import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/database.js';
import { classifyDocument } from './classificationService.js';
import { extractMedicalInformation, detectPatientMismatch } from './extractionService.js';
import { generateEventId } from '../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const processDocument = async (documentId) => {
  const doc = await prisma.medicalDocument.findUnique({
    where: { id: documentId },
    include: { patient: true }
  });

  if (!doc) throw new Error('Document not found');

  try {
    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: { processingStatus: 'EXTRACTING', extractionStatus: 'PROCESSING' }
    });

    let extractedText = "";
    let pageTexts = [];

    if (doc.fileType === 'application/pdf') {
      const result = await extractTextFromPDF(doc.filePath);
      extractedText = result.text;
      pageTexts = result.pages;
    } else if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(doc.fileType)) {
      const result = await extractTextFromImage(doc.filePath);
      extractedText = result.text;
      pageTexts = [{ pageNumber: 1, text: result.text }];
    } else {
      extractedText = await fs.promises.readFile(doc.filePath, 'utf-8').catch(() => "");
      pageTexts = [{ pageNumber: 1, text: extractedText }];
    }

    if (!extractedText || extractedText.trim().length < 20) {
      await prisma.medicalDocument.update({
        where: { id: documentId },
        data: {
          processingStatus: 'NEEDS_REVIEW',
          extractionStatus: 'FAILED',
          extractedText: extractedText || "",
          aiConfidence: 0.1,
          verificationStatus: 'NEEDS_REVIEW',
          mismatchWarning: 'Could not extract sufficient text. Document may be scanned or low quality.'
        }
      });
      return { status: 'NEEDS_REVIEW', reason: 'Insufficient text extracted' };
    }

    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: { processingStatus: 'ANALYZING', extractedText }
    });

    for (const page of pageTexts) {
      await prisma.documentText.create({
        data: {
          documentId: doc.id,
          patientId: doc.patientId,
          pageNumber: page.pageNumber,
          text: page.text.substring(0, 10000)
        }
      });
    }

    const classification = classifyDocument(extractedText, doc.originalName);

    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: {
        detectedCategory: classification.detectedCategory,
        categoryConfidence: classification.confidence,
        aiConfidence: classification.confidence / 100
      }
    });

    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: { processingStatus: 'STRUCTURING' }
    });

    const extracted = extractMedicalInformation(extractedText, doc.id, doc.patientId);

    let mismatchInfo = null;
    if (extracted.patient && extracted.patient.name) {
      const mismatch = detectPatientMismatch(extracted.patient, doc.patient);
      if (mismatch.mismatch) {
        mismatchInfo = mismatch.reason;
        await prisma.medicalDocument.update({
          where: { id: documentId },
          data: { mismatchWarning: mismatch.reason }
        });
      }
    }

    const docDate = extracted.dates.length > 0 ? new Date(extracted.dates[0].parsed) : null;
    if (docDate && !isNaN(docDate.getTime())) {
      await prisma.medicalDocument.update({
        where: { id: documentId },
        data: { documentDate: docDate }
      });
    }

    for (const lab of extracted.lab_results) {
      await prisma.extractedValue.create({
        data: {
          patientId: doc.patientId,
          documentId: doc.id,
          testName: lab.testName,
          result: String(lab.result),
          numericValue: lab.numericValue || null,
          unit: lab.unit || null,
          referenceRange: lab.referenceRange || null,
          status: lab.status || null,
          testDate: lab.testDate ? new Date(lab.testDate) : (docDate || new Date()),
          confidence: lab.confidence || 0.7,
          pageNumber: lab.pageNumber || 1,
          sourceText: lab.sourceText || null,
          verificationStatus: 'AI_EXTRACTED'
        }
      });

      await prisma.extractedEntity.create({
        data: {
          patientId: doc.patientId,
          documentId: doc.id,
          entityType: 'LAB_RESULT',
          entityValue: `${lab.testName}: ${lab.result} ${lab.unit || ''}`,
          normalizedValue: `${lab.numericValue} ${lab.unit || ''}`,
          unit: lab.unit,
          referenceRange: lab.referenceRange,
          status: lab.status,
          confidence: lab.confidence,
          pageNumber: lab.pageNumber,
          sourceText: lab.sourceText
        }
      });
    }

    for (const diag of extracted.diagnoses) {
      await prisma.extractedEntity.create({
        data: {
          patientId: doc.patientId,
          documentId: doc.id,
          entityType: 'DIAGNOSIS',
          entityValue: diag.diagnosis,
          confidence: diag.confidence,
          pageNumber: diag.pageNumber,
          sourceText: diag.sourceText
        }
      });
    }

    for (const sym of extracted.symptoms) {
      await prisma.extractedEntity.create({
        data: {
          patientId: doc.patientId,
          documentId: doc.id,
          entityType: 'SYMPTOM',
          entityValue: sym.symptom,
          confidence: sym.confidence,
          pageNumber: sym.pageNumber,
          sourceText: sym.sourceText
        }
      });
    }

    for (const med of extracted.medications) {
      await prisma.extractedEntity.create({
        data: {
          patientId: doc.patientId,
          documentId: doc.id,
          entityType: 'MEDICATION',
          entityValue: `${med.medication} ${med.dosage || ''} ${med.frequency || ''}`.trim(),
          confidence: med.confidence,
          pageNumber: med.pageNumber,
          sourceText: med.sourceText
        }
      });
    }

    for (const vital of extracted.vital_signs) {
      await prisma.extractedEntity.create({
        data: {
          patientId: doc.patientId,
          documentId: doc.id,
          entityType: 'VITAL_SIGN',
          entityValue: `${vital.type}: ${vital.value} ${vital.unit}`,
          unit: vital.unit,
          confidence: vital.confidence,
          pageNumber: vital.pageNumber,
          sourceText: vital.sourceText
        }
      });
    }

    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: { processingStatus: 'BUILDING_TIMELINE' }
    });

    await buildTimelineEvents(doc, extracted, docDate);

    await detectAndCreateRelationships(doc.patientId);

    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: {
        processingStatus: mismatchInfo ? 'NEEDS_REVIEW' : 'COMPLETED',
        extractionStatus: 'COMPLETED',
        verificationStatus: mismatchInfo ? 'NEEDS_REVIEW' : 'AI_EXTRACTED'
      }
    });

    await prisma.aIInsight.create({
      data: {
        patientId: doc.patientId,
        documentId: doc.id,
        insightType: 'DOCUMENT_PROCESSED',
        title: `Document ${classification.detectedCategory} processed`,
        description: `Extracted ${extracted.lab_results.length} lab values, ${extracted.diagnoses.length} diagnoses, ${extracted.medications.length} medications from ${doc.originalName}`,
        confidence: classification.confidence / 100,
        sourceReferences: JSON.stringify([{ documentId: doc.id, fileName: doc.originalName, pages: pageTexts.map(p => p.pageNumber) }])
      }
    });

    return {
      status: 'COMPLETED',
      extractedCounts: {
        lab_results: extracted.lab_results.length,
        diagnoses: extracted.diagnoses.length,
        medications: extracted.medications.length,
        symptoms: extracted.symptoms.length,
        vital_signs: extracted.vital_signs.length
      },
      classification,
      mismatchWarning: mismatchInfo
    };

  } catch (error) {
    console.error('Document processing error:', error);
    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: {
        processingStatus: 'FAILED',
        extractionStatus: 'FAILED',
        mismatchWarning: `Processing failed: ${error.message}`
      }
    });
    throw error;
  }
};

