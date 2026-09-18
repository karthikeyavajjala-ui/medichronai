import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import prisma from '../config/database.js';
import { calculateAge } from '../utils/helpers.js';

export const generateExcelExport = async (patientId) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      primaryDoctor: true,
      documents: { orderBy: { uploadDate: 'desc' } },
      medicalEvents: { orderBy: { eventDate: 'asc' } },
      extractedValues: { orderBy: { testDate: 'desc' } },
      extractedEntities: true,
      visits: { orderBy: { date: 'desc' }, include: { doctor: true } },
      prescriptions: { orderBy: { date: 'desc' }, include: { medications: true, doctor: true } },
      patientAccesses: { include: { doctor: true } }
    }
  });

  if (!patient) throw new Error('Patient not found');

  const wb = XLSX.utils.book_new();

  // Sheet 1: Patient Profile
  const profileData = [
    ["Patient Profile", ""],
    ["Patient ID", patient.patientId],
    ["Name", patient.name],
    ["Date of Birth", new Date(patient.dob).toLocaleDateString()],
    ["Age", calculateAge(patient.dob)],
    ["Gender", patient.gender],
    ["Phone", patient.phone],
    ["Email", patient.email],
    ["Address", patient.address || "N/A"],
    ["Emergency Contact", patient.emergencyContact || "N/A"],
    ["Blood Group", patient.bloodGroup || "N/A"],
    ["Primary Doctor", patient.primaryDoctor ? `${patient.primaryDoctor.name} (${patient.primaryDoctor.doctorId})` : "N/A"],
    ["Total Documents", patient.documents.length],
    ["Total Visits", patient.visits.length],
    ["Total Lab Results", patient.extractedValues.length],
    ["Created At", new Date(patient.createdAt).toLocaleString()],
  ];
  const wsProfile = XLSX.utils.aoa_to_sheet(profileData);
  XLSX.utils.book_append_sheet(wb, wsProfile, "Patient Profile");

  // Sheet 2: Timeline
  const timelineHeader = ["Date", "Event Type", "Description", "Doctor", "Source Document", "Verification Status", "Confidence"];
  const timelineRows = patient.medicalEvents.map(evt => [
    new Date(evt.eventDate).toLocaleDateString(),
    evt.eventType,
    evt.description,
    evt.doctorId || "N/A",
    evt.sourceReference || "N/A",
    evt.verificationStatus,
    evt.confidence || "N/A"
  ]);
  const wsTimeline = XLSX.utils.aoa_to_sheet([timelineHeader, ...timelineRows]);
  XLSX.utils.book_append_sheet(wb, wsTimeline, "Timeline");

  // Sheet 3: Documents
  const docHeader = ["Document ID", "File Name", "Category", "Detected Category", "Confidence", "Upload Date", "Document Date", "Status", "File Type", "Verification"];
  const docRows = patient.documents.map(doc => [
    doc.documentId,
    doc.originalName,
    doc.category,
    doc.detectedCategory || "N/A",
    doc.categoryConfidence ? `${doc.categoryConfidence}%` : "N/A",
    new Date(doc.uploadDate).toLocaleString(),
    doc.documentDate ? new Date(doc.documentDate).toLocaleDateString() : "N/A",
    doc.processingStatus,
    doc.fileType,
    doc.verificationStatus
  ]);
  const wsDocs = XLSX.utils.aoa_to_sheet([docHeader, ...docRows]);
  XLSX.utils.book_append_sheet(wb, wsDocs, "Documents");

  // Sheet 4: Lab Results
  const labHeader = ["Date", "Test", "Result", "Unit", "Reference Range", "Status", "Source Document", "Page", "Verification"];
  const labRows = patient.extractedValues.map(lab => [
    lab.testDate ? new Date(lab.testDate).toLocaleDateString() : "N/A",
    lab.testName,
    lab.result,
    lab.unit || "N/A",
    lab.referenceRange || "Reference range not provided",
    lab.status || "Unknown",
    lab.documentId,
    lab.pageNumber || 1,
    lab.verificationStatus
  ]);
  const wsLabs = XLSX.utils.aoa_to_sheet([labHeader, ...labRows]);
  XLSX.utils.book_append_sheet(wb, wsLabs, "Lab Results");

  // Sheet 5: Medications
  const medHeader = ["Date", "Medication", "Dosage", "Frequency", "Duration", "Instructions", "Doctor", "Source"];
  const medRows = [];
  patient.prescriptions.forEach(pres => {
    pres.medications.forEach(med => {
      medRows.push([
        new Date(pres.date).toLocaleDateString(),
        med.medication,
        med.dosage || "N/A",
        med.frequency || "N/A",
        med.duration || "N/A",
        med.instructions || pres.instructions || "N/A",
        pres.doctor ? pres.doctor.name : pres.doctorId,
        pres.sourceDocumentId || "Doctor Entered"
      ]);
    });
  });
  const allMeds = patient.extractedEntities.filter(e => e.entityType === 'MEDICATION');
  allMeds.forEach(med => {
    medRows.push([
      new Date(med.createdAt).toLocaleDateString(),
      med.entityValue,
      "N/A",
      "N/A",
      "N/A",
      med.sourceText?.substring(0,100) || "N/A",
      "AI Extracted",
      med.documentId
    ]);
  });
  const wsMeds = XLSX.utils.aoa_to_sheet([medHeader, ...medRows]);
  XLSX.utils.book_append_sheet(wb, wsMeds, "Medications");

  // Sheet 6: Visits
  const visitHeader = ["Date", "Doctor", "Reason", "Clinical Notes", "Findings", "Investigations", "Assessment", "Plan", "Follow-up", "Source Type"];
  const visitRows = patient.visits.map(visit => [
    new Date(visit.date).toLocaleDateString(),
    visit.doctor ? visit.doctor.name : visit.doctorId,
    visit.reason || "N/A",
    visit.clinicalNotes || "N/A",
    visit.findings || "N/A",
    visit.investigations || "N/A",
    visit.assessment || "N/A",
    visit.plan || "N/A",
    visit.followUp || "N/A",
    visit.sourceType
  ]);
  const wsVisits = XLSX.utils.aoa_to_sheet([visitHeader, ...visitRows]);
  XLSX.utils.book_append_sheet(wb, wsVisits, "Visits");

  // Sheet 7: AI Analysis
  const analysisHeader = ["Type", "Value", "Confidence", "Source", "Date"];
  const analysisRows = patient.extractedEntities.map(ent => [
    ent.entityType,
    ent.entityValue,
    ent.confidence || "N/A",
    ent.documentId,
    new Date(ent.createdAt).toLocaleDateString()
  ]);
  const wsAnalysis = XLSX.utils.aoa_to_sheet([analysisHeader, ...analysisRows]);
  XLSX.utils.book_append_sheet(wb, wsAnalysis, "AI Analysis");

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
};

