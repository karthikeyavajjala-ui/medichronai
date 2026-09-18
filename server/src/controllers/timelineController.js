import prisma from '../config/database.js';

export const getPatientTimeline = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { eventType, startDate, endDate, page = 1, limit = 50 } = req.query;

    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
      if (!access) return res.status(403).json({ error: 'Access Required', code: 'ACCESS_REQUIRED' });
    }

    let where = { patientId: patient.id };
    if (eventType) where.eventType = eventType;
    if (startDate || endDate) {
      where.eventDate = {};
      if (startDate) where.eventDate.gte = new Date(startDate);
      if (endDate) where.eventDate.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
      prisma.medicalEvent.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { eventDate: 'asc' },
        include: {
          document: { select: { originalName: true, documentId: true, category: true } },
          sourceRelationships: { include: { targetEvent: true } },
          targetRelationships: { include: { sourceEvent: true } }
        }
      }),
      prisma.medicalEvent.count({ where })
    ]);

    const grouped = {};
    events.forEach(evt => {
      const dateKey = new Date(evt.eventDate).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(evt);
    });

    const timeline = Object.keys(grouped).sort().map(date => ({
      date,
      events: grouped[date].map(evt => ({
        id: evt.id,
        eventId: evt.eventId,
        eventType: evt.eventType,
        eventDate: evt.eventDate,
        description: evt.description,
        doctorId: evt.doctorId,
        document: evt.document,
        pageNumber: evt.pageNumber,
        confidence: evt.confidence,
        verificationStatus: evt.verificationStatus,
        sourceReference: evt.sourceReference,
        relationships: [...evt.sourceRelationships.map(r => ({ type: r.relationshipType, description: r.description, isDocumented: r.isDocumented, target: { id: r.targetEvent.id, type: r.targetEvent.eventType, description: r.targetEvent.description, date: r.targetEvent.eventDate } })), ...evt.targetRelationships.map(r => ({ type: `REVERSE_${r.relationshipType}`, description: r.description, isDocumented: r.isDocumented, source: { id: r.sourceEvent.id, type: r.sourceEvent.eventType, description: r.sourceEvent.description, date: r.sourceEvent.eventDate } }))]
      }))
    }));

    res.json({ patientId: patient.patientId, timeline, total, page: parseInt(page), limit: parseInt(limit), groupedByDate: timeline });
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
};

export const getTimelineStats = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patient.findFirst({ where: { OR: [{ id: patientId }, { patientId }] } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    if (req.user.role === 'PATIENT' && patient.id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'DOCTOR' && patient.primaryDoctorId !== req.user.id) {
      const access = await prisma.patientAccess.findFirst({ where: { doctorId: req.user.id, patientId: patient.id, isRevoked: false } });
      if (!access) return res.status(403).json({ error: 'Access Required' });
    }

    const stats = await prisma.medicalEvent.groupBy({ by: ['eventType'], where: { patientId: patient.id }, _count: { id: true } });
    const totalEvents = await prisma.medicalEvent.count({ where: { patientId: patient.id } });
    const dateRange = await prisma.medicalEvent.aggregate({ where: { patientId: patient.id }, _min: { eventDate: true }, _max: { eventDate: true } });

    res.json({ totalEvents, byType: stats.map(s => ({ type: s.eventType, count: s._count.id })), dateRange: { earliest: dateRange._min.eventDate, latest: dateRange._max.eventDate } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
