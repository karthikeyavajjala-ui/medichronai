import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { getPatientTimeline, getTimelineStats } from '../controllers/timelineController.js';

const router = express.Router();
router.use(authenticate);
router.get('/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), getPatientTimeline);
router.get('/:patientId/stats', authorizeRoles('DOCTOR', 'PATIENT'), getTimelineStats);
export default router;
