import { DOCUMENT_CATEGORIES } from '../config/constants.js';

const CATEGORY_KEYWORDS = {
  "Blood Test": ["hemoglobin", "wbc", "rbc", "platelet", "cbc", "blood test", "hematology", "blood count", "esr", "pcv", "mcv", "mch"],
  "Lab Report": ["lab report", "laboratory", "test report", "biochemistry", "lab results"],
  "Imaging Report": ["imaging", "radiology report", "scan report"],
  "X-Ray": ["x-ray", "xray", "radiograph", "chest x-ray"],
  "CT": ["ct scan", "computed tomography", "ct chest", "ct brain", "ct abdomen"],
  "MRI": ["mri", "magnetic resonance", "mr imaging"],
  "Ultrasound": ["ultrasound", "usg", "sonography", "doppler"],
  "ECG": ["ecg", "ekg", "electrocardiogram", "ecg report"],
  "Prescription": ["prescription", "rx", "medications prescribed", "take", "dosage", "tablet", "capsule"],
  "Discharge Summary": ["discharge summary", "discharge", "admitted", "discharged", "hospital course"],
  "Consultation Note": ["consultation", "consult note", "opd", "clinic note", "chief complaint"],
  "Clinical Note": ["clinical note", "progress note", "clinical findings"],
  "Pathology Report": ["pathology", "biopsy", "histopathology", "cytology", "specimen"],
  "Surgical Report": ["surgery", "surgical report", "operative note", "operation", "procedure note"],
  "Medical Certificate": ["medical certificate", "fitness certificate", "certificate"],
  "Previous Medical Record": ["past history", "previous record", "old report", "history"]
};

export const classifyDocument = (text, fileName = "") => {
  const combined = `${text} ${fileName}`.toLowerCase();
  
  let bestCategory = "Other";
  let bestScore = 0;
  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (combined.includes(kw.toLowerCase())) {
        score += kw.length > 5 ? 2 : 1;
        if (combined.indexOf(kw.toLowerCase()) < 200) score += 1;
      }
    }
    scores[category] = score;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  let confidence = 0;
  if (bestScore === 0) {
    confidence = 30;
    bestCategory = "Other";
  } else if (bestScore >= 6) {
    confidence = 95;
  } else if (bestScore >= 4) {
    confidence = 85;
  } else if (bestScore >= 2) {
    confidence = 70;
  } else {
    confidence = 55;
  }

  const filenameLower = fileName.toLowerCase();
  if (filenameLower.includes("blood") || filenameLower.includes("cbc")) {
    if (bestCategory === "Other") {
      bestCategory = "Blood Test";
      confidence = Math.max(confidence, 75);
    }
  }
  if (filenameLower.includes("mri")) {
    bestCategory = "MRI";
    confidence = Math.max(confidence, 90);
  }
  if (filenameLower.includes("ct")) {
    bestCategory = "CT";
    confidence = Math.max(confidence, 90);
  }
  if (filenameLower.includes("xray") || filenameLower.includes("x-ray") || filenameLower.includes("x_ray")) {
    bestCategory = "X-Ray";
    confidence = Math.max(confidence, 90);
  }
  if (filenameLower.includes("prescription") || filenameLower.includes("rx")) {
    bestCategory = "Prescription";
    confidence = Math.max(confidence, 85);
  }
  if (filenameLower.includes("discharge")) {
    bestCategory = "Discharge Summary";
    confidence = Math.max(confidence, 90);
  }

  return {
    detectedCategory: bestCategory,
    confidence,
    scores,
    reasoning: `Matched keywords for ${bestCategory} with score ${bestScore}`
  };
};

export const normalizeCategory = (category) => {
  if (DOCUMENT_CATEGORIES.includes(category)) return category;
  const lower = category.toLowerCase();
  for (const cat of DOCUMENT_CATEGORIES) {
    if (cat.toLowerCase() === lower) return cat;
  }
  return "Other";
};
