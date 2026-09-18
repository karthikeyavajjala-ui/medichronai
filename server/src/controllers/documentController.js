import fs from 'fs';
import path from 'path';
import prisma from '../config/database.js';
import { generateDocumentId } from '../utils/helpers.js';
import { processDocument } from '../services/documentProcessor.js';
import { DOCUMENT_CATEGORIES } from '../config/constants.js';

export const uploadDocuments = async (req, res) => {
  try {
    const { patientId, category } = req.body;
    const files = req.files;

    if (!patientId) return res.status(400).json({ error: 'Patient ID is required' });
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({
        where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
      });
      if (!access) return res.status(403).json({ error: 'Access denied to this patient' });
    }

    const uploadedDocs = [];

    for (const file of files) {
      const docId = generateDocumentId();
      const docCategory = DOCUMENT_CATEGORIES.includes(category) ? category : 'Other';

      const medicalDoc = await prisma.medicalDocument.create({
        data: {
          documentId: docId,
          patientId: patient.id,
          doctorId: req.user.id,
          fileName: `${docId}_${file.originalname}`,
          originalName: file.originalname,
          category: docCategory,
          fileType: file.mimetype,
          filePath: file.path,
          fileSize: file.size,
          processingStatus: 'UPLOADED',
          extractionStatus: 'PENDING',
          verificationStatus: 'PENDING'
        }
      });

      uploadedDocs.push(medicalDoc);

      setImmediate(async () => {
        try {
          await processDocument(medicalDoc.id);
        } catch (err) {
          console.error(`Failed to process document ${medicalDoc.id}:`, err);
        }
      });
    }

    await prisma.accessAuditLog.create({
      data: {
        doctorId: req.user.id,
        patientId: patient.id,
        action: 'DOCUMENT_UPLOAD',
        details: `Uploaded ${uploadedDocs.length} documents: ${uploadedDocs.map(d => d.originalName).join(', ')}`,
        permissionType: 'WRITE'
      }
    });

    res.status(201).json({
      message: `${uploadedDocs.length} document(s) uploaded successfully. Processing started.`,
      documents: uploadedDocs.map(d => ({
        id: d.id,
        documentId: d.documentId,
        fileName: d.originalName,
        category: d.category,
        status: d.processingStatus,
        uploadDate: d.uploadDate
      }))
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
};

export const getPatientDocuments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { category, status, page = 1, limit = 20 } = req.query;

    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    let where = { patientId: patient.id };
    if (category) where.category = category;
    if (status) where.processingStatus = status;

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({
        where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
      });
      if (!access) return res.status(403).json({ error: 'Access Required', code: 'ACCESS_REQUIRED' });

      if (access.accessType === 'SELECTED' && access.selectedDocuments) {
        try {
          const selectedIds = JSON.parse(access.selectedDocuments);
          where.id = { in: selectedIds };
        } catch {}
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [documents, total] = await Promise.all([
      prisma.medicalDocument.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { uploadDate: 'desc' },
        include: { doctor: { select: { name: true, doctorId: true } }, _count: { select: { extractedValues: true, extractedEntities: true, medicalEvents: true } } }
      }),
      prisma.medicalDocument.count({ where })
    ]);

    res.json({
      documents: documents.map(doc => ({
        id: doc.id,
        documentId: doc.documentId,
        fileName: doc.originalName,
        category: doc.category,
        detectedCategory: doc.detectedCategory,
        categoryConfidence: doc.categoryConfidence,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        uploadDate: doc.uploadDate,
        documentDate: doc.documentDate,
        processingStatus: doc.processingStatus,
        extractionStatus: doc.extractionStatus,
        aiConfidence: doc.aiConfidence,
        verificationStatus: doc.verificationStatus,
        mismatchWarning: doc.mismatchWarning,
        doctor: doc.doctor,
        extractedCounts: { labResults: doc._count.extractedValues, entities: doc._count.extractedEntities, events: doc._count.medicalEvents }
      })),
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

export const getDocumentDetails = async (req, res) => {
  try {
    const { documentId } = req.params;

    const doc = await prisma.medicalDocument.findFirst({
      where: { OR: [{ id: documentId }, { documentId }] },
      include: {
        patient: { select: { id: true, patientId: true, primaryDoctorId: true, name: true } },
        doctor: { select: { name: true, doctorId: true } },
        documentTexts: { orderBy: { pageNumber: 'asc' } },
        extractedValues: { orderBy: { createdAt: 'asc' } },
        extractedEntities: { orderBy: { createdAt: 'asc' } },
        medicalEvents: { orderBy: { eventDate: 'asc' } }
      }
    });

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (req.user.role === 'PATIENT' && doc.patient.id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'DOCTOR' && doc.patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({
        where: { doctorId: req.user.id, patientId: doc.patient.id, isRevoked: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
      });
      if (!access) return res.status(403).json({ error: 'Access Required', code: 'ACCESS_REQUIRED' });
    }

    res.json({
      document: {
        id: doc.id,
        documentId: doc.documentId,
        fileName: doc.originalName,
        category: doc.category,
        detectedCategory: doc.detectedCategory,
        categoryConfidence: doc.categoryConfidence,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        uploadDate: doc.uploadDate,
        documentDate: doc.documentDate,
        processingStatus: doc.processingStatus,
        extractionStatus: doc.extractionStatus,
        aiConfidence: doc.aiConfidence,
        verificationStatus: doc.verificationStatus,
        mismatchWarning: doc.mismatchWarning,
        extractedText: doc.extractedText?.substring(0, 10000),
        doctor: doc.doctor,
        patient: { id: doc.patient.id, patientId: doc.patient.patientId, name: doc.patient.name }
      },
      texts: doc.documentTexts,
      labResults: doc.extractedValues,
      entities: doc.extractedEntities,
      events: doc.medicalEvents
    });
  } catch (error) {
    console.error('Get doc details error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

export const getDocumentFile = async (req, res) => {
  try {
    const { documentId } = req.params;

    const doc = await prisma.medicalDocument.findFirst({
      where: { OR: [{ id: documentId }, { documentId }] },
      include: { patient: { select: { id: true, primaryDoctorId: true } } }
    });

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (req.user.role === 'PATIENT' && doc.patient.id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'DOCTOR' && doc.patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({
        where: { doctorId: req.user.id, patientId: doc.patient.id, isRevoked: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
      });
      if (!access) return res.status(403).json({ error: 'Access Required' });
    }

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    await prisma.accessAuditLog.create({
      data: {
        doctorId: req.user.role === 'DOCTOR' ? req.user.id : null,
        patientId: doc.patient.id,
        action: 'DOCUMENT_VIEW',
        details: `Viewed document ${doc.documentId} - ${doc.originalName}`,
        permissionType: 'READ'
      }
    });

    res.setHeader('Content-Type', doc.fileType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
    const stream = fs.createReadStream(doc.filePath);
    stream.pipe(res);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
};

export const retryProcessing = async (req, res) => {
  try {
    const { documentId } = req.params;

    const doc = await prisma.medicalDocument.findFirst({
      where: { OR: [{ id: documentId }, { documentId }] },
      include: { patient: { select: { id: true, primaryDoctorId: true } } }
    });

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (req.user.role === 'DOCTOR' && doc.patient.primaryDoctorId !== req.user.id && doc.doctorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.medicalDocument.update({
      where: { id: doc.id },
      data: { processingStatus: 'UPLOADED', extractionStatus: 'PENDING' }
    });

    setImmediate(async () => {
      try {
        await processDocument(doc.id);
      } catch (err) {
        console.error('Retry processing failed:', err);
      }
    });

    res.json({ message: 'Processing retry started', documentId: doc.documentId });
  } catch (error) {
    res.status(500).json({ error: 'Retry failed' });
  }
};

export const updateDocumentCategory = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { category } = req.body;

    if (!DOCUMENT_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category', valid: DOCUMENT_CATEGORIES });
    }

    const doc = await prisma.medicalDocument.findFirst({
      where: { OR: [{ id: documentId }, { documentId }] },
      include: { patient: { select: { id: true, primaryDoctorId: true } } }
    });

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (req.user.role === 'DOCTOR' && doc.patient.primaryDoctorId !== req.user.id && doc.doctorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.medicalDocument.update({
      where: { id: doc.id },
      data: { category, verificationStatus: 'DOCTOR_VERIFIED' }
    });

    res.json({ message: 'Category updated', document: { id: updated.id, category: updated.category, verificationStatus: updated.verificationStatus } });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
};

export const getLabResults = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
      if (!access) return res.status(403).json({ error: 'Access Required', code: 'ACCESS_REQUIRED' });
    }

    const labs = await prisma.extractedValue.findMany({
      where: { patientId: patient.id },
      orderBy: { testDate: 'desc' },
      include: { document: { select: { originalName: true, documentId: true, category: true } } }
    });

    res.json({ labResults: labs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lab results' });
  }
};

export const compareReports = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { docId1, docId2 } = req.query;

    if (!docId1 || !docId2) return res.status(400).json({ error: 'Two document IDs required' });

    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false } });
      if (!access) return res.status(403).json({ error: 'Access Required' });
    }

    const [doc1, doc2] = await Promise.all([
      prisma.medicalDocument.findFirst({ where: { OR: [{ id: docId1 }, { documentId: docId1 }], patientId: patient.id }, include: { extractedValues: true, extractedEntities: true } }),
      prisma.medicalDocument.findFirst({ where: { OR: [{ id: docId2 }, { documentId: docId2 }], patientId: patient.id }, include: { extractedValues: true, extractedEntities: true } })
    ]);

    if (!doc1 || !doc2) return res.status(404).json({ error: 'One or both documents not found' });

    const labs1Map = new Map(doc1.extractedValues.map(v => [v.testName, v]));
    const labs2Map = new Map(doc2.extractedValues.map(v => [v.testName, v]));

    const allTestNames = new Set([...labs1Map.keys(), ...labs2Map.keys()]);
    const comparison = [];

    for (const testName of allTestNames) {
      const v1 = labs1Map.get(testName);
      const v2 = labs2Map.get(testName);

      let status = 'Unchanged';
      let change = null;

      if (!v1) status = 'Newly reported';
      else if (!v2) status = 'No longer reported';
      else {
        const n1 = v1.numericValue;
        const n2 = v2.numericValue;
        if (n1 !== null && n2 !== null) {
          if (n2 > n1) { status = 'Increased'; change = n2 - n1; }
          else if (n2 < n1) { status = 'Decreased'; change = n1 - n2; }
          else status = 'Unchanged';
        }
      }

      comparison.push({
        testName,
        previous: v1 ? { result: v1.result, unit: v1.unit, referenceRange: v1.referenceRange, status: v1.status, date: v1.testDate, source: doc1.originalName, page: v1.pageNumber } : null,
        current: v2 ? { result: v2.result, unit: v2.unit, referenceRange: v2.referenceRange, status: v2.status, date: v2.testDate, source: doc2.originalName, page: v2.pageNumber } : null,
        status,
        change
      });
    }

    res.json({
      patientId: patient.patientId,
      previous: { documentId: doc1.documentId, fileName: doc1.originalName, category: doc1.category, date: doc1.documentDate || doc1.uploadDate },
      current: { documentId: doc2.documentId, fileName: doc2.originalName, category: doc2.category, date: doc2.documentDate || doc2.uploadDate },
      comparison,
      summary: {
        totalTests: comparison.length,
        increased: comparison.filter(c => c.status === 'Increased').length,
        decreased: comparison.filter(c => c.status === 'Decreased').length,
        unchanged: comparison.filter(c => c.status === 'Unchanged').length,
        newlyReported: comparison.filter(c => c.status === 'Newly reported').length
      }
    });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ error: 'Comparison failed' });
  }
};
