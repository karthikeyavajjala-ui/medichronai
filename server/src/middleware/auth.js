import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'healthcare-super-secret-key-change-in-production-2026';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;

    if (decoded.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { id: decoded.id } });
      if (!doctor) return res.status(401).json({ error: 'Doctor not found' });
      req.doctor = doctor;
    } else if (decoded.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { id: decoded.id } });
      if (!patient) return res.status(401).json({ error: 'Patient not found' });
      req.patient = patient;
    }

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorizeDoctor = (req, res, next) => {
  if (req.user?.role !== 'DOCTOR') {
    return res.status(403).json({ error: 'Doctor access required' });
  }
  next();
};

export const authorizePatient = (req, res, next) => {
  if (req.user?.role !== 'PATIENT') {
    return res.status(403).json({ error: 'Patient access required' });
  }
  next();
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyPatientAccess = async (req, res, next) => {
  try {
    const patientId = req.params.patientId || req.body.patientId || req.query.patientId;
    if (!patientId) return next();

    if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { OR: [{ id: patientId }, { patientId: patientId }] }
      });
      if (!patient || patient.id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied to patient records' });
      }
      return next();
    }

    if (req.user.role === 'DOCTOR') {
      const patient = await prisma.patient.findFirst({
        where: { OR: [{ id: patientId }, { patientId: patientId }] }
      });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      if (patient.primaryDoctorId === req.user.id) {
        return next();
      }

      const access = await prisma.patientAccess.findFirst({
        where: {
          doctorId: req.user.id,
          patientId: patient.id,
          isRevoked: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      if (!access) {
        return res.status(403).json({ 
          error: 'Access required',
          code: 'ACCESS_REQUIRED',
          patientId: patient.patientId,
          message: 'You need patient authorization to access this record. Please request access.'
        });
      }

      req.patientAccess = access;
      return next();
    }

    next();
  } catch (error) {
    console.error('Access verification error:', error);
    return res.status(500).json({ error: 'Access verification failed' });
  }
};
