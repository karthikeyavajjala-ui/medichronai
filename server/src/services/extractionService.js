import { extractDatesFromText } from '../utils/helpers.js';

const LAB_TEST_PATTERNS = [
  { name: "Hemoglobin", patterns: [/hemoglobin\s*[:\-]?\s*([\d\.]+)\s*(g\/dL|g\/dl|gm\/dl|g%)?/gi, /hb\s*[:\-]?\s*([\d\.]+)\s*(g\/dL)?/gi] },
  { name: "WBC", patterns: [/wbc\s*(count)?\s*[:\-]?\s*([\d,\.]+)\s*(\/cumm|\/cu mm|cells\/cumm|10\^3\/uL)?/gi, /white blood cells?\s*[:\-]?\s*([\d,\.]+)/gi] },
  { name: "RBC", patterns: [/rbc\s*(count)?\s*[:\-]?\s*([\d\.]+)\s*(million\/cumm|10\^6\/uL)?/gi] },
  { name: "Platelets", patterns: [/platelets?\s*[:\-]?\s*([\d,\.]+)\s*(lakh|\/cumm|10\^3\/uL)?/gi, /plt\s*[:\-]?\s*([\d,\.]+)/gi] },
  { name: "Glucose Fasting", patterns: [/fasting\s*(blood\s*)?glucose\s*[:\-]?\s*([\d\.]+)\s*(mg\/dL)?/gi, /fbs\s*[:\-]?\s*([\d\.]+)/gi, /glucose\s*\(?fasting\)?\s*[:\-]?\s*([\d\.]+)/gi] },
  { name: "Glucose Random", patterns: [/random\s*(blood\s*)?glucose\s*[:\-]?\s*([\d\.]+)/gi, /rbs\s*[:\-]?\s*([\d\.]+)/gi] },
  { name: "HbA1c", patterns: [/hba1c\s*[:\-]?\s*([\d\.]+)\s*%?/gi] },
  { name: "Total Cholesterol", patterns: [/total\s*cholesterol\s*[:\-]?\s*([\d\.]+)\s*(mg\/dL)?/gi, /cholesterol\s*[:\-]?\s*([\d\.]+)/gi] },
  { name: "HDL", patterns: [/hdl\s*(cholesterol)?\s*[:\-]?\s*([\d\.]+)/gi] },
  { name: "LDL", patterns: [/ldl\s*(cholesterol)?\s*[:\-]?\s*([\d\.]+)/gi] },
  { name: "Triglycerides", patterns: [/triglycerides?\s*[:\-]?\s*([\d\.]+)/gi] },
  { name: "Creatinine", patterns: [/creatinine\s*[:\-]?\s*([\d\.]+)\s*(mg\/dL)?/gi] },
  { name: "Urea", patterns: [/\burea\s*[:\-]?\s*([\d\.]+)/gi, /blood urea\s*[:\-]?\s*([\d\.]+)/gi] },
  { name: "Bilirubin Total", patterns: [/total\s*bilirubin\s*[:\-]?\s*([\d\.]+)/gi, /bilirubin\s*\(?total\)?\s*[:\-]?\s*([\d\.]+)/gi] },
  { name: "SGOT", patterns: [/sgot\s*[:\-]?\s*([\d\.]+)/gi, /ast\s*[:\-]?\s*([\d\.]+)/gi] },
  { name: "SGPT", patterns: [/sgpt\s*[:\-]?\s*([\d\.]+)/gi, /alt\s*[:\-]?\s*([\d\.]+)/gi] },
  { name: "ESR", patterns: [/esr\s*[:\-]?\s*([\d\.]+)\s*(mm\/hr)?/gi] },
  { name: "TSH", patterns: [/tsh\s*[:\-]?\s*([\d\.]+)/gi] },
  { name: "Vitamin D", patterns: [/vitamin\s*d\s*[:\-]?\s*([\d\.]+)/gi, /25-oh vitamin d\s*[:\-]?\s*([\d\.]+)/gi] },
  { name: "Vitamin B12", patterns: [/vitamin\s*b12\s*[:\-]?\s*([\d\.]+)/gi, /b12\s*[:\-]?\s*([\d\.]+)/gi] },
];

