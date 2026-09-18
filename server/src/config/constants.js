export const DOCTOR_DESIGNATIONS = [
  { name: "Cardiologist", code: "CARD" },
  { name: "Neurologist", code: "NEUR" },
  { name: "Neurosurgeon", code: "NSUR" },
  { name: "General Surgeon", code: "GSUR" },
  { name: "Orthopedic Surgeon", code: "ORTH" },
  { name: "Dermatologist", code: "DERM" },
  { name: "Pediatrician", code: "PED" },
  { name: "Gynecologist", code: "GYNO" },
  { name: "Gastroenterologist", code: "GAST" },
  { name: "Nephrologist", code: "NEPH" },
  { name: "Pulmonologist", code: "PULM" },
  { name: "Endocrinologist", code: "ENDO" },
  { name: "Oncologist", code: "ONCO" },
  { name: "Urologist", code: "UROL" },
  { name: "Ophthalmologist", code: "OPHT" },
  { name: "ENT Specialist", code: "ENT" },
  { name: "Psychiatrist", code: "PSY" },
  { name: "Radiologist", code: "RAD" },
  { name: "Anaesthesiologist", code: "ANES" },
  { name: "Pathologist", code: "PATH" },
  { name: "Emergency Medicine Specialist", code: "EMER" },
  { name: "Rheumatologist", code: "RHEU" },
  { name: "General Physician", code: "GP" },
  { name: "Cardiothoracic Surgeon", code: "CTS" },
  { name: "Plastic Surgeon", code: "PLAS" },
  { name: "Vascular Surgeon", code: "VASC" },
  { name: "Infectious Disease Specialist", code: "IDS" },
  { name: "Critical Care Specialist", code: "CCR" },
];

export const DOCUMENT_CATEGORIES = [
  "Blood Test",
  "Lab Report",
  "Imaging Report",
  "X-Ray",
  "CT",
  "MRI",
  "Ultrasound",
  "ECG",
  "Prescription",
  "Discharge Summary",
  "Consultation Note",
  "Clinical Note",
  "Pathology Report",
  "Surgical Report",
  "Medical Certificate",
  "Previous Medical Record",
  "Other"
];

export const PROCESSING_STATUS = {
  UPLOADED: "UPLOADED",
  PROCESSING: "PROCESSING",
  EXTRACTING: "EXTRACTING",
  ANALYZING: "ANALYZING",
  STRUCTURING: "STRUCTURING",
  BUILDING_TIMELINE: "BUILDING_TIMELINE",
  COMPLETED: "COMPLETED",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  FAILED: "FAILED"
};

export const EVENT_TYPES = [
  "Consultation",
  "Diagnosis",
  "Lab Test",
  "Imaging",
  "Surgery",
  "Hospitalization",
  "Prescription",
  "Medication Change",
  "Follow-up",
  "Procedure",
  "Vital Signs",
  "Clinical Note"
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
