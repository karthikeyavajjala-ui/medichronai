import prisma from '../config/database.js';
import { generatePatientId, calculateAge } from '../utils/helpers.js';

export const addPatient = async (req, res) => {
  try {
    const { name, dob, gender, phone, email, address, emergencyContact, bloodGroup, medicalInfo } = req.body;

    if (!name || !dob || !gender || !phone || !email) {
      return res.status(400).json({ error: 'Name, DOB, gender, phone, email are required' });
    }

    const existingEmail = await prisma.patient.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Patient with this email already exists' });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: req.user.id } });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const patientId = await generatePatientId(prisma, doctor.doctorId);

    const patient = await prisma.patient.create({
      data: {
        patientId,
        primaryDoctorId: doctor.id,
        name,
        dob: new Date(dob),
        gender,
        phone,
        email,
        address: address || null,
        emergencyContact: emergencyContact || null,
        bloodGroup: bloodGroup || null,
        medicalInfo: medicalInfo || null,
        isActivated: false
      }
    });

    await prisma.accessAuditLog.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
        action: 'PATIENT_CREATED',
        details: `Patient ${patientId} created by Doctor ${doctor.doctorId}`,
        permissionType: 'FULL'
      }
    });

    await prisma.patientAccess.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
        accessType: 'FULL',
        grantedBy: doctor.id
      }
    });

    res.status(201).json({
      message: 'Patient created successfully',
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        name: patient.name,
        email: patient.email,
        dob: patient.dob,
        gender: patient.gender,
        phone: patient.phone,
        bloodGroup: patient.bloodGroup,
        age: calculateAge(patient.dob),
        isActivated: patient.isActivated
      }
    });
  } catch (error) {
    console.error('Add patient error:', error);
    res.status(500).json({ error: 'Failed to create patient', details: error.message });
  }
};

export const getPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const doctorId = req.user.id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = { primaryDoctorId: doctorId };

    if (search) {
      where = {
        AND: [
          { primaryDoctorId: doctorId },
          {
            OR: [
              { name: { contains: search } },
              { patientId: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } }
            ]
          }
        ]
      };
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { documents: true, medicalEvents: true, visits: true } }
        }
      }),
      prisma.patient.count({ where })
    ]);

    const accessiblePatients = await prisma.patientAccess.findMany({
      where: { doctorId, isRevoked: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      include: { patient: { include: { _count: { select: { documents: true, medicalEvents: true, visits: true } } } } }
    });

    let allPatients = patients;
    if (!search) {
      const primaryIds = new Set(patients.map(p => p.id));
      const additional = accessiblePatients.filter(ap => !primaryIds.has(ap.patient.id)).map(ap => ap.patient);
      allPatients = [...patients, ...additional];
    }

    res.json({
      patients: allPatients.map(p => ({
        id: p.id,
        patientId: p.patientId,
        name: p.name,
        email: p.email,
        phone: p.phone,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        dob: p.dob,
        age: calculateAge(p.dob),
        isActivated: p.isActivated,
        createdAt: p.createdAt,
        totalDocuments: p._count?.documents || 0,
        totalEvents: p._count?.medicalEvents || 0,
        totalVisits: p._count?.visits || 0,
        isPrimary: p.primaryDoctorId === doctorId
      })),
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

export const searchPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user.id;

    const patient = await prisma.patient.findFirst({
      where: { patientId },
      include: {
        primaryDoctor: { select: { name: true, doctorId: true, designation: true } },
        _count: { select: { documents: true, medicalEvents: true, visits: true, prescriptions: true } }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.primaryDoctorId === doctorId) {
      return res.json({
        patient: {
          id: patient.id,
          patientId: patient.patientId,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          gender: patient.gender,
          dob: patient.dob,
          age: calculateAge(patient.dob),
          bloodGroup: patient.bloodGroup,
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          primaryDoctor: patient.primaryDoctor,
          totalDocuments: patient._count.documents,
          totalEvents: patient._count.medicalEvents,
          totalVisits: patient._count.visits,
          totalPrescriptions: patient._count.prescriptions,
          access: 'FULL',
          isPrimary: true
        }
      });
    }

    const access = await prisma.patientAccess.findFirst({
      where: { doctorId, patientId: patient.id, isRevoked: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
    });

    if (access) {
      return res.json({
        patient: {
          id: patient.id,
          patientId: patient.patientId,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          gender: patient.gender,
          dob: patient.dob,
          age: calculateAge(patient.dob),
          bloodGroup: patient.bloodGroup,
          address: patient.address,
          primaryDoctor: patient.primaryDoctor,
          totalDocuments: patient._count.documents,
          totalEvents: patient._count.medicalEvents,
          totalVisits: patient._count.visits,
          access: access.accessType,
          isPrimary: false,
          accessDetails: access
        }
      });
    }

    return res.status(403).json({
      error: 'Access Required',
      code: 'ACCESS_REQUIRED',
      patientId: patient.patientId,
      patientName: patient.name,
      primaryDoctor: patient.primaryDoctor,
      message: 'You need patient authorization to access this record. Request access from the patient.'
    });
  } catch (error) {
    console.error('Search patient error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

export const getPatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    let patient = await prisma.patient.findFirst({
      where: { OR: [{ id: patientId }, { patientId }] },
      include: {
        primaryDoctor: true,
        documents: { orderBy: { uploadDate: 'desc' }, take: 5 },
        medicalEvents: { orderBy: { eventDate: 'desc' }, take: 5 },
        visits: { orderBy: { date: 'desc' }, take: 5 },
        prescriptions: { orderBy: { date: 'desc' }, take: 5, include: { medications: true } },
        patientAccesses: { where: { isRevoked: false }, include: { doctor: { select: { name: true, doctorId: true, designation: true } } } },
        _count: { select: { documents: true, medicalEvents: true, visits: true, prescriptions: true, extractedValues: true } }
      }
    });

    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'DOCTOR') {
      const isPrimary = patient.primaryDoctorId === req.user.id;
      if (!isPrimary) {
        const access = await prisma.patientAccess.findFirst({
          where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
        });
        if (!access) {
          return res.status(403).json({ error: 'Access Required', code: 'ACCESS_REQUIRED' });
        }
      }
    }

    const latestLabs = await prisma.extractedValue.findMany({
      where: { patientId: patient.id },
      orderBy: { testDate: 'desc' },
      take: 5
    });

    res.json({
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        name: patient.name,
        email: patient.email,
        dob: patient.dob,
        age: calculateAge(patient.dob),
        gender: patient.gender,
        phone: patient.phone,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        bloodGroup: patient.bloodGroup,
        medicalInfo: patient.medicalInfo,
        isActivated: patient.isActivated,
        createdAt: patient.createdAt,
        primaryDoctor: patient.primaryDoctor ? { name: patient.primaryDoctor.name, doctorId: patient.primaryDoctor.doctorId, designation: patient.primaryDoctor.designation } : null,
        totalDocuments: patient._count.documents,
        totalEvents: patient._count.medicalEvents,
        totalVisits: patient._count.visits,
        totalPrescriptions: patient._count.prescriptions,
        totalLabResults: patient._count.extractedValues,
        recentDocuments: patient.documents,
        recentEvents: patient.medicalEvents,
        recentVisits: patient.visits,
        recentPrescriptions: patient.prescriptions,
        latestLabs,
        authorizedDoctors: patient.patientAccesses.map(pa => ({ doctor: pa.doctor, accessType: pa.accessType, grantedAt: pa.grantedAt, expiresAt: pa.expiresAt })),
        timelineSummary: `${patient._count.medicalEvents} events across ${patient._count.documents} documents`
      }
    });
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, phone, address, emergencyContact, bloodGroup, medicalInfo } = req.body;

    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      return res.status(403).json({ error: 'Only primary doctor can update patient' });
    }

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: { name: name || patient.name, phone: phone || patient.phone, address, emergencyContact, bloodGroup, medicalInfo }
    });

    res.json({ message: 'Patient updated', patient: updated });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
};

