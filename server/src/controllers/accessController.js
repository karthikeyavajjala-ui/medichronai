import prisma from '../config/database.js';

export const requestAccess = async (req, res) => {
  try {
    const { patientId, requestedAccessType = 'FULL', message, selectedDocuments, expiresAt } = req.body;

    if (!patientId) return res.status(400).json({ error: 'Patient ID required' });

    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (patient.primaryDoctorId === req.user.id) return res.status(400).json({ error: 'You are already the primary doctor for this patient' });

    const existingAccess = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
    if (existingAccess) return res.status(400).json({ error: 'You already have access to this patient', access: existingAccess });

    const existingRequest = await prisma.accessRequest.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, status: 'PENDING' } });
    if (existingRequest) return res.status(400).json({ error: 'Access request already pending', request: existingRequest });

    const accessRequest = await prisma.accessRequest.create({
      data: {
        doctorId: req.user.id,
        patientId: patient.id,
        requestedAccessType,
        message: message || null,
        selectedDocuments: selectedDocuments ? JSON.stringify(selectedDocuments) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: { doctor: { select: { name: true, doctorId: true, designation: true } }, patient: { select: { name: true, patientId: true } } }
    });

    await prisma.accessAuditLog.create({
      data: {
        doctorId: req.user.id,
        patientId: patient.id,
        action: 'ACCESS_REQUESTED',
        details: `Doctor ${req.user.doctorId} requested ${requestedAccessType} access to patient ${patient.patientId}`,
        permissionType: requestedAccessType
      }
    });

    res.status(201).json({ message: 'Access request sent to patient', request: accessRequest });
  } catch (error) {
    console.error('Request access error:', error);
    res.status(500).json({ error: 'Failed to request access' });
  }
};

export const getAccessRequestsForDoctor = async (req, res) => {
  try {
    const requests = await prisma.accessRequest.findMany({ where: { doctorId: req.user.id }, orderBy: { createdAt: 'desc' }, include: { patient: { select: { name: true, patientId: true, id: true } } } });
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

export const getAccessRequestsForPatient = async (req, res) => {
  try {
    const patientId = req.user.id;
    const requests = await prisma.accessRequest.findMany({ where: { patientId, status: 'PENDING' }, orderBy: { createdAt: 'desc' }, include: { doctor: { select: { name: true, doctorId: true, designation: true, email: true } } } });
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

export const approveAccessRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { accessType, selectedDocuments, expiresAt } = req.body;

    const accessRequest = await prisma.accessRequest.findUnique({ where: { id: requestId }, include: { patient: true, doctor: true } });
    if (!accessRequest) return res.status(404).json({ error: 'Request not found' });

    if (accessRequest.patientId !== req.user.id) return res.status(403).json({ error: 'Only patient can approve requests' });
    if (accessRequest.status !== 'PENDING') return res.status(400).json({ error: `Request already ${accessRequest.status}` });

    const finalAccessType = accessType || accessRequest.requestedAccessType;

    await prisma.accessRequest.update({ where: { id: requestId }, data: { status: 'APPROVED' } });

    const patientAccess = await prisma.patientAccess.create({
      data: {
        doctorId: accessRequest.doctorId,
        patientId: accessRequest.patientId,
        accessType: finalAccessType,
        selectedDocuments: selectedDocuments ? JSON.stringify(selectedDocuments) : accessRequest.selectedDocuments,
        expiresAt: expiresAt ? new Date(expiresAt) : accessRequest.expiresAt,
        grantedBy: req.user.id
      },
      include: { doctor: { select: { name: true, doctorId: true } } }
    });

    await prisma.accessAuditLog.create({
      data: {
        doctorId: accessRequest.doctorId,
        patientId: accessRequest.patientId,
        action: 'ACCESS_GRANTED',
        details: `Patient ${accessRequest.patient.patientId} granted ${finalAccessType} access to Doctor ${accessRequest.doctor.doctorId}`,
        permissionType: finalAccessType
      }
    });

    res.json({ message: 'Access granted', access: patientAccess });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
};

export const rejectAccessRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const accessRequest = await prisma.accessRequest.findUnique({ where: { id: requestId }, include: { patient: true, doctor: true } });
    if (!accessRequest) return res.status(404).json({ error: 'Request not found' });
    if (accessRequest.patientId !== req.user.id) return res.status(403).json({ error: 'Only patient can reject requests' });
    if (accessRequest.status !== 'PENDING') return res.status(400).json({ error: `Request already ${accessRequest.status}` });

    await prisma.accessRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });

    await prisma.accessAuditLog.create({
      data: {
        doctorId: accessRequest.doctorId,
        patientId: accessRequest.patientId,
        action: 'ACCESS_REJECTED',
        details: `Patient ${accessRequest.patient.patientId} rejected access request from Doctor ${accessRequest.doctor.doctorId}`,
        permissionType: accessRequest.requestedAccessType
      }
    });

    res.json({ message: 'Access request rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject request' });
  }
};

export const revokeAccess = async (req, res) => {
  try {
    const { accessId } = req.params;

    const access = await prisma.patientAccess.findUnique({ where: { id: accessId }, include: { patient: true, doctor: true } });
    if (!access) return res.status(404).json({ error: 'Access not found' });

    if (req.user.role === 'PATIENT' && access.patientId !== req.user.id) return res.status(403).json({ error: 'Only patient can revoke access' });
    if (req.user.role === 'DOCTOR' && access.patient.primaryDoctorId !== req.user.id && access.doctorId !== req.user.id) return res.status(403).json({ error: 'Not authorized to revoke' });

    await prisma.patientAccess.update({ where: { id: accessId }, data: { isRevoked: true, revokedAt: new Date() } });

    await prisma.accessAuditLog.create({
      data: {
        doctorId: access.doctorId,
        patientId: access.patientId,
        action: 'ACCESS_REVOKED',
        details: `Access revoked for Doctor ${access.doctor.doctorId} to Patient ${access.patient.patientId} by ${req.user.role}`,
        permissionType: access.accessType
      }
    });

    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke access' });
  }
};

export const getActiveAccess = async (req, res) => {
  try {
    const { patientId } = req.params;
    let where = {};

    if (patientId) {
      const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      
      if (req.user.role === 'PATIENT' && patient.id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
      
      where.patientId = patient.id;
    } else {
      if (req.user.role === 'PATIENT') where.patientId = req.user.id;
      else if (req.user.role === 'DOCTOR') where.doctorId = req.user.id;
    }

    where.isRevoked = false;
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];

    const accesses = await prisma.patientAccess.findMany({ where, include: { doctor: { select: { name: true, doctorId: true, designation: true, email: true } }, patient: { select: { name: true, patientId: true, id: true } } }, orderBy: { grantedAt: 'desc' } });

    res.json({ accesses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch access list' });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false } });
      if (!access) return res.status(403).json({ error: 'Access denied' });
    }

    const logs = await prisma.accessAuditLog.findMany({ where: { patientId: patient.id }, orderBy: { createdAt: 'desc' }, take: 100, include: { doctor: { select: { name: true, doctorId: true } } } });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};
