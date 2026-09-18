import prisma from '../config/database.js';
import { processAIQuery } from '../services/aiAssistantService.js';
import { generateExcelExport, generatePDFSummary } from '../services/exportService.js';

export const askAI = async (req, res) => {
  try {
    const { patientId, mode = 'HEALTH_RECORD', documentId, question, conversationId } = req.body;

    if (!patientId || !question) return res.status(400).json({ error: 'Patient ID and question are required' });
    if (!['REPORT', 'TIMELINE', 'HEALTH_RECORD'].includes(mode)) return res.status(400).json({ error: 'Invalid mode' });

    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
      if (!access) return res.status(403).json({ error: 'Access Required', code: 'ACCESS_REQUIRED' });
    }

    const result = await processAIQuery({
      patientId: patient.id,
      userId: req.user.id,
      userRole: req.user.role,
      mode,
      documentId,
      question,
      conversationId
    });

    res.json(result);
  } catch (error) {
    console.error('AI query error:', error);
    res.status(500).json({ error: 'AI query failed', details: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false } });
      if (!access) return res.status(403).json({ error: 'Access Required' });
    }

    const conversations = await prisma.aIConversation.findMany({
      where: { patientId: patient.id, userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
      take: 20
    });

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await prisma.aIConversation.findUnique({ where: { id: conversationId }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    if (conversation.userId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const exportExcel = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false } });
      if (!access) return res.status(403).json({ error: 'Access Required' });
    }

    const buffer = await generateExcelExport(patient.id);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${patient.patientId}_medical_record.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Export failed', details: error.message });
  }
};

export const exportPDF = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false } });
      if (!access) return res.status(403).json({ error: 'Access Required' });
    }

    const buffer = await generatePDFSummary(patient.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${patient.patientId}_summary.pdf"`);
    res.send(buffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Export failed', details: error.message });
  }
};

