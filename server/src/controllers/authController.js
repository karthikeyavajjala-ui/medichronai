import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { generateDoctorId } from '../utils/helpers.js';
import { DOCTOR_DESIGNATIONS } from '../config/constants.js';

export const doctorSignUp = async (req, res) => {
  try {
    const { name, email, password, designation, phone } = req.body;

    if (!name || !email || !password || !designation) {
      return res.status(400).json({ error: 'Name, email, password, and designation are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const designationObj = DOCTOR_DESIGNATIONS.find(d => d.name === designation || d.code === designation);
    if (!designationObj) {
      return res.status(400).json({ error: 'Invalid designation', validDesignations: DOCTOR_DESIGNATIONS.map(d => d.name) });
    }

    const existing = await prisma.doctor.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Doctor with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const doctorId = await generateDoctorId(prisma, designationObj.code);

    const doctor = await prisma.doctor.create({
      data: {
        doctorId,
        name,
        email,
        password: hashedPassword,
        designation: designationObj.name,
        specialtyCode: designationObj.code,
        phone: phone || null
      }
    });

    const token = generateToken({ id: doctor.id, doctorId: doctor.doctorId, email: doctor.email, role: 'DOCTOR', designation: doctor.designation });

    res.status(201).json({
      message: 'Doctor account created successfully',
      token,
      doctor: {
        id: doctor.id,
        doctorId: doctor.doctorId,
        name: doctor.name,
        email: doctor.email,
        designation: doctor.designation,
        specialtyCode: doctor.specialtyCode,
        phone: doctor.phone
      }
    });
  } catch (error) {
    console.error('Doctor signup error:', error);
    res.status(500).json({ error: 'Failed to create doctor account', details: error.message });
  }
};

export const doctorSignIn = async (req, res) => {
  try {
    const { email, password, doctorId } = req.body;

    if ((!email && !doctorId) || !password) {
      return res.status(400).json({ error: 'Email/Doctor ID and password are required' });
    }

    const doctor = await prisma.doctor.findFirst({
      where: { OR: [{ email: email || '' }, { doctorId: doctorId || '' }] }
    });

    if (!doctor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, doctor.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: doctor.id, doctorId: doctor.doctorId, email: doctor.email, role: 'DOCTOR', designation: doctor.designation });

    res.json({
      message: 'Sign in successful',
      token,
      doctor: {
        id: doctor.id,
        doctorId: doctor.doctorId,
        name: doctor.name,
        email: doctor.email,
        designation: doctor.designation,
        specialtyCode: doctor.specialtyCode
      }
    });
  } catch (error) {
    console.error('Doctor signin error:', error);
    res.status(500).json({ error: 'Sign in failed' });
  }
};

export const patientActivation = async (req, res) => {
  try {
    const { patientId, email, password, confirmPassword } = req.body;

    if (!patientId || !email || !password) {
      return res.status(400).json({ error: 'Patient ID, email, and password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const patient = await prisma.patient.findFirst({
      where: { patientId, email }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found. Check Patient ID and email.' });
    }

    if (patient.isActivated && patient.password) {
      return res.status(400).json({ error: 'Account already activated. Please sign in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: { password: hashedPassword, isActivated: true }
    });

    const token = generateToken({ id: updated.id, patientId: updated.patientId, email: updated.email, role: 'PATIENT' });

    res.json({
      message: 'Patient account activated successfully',
      token,
      patient: {
        id: updated.id,
        patientId: updated.patientId,
        name: updated.name,
        email: updated.email
      }
    });
  } catch (error) {
    console.error('Patient activation error:', error);
    res.status(500).json({ error: 'Activation failed', details: error.message });
  }
};

export const patientSignIn = async (req, res) => {
  try {
    const { email, password, patientId } = req.body;

    if ((!email && !patientId) || !password) {
      return res.status(400).json({ error: 'Email/Patient ID and password required' });
    }

    const patient = await prisma.patient.findFirst({
      where: { OR: [{ email: email || '' }, { patientId: patientId || '' }] }
    });

    if (!patient) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!patient.isActivated || !patient.password) {
      return res.status(401).json({ error: 'Account not activated. Please activate your account first.' });
    }

    const isValid = await bcrypt.compare(password, patient.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: patient.id, patientId: patient.patientId, email: patient.email, role: 'PATIENT' });

    res.json({
      message: 'Sign in successful',
      token,
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        name: patient.name,
        email: patient.email
      }
    });
  } catch (error) {
    console.error('Patient signin error:', error);
    res.status(500).json({ error: 'Sign in failed' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userRole = role === 'PATIENT' ? 'PATIENT' : 'DOCTOR';
    
    let user = null;
    if (userRole === 'DOCTOR') {
      user = await prisma.doctor.findUnique({ where: { email } });
    } else {
      user = await prisma.patient.findUnique({ where: { email } });
    }

    if (!user) {
      return res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { email, role: userRole, token, expiresAt }
    });

    console.log(`Password reset token for ${email} (${userRole}): ${token}`);

    res.json({
      message: 'Password reset token generated',
      token,
      note: 'In production, this would be sent via email. For demo, token is returned.',
      expiresAt
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });
    if (newPassword !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    if (resetToken.role === 'DOCTOR') {
      await prisma.doctor.updateMany({ where: { email: resetToken.email }, data: { password: hashedPassword } });
    } else {
      await prisma.patient.updateMany({ where: { email: resetToken.email }, data: { password: hashedPassword } });
    }

    await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } });

    res.json({ message: 'Password reset successful. Please sign in with new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
};

export const getProfile = async (req, res) => {
  try {
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { id: req.user.id } });
      res.json({ role: 'DOCTOR', profile: { id: doctor.id, doctorId: doctor.doctorId, name: doctor.name, email: doctor.email, designation: doctor.designation, specialtyCode: doctor.specialtyCode, phone: doctor.phone, createdAt: doctor.createdAt } });
    } else {
      const patient = await prisma.patient.findUnique({ where: { id: req.user.id }, include: { primaryDoctor: { select: { name: true, doctorId: true, designation: true } } } });
      res.json({ role: 'PATIENT', profile: { id: patient.id, patientId: patient.patientId, name: patient.name, email: patient.email, dob: patient.dob, gender: patient.gender, phone: patient.phone, bloodGroup: patient.bloodGroup, primaryDoctor: patient.primaryDoctor } });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const getDesignations = async (req, res) => {
  res.json({ designations: DOCTOR_DESIGNATIONS });
};
