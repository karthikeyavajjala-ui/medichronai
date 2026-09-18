import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { requestAccess, getAccessRequestsForDoctor, getAccessRequestsForPatient, approveAccessRequest, rejectAccessRequest, revokeAccess, getActiveAccess, getAuditLogs } from '../controllers/accessController.js';

const router = express.Router();
router.use(authenticate);

router.post('/request', authorizeRoles('DOCTOR'), requestAccess);
router.get('/doctor/requests', authorizeRoles('DOCTOR'), getAccessRequestsForDoctor);
router.get('/patient/requests', authorizeRoles('PATIENT'), getAccessRequestsForPatient);
router.post('/approve/:requestId', authorizeRoles('PATIENT'), approveAccessRequest);
router.post('/reject/:requestId', authorizeRoles('PATIENT'), rejectAccessRequest);
router.delete('/revoke/:accessId', authorizeRoles('DOCTOR', 'PATIENT'), revokeAccess);
router.get('/active', authorizeRoles('DOCTOR', 'PATIENT'), getActiveAccess);
router.get('/active/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), getActiveAccess);
router.get('/audit/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), getAuditLogs);

export default router;