export const createDemoData = async (req, res) => {
  try {
    if (req.user.role !== 'DOCTOR') return res.status(403).json({ error: 'Only doctors can create demo data' });

    const doctor = await prisma.doctor.findUnique({ where: { id: req.user.id } });

    const demoPatients = [
      { name: "John Smith", dob: "1985-06-15", gender: "Male", phone: "9876543210", email: `demo_john_${Date.now()}@example.com`, bloodGroup: "O+", address: "123 Demo Street, Coimbatore" },
      { name: "Sarah Johnson", dob: "1990-03-22", gender: "Female", phone: "9876543211", email: `demo_sarah_${Date.now()}@example.com`, bloodGroup: "A+", address: "456 Sample Ave" },
      { name: "Robert Davis", dob: "1978-11-08", gender: "Male", phone: "9876543212", email: `demo_robert_${Date.now()}@example.com`, bloodGroup: "B+" }
    ];

    const { generatePatientId } = await import('../utils/helpers.js');
    const created = [];

    for (const p of demoPatients) {
      const patientId = await generatePatientId(prisma, doctor.doctorId);
      const patient = await prisma.patient.create({
        data: {
          patientId,
          primaryDoctorId: doctor.id,
          name: p.name,
          dob: new Date(p.dob),
          gender: p.gender,
          phone: p.phone,
          email: p.email,
          address: p.address,
          bloodGroup: p.bloodGroup,
          medicalInfo: "Demo patient - synthetic data for testing",
          isActivated: false
        }
      });

      await prisma.patientAccess.create({ data: { doctorId: doctor.id, patientId: patient.id, accessType: 'FULL', grantedBy: doctor.id } });

      const { generateDocumentId, generateEventId } = await import('../utils/helpers.js');

      const doc1 = await prisma.medicalDocument.create({
        data: {
          documentId: generateDocumentId(),
          patientId: patient.id,
          doctorId: doctor.id,
          fileName: `${patientId}_blood_test.pdf`,
          originalName: "Blood_Report_Jan.pdf",
          category: "Blood Test",
          detectedCategory: "Blood Test",
          categoryConfidence: 96,
          fileType: "application/pdf",
          filePath: `/tmp/demo_${patientId}_blood.pdf`,
          fileSize: 1024,
          documentDate: new Date('2026-01-10'),
          processingStatus: 'COMPLETED',
          extractionStatus: 'COMPLETED',
          aiConfidence: 0.96,
          verificationStatus: 'AI_EXTRACTED',
          extractedText: `Patient: ${p.name}\nDate: 10 Jan 2026\nHemoglobin: 11.2 g/dL (Ref: 12-16)\nWBC: 7500 /cumm\nPlatelets: 2.5 lakh\nGlucose Fasting: 95 mg/dL\nTotal Cholesterol: 180 mg/dL`
        }
      });

      await prisma.extractedValue.createMany({
        data: [
          { patientId: patient.id, documentId: doc1.id, testName: "Hemoglobin", result: "11.2", numericValue: 11.2, unit: "g/dL", referenceRange: "12-16 g/dL", status: "Low", testDate: new Date('2026-01-10'), confidence: 0.96, pageNumber: 1, sourceText: "Hemoglobin: 11.2 g/dL" },
          { patientId: patient.id, documentId: doc1.id, testName: "WBC", result: "7500", numericValue: 7500, unit: "/cumm", referenceRange: "4000-11000", status: "Normal", testDate: new Date('2026-01-10'), confidence: 0.9, pageNumber: 1, sourceText: "WBC: 7500" },
          { patientId: patient.id, documentId: doc1.id, testName: "Glucose Fasting", result: "95", numericValue: 95, unit: "mg/dL", referenceRange: "70-100", status: "Normal", testDate: new Date('2026-01-10'), confidence: 0.92, pageNumber: 1 }
        ]
      });

      await prisma.medicalEvent.createMany({
        data: [
          { eventId: generateEventId(), patientId: patient.id, eventType: "Lab Test", eventDate: new Date('2026-01-10'), description: "Hemoglobin: 11.2 g/dL (Low)", doctorId: doctor.id, documentId: doc1.id, pageNumber: 1, confidence: 0.96, verificationStatus: "AI_EXTRACTED", sourceReference: "Blood_Report_Jan.pdf - Page 1" },
          { eventId: generateEventId(), patientId: patient.id, eventType: "Lab Test", eventDate: new Date('2026-01-10'), description: "WBC: 7500 /cumm (Normal)", doctorId: doctor.id, documentId: doc1.id, pageNumber: 1, confidence: 0.9, verificationStatus: "AI_EXTRACTED", sourceReference: "Blood_Report_Jan.pdf - Page 1" }
        ]
      });

      const doc2 = await prisma.medicalDocument.create({
        data: {
          documentId: generateDocumentId(),
          patientId: patient.id,
          doctorId: doctor.id,
          fileName: `${patientId}_blood_test_march.pdf`,
          originalName: "Blood_Report_March.pdf",
          category: "Blood Test",
          detectedCategory: "Blood Test",
          categoryConfidence: 97,
          fileType: "application/pdf",
          filePath: `/tmp/demo_${patientId}_blood2.pdf`,
          fileSize: 1024,
          documentDate: new Date('2026-03-12'),
          processingStatus: 'COMPLETED',
          extractionStatus: 'COMPLETED',
          aiConfidence: 0.97,
          verificationStatus: 'AI_EXTRACTED',
          extractedText: `Patient: ${p.name}\nDate: 12 March 2026\nHemoglobin: 12.4 g/dL (Ref: 12-16)\nWBC: 6800 /cumm\nImproved from previous`
        }
      });

      await prisma.extractedValue.createMany({
        data: [
          { patientId: patient.id, documentId: doc2.id, testName: "Hemoglobin", result: "12.4", numericValue: 12.4, unit: "g/dL", referenceRange: "12-16 g/dL", status: "Normal", testDate: new Date('2026-03-12'), confidence: 0.97, pageNumber: 1 },
          { patientId: patient.id, documentId: doc2.id, testName: "WBC", result: "6800", numericValue: 6800, unit: "/cumm", referenceRange: "4000-11000", status: "Normal", testDate: new Date('2026-03-12'), confidence: 0.9, pageNumber: 1 }
        ]
      });

      await prisma.medicalEvent.create({
        data: { eventId: generateEventId(), patientId: patient.id, eventType: "Lab Test", eventDate: new Date('2026-03-12'), description: "Hemoglobin: 12.4 g/dL (Normal) - Improved", doctorId: doctor.id, documentId: doc2.id, pageNumber: 1, confidence: 0.97, verificationStatus: "AI_EXTRACTED", sourceReference: "Blood_Report_March.pdf - Page 1" }
      });

      await prisma.visit.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          date: new Date('2026-01-15'),
          reason: "Routine checkup and fatigue",
          clinicalNotes: "Patient reports fatigue, mild weakness. No fever.",
          findings: "Mild pallor, vitals stable. BP 120/80, Pulse 78",
          assessment: "Mild anemia, likely nutritional",
          plan: "Iron supplements, diet advice, repeat CBC after 2 months",
          followUp: "Follow up after 2 months with repeat blood test",
          sourceType: "DOCTOR_ENTERED"
        }
      });

      created.push(patient);
    }

    res.json({ message: `Demo data created: ${created.length} patients with synthetic records`, patients: created.map(p => ({ patientId: p.patientId, name: p.name, email: p.email })), note: "These are clearly labeled synthetic demo records for testing workflow. Real patient data remains separate." });
  } catch (error) {
    console.error('Demo data error:', error);
    res.status(500).json({ error: 'Failed to create demo data', details: error.message });
  }
};
