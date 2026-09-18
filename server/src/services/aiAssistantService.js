import prisma from '../config/database.js';

export const processAIQuery = async ({ patientId, userId, userRole, mode, documentId, question, conversationId }) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      documents: { orderBy: { uploadDate: 'desc' }, take: 20 },
      medicalEvents: { orderBy: { eventDate: 'desc' }, take: 50 },
      visits: { orderBy: { date: 'desc' }, take: 20, include: { doctor: true } },
      prescriptions: { orderBy: { date: 'desc' }, take: 20, include: { medications: true, doctor: true } },
      extractedValues: { orderBy: { testDate: 'desc' }, take: 100 },
      extractedEntities: { orderBy: { createdAt: 'desc' }, take: 100 }
    }
  });

  if (!patient) throw new Error('Patient not found');

  let contextData = {};
  let sources = [];

  if (mode === 'REPORT') {
    if (!documentId) throw new Error('Document ID required for Report Assistant mode');
    const doc = await prisma.medicalDocument.findUnique({
      where: { id: documentId },
      include: { documentTexts: true, extractedEntities: true, extractedValues: true }
    });
    if (!doc || doc.patientId !== patientId) throw new Error('Document not found or access denied');
    
    contextData = {
      document: {
        fileName: doc.originalName,
        category: doc.detectedCategory || doc.category,
        uploadDate: doc.uploadDate,
        documentDate: doc.documentDate,
        extractedText: doc.extractedText?.substring(0, 8000) || "",
        labResults: doc.extractedValues || [],
        entities: doc.extractedEntities || []
      }
    };
    sources = [{ documentId: doc.id, fileName: doc.originalName, type: 'document', confidence: doc.aiConfidence }];
  } else if (mode === 'TIMELINE') {
    contextData = {
      timeline: patient.medicalEvents.map(e => ({
        date: e.eventDate,
        type: e.eventType,
        description: e.description,
        source: e.sourceReference,
        verification: e.verificationStatus
      })),
      eventsCount: patient.medicalEvents.length
    };
    sources = patient.medicalEvents.slice(0, 10).map(e => ({
      eventId: e.eventId,
      date: e.eventDate,
      type: e.eventType,
      source: e.sourceReference
    }));
  } else {
    contextData = {
      patient: {
        name: patient.name,
        age: calculateAge(patient.dob),
        gender: patient.gender,
        bloodGroup: patient.bloodGroup
      },
      timeline: patient.medicalEvents.slice(0, 30).map(e => ({
        date: e.eventDate,
        type: e.eventType,
        description: e.description,
        source: e.sourceReference
      })),
      labResults: patient.extractedValues.slice(0, 30).map(v => ({
        test: v.testName,
        result: v.result,
        unit: v.unit,
        range: v.referenceRange,
        status: v.status,
        date: v.testDate,
        source: v.documentId
      })),
      diagnoses: patient.extractedEntities.filter(e => e.entityType === 'DIAGNOSIS').slice(0, 15).map(d => d.entityValue),
      medications: patient.extractedEntities.filter(e => e.entityType === 'MEDICATION').slice(0, 20).map(m => m.entityValue),
      visits: patient.visits.slice(0, 10).map(v => ({
        date: v.date,
        reason: v.reason,
        assessment: v.assessment,
        plan: v.plan
      })),
      prescriptions: patient.prescriptions.slice(0, 10).map(p => ({
        date: p.date,
        medications: p.medications.map(m => `${m.medication} ${m.dosage || ''} ${m.frequency || ''}`.trim())
      })),
      documents: patient.documents.slice(0, 10).map(d => ({
        fileName: d.originalName,
        category: d.category,
        date: d.documentDate || d.uploadDate
      }))
    };
    sources = [
      ...patient.medicalEvents.slice(0, 5).map(e => ({ type: 'event', date: e.eventDate, description: e.description, source: e.sourceReference })),
      ...patient.extractedValues.slice(0, 5).map(v => ({ type: 'lab', test: v.testName, result: v.result, source: `Document ${v.documentId}` }))
    ];
  }

  const answer = generateLocalAnswer(question, contextData, mode, patient);

  let conversation;
  if (conversationId) {
    conversation = await prisma.aIConversation.findUnique({ where: { id: conversationId } });
  }
  
  if (!conversation) {
    conversation = await prisma.aIConversation.create({
      data: {
        patientId,
        userId,
        userRole,
        mode,
        documentId: mode === 'REPORT' ? documentId : null,
        title: question.substring(0, 80)
      }
    });
  }

  await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'USER',
      content: question
    }
  });

  const assistantMessage = await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'ASSISTANT',
      content: answer.text,
      sources: JSON.stringify(answer.sources || sources)
    }
  });

  return {
    conversationId: conversation.id,
    question,
    answer: answer.text,
    sources: answer.sources || sources,
    mode,
    contextSummary: `${mode} mode - ${Object.keys(contextData).length} data sections`,
    disclaimer: answer.disclaimer
  };
};

