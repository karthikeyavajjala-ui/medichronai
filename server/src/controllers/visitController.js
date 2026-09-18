import prisma from '../config/database.js';
import { generateEventId } from '../utils/helpers.js';

export const addVisit = async (req, res) => {
  try {
    const { patientId, date, reason, clinicalNotes, findings, investigations, assessment, plan, followUp } = req.body;

    if (!patientId || !date) return res.status(400).json({ error: 'Patient ID and date required' });

    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false } });
      if (!access) return res.status(403).json({ error: 'Access denied' });
    }

    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        doctorId: req.user.id,
        date: new Date(date),
        reason: reason || null,
        clinicalNotes: clinicalNotes || null,
        findings: findings || null,
        investigations: investigations || null,
        assessment: assessment || null,
        plan: plan || null,
        followUp: followUp || null,
        sourceType: 'DOCTOR_ENTERED'
      },
      include: { doctor: { select: { name: true, doctorId: true } } }
    });

    await prisma.medicalEvent.create({
      data: {
        eventId: generateEventId(),
        patientId: patient.id,
        eventType: 'Consultation',
        eventDate: new Date(date),
        description: `Visit: ${reason || 'Consultation'} - ${assessment || clinicalNotes || ''}`.substring(0,500),
        doctorId: req.user.id,
        confidence: 1.0,
        verificationStatus: 'DOCTOR_VERIFIED',
        sourceReference: `Visit on ${new Date(date).toLocaleDateString()} by Doctor`
      }
    });

    res.status(201).json({ message: 'Visit added', visit });
  } catch (error) {
    console.error('Add visit error:', error);
    res.status(500).json({ error: 'Failed to add visit' });
  }
};

export const getVisits = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false } });
      if (!access) return res.status(403).json({ error: 'Access Required' });
    }

    const visits = await prisma.visit.findMany({ where: { patientId: patient.id }, orderBy: { date: 'desc' }, include: { doctor: { select: { name: true, doctorId: true, designation: true } }, prescriptions: { include: { medications: true } } } });
    res.json({ visits });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
};

export const addPrescription = async (req, res) => {
  try {
    const { patientId, date, relatedVisitId, instructions, medications } = req.body;

    if (!patientId || !medications || medications.length === 0) return res.status(400).json({ error: 'Patient ID and medications required' });

    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false } });
      if (!access) return res.status(403).json({ error: 'Access denied' });
    }

    const prescription = await prisma.prescription.create({
      data: {
        patientId: patient.id,
        doctorId: req.user.id,
        date: date ? new Date(date) : new Date(),
        relatedVisitId: relatedVisitId || null,
        instructions: instructions || null,
        sourceType: 'DOCTOR_ENTERED',
        medications: { create: medications.map(med => ({ medication: med.medication, dosage: med.dosage || null, frequency: med.frequency || null, duration: med.duration || null, instructions: med.instructions || null })) }
      },
      include: { medications: true, doctor: { select: { name: true, doctorId: true } } }
    });

    await prisma.medicalEvent.create({
      data: {
        eventId: generateEventId(),
        patientId: patient.id,
        eventType: 'Prescription',
        eventDate: prescription.date,
        description: `Prescription: ${medications.map(m => `${m.medication} ${m.dosage || ''}`).join(', ')}`.substring(0,500),
        doctorId: req.user.id,
        confidence: 1.0,
        verificationStatus: 'DOCTOR_VERIFIED',
        sourceReference: `Prescription on ${new Date(prescription.date).toLocaleDateString()}`
      }
    });

    res.status(201).json({ message: 'Prescription added', prescription });
  } catch (error) {
    console.error('Add prescription error:', error);
    res.status(500).json({ error: 'Failed to add prescription' });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false } });
      if (!access) return res.status(403).json({ error: 'Access Required' });
    }

    const prescriptions = await prisma.prescription.findMany({ where: { patientId: patient.id }, orderBy: { date: 'desc' }, include: { medications: true, doctor: { select: { name: true, doctorId: true, designation: true } }, relatedVisit: true } });
    res.json({ prescriptions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
};