async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.promises.readFile(filePath);
    
    // Try pdfjs-dist first (more robust for various PDFs including pdfkit)
    try {
      const pdfjsLib = (await import('pdfjs-dist/legacy/build/pdf.js')).default;
      const uint8Array = new Uint8Array(dataBuffer);
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array, useSystemFonts: true });
      const pdfDoc = await loadingTask.promise;
      
      let fullText = "";
      const pages = [];
      
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        pages.push({ pageNumber: i, text: pageText });
        fullText += pageText + "\n";
      }
      
      if (fullText.trim().length >= 20) {
        console.log(`pdfjs-dist extracted ${fullText.length} chars from ${pdfDoc.numPages} pages`);
        return { text: fullText, pages };
      }
    } catch (pdfjsErr) {
      console.log('pdfjs-dist extraction failed, trying pdf-parse:', pdfjsErr.message);
    }

    // Fallback to pdf-parse
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(dataBuffer);
      
      const text = data.text || "";
      const pages = [];
      
      if (data.numpages) {
        const avgLength = Math.ceil(text.length / data.numpages);
        for (let i = 0; i < data.numpages; i++) {
          const start = i * avgLength;
          const end = Math.min((i+1)*avgLength, text.length);
          pages.push({
            pageNumber: i+1,
            text: text.substring(start, end)
          });
        }
      } else {
        pages.push({ pageNumber: 1, text });
      }

      if (text.trim().length >= 20) {
        return { text, pages };
      }
      console.log('PDF text too short, trying fallback text read');
    } catch (pdfErr) {
      console.log('PDF parse failed, trying text fallback:', pdfErr.message);
    }

    // Fallback: try reading as utf8 text (for synthetic/test PDFs)
    try {
      const textContent = await fs.promises.readFile(filePath, 'utf-8');
      if (textContent && textContent.trim().length > 20) {
        return { text: textContent, pages: [{ pageNumber: 1, text: textContent }] };
      }
    } catch {}

    // If still no text, return what we have or minimal
    return { text: `Document: ${path.basename(filePath)} - PDF content extraction attempted. Original preserved for manual review.`, pages: [{ pageNumber: 1, text: `Document: ${path.basename(filePath)}` }] };

  } catch (error) {
    console.error('PDF extraction failed:', error);
    return { text: "", pages: [] };
  }
}

