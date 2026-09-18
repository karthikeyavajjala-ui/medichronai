import crypto from 'crypto';

export const generateDoctorId = async (prisma, specialtyCode) => {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `${year}${specialtyCode}`;
  
  const existing = await prisma.doctor.findMany({
    where: { doctorId: { startsWith: prefix } },
    orderBy: { doctorId: 'desc' },
    take: 1
  });

  let seq = 1;
  if (existing.length > 0) {
    const lastId = existing[0].doctorId;
    const lastSeq = parseInt(lastId.slice(prefix.length), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  const seqStr = String(seq).padStart(3, '0');
  return `${prefix}${seqStr}`;
};

export const generatePatientId = async (prisma, doctorDoctorId) => {
  const prefix = `${doctorDoctorId}P`;
  
  const existing = await prisma.patient.findMany({
    where: { patientId: { startsWith: prefix } },
    orderBy: { patientId: 'desc' },
    take: 1
  });

  let seq = 1;
  if (existing.length > 0) {
    const lastId = existing[0].patientId;
    const lastSeq = parseInt(lastId.slice(prefix.length), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  const seqStr = String(seq).padStart(3, '0');
  return `${prefix}${seqStr}`;
};

export const generateDocumentId = () => {
  return `DOC${Date.now()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

export const generateEventId = () => {
  return `EVT${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
};

export const calculateAge = (dob) => {
  const diff = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const extractDatesFromText = (text) => {
  const datePatterns = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
    /\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g,
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/gi,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\b/gi
  ];
  
  const dates = [];
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const dateStr = match[1] || match[0];
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
        dates.push({ raw: dateStr, parsed: parsed.toISOString(), timestamp: parsed.getTime() });
      }
    }
  }
  return dates;
};