const VITAL_PATTERNS = {
  bloodPressure: /blood pressure\s*[:\-]?\s*(\d{2,3}\s*\/\s*\d{2,3})\s*(mmhg)?/gi,
  bpShort: /\bbp\s*[:\-]?\s*(\d{2,3}\s*\/\s*\d{2,3})/gi,
  heartRate: /(?:heart rate|pulse|hr)\s*[:\-]?\s*(\d{2,3})\s*(bpm)?/gi,
  temperature: /(?:temperature|temp|fever)\s*[:\-]?\s*([\d\.]+)\s*(°?c|°?f)?/gi,
  respiratoryRate: /(?:respiratory rate|rr)\s*[:\-]?\s*(\d{1,3})\s*(\/min)?/gi,
  spo2: /(?:spo2|o2 sat|oxygen saturation)\s*[:\-]?\s*(\d{1,3})\s*%?/gi,
  weight: /(?:weight|wt)\s*[:\-]?\s*([\d\.]+)\s*(kg|kgs)?/gi,
  height: /(?:height|ht)\s*[:\-]?\s*([\d\.]+)\s*(cm|ft|feet)?/gi,
};

const MEDICATION_PATTERNS = [
  /(?:tab|tablet|capsule|cap|syrup|inj|injection)\s+([a-zA-Z][a-zA-Z0-9\s\-]{2,40}?)\s+(\d+\s*(?:mg|mcg|g|ml|units)?)\s*(?:x\s*(\d+))?\s*(?:for\s*(\d+\s*(?:days|weeks|months)))?/gi,
  /(?:prescribed|adv|advised)\s*[:\-]?\s*([a-zA-Z][a-zA-Z0-9\s]{3,30})\s+(\d+\s*mg)/gi,
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(\d+\s*mg)\s+(once|twice|thrice|daily|bid|tid|qid|od|bd|hs)\b/gi,
];

const DIAGNOSIS_PATTERNS = [
  /(?:diagnosis|diagnosed|impression|final diagnosis|provisional diagnosis)\s*[:\-]?\s*([^\n\.]{5,150})/gi,
  /(?:known case of|k\/c\/o|k\/c of)\s+([^\n,\.]{3,100})/gi,
];

const SYMPTOM_KEYWORDS = [
  "fever", "cough", "headache", "chest pain", "shortness of breath", "dyspnea",
  "fatigue", "weakness", "nausea", "vomiting", "diarrhea", "abdominal pain",
  "dizziness", "palpitations", "swelling", "edema", "weight loss", "weight gain",
  "loss of appetite", "sore throat", "runny nose", "body ache", "joint pain",
  "back pain", "rash", "itching", "bleeding", "bruising", "numbness", "tingling"
];

const REFERENCE_RANGE_PATTERN = /(?:reference range|normal range|ref range|normal)\s*[:\-]?\s*([^\n]{3,80})/gi;
const REF_RANGE_INLINE = /([\d\.\-]+\s*[-–]\s*[\d\.]+\s*(?:mg\/dL|g\/dL|mmol\/L|IU\/L|U\/L|%|mm\/hr)?)/gi;

