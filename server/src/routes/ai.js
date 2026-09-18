import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { askAI, getConversations, getConversationMessages, exportExcel, exportPDF, createDemoData } from '../controllers/aiController.js';

const router = express.Router();
router.use(authenticate);

router.post('/ask', authorizeRoles('DOCTOR', 'PATIENT'), askAI);
router.get('/conversations/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), getConversations);
router.get('/conversation/:conversationId', authorizeRoles('DOCTOR', 'PATIENT'), getConversationMessages);
router.get('/export/excel/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), exportExcel);
router.get('/export/pdf/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), exportPDF);
router.post('/demo', authorizeRoles('DOCTOR'), createDemoData);

export default router;