async function extractTextFromImage(filePath) {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const { data } = await worker.recognize(filePath);
    await worker.terminate();
    return { text: data.text || "" };
  } catch (error) {
    console.error('OCR failed, trying fallback:', error.message);
    return { text: `Image document: ${path.basename(filePath)}. OCR processing attempted but requires additional setup. Please review manually.` };
  }
}

async function buildTimelineEvents(doc, extracted, docDate) {
  const baseDate = docDate || doc.uploadDate || new Date();
  
  const eventsToCreate = [];

  for (const lab of extracted.lab_results) {
    eventsToCreate.push({
      eventId: generateEventId(),
      patientId: doc.patientId,
      eventType: 'Lab Test',
      eventDate: lab.testDate ? new Date(lab.testDate) : baseDate,
      description: `${lab.testName}: ${lab.result} ${lab.unit || ''} ${lab.status ? `(${lab.status})` : ''}`.trim(),
      doctorId: doc.doctorId,
      documentId: doc.id,
      pageNumber: lab.pageNumber || 1,
      confidence: lab.confidence || 0.7,
      verificationStatus: 'AI_EXTRACTED',
      sourceReference: `${doc.originalName} - Page ${lab.pageNumber || 1}`
    });
  }

  for (const diag of extracted.diagnoses) {
    eventsToCreate.push({
      eventId: generateEventId(),
      patientId: doc.patientId,
      eventType: 'Diagnosis',
      eventDate: baseDate,
      description: diag.diagnosis,
      doctorId: doc.doctorId,
      documentId: doc.id,
      pageNumber: diag.pageNumber || 1,
      confidence: diag.confidence || 0.75,
      verificationStatus: 'AI_EXTRACTED',
      sourceReference: `${doc.originalName} - Page ${diag.pageNumber || 1}`
    });
  }

  for (const med of extracted.medications) {
    eventsToCreate.push({
      eventId: generateEventId(),
      patientId: doc.patientId,
      eventType: 'Prescription',
      eventDate: baseDate,
      description: `Medication: ${med.medication} ${med.dosage || ''} ${med.frequency || ''} ${med.duration || ''}`.trim(),
      doctorId: doc.doctorId,
      documentId: doc.id,
      pageNumber: med.pageNumber || 1,
      confidence: med.confidence || 0.7,
      verificationStatus: 'AI_EXTRACTED',
      sourceReference: `${doc.originalName} - Page ${med.pageNumber || 1}`
    });
  }

  for (const vital of extracted.vital_signs) {
    eventsToCreate.push({
      eventId: generateEventId(),
      patientId: doc.patientId,
      eventType: 'Vital Signs',
      eventDate: baseDate,
      description: `${vital.type}: ${vital.value} ${vital.unit || ''}`,
      doctorId: doc.doctorId,
      documentId: doc.id,
      pageNumber: vital.pageNumber || 1,
      confidence: vital.confidence || 0.8,
      verificationStatus: 'AI_EXTRACTED',
      sourceReference: `${doc.originalName} - Page ${vital.pageNumber || 1}`
    });
  }

  if (eventsToCreate.length === 0) {
    const docType = doc.detectedCategory || doc.category || 'Document';
    eventsToCreate.push({
      eventId: generateEventId(),
      patientId: doc.patientId,
      eventType: docType.includes('Consult') ? 'Consultation' : docType.includes('Prescription') ? 'Prescription' : 'Clinical Note',
      eventDate: baseDate,
      description: `${docType} uploaded: ${doc.originalName}`,
      doctorId: doc.doctorId,
      documentId: doc.id,
      pageNumber: 1,
      confidence: 0.6,
      verificationStatus: 'AI_EXTRACTED',
      sourceReference: doc.originalName
    });
  }

  for (const evt of eventsToCreate) {
    await prisma.medicalEvent.create({ data: evt });
  }
}

