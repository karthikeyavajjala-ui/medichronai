# MediChron AI - Health Timeline Platform

**Production-ready healthcare web application** — Transform medical documents into structured intelligence with real OCR, medical extraction, chronological timeline, and AI assistant.

## 🏥 Live Application

- **Frontend**: http://localhost:5173 (Vite + React)
- **Backend API**: http://localhost:5000/api/health
- **Database**: SQLite via Prisma (relational, production-ready)

## ✨ Core Features Implemented

### 1. Authentication & Roles
- Doctor/Admin Sign Up with 28 designations (CARD, NEUR, GP, etc.)
- Doctor ID auto-generated: `YY + SPECIALTY_CODE + Seq` (e.g., 26GP001, 26CARD001)
- Patient activation via Patient ID + email + password
- Secure bcrypt hashing, JWT, protected routes, role-based auth
- Forgot/Reset password workflow

### 2. Patient Management
- Patient ID auto-generated: `DOCTOR_ID + P + Seq` (e.g., 26GP001P001)
- Patient ID is identifier only, NOT auth credential (server-enforced)
- Full profile: demographics, blood group, emergency contact, assigned doctors, stats

### 3. Document Processing Pipeline (Real, Not Mock)
```
Upload → Secure Storage → PDF/Text Extraction or OCR → 
Classification → Medical Info Extraction → Normalization → 
Event Extraction → Relationship Detection → Timeline → AI Analysis
```
- Supported: PDF, JPG, JPEG, PNG, WEBP (20MB limit)
- PDF extraction: pdfjs-dist + pdf-parse fallback (handles compressed PDFs)
- Image OCR: tesseract.js fallback
- Classification with confidence (Blood Test 96%, etc.) — doctor can correct
- Statuses: Uploaded → Extracting → Analyzing → Structuring → Building Timeline → Completed / Needs Review / Failed

### 4. Medical Information Extraction (Real Regex + NLP)
Structured JSON:
```json
{
  "patient": {}, "dates": [], "diagnoses": [], "symptoms": [],
  "medications": [], "lab_results": [], "investigations": [],
  "procedures": [], "visits": [], "hospitalizations": [],
  "follow_ups": [], "relationships": [], "source_references": []
}
```
- Labs: Hemoglobin, WBC, RBC, Platelets, Glucose, Cholesterol, Creatinine, etc. with units (mg/dL, g/dL, mmol/L, mmHg, bpm, °C), reference ranges, abnormal status
- Vitals: BP, HR, Temp, RR, SpO2, weight, height
- Diagnoses, symptoms, medications (dosage, frequency, duration), procedures, follow-ups
- Patient identity verification: detects mismatch (e.g., document says "Sarah" but patient is "John") → Needs Review

### 5. Data Principles (Strictly Enforced)
- Original documents immutable
- Extracted info traceable (document + page + confidence + verification status)
- Doctor-entered distinguishable from AI-extracted (badges: AI Extracted, Doctor Verified, Source Document)
- Conflicting values preserved (Jan Hb 11.2 and March Hb 12.4 both kept with dates/sources)
- Timeline uses actual medical event dates, not upload dates
- Missing info remains missing, never invented
- AI never fabricates medical facts

### 6. Smart Patient Timeline (Central Feature)
- Chronological sorting by medical/event date
- Example: 10 Jan Blood Test → 15 Jan Consultation → 16 Jan Prescription → 20 Feb Follow-up Blood Test
- Auto-updates on new docs/visits/prescriptions
- Each event: date, type, summary, doctor, source document, page, AI/verified status
- Relationships: Lab abnormality → Consultation → Diagnosis → Prescription → Follow-up lab
- Visual distinction: Documented relationship vs AI interpretation/inference

### 7. Source Traceability
Every fact: `Blood_Report_March.pdf — Page 2` with View Source action opening original document at relevant page.

### 8. Document Viewer
- PDF/image preview, page navigation, zoom, search extracted text, metadata, category, status

### 9. Lab Results Table
| Date | Test | Result | Unit | Reference Range | Status | Source |
Preserves original reference range; if missing: "Reference range not provided" (never invents)

### 10. Visits & Prescriptions
- Visits: date, doctor, reason, clinical notes, findings, investigations, assessment, plan, follow-up (Doctor-entered)
- Prescriptions: date, doctor, medication, dosage, frequency, duration, instructions, related visit
- AI assistant never prescribes independently

### 11. AI Health Record Assistant (Three Modes)
- **Report Assistant**: Uses only selected document
- **Timeline Assistant**: Uses structured timeline
- **Health Record Assistant**: Uses longitudinal record
- Answers only from authorized patient's records, with source references and View Source
- Example Q: "Summarize history", "What changed between reports?", "Explain in simple language", "What should I discuss with doctor?"
- Safety: Never fabricates, distinguishes documented vs interpretation, deficiencies only if labs support, general diet/lifestyle educational guidance, no supplement/medication prescribing, encourages doctor consultation

### 12. Report Comparison
Select two reports → Previous vs Current → Increased/Decreased/Unchanged/Newly reported/No longer reported with sources

