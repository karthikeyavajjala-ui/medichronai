import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { uploadDocuments, getPatientDocuments, getDocumentDetails, getDocumentFile, retryProcessing, updateDocumentCategory, getLabResults, compareReports } from '../controllers/documentController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const altDir = path.join('/home/user/uploads');
    if (!fs.existsSync(altDir)) fs.mkdirSync(altDir, { recursive: true });
    cb(null, fs.existsSync('/home/user/uploads') ? '/home/user/uploads' : uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type. Only PDF, JPG, PNG, WEBP allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024, files: 10 } });

router.use(authenticate);

router.post('/upload', authorizeRoles('DOCTOR'), upload.array('documents', 10), uploadDocuments);
router.get('/patient/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), getPatientDocuments);
router.get('/lab-results/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), getLabResults);
router.get('/compare/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), compareReports);
router.get('/:documentId', authorizeRoles('DOCTOR', 'PATIENT'), getDocumentDetails);
router.get('/:documentId/file', authorizeRoles('DOCTOR', 'PATIENT'), getDocumentFile);
router.post('/:documentId/retry', authorizeRoles('DOCTOR'), retryProcessing);
router.put('/:documentId/category', authorizeRoles('DOCTOR'), updateDocumentCategory);

export default router;