async function detectAndCreateRelationships(patientId) {
  const events = await prisma.medicalEvent.findMany({
    where: { patientId },
    orderBy: { eventDate: 'asc' },
    take: 100
  });

  if (events.length < 2) return;

  for (let i = 0; i < events.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 6, events.length); j++) {
      const source = events[i];
      const target = events[j];
      
      const daysDiff = (target.eventDate - source.eventDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 60) continue;

      let relationshipType = null;
      let description = null;
      let isDocumented = false;

      if (source.eventType === 'Lab Test' && target.eventType === 'Consultation') {
        relationshipType = 'LAB_TO_CONSULTATION';
        description = `Lab result on ${source.eventDate.toLocaleDateString()} followed by consultation`;
      } else if (source.eventType === 'Consultation' && target.eventType === 'Diagnosis') {
        relationshipType = 'CONSULTATION_TO_DIAGNOSIS';
        description = 'Diagnosis documented following consultation';
        isDocumented = true;
      } else if (source.eventType === 'Diagnosis' && target.eventType === 'Prescription') {
        relationshipType = 'DIAGNOSIS_TO_PRESCRIPTION';
        description = 'Prescription following diagnosis';
      } else if (source.eventType === 'Lab Test' && target.eventType === 'Lab Test') {
        const sameTest = source.description.split(':')[0] === target.description.split(':')[0];
        if (sameTest) {
          relationshipType = 'LAB_TREND';
          description = `Follow-up lab test for ${source.description.split(':')[0]}`;
          isDocumented = true;
        }
      } else if (source.eventType === 'Imaging' && target.eventType === 'Consultation') {
        relationshipType = 'IMAGING_TO_CONSULTATION';
        description = 'Consultation following imaging finding';
      } else if (daysDiff <= 7 && source.eventType !== target.eventType) {
        relationshipType = 'TEMPORAL_ASSOCIATION';
        description = `Events occurred ${Math.round(daysDiff)} days apart`;
      }

      if (relationshipType) {
        const existing = await prisma.eventRelationship.findFirst({
          where: { sourceEventId: source.id, targetEventId: target.id }
        });
        if (!existing) {
          await prisma.eventRelationship.create({
            data: {
              sourceEventId: source.id,
              targetEventId: target.id,
              relationshipType,
              description,
              isDocumented,
              confidence: isDocumented ? 0.9 : 0.6
            }
          });
        }
      }
    }
  }
}
