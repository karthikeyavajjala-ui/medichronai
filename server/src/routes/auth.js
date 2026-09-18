import express from 'express';
import { doctorSignUp, doctorSignIn, patientActivation, patientSignIn, forgotPassword, resetPassword, getProfile, getDesignations } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/designations', getDesignations);
router.post('/doctor/signup', doctorSignUp);
router.post('/doctor/signin', doctorSignIn);
router.post('/patient/activate', patientActivation);
router.post('/patient/signin', patientSignIn);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticate, getProfile);

export default router;