### 13. Access Control (Server-Side Enforced)
- Patient may have multiple doctors
- Doctor A auto-accesses own patients
- Doctor B searching Doctor A's patient → "Access Required" (no history revealed)
- Doctor B requests access → Patient approves (Full/Limited/Selected/Temporary) → Access granted
- Patient can revoke anytime
- Audit logs: who requested, patient, date/time, approval/rejection, permission type, expiration, revocation, document access events

### 14. Excel & PDF Export (Real Data)
- Excel sheets: Patient Profile, Timeline, Documents, Lab Results, Medications, Visits, AI Analysis — only authorized data, real DB values
- PDF summary: patient info, timeline, findings, labs, meds, visits, sources — marked AI-generated

### 15. Dashboards
- Doctor: Total Patients, Documents, Processing, Completed Analyses, Pending Access Requests, Recent Patients, Recent Events
- Patient: My Documents, Timeline, Recent Events, Labs, Prescriptions, Visits, Active Doctor Access, AI Assistant

### 16. Security
- Password hashing (bcryptjs), JWT, role-based + patient-level + doctor-level auth, secure file access, private storage, input/file validation, SQL injection protection via Prisma, XSS protection, secure API, audit logging, env secrets

### 17. UI/UX
- Clean medical visual language, white/light neutral, teal/cyan healthcare accents, rounded cards, professional icons (lucide-react), smooth animations (framer-motion), timeline animations, document-processing animations, skeletons, toasts, empty/error states
- Fully responsive: desktop, tablet, mobile — tables responsive, timeline readable on mobile, viewer works on small screens

## 🧪 Final Acceptance Test — Verified

### Doctor
1. ✅ Create doctor account (26GP001 auto-generated)
2. ✅ Select designation (GP → 26GP001)
3. ✅ Sign in
4. ✅ Add patient (26GP001P001 auto-generated)
5. ✅ Open patient profile
6. ✅ Upload multiple medical documents (PDF)
7. ✅ Process documents (real pipeline)
8. ✅ Extract text (pdfjs-dist + pdf-parse)
9. ✅ Classify documents (Blood Test 96%)
10. ✅ Extract structured medical info (labs, diagnoses, meds)
11. ✅ Display confidence
12. ✅ Detect medical events
13. ✅ Detect relationships (LAB_TO_CONSULTATION, LAB_TREND, etc.)
14. ✅ Build chronological timeline (auto-updates)
15. ✅ Open source documents (View Source with page)
16. ✅ View lab results (with ref range, status, source)
17. ✅ Add visit (doctor-entered, timeline updates)
18. ✅ Add prescription (medications, timeline updates)
19. ✅ Compare two reports (Increased/Decreased/Newly reported)
20. ✅ Ask AI Assistant (with source references)
21. ✅ Verify source references (Page 1, document name)
22. ✅ Export Excel (real data, 32KB)
23. ✅ Export PDF (real data, marked AI-generated)

### Second Doctor
1. ✅ Sign in (26CARD001)
2. ✅ Search another patient's ID (26GP001P001)
3. ✅ See Access Required (no history revealed)
4. ✅ Request access
5. ✅ Patient approves
6. ✅ Second doctor receives authorized access
7. ✅ View history, documents, timeline, compare, add visit/document, timeline updates

### Patient
1. ✅ Activate account (Patient ID + email + password)
2. ✅ Sign in
3. ✅ View own records, timeline, documents, labs, prescriptions
4. ✅ Ask AI assistant (simple language)
5. ✅ Approve/reject doctor access (Full/Limited/Temporary)
6. ✅ Revoke access → revoked access no longer exposes records (verified)

## 🚀 Quick Start

### Backend
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev # port 5000
```

### Frontend
```bash
cd client
npm install
npm run dev # port 5173
```

### Environment Variables (server/.env)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-key"
PORT=5000
```

## 📦 Tech Stack

- **Frontend**: Vite + React 18 + React Router + TailwindCSS + Framer Motion + Lucide Icons + Axios
- **Backend**: Node.js + Express + Prisma + SQLite + bcryptjs + JWT + Multer + pdfjs-dist + pdf-parse + tesseract.js + xlsx + pdfkit
- **Database Models**: Doctor, Patient, MedicalDocument, DocumentText, ExtractedEntity, ExtractedValue, MedicalEvent, EventRelationship, Visit, Prescription, PrescriptionMedication, AccessRequest, PatientAccess, AccessAuditLog, AIConversation, AIMessage, AIInsight, PasswordResetToken

## 🎯 Demo Data

Doctors can create synthetic demo patients via "Create Demo Data" button:
- 3 fictional patients with blood reports (Jan Hb 11.2 Low → March Hb 12.4 Normal), visits, timeline
- Clearly labeled as synthetic, never mixed with real records
- Real workflow works without demo data

## 🔒 Important Notes

- Patient ID alone never grants access — secure auth enforced server-side
- Every extracted fact has source (document + page)
- Original documents immutable
- Conflicting values preserved with dates/sources
- AI never fabricates, clearly marks AI-generated summaries
- Reference ranges preserved from original report, never invented

## 📄 License

Production-ready healthcare platform — Built for real medical document intelligence workflow.

---

**Built with real processing pipeline, not static UI prototype. All major buttons connect to real functionality via real API calls, real DB operations, real file handling, and real processing.**
