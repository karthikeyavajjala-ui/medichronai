import express from 'express';
import { addPatient, getPatients, searchPatientById, getPatientProfile, updatePatient, getPatientDashboard, getDoctorDashboard } from '../controllers/patientController.js';
import { authenticate, authorizeDoctor, authorizePatient, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/doctor/dashboard', authorizeDoctor, getDoctorDashboard);
router.get('/patient/dashboard', authorizePatient, getPatientDashboard);

router.post('/', authorizeDoctor, addPatient);
router.get('/', authorizeDoctor, getPatients);
router.get('/search/:patientId', authorizeDoctor, searchPatientById);
router.get('/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), getPatientProfile);
router.put('/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), updatePatient);

export default router;