export const extractMedicalInformation = (text, documentId, patientId) => {
  const result = {
    patient: {},
    dates: [],
    diagnoses: [],
    symptoms: [],
    medications: [],
    lab_results: [],
    investigations: [],
    procedures: [],
    visits: [],
    hospitalizations: [],
    follow_ups: [],
    vital_signs: [],
    relationships: [],
    source_references: []
  };

  if (!text || text.trim().length < 10) {
    return result;
  }

  const dates = extractDatesFromText(text);
  result.dates = dates.map(d => ({
    raw: d.raw,
    parsed: d.parsed,
    timestamp: d.timestamp
  }));

  let primaryDate = null;
  if (dates.length > 0) {
    const sorted = [...dates].sort((a,b) => b.timestamp - a.timestamp);
    primaryDate = new Date(sorted[0].parsed);
  }

  const lines = text.split(/\n/);
  const lowerText = text.toLowerCase();

  // Extract lab results
  for (const lab of LAB_TEST_PATTERNS) {
    for (const pattern of lab.patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        let valueStr = match[1] || match[2] || "";
        let unit = match[2] || match[3] || "";
        
        if (match.length >= 3 && /^\d/.test(match[1])) {
          valueStr = match[1];
          unit = match[2] || "";
        } else if (match.length >= 3) {
          valueStr = match[2] || match[1];
          unit = match[3] || "";
        }

        const numericValue = parseFloat(valueStr.replace(/,/g, ''));
        if (isNaN(numericValue) || numericValue <= 0 || numericValue > 100000) continue;

        const contextStart = Math.max(0, match.index - 80);
        const contextEnd = Math.min(text.length, match.index + 120);
        const context = text.substring(contextStart, contextEnd);

        let refRange = null;
        const refMatch = context.match(/(?:ref|normal|range)[^\n]*?([\d\.\-]+\s*[-–]\s*[\d\.]+\s*(?:mg\/dL|g\/dL|%|mm\/hr|U\/L|IU\/L)?)/i);
        if (refMatch) refRange = refMatch[1].trim();
        else {
          const inlineRange = context.match(/([\d\.\-]+\s*[-–]\s*[\d\.]+\s*(?:mg\/dL|g\/dL|mmol\/L)?)/);
          if (inlineRange && inlineRange[1] !== valueStr) refRange = inlineRange[1];
        }

        let status = null;
        if (refRange) {
          const rangeParts = refRange.match(/([\d\.]+)\s*[-–]\s*([\d\.]+)/);
          if (rangeParts) {
            const low = parseFloat(rangeParts[1]);
            const high = parseFloat(rangeParts[2]);
            if (!isNaN(low) && !isNaN(high)) {
              if (numericValue < low) status = "Low";
              else if (numericValue > high) status = "High";
              else status = "Normal";
            }
          }
        }

        if (context.toLowerCase().includes("high") && !status) status = "High";
        if (context.toLowerCase().includes("low") && !status) status = "Low";

        result.lab_results.push({
          testName: lab.name,
          result: valueStr,
          numericValue,
          unit: unit || detectUnit(lab.name, context),
          referenceRange: refRange,
          status,
          testDate: primaryDate ? primaryDate.toISOString() : null,
          confidence: status ? 0.85 : 0.75,
          pageNumber: estimatePageNumber(match.index, text),
          sourceText: context.trim(),
          documentId,
          patientId
        });
      }
    }
  }

  // Deduplicate lab results by testName keeping last
  const labMap = new Map();
  for (const lab of result.lab_results) {
    const key = `${lab.testName}_${lab.numericValue}_${lab.testDate || ''}`;
    if (!labMap.has(lab.testName) || lab.confidence > (labMap.get(lab.testName).confidence || 0)) {
      labMap.set(lab.testName, lab);
    }
  }
  result.lab_results = Array.from(labMap.values());

  // Vital signs
  for (const [vitalName, pattern] of Object.entries(VITAL_PATTERNS)) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const value = match[1];
      const context = text.substring(Math.max(0, match.index-50), Math.min(text.length, match.index+80));
      result.vital_signs.push({
        type: vitalName,
        value,
        unit: match[2] || "",
        sourceText: context,
        confidence: 0.8,
        pageNumber: estimatePageNumber(match.index, text)
      });
    }
  }

  // Diagnoses
  for (const pattern of DIAGNOSIS_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const diag = match[1].trim().replace(/^[^\w]+/, '').substring(0,200);
      if (diag.length > 5 && diag.length < 200 && !diag.toLowerCase().includes("http")) {
        result.diagnoses.push({
          diagnosis: diag,
          confidence: 0.75,
          sourceText: match[0].substring(0,200),
          pageNumber: estimatePageNumber(match.index, text)
        });
      }
    }
  }

  // Symptoms
  for (const symptom of SYMPTOM_KEYWORDS) {
    if (lowerText.includes(symptom)) {
      const idx = lowerText.indexOf(symptom);
      const context = text.substring(Math.max(0, idx-60), Math.min(text.length, idx+80));
      result.symptoms.push({
        symptom,
        sourceText: context.trim(),
        confidence: 0.6,
        pageNumber: estimatePageNumber(idx, text)
      });
    }
  }

  // Medications
  for (const pattern of MEDICATION_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const medName = (match[1] || "").trim();
      if (medName.length < 3 || medName.length > 50) continue;
      if (/^\d+$/.test(medName)) continue;
      
      result.medications.push({
        medication: medName,
        dosage: match[2] || null,
        frequency: match[3] || null,
        duration: match[4] || null,
        sourceText: match[0].substring(0,150),
        confidence: 0.7,
        pageNumber: estimatePageNumber(match.index, text)
      });
    }
  }

  // Procedures / Investigations
  const procedureKeywords = ["surgery", "operation", "biopsy", "endoscopy", "colonoscopy", "angioplasty", "catheterization"];
  for (const kw of procedureKeywords) {
    if (lowerText.includes(kw)) {
      const idx = lowerText.indexOf(kw);
      const context = text.substring(Math.max(0, idx-40), Math.min(text.length, idx+120));
      result.procedures.push({
        procedure: kw,
        description: context.trim(),
        confidence: 0.65,
        pageNumber: estimatePageNumber(idx, text)
      });
    }
  }

  // Follow ups
  const followUpPattern = /(?:follow up|follow-up|review|next visit|return)\s*[:\-]?\s*([^\n]{5,100})/gi;
  let fMatch;
  while ((fMatch = followUpPattern.exec(text)) !== null) {
    result.follow_ups.push({
      instruction: fMatch[1].trim().substring(0,150),
      sourceText: fMatch[0],
      confidence: 0.7,
      pageNumber: estimatePageNumber(fMatch.index, text)
    });
  }

  // Patient info attempt
  const namePattern = /(?:patient name|name)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi;
  let nMatch;
  while ((nMatch = namePattern.exec(text)) !== null) {
    result.patient.name = nMatch[1].trim();
    break;
  }

  const dobPattern = /(?:dob|date of birth|birth date)\s*[:\-]?\s*([^\n]{5,30})/gi;
  let dobMatch;
  while ((dobMatch = dobPattern.exec(text)) !== null) {
    result.patient.dobRaw = dobMatch[1].trim();
    break;
  }

  return result;
};

