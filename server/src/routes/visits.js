import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { addVisit, getVisits, addPrescription, getPrescriptions } from '../controllers/visitController.js';

const router = express.Router();
router.use(authenticate);
router.post('/', authorizeRoles('DOCTOR'), addVisit);
router.get('/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), getVisits);
router.post('/prescription', authorizeRoles('DOCTOR'), addPrescription);
router.get('/prescription/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), getPrescriptions);
export default router;