function generateLocalAnswer(question, context, mode, patient) {
  const q = question.toLowerCase();
  let text = "";
  let sources = [];
  let disclaimer = "This information is based on documented medical records and is for informational purposes. Please consult your healthcare provider for medical decisions.";

  if (mode === 'REPORT') {
    const doc = context.document;
    if (!doc) {
      return { text: "No document data available for this report.", sources: [], disclaimer };
    }

    if (q.includes("summarize") || q.includes("summary")) {
      text = `**Report Summary: ${doc.fileName}**\n\n**Category:** ${doc.category}\n**Date:** ${doc.documentDate ? new Date(doc.documentDate).toLocaleDateString() : 'Not specified'}\n\n**Extracted Information:**\n`;
      if (doc.labResults.length > 0) {
        text += `\n**Lab Results (${doc.labResults.length}):**\n`;
        doc.labResults.slice(0, 10).forEach(lab => {
          text += `- ${lab.testName}: ${lab.result} ${lab.unit || ''} ${lab.referenceRange ? `(Ref: ${lab.referenceRange})` : ''} ${lab.status ? `[${lab.status}]` : ''}\n`;
          sources.push({ fileName: doc.fileName, test: lab.testName, result: lab.result, source: `Page ${lab.pageNumber || 1}` });
        });
      }
      if (doc.entities.length > 0) {
        const diags = doc.entities.filter(e => e.entityType === 'DIAGNOSIS');
        if (diags.length > 0) {
          text += `\n**Documented Findings:**\n`;
          diags.forEach(d => {
            text += `- ${d.entityValue}\n`;
            sources.push({ fileName: doc.fileName, finding: d.entityValue, source: `Page ${d.pageNumber || 1}` });
          });
        }
      }
      text += `\n**Source:** ${doc.fileName} - ${doc.category}\n`;
      if (doc.extractedText) {
        text += `\n**Key Excerpts:**\n${doc.extractedText.substring(0, 500)}...\n`;
      }
    } else if (q.includes("lab") || q.includes("test") || q.includes("result")) {
      if (doc.labResults.length > 0) {
        text = `**Lab Results from ${doc.fileName}:**\n\n`;
        doc.labResults.forEach(lab => {
          text += `| ${lab.testName} | ${lab.result} ${lab.unit || ''} | ${lab.referenceRange || 'Reference range not provided'} | ${lab.status || 'Unknown'} | Source: Page ${lab.pageNumber || 1} |\n`;
          sources.push({ test: lab.testName, result: lab.result, page: lab.pageNumber, fileName: doc.fileName });
        });
        text += `\n**Source:** ${doc.fileName} - Page references included above.`;
      } else {
        text = `No structured lab results were extracted from ${doc.fileName}. The document may not contain lab values or may require manual review. You can view the original document for details.`;
        sources.push({ fileName: doc.fileName, note: "No lab results extracted" });
      }
    } else if (q.includes("medication") || q.includes("prescription") || q.includes("drug")) {
      const meds = doc.entities.filter(e => e.entityType === 'MEDICATION');
      if (meds.length > 0) {
        text = `**Medications documented in ${doc.fileName}:**\n\n`;
        meds.forEach(m => {
          text += `- ${m.entityValue} (Source: Page ${m.pageNumber || 1})\n`;
          sources.push({ medication: m.entityValue, source: `${doc.fileName} Page ${m.pageNumber}` });
        });
      } else {
        text = `No medications were explicitly extracted from ${doc.fileName}. Please review the document directly.`;
      }
    } else {
      text = `**Document:** ${doc.fileName} (${doc.category})\n\n**Extracted Text Preview:**\n${doc.extractedText.substring(0, 1000)}\n\n**Structured Data:**\n- Lab Results: ${doc.labResults.length}\n- Other Entities: ${doc.entities.length}\n\n**Source:** ${doc.fileName}\n\nFor specific questions about lab values, diagnoses, or medications, please ask more specifically.`;
      sources.push({ fileName: doc.fileName, category: doc.category });
    }

  } else if (mode === 'TIMELINE') {
    if (q.includes("summarize") || q.includes("history")) {
      text = `**Patient Timeline Summary for ${patient.name}:**\n\n**Total Events:** ${context.timeline.length}\n\n**Chronological Events:**\n`;
      const sorted = [...context.timeline].sort((a,b) => new Date(a.date) - new Date(b.date));
      sorted.slice(0, 20).forEach(evt => {
        text += `\n**${new Date(evt.date).toLocaleDateString()}** - ${evt.type}\n${evt.description}\nSource: ${evt.source || 'N/A'} [${evt.verification}]\n`;
        sources.push({ date: evt.date, type: evt.type, source: evt.source });
      });
    } else if (q.includes("lab") || q.includes("test")) {
      const labEvents = context.timeline.filter(e => e.type === 'Lab Test');
      if (labEvents.length > 0) {
        text = `**Lab Tests in Timeline (${labEvents.length}):**\n\n`;
        labEvents.forEach(e => {
          text += `- ${new Date(e.date).toLocaleDateString()}: ${e.description} | Source: ${e.source}\n`;
          sources.push({ date: e.date, description: e.description, source: e.source });
        });
        text += `\n**Note:** Values are preserved as documented. If two documents show different values for the same test, both are kept with their dates and sources to show progression.`;
      } else {
        text = "No lab test events found in the timeline.";
      }
    } else if (q.includes("medication") || q.includes("prescription")) {
      const medEvents = context.timeline.filter(e => e.type === 'Prescription');
      text = medEvents.length > 0 ? `**Medication History:**\n\n${medEvents.map(e => `- ${new Date(e.date).toLocaleDateString()}: ${e.description} (Source: ${e.source})`).join('\n')}` : "No prescription events in timeline.";
      sources = medEvents.map(e => ({ date: e.date, description: e.description, source: e.source }));
    } else if (q.includes("2026") || q.includes("2025") || q.includes("2024") || q.match(/\b\d{4}\b/)) {
      const yearMatch = q.match(/\b(20\d{2})\b/);
      const year = yearMatch ? yearMatch[1] : null;
      if (year) {
        const yearEvents = context.timeline.filter(e => new Date(e.date).getFullYear() == year);
        text = yearEvents.length > 0 ? `**Medical Events in ${year} (${yearEvents.length}):**\n\n${yearEvents.map(e => `- ${new Date(e.date).toLocaleDateString()}: ${e.type} - ${e.description} [Source: ${e.source}]`).join('\n')}` : `No events found for year ${year}.`;
        sources = yearEvents.map(e => ({ date: e.date, type: e.type, source: e.source }));
      }
    } else {
      text = `**Timeline Overview:** ${context.timeline.length} events documented.\n\n`;
      const recent = context.timeline.slice(0, 10);
      recent.forEach(e => {
        text += `**${new Date(e.date).toLocaleDateString()}** - ${e.type}: ${e.description.substring(0, 100)}... [Source: ${e.source}]\n`;
      });
      text += `\nAsk specific questions like "What lab tests were done?" or "Show medication history" for detailed information.`;
      sources = recent.map(e => ({ date: e.date, type: e.type, source: e.source }));
    }

  } else {
    if (q.includes("summarize") || q.includes("history") || q.includes("overview")) {
      text = `**Medical History Summary for ${context.patient.name}**\n\n**Patient:** ${context.patient.name}, ${context.patient.age} years, ${context.patient.gender}, Blood Group: ${context.patient.bloodGroup || 'Not specified'}\n\n`;
      text += `**Timeline:** ${context.timeline.length} medical events documented\n`;
      text += `**Lab Results:** ${context.labResults.length} test results\n`;
      text += `**Documents:** ${context.documents.length} documents\n`;
      text += `**Visits:** ${context.visits.length} visits\n`;
      text += `**Prescriptions:** ${context.prescriptions.length} prescriptions\n\n`;

      if (context.diagnoses.length > 0) {
        text += `**Documented Diagnoses/Findings:**\n${context.diagnoses.slice(0,5).map(d => `- ${d}`).join('\n')}\n\n`;
        sources.push(...context.diagnoses.slice(0,3).map(d => ({ type: 'diagnosis', value: d, note: 'Documented finding' })));
      }

      if (context.labResults.length > 0) {
        text += `**Recent Lab Results:**\n`;
        context.labResults.slice(0,5).forEach(lab => {
          text += `- ${new Date(lab.date).toLocaleDateString()}: ${lab.test}: ${lab.result} ${lab.unit || ''} ${lab.range ? `(Ref: ${lab.range})` : '(Reference range not provided)'} ${lab.status ? `[${lab.status}]` : ''} | Source: Document ${lab.source}\n`;
          sources.push({ test: lab.test, result: lab.result, date: lab.date, source: lab.source });
        });
        text += `\n`;
      }

      if (context.prescriptions.length > 0) {
        text += `**Medication History:**\n`;
        context.prescriptions.slice(0,3).forEach(p => {
          text += `- ${new Date(p.date).toLocaleDateString()}: ${p.medications.join(', ')}\n`;
          sources.push({ date: p.date, medications: p.medications, type: 'prescription' });
        });
      }

      text += `\n**Sources:** Medical records, lab reports, and clinical notes as documented. Use 'View Source' to see original documents.\n`;
      disclaimer = "This summary is AI-generated from documented records and marked as such. It is for informational purposes only. Consult your doctor for medical decisions.";

    } else if (q.includes("change") && (q.includes("report") || q.includes("blood") || q.includes("lab"))) {
      const grouped = {};
      context.labResults.forEach(lab => {
        if (!grouped[lab.test]) grouped[lab.test] = [];
        grouped[lab.test].push(lab);
      });

      text = `**Changes Between Reports:**\n\n`;
      let hasChanges = false;
      for (const [test, values] of Object.entries(grouped)) {
        if (values.length >= 2) {
          const sorted = values.sort((a,b) => new Date(a.date) - new Date(b.date));
          const first = sorted[0];
          const last = sorted[sorted.length-1];
          const firstVal = parseFloat(first.result);
          const lastVal = parseFloat(last.result);
          if (!isNaN(firstVal) && !isNaN(lastVal)) {
            const diff = lastVal - firstVal;
            const direction = diff > 0 ? 'Increased' : diff < 0 ? 'Decreased' : 'Unchanged';
            const percent = firstVal !== 0 ? ((diff/firstVal)*100).toFixed(1) : 0;
            text += `**${test}:**\n- Previous (${new Date(first.date).toLocaleDateString()}): ${first.result} ${first.unit || ''} [Source: ${first.source}]\n- Current (${new Date(last.date).toLocaleDateString()}): ${last.result} ${last.unit || ''} [Source: ${last.source}]\n- Change: ${direction} by ${Math.abs(diff).toFixed(2)} (${percent}%)\n- Reference: ${last.range || 'Reference range not provided'}\n\n`;
            sources.push({ test, previous: first, current: last, change: direction });
            hasChanges = true;
          }
        }
      }
      if (!hasChanges) {
        text += "Not enough historical data to compare changes, or only single values exist for each test. Each value is preserved with its date and source to show progression when multiple reports are available.\n";
        text += `\n**Available Lab Results:**\n${context.labResults.slice(0,10).map(l => `- ${l.test}: ${l.result} on ${new Date(l.date).toLocaleDateString()}`).join('\n')}`;
      }

    } else if (q.includes("medication") || q.includes("prescription") || q.includes("drug") || q.includes("medicine")) {
      if (context.prescriptions.length > 0 || context.labResults.length > 0) {
        text = `**Medication History for ${context.patient.name}:**\n\n`;
        if (context.prescriptions.length > 0) {
          context.prescriptions.forEach(p => {
            text += `**${new Date(p.date).toLocaleDateString()}** - Prescription:\n${p.medications.map(m => `  - ${m}`).join('\n')}\nSource: Prescription record ${new Date(p.date).toLocaleDateString()}\n\n`;
            sources.push({ date: p.date, medications: p.medications });
          });
        }
        const medEntities = context.timeline.filter(e => e.type === 'Prescription');
        if (medEntities.length > 0) {
          text += `**Additional Medications from Documents:**\n${medEntities.slice(0,5).map(e => `- ${e.description} [${new Date(e.date).toLocaleDateString()}, Source: ${e.source}]`).join('\n')}\n`;
        }
        text += `\n**Note:** This is documented medication history. Do not self-medicate. Consult your doctor for medication decisions.`;
      } else {
        text = "No prescriptions documented in the available medical records.";
      }

    } else if (q.includes("explain") && (q.includes("report") || q.includes("simple"))) {
      text = `**Simple Explanation of Your Medical Records:**\n\nHello ${context.patient.name},\n\nYour medical records show:\n\n`;
      if (context.labResults.length > 0) {
        text += `You have ${context.labResults.length} lab test results documented. For example:\n`;
        context.labResults.slice(0,3).forEach(lab => {
          let explanation = "";
          if (lab.status === 'High') explanation = "This value is higher than the reference range provided in your report.";
          else if (lab.status === 'Low') explanation = "This value is lower than the reference range provided in your report.";
          else if (lab.status === 'Normal') explanation = "This value is within the reference range provided.";
          else explanation = "Reference range not provided in the report - discuss with your doctor.";
          
          text += `- **${lab.test}**: ${lab.result} ${lab.unit || ''} - ${explanation} (Source: ${new Date(lab.date).toLocaleDateString()}, ${lab.source})\n`;
          sources.push({ test: lab.test, explanation, source: lab.source });
        });
      }
      text += `\n**General Guidance:**\n- Keep all your reports organized chronologically\n- Discuss any abnormal values with your doctor\n- Maintain a healthy lifestyle with balanced diet and regular exercise\n- Follow up as advised by your doctor\n\n**Important:** This is educational information based on your documented reports. It is not a diagnosis. Always consult your healthcare provider.\n`;
      disclaimer = "Simplified explanation for patient understanding. Not medical advice. Consult doctor for interpretation.";

    } else if (q.includes("deficien") || q.includes("low") || q.includes("vitamin")) {
      const lowValues = context.labResults.filter(l => l.status === 'Low');
      if (lowValues.length > 0) {
        text = `**Documented Low Values (from lab reports):**\n\n`;
        lowValues.forEach(lab => {
          text += `- **${lab.test}**: ${lab.result} ${lab.unit || ''} (Ref: ${lab.range || 'Not provided'}) on ${new Date(lab.date).toLocaleDateString()} - Status: Low [Source: ${lab.source}]\n`;
          sources.push({ test: lab.test, result: lab.result, status: 'Low', source: lab.source });
        });
        text += `\n**General Educational Information:**\n`;
        lowValues.forEach(lab => {
          if (lab.test.toLowerCase().includes('vitamin d')) {
            text += `- Vitamin D: General dietary sources include fortified milk, eggs, fatty fish. Sunlight exposure helps. Discuss supplementation with your doctor.\n`;
          } else if (lab.test.toLowerCase().includes('b12')) {
            text += `- Vitamin B12: Found in meat, fish, dairy, eggs. Vegetarians may need to monitor. Discuss with doctor.\n`;
          } else if (lab.test.toLowerCase().includes('hemoglobin') || lab.test.toLowerCase().includes('iron')) {
            text += `- Hemoglobin/Iron: Iron-rich foods include leafy greens, beans, red meat, fortified cereals. Discuss with doctor.\n`;
          }
        });
        text += `\n**Important:** Low lab values do not automatically mean deficiency diagnosis. Only a doctor can diagnose deficiency based on your complete clinical picture. Do not self-prescribe supplements.\n`;
        disclaimer = "Educational information based on documented lab values. Not a diagnosis. Consult doctor before taking supplements.";
      } else {
        text = `No low values currently documented as 'Low' in your lab reports based on reference ranges provided. If you have concerns about specific nutrients, please discuss with your doctor and refer to your latest lab reports.\n\n**Available Results:**\n${context.labResults.slice(0,5).map(l => `- ${l.test}: ${l.result} ${l.status ? `[${l.status}]` : ''}`).join('\n')}`;
      }

    } else if (q.includes("diet") || q.includes("lifestyle") || q.includes("food") || q.includes("exercise")) {
      text = `**General Wellness Guidance (Educational):**\n\nBased on your documented medical records:\n\n`;
      if (context.labResults.some(l => l.test.toLowerCase().includes('cholesterol') && l.status === 'High')) {
        text += `- Your reports document high cholesterol values. General guidance: Focus on fiber-rich foods, reduce saturated fats, regular exercise. Discuss personalized plan with doctor.\n`;
      }
      if (context.labResults.some(l => l.test.toLowerCase().includes('glucose') && l.status === 'High')) {
        text += `- Your reports document high glucose values. General guidance: Balanced diet, limit refined sugars, regular physical activity. Consult doctor for diabetes management.\n`;
      }
      text += `\n**General Healthy Lifestyle:**\n- Balanced diet with fruits, vegetables, whole grains\n- Regular physical activity as advised by doctor\n- Adequate hydration and sleep\n- Avoid smoking and limit alcohol\n- Regular follow-ups\n\n**Sources:** General health education, not specific medical advice. Your documented values: ${context.labResults.slice(0,3).map(l => `${l.test}: ${l.result}`).join(', ')}\n`;
      disclaimer = "General wellness information only. Not personalized medical advice. Consult healthcare provider.";

    } else {
      const keywords = q.split(/\s+/).filter(w => w.length > 3);
      const relevantEvents = context.timeline.filter(e => 
        keywords.some(kw => e.description.toLowerCase().includes(kw) || e.type.toLowerCase().includes(kw))
      );
      const relevantLabs = context.labResults.filter(l => 
        keywords.some(kw => l.test.toLowerCase().includes(kw))
      );

      if (relevantEvents.length > 0 || relevantLabs.length > 0) {
        text = `**Information related to "${question}" from your medical records:**\n\n`;
        if (relevantLabs.length > 0) {
          text += `**Lab Results:**\n${relevantLabs.map(l => `- ${l.test}: ${l.result} ${l.unit || ''} on ${new Date(l.date).toLocaleDateString()} ${l.range ? `(Ref: ${l.range})` : ''} ${l.status ? `[${l.status}]` : ''} | Source: ${l.source}`).join('\n')}\n\n`;
          sources.push(...relevantLabs.map(l => ({ test: l.test, result: l.result, source: l.source })));
        }
        if (relevantEvents.length > 0) {
          text += `**Related Medical Events:**\n${relevantEvents.slice(0,5).map(e => `- ${new Date(e.date).toLocaleDateString()}: ${e.type} - ${e.description} [Source: ${e.source}]`).join('\n')}\n\n`;
          sources.push(...relevantEvents.slice(0,5).map(e => ({ date: e.date, type: e.type, source: e.source })));
        }
        text += `**Note:** All information is from documented medical records with source references provided.`;
      } else {
        text = `I searched your medical records for "${question}" but did not find specific matching information in the structured data.\n\n**Available Data Summary:**\n- ${context.timeline.length} timeline events\n- ${context.labResults.length} lab results (${context.labResults.slice(0,3).map(l => l.test).join(', ')})\n- ${context.documents.length} documents\n- ${context.visits.length} visits\n\n**Try asking:**\n- "Summarize my medical history"\n- "What are my lab results?"\n- "Show my medication history"\n- "What changed between my reports?"\n- "Explain my report in simple language"\n\n**Sources:** Searched across ${context.timeline.length} events and ${context.labResults.length} lab results. No direct matches found.`;
        sources.push({ note: "No direct matches", searched: `${context.timeline.length} events, ${context.labResults.length} labs` });
      }
    }
  }

  if (!text.includes("Source:") && !text.includes("Source **")) {
    text += `\n\n**Source References:** Based on documented medical records for patient ${patient.name} (${patient.patientId})`;
  }

  return { text, sources, disclaimer };
}

function calculateAge(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