function detectUnit(testName, context) {
  const unitMap = {
    "Hemoglobin": "g/dL",
    "WBC": "/cumm",
    "RBC": "million/cumm",
    "Platelets": "/cumm",
    "Glucose Fasting": "mg/dL",
    "Glucose Random": "mg/dL",
    "HbA1c": "%",
    "Total Cholesterol": "mg/dL",
    "Creatinine": "mg/dL",
    "Urea": "mg/dL",
    "Bilirubin Total": "mg/dL",
    "ESR": "mm/hr"
  };
  return unitMap[testName] || "";
}

function estimatePageNumber(charIndex, fullText) {
  const avgCharsPerPage = 2000;
  return Math.floor(charIndex / avgCharsPerPage) + 1;
}

export const normalizeLabValue = (lab) => {
  return {
    ...lab,
    normalizedUnit: lab.unit?.toLowerCase().includes("g/dl") ? "g/dL" : lab.unit,
    originalValue: lab.result,
    originalUnit: lab.unit
  };
};

export const detectPatientMismatch = (extractedPatient, actualPatient) => {
  if (!extractedPatient.name) return { mismatch: false, reason: null };
  
  const extractedName = extractedPatient.name.toLowerCase().trim();
  const actualName = actualPatient.name.toLowerCase().trim();
  
  if (extractedName.length < 3) return { mismatch: false, reason: null };
  
  const extractedParts = extractedName.split(/\s+/);
  const actualParts = actualName.split(/\s+/);
  
  let matchingParts = 0;
  for (const part of extractedParts) {
    if (part.length > 2 && actualParts.some(ap => ap.includes(part) || part.includes(ap))) {
      matchingParts++;
    }
  }
  
  if (matchingParts === 0 && extractedParts.length > 1) {
    return {
      mismatch: true,
      reason: `Document mentions patient name "${extractedPatient.name}" which differs from selected patient "${actualPatient.name}"`,
      extractedName: extractedPatient.name,
      actualName: actualPatient.name
    };
  }
  
  return { mismatch: false, reason: null };
};