export const getPatientDashboard = async (req, res) => {
  try {
    const patientId = req.user.id;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        documents: { orderBy: { uploadDate: 'desc' }, take: 10 },
        medicalEvents: { orderBy: { eventDate: 'desc' }, take: 10 },
        visits: { orderBy: { date: 'desc' }, take: 5, include: { doctor: true } },
        prescriptions: { orderBy: { date: 'desc' }, take: 5, include: { medications: true, doctor: true } },
        extractedValues: { orderBy: { testDate: 'desc' }, take: 10 },
        patientAccesses: { where: { isRevoked: false }, include: { doctor: true } },
        accessRequests: { where: { status: 'PENDING' }, include: { doctor: true } },
        _count: { select: { documents: true, medicalEvents: true, visits: true, prescriptions: true } }
      }
    });

    res.json({
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        name: patient.name,
        age: calculateAge(patient.dob),
        gender: patient.gender,
        bloodGroup: patient.bloodGroup
      },
      stats: {
        totalDocuments: patient._count.documents,
        totalEvents: patient._count.medicalEvents,
        totalVisits: patient._count.visits,
        totalPrescriptions: patient._count.prescriptions,
        activeDoctorAccess: patient.patientAccesses.length,
        pendingRequests: patient.accessRequests.length
      },
      recentDocuments: patient.documents,
      recentEvents: patient.medicalEvents,
      recentVisits: patient.visits,
      recentPrescriptions: patient.prescriptions,
      labResults: patient.extractedValues,
      activeAccess: patient.patientAccesses,
      pendingRequests: patient.accessRequests
    });
  } catch (error) {
    console.error('Patient dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

export const getDoctorDashboard = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const [totalPatients, totalDocuments, processingDocs, completedDocs, pendingRequests, recentPatients, recentEvents] = await Promise.all([
      prisma.patient.count({ where: { primaryDoctorId: doctorId } }),
      prisma.medicalDocument.count({ where: { doctorId } }),
      prisma.medicalDocument.count({ where: { doctorId, processingStatus: { in: ['UPLOADED', 'PROCESSING', 'EXTRACTING', 'ANALYZING', 'STRUCTURING', 'BUILDING_TIMELINE'] } } }),
      prisma.medicalDocument.count({ where: { doctorId, processingStatus: 'COMPLETED' } }),
      prisma.accessRequest.count({ where: { doctorId, status: 'PENDING' } }),
      prisma.patient.findMany({ where: { primaryDoctorId: doctorId }, orderBy: { createdAt: 'desc' }, take: 5, include: { _count: { select: { documents: true } } } }),
      prisma.medicalEvent.findMany({ where: { doctorId }, orderBy: { createdAt: 'desc' }, take: 10, include: { patient: { select: { name: true, patientId: true } } } })
    ]);

    const accessiblePatientsCount = await prisma.patientAccess.count({ where: { doctorId, isRevoked: false } });

    res.json({
      stats: {
        totalPatients,
        accessiblePatients: accessiblePatientsCount,
        totalDocuments,
        processingDocuments: processingDocs,
        completedAnalyses: completedDocs,
        pendingAccessRequests: pendingRequests
      },
      recentPatients: recentPatients.map(p => ({ id: p.id, patientId: p.patientId, name: p.name, age: calculateAge(p.dob), gender: p.gender, totalDocuments: p._count.documents, createdAt: p.createdAt })),
      recentEvents
    });
  } catch (error) {
    console.error('Doctor dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};