export const generatePDFSummary = async (patientId) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      primaryDoctor: true,
      documents: { orderBy: { uploadDate: 'desc' }, take: 20 },
      medicalEvents: { orderBy: { eventDate: 'asc' } },
      extractedValues: { orderBy: { testDate: 'desc' }, take: 50 },
      extractedEntities: true,
      visits: { orderBy: { date: 'desc' }, take: 20, include: { doctor: true } },
      prescriptions: { orderBy: { date: 'desc' }, take: 20, include: { medications: true, doctor: true } }
    }
  });

  if (!patient) throw new Error('Patient not found');

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).fillColor('#0f172a').text('Medical Record Summary', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#64748b').text(`Generated on ${new Date().toLocaleString()} | AI-Generated Summary - For informational purposes`, { align: 'center' });
      doc.moveDown(1);

      // Patient Info
      doc.fontSize(14).fillColor('#0f172a').text('Patient Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Patient ID: ${patient.patientId}`);
      doc.text(`Name: ${patient.name}`);
      doc.text(`DOB: ${new Date(patient.dob).toLocaleDateString()} (Age: ${calculateAge(patient.dob)})`);
      doc.text(`Gender: ${patient.gender} | Blood Group: ${patient.bloodGroup || 'N/A'}`);
      doc.text(`Phone: ${patient.phone} | Email: ${patient.email}`);
      doc.text(`Primary Doctor: ${patient.primaryDoctor ? `${patient.primaryDoctor.name} (${patient.primaryDoctor.doctorId})` : 'N/A'}`);
      doc.moveDown(1);

      // Timeline
      doc.fontSize(14).fillColor('#0f172a').text('Medical Timeline', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#334155');
      if (patient.medicalEvents.length > 0) {
        patient.medicalEvents.slice(0, 30).forEach(evt => {
          doc.text(`${new Date(evt.eventDate).toLocaleDateString()} - ${evt.eventType}: ${evt.description.substring(0,120)}`, { indent: 10 });
          doc.fontSize(7).fillColor('#64748b').text(`Source: ${evt.sourceReference || 'N/A'} | Status: ${evt.verificationStatus}`, { indent: 20 });
          doc.fontSize(9).fillColor('#334155');
          doc.moveDown(0.3);
          if (doc.y > 700) { doc.addPage(); }
        });
      } else {
        doc.text('No timeline events documented.');
      }
      doc.moveDown(1);

      // Lab Results
      doc.addPage();
      doc.fontSize(14).fillColor('#0f172a').text('Lab Results', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#334155');
      if (patient.extractedValues.length > 0) {
        doc.text('Date | Test | Result | Unit | Reference Range | Status | Source', { underline: true });
        doc.moveDown(0.3);
        patient.extractedValues.slice(0, 40).forEach(lab => {
          const line = `${lab.testDate ? new Date(lab.testDate).toLocaleDateString() : 'N/A'} | ${lab.testName} | ${lab.result} | ${lab.unit || ''} | ${lab.referenceRange || 'Not provided'} | ${lab.status || 'Unknown'} | Doc: ${lab.documentId.substring(0,8)}`;
          doc.text(line, { indent: 5 });
          doc.moveDown(0.2);
          if (doc.y > 700) { doc.addPage(); }
        });
      } else {
        doc.text('No lab results documented.');
      }
      doc.moveDown(1);

      // Medications
      doc.fontSize(14).fillColor('#0f172a').text('Medications', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#334155');
      if (patient.prescriptions.length > 0) {
        patient.prescriptions.forEach(pres => {
          doc.text(`${new Date(pres.date).toLocaleDateString()} - Prescription by ${pres.doctor?.name || pres.doctorId}:`, { indent: 5 });
          pres.medications.forEach(med => {
            doc.text(`  - ${med.medication} ${med.dosage || ''} ${med.frequency || ''} ${med.duration || ''}`, { indent: 15 });
          });
          doc.moveDown(0.3);
        });
      } else {
        doc.text('No prescriptions documented.');
      }
      doc.moveDown(1);

      // Visits
      doc.fontSize(14).fillColor('#0f172a').text('Visits', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#334155');
      if (patient.visits.length > 0) {
        patient.visits.slice(0,10).forEach(visit => {
          doc.text(`${new Date(visit.date).toLocaleDateString()} - Doctor: ${visit.doctor?.name || visit.doctorId}`, { indent: 5 });
          if (visit.reason) doc.text(`Reason: ${visit.reason.substring(0,150)}`, { indent: 10 });
          if (visit.assessment) doc.text(`Assessment: ${visit.assessment.substring(0,150)}`, { indent: 10 });
          doc.moveDown(0.3);
          if (doc.y > 700) { doc.addPage(); }
        });
      } else {
        doc.text('No visits documented.');
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor('#94a3b8').text('This document is AI-generated from documented medical records. It is marked as AI-generated. All facts are traceable to source documents. Consult your healthcare provider for medical decisions.', { align: 'center' });
      doc.text(`Patient ID: ${patient.patientId} | Generated: ${new Date().toISOString()}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
