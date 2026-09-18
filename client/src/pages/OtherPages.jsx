import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, Eye, Download, Brain, Activity, Clock, AlertTriangle, CheckCircle, Search, Plus, Shield, Users, Calendar, Pill, Stethoscope, ArrowLeft, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, X, Image as ImageIcon, File, TrendingUp, Sparkles } from 'lucide-react';
import { PageLayout, BackButton } from '../components/Layout';
import { Card, Button, Badge, Input, Select, Textarea, Alert, MarkdownRenderer, TimelineGraph } from '../components/UI';
import { documentAPI, timelineAPI, visitAPI, accessAPI, aiAPI, patientAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DocumentViewer = () => {
  const { documentId } = useParams();
  const { role } = useAuth();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [fullscreenImage, setFullscreenImage] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    documentAPI.getDetails(documentId).then(res => { setDoc(res.data); setCurrentPage(1); }).catch(console.error).finally(() => setLoading(false));
  }, [documentId]);

  if (loading) return <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}><div className="p-8 text-center dark:text-white">Loading document...</div></PageLayout>;
  if (!doc) return <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}><div className="p-8 text-center dark:text-white">Document not found</div></PageLayout>;

  const { document: meta, texts, labResults, entities, events } = doc;
  const fileUrl = `/api/documents/${meta.id}/file`;
  const isImage = meta.fileType?.includes('image');
  const filteredText = searchText ? (texts?.[currentPage-1]?.text || '').split(new RegExp(`(${searchText})`, 'gi')).map((part, i) => 
    part.toLowerCase() === searchText.toLowerCase() ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark> : part
  ) : null;

  return (
    <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <BackButton fallback={role === 'DOCTOR' ? `/doctor/patient/${meta.patient?.patientId}` : '/patient/records'} />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate dark:text-white">{meta.fileName}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{meta.category} • Detected: {meta.detectedCategory} ({meta.categoryConfidence}%) • {meta.processingStatus} • AI Confidence: {meta.aiConfidence ? Math.round(meta.aiConfidence*100)+'%' : 'N/A'}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => window.open(fileUrl, '_blank')}><Download className="w-4 h-4" /> Download</Button>
        </div>
      </div>

      {meta.mismatchWarning && <Alert type="warning" title="Possible Patient Mismatch" className="mb-6">{meta.mismatchWarning} — Requires doctor review before adding to official timeline.</Alert>}

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-5">
          <Card className="p-4 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 dark:text-white">
                {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                Document Preview — {isImage ? 'Image Viewer with Fullscreen' : 'PDF Viewer'}
              </h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setZoom(z => Math.max(25, z-10))}><ZoomOut className="w-4 h-4" /></Button>
                <span className="text-xs font-mono w-14 text-center bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full border dark:border-slate-700 dark:text-white">{zoom}%</span>
                <Button size="sm" variant="secondary" onClick={() => setZoom(z => Math.min(300, z+10))}><ZoomIn className="w-4 h-4" /></Button>
                {isImage && <Button size="sm" variant="teal" onClick={() => setFullscreenImage(true)}><Maximize2 className="w-4 h-4" /> Fullscreen</Button>}
                <a href={fileUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="secondary"><Eye className="w-4 h-4" /> Open Original</Button></a>
              </div>
            </div>
            
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl border dark:border-slate-700 overflow-hidden relative group" style={{ height: '650px' }}>
              {meta.fileType === 'application/pdf' ? (
                <iframe src={fileUrl} className="w-full h-full border-0 bg-white" title="PDF" style={{ transform: `scale(${zoom/100})`, transformOrigin: 'top left', width: `${10000/zoom}%`, height: `${10000/zoom}%` }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 relative">
                  <img 
                    src={fileUrl} 
                    alt={meta.fileName} 
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-xl cursor-zoom-in transition-transform hover:scale-[1.02]" 
                    style={{ transform: `scale(${zoom/100})` }}
                    onClick={() => setFullscreenImage(true)}
                    onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                  />
                  <div className="hidden absolute inset-0 items-center justify-center p-8 text-center">
                    <div>
                      <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Image preview not available</p>
                      <a href={fileUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-600 dark:text-teal-400 hover:underline mt-2 inline-block">Open original file →</a>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition">
                    Click to view fullscreen • {zoom}% zoom
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-xs">
              <span className="text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border dark:border-slate-700">
                Page {currentPage} of {texts?.length || 1} • {meta.fileType} • {Math.round(meta.fileSize/1024)}KB • Uploaded {new Date(meta.uploadDate).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage <= 1}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-mono text-xs border dark:border-slate-700 dark:text-white">{currentPage} / {texts?.length || 1}</span>
                <Button size="sm" variant="secondary" onClick={() => setCurrentPage(p => Math.min(texts?.length || 1, p+1))} disabled={currentPage >= (texts?.length || 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-sm dark:text-white">Extracted Text (Page {currentPage}) — Searchable with Highlighting</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search in text..." className="pl-8 pr-3 py-1.5 rounded-full border dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-white" />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-4 max-h-[400px] overflow-y-auto text-sm whitespace-pre-wrap font-mono text-xs leading-relaxed dark:text-slate-200">
              {searchText ? filteredText : (texts?.[currentPage-1]?.text || meta.extractedText?.substring(0,8000) || 'No extracted text available')}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">Source traceability: Every fact extracted preserves page number, bounding info, and confidence. Click View Source to see original document at relevant page.</p>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-5">
          <Card className="p-5">
            <h3 className="font-bold text-sm mb-4 dark:text-white">Document Metadata — Improved Layout</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700"><span className="text-xs text-slate-500 dark:text-slate-400">Document ID</span><span className="font-mono text-xs font-bold dark:text-white">{meta.documentId.slice(0,12)}...</span></div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700"><span className="text-xs text-slate-500 dark:text-slate-400">Category</span><Badge variant="info">{meta.category}</Badge></div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700"><span className="text-xs text-slate-500 dark:text-slate-400">Detected Type</span><div className="text-right"><p className="font-medium text-xs dark:text-white">{meta.detectedCategory}</p><p className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">{meta.categoryConfidence}% confidence</p></div></div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700"><span className="text-xs text-slate-500 dark:text-slate-400">Processing</span><Badge variant={meta.processingStatus === 'COMPLETED' ? 'success' : 'warning'}>{meta.processingStatus}</Badge></div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700"><span className="text-xs text-slate-500 dark:text-slate-400">Verification</span><Badge variant="default">{meta.verificationStatus}</Badge></div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700"><span className="text-xs text-slate-500 dark:text-slate-400">Doctor</span><span className="text-xs font-medium dark:text-white">{meta.doctor?.name}</span></div>
            </div>
            {meta.processingStatus !== 'COMPLETED' && <Button size="sm" className="w-full mt-4" variant="secondary" onClick={async () => { await documentAPI.retry(meta.id); alert('Retry started'); }}>Retry Processing</Button>}
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 dark:text-white"><Activity className="w-4 h-4" /> Lab Results ({labResults?.length || 0}) — Source Traceable</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {labResults?.map(lab => (
                <div key={lab.id} className="border dark:border-slate-700 rounded-xl p-3.5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 hover:shadow-md transition">
                  <div className="flex justify-between items-start"><span className="text-sm font-bold text-slate-900 dark:text-white">{lab.testName}</span><Badge variant={lab.status === 'Normal' ? 'success' : lab.status === 'High' || lab.status === 'Low' ? 'warning' : 'default'}>{lab.status}</Badge></div>
                  <p className="text-lg font-mono font-bold mt-2 text-slate-900 dark:text-white">{lab.result} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{lab.unit}</span></p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Ref: {lab.referenceRange || 'Reference range not provided'}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 font-mono">Page {lab.pageNumber}</span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono border dark:border-slate-700 dark:text-slate-300">{Math.round((lab.confidence||0)*100)}% • {lab.verificationStatus}</span>
                  </div>
                </div>
              ))}
              {!labResults?.length && <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">No lab results extracted</p>}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-sm mb-3 dark:text-white">Medical Entities ({entities?.length || 0})</h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {entities?.map(ent => (
                <div key={ent.id} className="text-xs border dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                  <div className="flex justify-between items-center"><Badge variant="default" className="text-[10px]">{ent.entityType}</Badge><span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">P{ent.pageNumber} • {Math.round((ent.confidence||0)*100)}%</span></div>
                  <p className="mt-2 font-medium text-slate-900 dark:text-white">{ent.entityValue}</p>
                  {ent.sourceText && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 italic line-clamp-2">"{ent.sourceText.substring(0,100)}..."</p>}
                </div>
              ))}
              {!entities?.length && <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">No entities</p>}
            </div>
          </Card>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && isImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFullscreenImage(false)}>
          <div className="relative w-full h-full flex items-center justify-center">
            <button onClick={() => setFullscreenImage(false)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur">
              <X className="w-5 h-5" />
            </button>
            <img src={fileUrl} alt={meta.fileName} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur text-white px-4 py-2 rounded-full text-sm flex items-center gap-3">
              <span>{meta.fileName}</span>
              <span className="w-px h-4 bg-white/20" />
              <span className="flex items-center gap-1"><ZoomIn className="w-4 h-4" /> {zoom}%</span>
              <div className="flex gap-1 ml-2">
                <button onClick={e => { e.stopPropagation(); setZoom(z => Math.max(25, z-10)); }} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={e => { e.stopPropagation(); setZoom(z => Math.min(300, z+10)); }} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><ZoomIn className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export const TimelinePage = () => {
  const { patientId: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('patientId');
  const patientId = paramId || queryId;
  const { role } = useAuth();
  const [timeline, setTimeline] = useState([]);
  const [labs, setLabs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState('graph'); // graph or list

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    Promise.all([
      timelineAPI.getTimeline(patientId, { limit: 100 }), 
      timelineAPI.getStats(patientId),
      documentAPI.getLabResults(patientId).catch(() => ({ data: { labResults: [] } }))
    ])
      .then(([tRes, sRes, lRes]) => { 
        setTimeline(tRes.data.groupedByDate || []); 
        setStats(sRes.data);
        setLabs(lRes.data.labResults || []);
      })
      .catch(console.error).finally(() => setLoading(false));
  }, [patientId]);

  if (!patientId) return <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}><Card className="p-8 text-center"><p className="text-sm text-slate-600 dark:text-slate-400">Select a patient to view timeline</p><Link to={role === 'DOCTOR' ? '/doctor/patients' : '/patient'}><Button className="mt-4">Go to Patients</Button></Link></Card></PageLayout>;

  return (
    <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 dark:text-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center"><Clock className="w-5 h-5 text-white" /></div>
            Patient Timeline — Visual Graph
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Chronological medical events with visual graph, trends, and relationship mapping. Auto-updates.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border dark:border-slate-700">
            <button onClick={() => setViewMode('graph')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${viewMode === 'graph' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>📊 Graph View</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>📋 List View</button>
          </div>
          <Select value={filter} onChange={e => setFilter(e.target.value)} className="text-sm"><option value="">All Events</option><option>Lab Test</option><option>Diagnosis</option><option>Prescription</option><option>Consultation</option><option>Vital Signs</option></Select>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 text-white dark:text-slate-900"><p className="text-xs opacity-70">Total Events</p><p className="text-2xl font-bold mt-1">{stats.totalEvents}</p><p className="text-[11px] opacity-60 mt-1">Across {timeline.length} dates</p></Card>
          {stats.byType?.slice(0,4).map(s => <Card key={s.type} className="p-4 hover:shadow-md transition"><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.type}</p><p className="text-xl font-bold dark:text-white mt-1">{s.count}</p><div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1"><div className="bg-teal-600 h-1 rounded-full" style={{ width: `${(s.count/stats.totalEvents)*100}%` }} /></div></Card>)}
        </div>
      )}

      {loading ? <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-sm text-slate-500 dark:text-slate-400">Loading visual timeline...</p></div> : (
        <Card className="p-6">
          {timeline.length ? (
            viewMode === 'graph' ? <TimelineGraph events={timeline.filter(g => !filter || g.events.some(e => e.eventType === filter))} labResults={labs} /> : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <div className="space-y-8">
                  {timeline.filter(g => !filter || g.events.some(e => e.eventType === filter)).map(group => (
                    <div key={group.date}>
                      <div className="flex items-center gap-3 mb-4"><div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xs font-bold z-10 hidden sm:flex">{new Date(group.date).getDate()}</div><div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 rounded-full text-xs font-bold">{new Date(group.date).toLocaleDateString()}</div><div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
                      <div className="sm:ml-12 space-y-3">
                        {group.events.filter(e => !filter || e.eventType === filter).map(evt => (
                          <div key={evt.id} className="border dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 hover:shadow-md transition">
                            <div className="flex gap-2 mb-2"><Badge variant="info">{evt.eventType}</Badge><span className="text-xs text-slate-500 dark:text-slate-400">{new Date(evt.eventDate).toLocaleTimeString()} • {evt.verificationStatus} • {evt.confidence ? Math.round(evt.confidence*100)+'%' : ''}</span></div>
                            <p className="text-sm font-medium dark:text-white">{evt.description}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Source: {evt.sourceReference} {evt.document && `• ${evt.document.originalName}`} • Page {evt.pageNumber}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : <div className="text-center py-16"><div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4"><Clock className="w-8 h-8 text-slate-400" /></div><p className="font-bold dark:text-white">No timeline events yet</p><p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Upload medical documents to build visual timeline with graphs automatically.</p></div>}
        </Card>
      )}
    </PageLayout>
  );
};

export const AIAssistantPage = () => {
  const { patientId: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('patientId');
  const patientId = paramId || queryId || '';
  const { role } = useAuth();
  const [mode, setMode] = useState('HEALTH_RECORD');
  const [question, setQuestion] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [docs, setDocs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(patientId);

  useEffect(() => {
    if (selectedPatientId) {
      documentAPI.getPatientDocs(selectedPatientId, { limit: 20 }).then(res => setDocs(res.data.documents)).catch(()=>{});
    }
  }, [selectedPatientId]);

  useEffect(() => { if (patientId) setSelectedPatientId(patientId); }, [patientId]);

  const ask = async () => {
    if (!question.trim() || !selectedPatientId) { alert('Enter patient ID and question'); return; }
    if (mode === 'REPORT' && !documentId) { alert('Select document for Report Assistant mode'); return; }
    setLoading(true);
    const userMsg = { role: 'USER', content: question, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    try {
      const res = await aiAPI.ask({ patientId: selectedPatientId, mode, documentId: mode === 'REPORT' ? documentId : undefined, question });
      setMessages(prev => [...prev, { role: 'ASSISTANT', content: res.data.answer, sources: res.data.sources, disclaimer: res.data.disclaimer, timestamp: new Date() }]);
      setQuestion('');
    } catch (e) { setMessages(prev => [...prev, { role: 'ASSISTANT', content: `Error: ${e.response?.data?.error || e.message}`, timestamp: new Date() }]); }
    finally { setLoading(false); }
  };

  const exampleQuestions = {
    REPORT: ["Summarize this report in simple language", "What lab values are documented in this report?", "Explain abnormal findings with reference ranges", "Show source for hemoglobin result"],
    TIMELINE: ["Show my complete medical timeline with graph", "What medical events occurred during 2026?", "Visualize my lab trends over time", "What happened during last visit?"],
    HEALTH_RECORD: ["Summarize my medical history with timeline graph", "What changed between previous and latest blood reports? Show with comparison", "Show my medication history with sources", "Explain my latest report in simple language for patient", "What should I discuss with my doctor in next visit?", "Show my lab trends with visual chart"]
  };

  return (
    <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 dark:text-white">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-lg"><Brain className="w-5 h-5 text-white" /></div>
              AI Health Record Assistant — Advanced
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[11px] font-bold">NEW • Visual</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">Advanced AI that answers using only authorized patient's records. Every answer with <span className="font-semibold">beautiful formatting</span>, source references, View Source, and visual graphs where applicable.</p>
          </div>
          <div className="flex gap-2">
            <Select value={mode} onChange={e => setMode(e.target.value)} className="min-w-[200px]"><option value="HEALTH_RECORD">🏥 Health Record Assistant</option><option value="TIMELINE">📊 Timeline Assistant (Graph)</option><option value="REPORT">📄 Report Assistant</option></Select>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Patient ID</label>
              <input value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} placeholder="e.g., 26GP001P001" className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-white" />
              {mode === 'REPORT' && (
                <div className="mt-4">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Select Document</label>
                  <select value={documentId} onChange={e => setDocumentId(e.target.value)} className="w-full mt-2 px-3 py-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white">
                    <option value="">Choose document for analysis</option>
                    {docs.map(d => <option key={d.id} value={d.id}>{d.fileName} ({d.category})</option>)}
                  </select>
                </div>
              )}
              <div className="mt-5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Try These Advanced Queries</p>
                <div className="space-y-2">
                  {exampleQuestions[mode]?.map((q, i) => (
                    <button key={i} onClick={() => setQuestion(q)} className="w-full text-left text-xs bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 hover:from-teal-50 hover:to-cyan-50 dark:hover:from-teal-900/20 dark:hover:to-cyan-900/20 border border-slate-200 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-800 rounded-xl px-3 py-2.5 transition text-slate-700 dark:text-slate-300 hover:text-teal-800 dark:hover:text-teal-200 leading-relaxed">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-100 dark:border-teal-800">
              <h3 className="text-xs font-bold text-teal-800 dark:text-teal-200 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> AI Safety & Advanced Features</h3>
              <ul className="text-[11px] text-teal-700 dark:text-teal-300 space-y-2 leading-relaxed">
                <li className="flex gap-1.5"><span>✅</span><span>Never fabricates medical info — only documented facts</span></li>
                <li className="flex gap-1.5"><span>✅</span><span>Beautiful markdown rendering — no ** symbols, proper bold, lists, tables</span></li>
                <li className="flex gap-1.5"><span>✅</span><span>Visual timeline graphs and lab trends where applicable</span></li>
                <li className="flex gap-1.5"><span>✅</span><span>Every answer with source references and View Source</span></li>
                <li className="flex gap-1.5"><span>✅</span><span>Distinguishes documented findings vs AI interpretation</span></li>
                <li className="flex gap-1.5"><span>✅</span><span>No prescribing — encourages doctor consultation</span></li>
              </ul>
            </Card>
          </div>

          <div className="lg:col-span-9">
            <Card className="flex flex-col h-[750px] overflow-hidden shadow-xl">
              <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm" />
                  <span className="text-sm font-bold dark:text-white">{mode.replace('_', ' ')} Mode</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">• Patient: {selectedPatientId || 'Not selected'} • Advanced AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="teal">{messages.length} messages</Badge>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center"><Brain className="w-4 h-4 text-white" /></div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#f8fafc] dark:bg-slate-950">
                {messages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 border border-teal-100 dark:border-teal-800 flex items-center justify-center mx-auto mb-5 shadow-sm"><Brain className="w-10 h-10 text-teal-600 dark:text-teal-400" /></div>
                    <h3 className="font-bold text-lg dark:text-white">Advanced AI Health Assistant</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 max-w-md mx-auto leading-relaxed">Ask about medical records in natural language. Get beautifully formatted answers with visual graphs, source references, and View Source actions. No ** symbols — proper formatting.</p>
                    <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {exampleQuestions[mode]?.slice(0,4).map((q, i) => (
                        <button key={i} onClick={() => setQuestion(q)} className="text-left text-xs bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-4 hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800 transition group">
                          <p className="font-medium text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300">{q}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Click to ask →</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-2xl px-5 py-4 ${m.role === 'USER' ? 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm'}`}>
                      {m.role === 'USER' ? (
                        <p className="text-sm font-medium">{m.content}</p>
                      ) : (
                        <MarkdownRenderer content={m.content} />
                      )}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Source References — Traceable</p>
                          <div className="grid gap-1.5">
                            {m.sources.slice(0,5).map((s, i) => (
                              <div key={i} className="text-[11px] bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-full px-3 py-1.5 font-mono flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0" />
                                <span className="truncate">{s.fileName || s.source || s.test || s.type} {s.page ? `• Page ${s.page}` : ''} {s.date ? `• ${new Date(s.date).toLocaleDateString()}` : ''}</span>
                              </div>
                            ))}
                          </div>
                          <button className="mt-3 text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1">View Source Documents → <Eye className="w-3 h-3" /></button>
                        </div>
                      )}
                      {m.disclaimer && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 italic border-t dark:border-slate-800 pt-3 leading-relaxed">{m.disclaimer}</p>}
                      <p className="text-[10px] opacity-60 mt-3 flex items-center gap-1">🕐 {new Date(m.timestamp).toLocaleTimeString()} • {m.role === 'USER' ? 'You' : 'AI Assistant • Advanced'}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3">
                      <div className="flex gap-1"><div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" /><div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce delay-100" /><div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce delay-200" /></div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Analyzing your medical records with advanced AI...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex gap-3">
                  <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && ask()} placeholder={mode === 'REPORT' ? 'Ask about this document with advanced formatting...' : mode === 'TIMELINE' ? 'Ask about timeline with visual graph...' : 'Ask about medical history, lab trends, medications with beautiful formatting...'} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm" />
                  <Button onClick={ask} loading={loading} variant="teal" size="lg" className="shadow-md px-6"><Brain className="w-4 h-4" /> Ask AI</Button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Advanced AI: Beautiful formatting, no ** symbols, visual graphs, source traceability, never fabricates. Always shows sources.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export const CompareReports = () => {
  const { patientId: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('patientId');
  const patientId = paramId || queryId;
  const { role } = useAuth();
  const [docs, setDocs] = useState([]);
  const [doc1, setDoc1] = useState('');
  const [doc2, setDoc2] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');

  useEffect(() => {
    if (selectedPatientId) documentAPI.getPatientDocs(selectedPatientId, { limit: 50 }).then(res => setDocs(res.data.documents)).catch(()=>{});
  }, [selectedPatientId]);

  useEffect(() => { if (patientId) setSelectedPatientId(patientId); }, [patientId]);

  const compare = async () => {
    if (!selectedPatientId || !doc1 || !doc2) { alert('Select patient and two documents'); return; }
    setLoading(true);
    try {
      const res = await documentAPI.compare(selectedPatientId, doc1, doc2);
      setResult(res.data);
    } catch (e) { alert(e.response?.data?.error || 'Compare failed'); }
    finally { setLoading(false); }
  };

  return (
    <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-2 dark:text-white flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>Report Comparison — Visual & Advanced</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Select two reports to compare lab values, reference ranges, abnormal findings with visual Increased/Decreased/Unchanged indicators and source documents.</p>

        <Card className="p-6 mb-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold uppercase tracking-wider">Patient ID</label><input value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} placeholder="26GP001P001" className="w-full mt-2 px-3.5 py-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono dark:text-white" /></div>
            <div><label className="text-xs font-bold uppercase tracking-wider">Previous Report</label><select value={doc1} onChange={e => setDoc1(e.target.value)} className="w-full mt-2 px-3 py-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white"><option value="">Select previous document</option>{docs.map(d => <option key={d.id} value={d.id}>{d.fileName} ({new Date(d.uploadDate).toLocaleDateString()})</option>)}</select></div>
            <div><label className="text-xs font-bold uppercase tracking-wider">Current Report</label><select value={doc2} onChange={e => setDoc2(e.target.value)} className="w-full mt-2 px-3 py-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white"><option value="">Select current document</option>{docs.map(d => <option key={d.id} value={d.id}>{d.fileName} ({new Date(d.uploadDate).toLocaleDateString()})</option>)}</select></div>
          </div>
          <Button onClick={compare} loading={loading} variant="teal" className="mt-5 shadow-md">Compare Reports with Visual Analysis</Button>
        </Card>

        {result && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <Card className="p-5 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"><p className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">Previous Report</p><p className="text-sm font-bold mt-2 dark:text-white">{result.previous.fileName}</p><p className="text-xs text-amber-700 dark:text-amber-300 mt-2">{result.previous.category} • {new Date(result.previous.date).toLocaleDateString()} • {result.previous.documentId}</p></Card>
              <Card className="p-5 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"><p className="text-xs font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-wider">Current Report</p><p className="text-sm font-bold mt-2 dark:text-white">{result.current.fileName}</p><p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">{result.current.category} • {new Date(result.current.date).toLocaleDateString()} • {result.current.documentId}</p></Card>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 text-center"><p className="text-2xl font-bold dark:text-white">{result.summary.totalTests}</p><p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Tests</p></Card>
              <Card className="p-4 text-center border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"><p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{result.summary.increased}</p><p className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">↗ Increased</p></Card>
              <Card className="p-4 text-center border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10"><p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{result.summary.decreased}</p><p className="text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold">↘ Decreased</p></Card>
              <Card className="p-4 text-center border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10"><p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{result.summary.newlyReported}</p><p className="text-[11px] text-blue-600 dark:text-blue-400 uppercase tracking-wider font-semibold">✨ Newly Reported</p></Card>
            </div>

            <Card className="p-6">
              <h3 className="font-bold mb-5 dark:text-white flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Detailed Comparison — Visual with Source Preservation</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider"><th className="text-left py-3">Test</th><th className="text-left">Previous</th><th className="text-left">Current</th><th className="text-left">Change</th><th className="text-left">Source</th></tr></thead>
                  <tbody>
                    {result.comparison.map((c, i) => (
                      <tr key={i} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-4 font-bold dark:text-white">{c.testName}</td>
                        <td className="text-xs py-4"><div className="bg-amber-50 dark:bg-amber-900/20 border dark:border-amber-800 rounded-xl p-2.5">{c.previous ? <><p className="font-mono font-bold">{c.previous.result} {c.previous.unit || ''}</p><p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{c.previous.referenceRange || 'No ref'} [{c.previous.status || 'Unknown'}] • {c.previous.source} P{c.previous.page}</p></> : <span className="text-slate-400">— Not in previous</span>}</div></td>
                        <td className="text-xs py-4"><div className="bg-emerald-50 dark:bg-emerald-900/20 border dark:border-emerald-800 rounded-xl p-2.5">{c.current ? <><p className="font-mono font-bold">{c.current.result} {c.current.unit || ''}</p><p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{c.current.referenceRange || 'No ref'} [{c.current.status || 'Unknown'}] • {c.current.source} P{c.current.page}</p></> : <span className="text-slate-400">— Not in current</span>}</div></td>
                        <td className="py-4"><Badge variant={c.status === 'Increased' ? 'danger' : c.status === 'Decreased' ? 'warning' : c.status === 'Unchanged' ? 'success' : 'info'} className="font-bold">{c.status} {c.change ? `(${c.change > 0 ? '+' : ''}${c.change.toFixed(2)})` : ''}</Badge></td>
                        <td className="text-[11px] font-mono py-4"><div className="bg-slate-50 dark:bg-slate-800 rounded-full px-2.5 py-1 border dark:border-slate-700 text-slate-600 dark:text-slate-300">{c.previous?.source?.slice(0,10) || '—'} → {c.current?.source?.slice(0,10) || '—'}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export const AccessRequestsPage = () => {
  const { role } = useAuth();
  const [requests, setRequests] = useState([]);
  const [activeAccess, setActiveAccess] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (role === 'DOCTOR') {
        const [reqRes, accessRes] = await Promise.all([accessAPI.getDoctorRequests(), accessAPI.getActive()]);
        setRequests(reqRes.data.requests);
        setActiveAccess(accessRes.data.accesses);
      } else {
        const [reqRes, accessRes] = await Promise.all([accessAPI.getPatientRequests(), accessAPI.getActive()]);
        setRequests(reqRes.data.requests);
        setActiveAccess(accessRes.data.accesses);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id, accessType = 'FULL') => {
    try { await accessAPI.approve(id, { accessType }); alert('Access granted'); fetchData(); } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };
  const handleReject = async (id) => { try { await accessAPI.reject(id); alert('Rejected'); fetchData(); } catch (e) { alert('Failed'); } };
  const handleRevoke = async (id) => { if (!confirm('Revoke access?')) return; try { await accessAPI.revoke(id); alert('Revoked'); fetchData(); } catch (e) { alert('Failed'); } };

  return (
    <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}>
      <h1 className="text-2xl font-bold tracking-tight mb-2 dark:text-white flex items-center gap-3"><Shield className="w-7 h-7" /> {role === 'DOCTOR' ? 'Access Requests' : 'Doctor Access Management'}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{role === 'DOCTOR' ? 'Track your access requests to other doctors\' patients' : 'Approve/reject doctor access requests. Choose full/limited/selected/temporary. Revoke anytime. Audit logged.'}</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-5 flex items-center gap-2 dark:text-white"><Shield className="w-5 h-5" /> {role === 'DOCTOR' ? 'My Requests' : 'Pending Requests'} ({requests.length})</h3>
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="border dark:border-slate-700 rounded-xl p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 hover:shadow-md transition">
                <div className="flex justify-between gap-3">
                  <div><p className="text-sm font-bold dark:text-white">{role === 'DOCTOR' ? `${req.patient?.name} (${req.patient?.patientId})` : `${req.doctor?.name} (${req.doctor?.doctorId}) — ${req.doctor?.designation}`}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Type: {req.requestedAccessType} • Status: {req.status} • {new Date(req.createdAt).toLocaleString()}</p>{req.message && <p className="text-xs mt-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-3 italic">"{req.message}"</p>}</div>
                  <Badge variant={req.status === 'PENDING' ? 'warning' : req.status === 'APPROVED' ? 'success' : 'danger'}>{req.status}</Badge>
                </div>
                {role === 'PATIENT' && req.status === 'PENDING' && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button size="sm" variant="teal" onClick={() => handleApprove(req.id, 'FULL')}>Approve Full</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleApprove(req.id, 'LIMITED')}>Limited</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleApprove(req.id, 'TEMPORARY')}>Temporary (7d)</Button>
                    <Button size="sm" variant="danger" onClick={() => handleReject(req.id)}>Reject</Button>
                  </div>
                )}
              </div>
            ))}
            {requests.length === 0 && <div className="text-center py-12"><Shield className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" /><p className="text-sm text-slate-500 dark:text-slate-400">No requests</p></div>}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-5 dark:text-white">Active Access Permissions ({activeAccess.length})</h3>
          <div className="space-y-3">
            {activeAccess.map(acc => (
              <div key={acc.id} className="border dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 hover:shadow-md transition">
                <div className="flex justify-between gap-3"><div><p className="text-sm font-bold dark:text-white">{role === 'DOCTOR' ? `${acc.patient?.name} (${acc.patient?.patientId})` : `${acc.doctor?.name} (${acc.doctor?.doctorId})`}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{acc.accessType} • Granted {new Date(acc.grantedAt).toLocaleDateString()} {acc.expiresAt && `• Expires ${new Date(acc.expiresAt).toLocaleDateString()}`}</p></div><Badge variant="success">Active</Badge></div>
                <Button size="sm" variant="danger" className="mt-3" onClick={() => handleRevoke(acc.id)}>Revoke Access</Button>
              </div>
            ))}
            {activeAccess.length === 0 && <div className="text-center py-12"><Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" /><p className="text-sm text-slate-500 dark:text-slate-400">No active access</p></div>}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

export const VisitsPage = () => {
  const { patientId } = useParams();
  const { role } = useAuth();
  const [visits, setVisits] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [showAddRx, setShowAddRx] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], reason: '', clinicalNotes: '', findings: '', assessment: '', plan: '', followUp: '' });
  const [rxForm, setRxForm] = useState({ date: new Date().toISOString().split('T')[0], instructions: '', medications: [{ medication: '', dosage: '', frequency: '', duration: '' }] });

  const fetchData = async () => {
    if (!patientId) return;
    const [vRes, pRes] = await Promise.all([visitAPI.getVisits(patientId), visitAPI.getPrescriptions(patientId)]);
    setVisits(vRes.data.visits);
    setPrescriptions(pRes.data.prescriptions);
  };
  useEffect(() => { fetchData(); }, [patientId]);

  const addVisit = async () => {
    try { await visitAPI.addVisit({ patientId, ...form }); alert('Visit added, timeline updated'); setShowAddVisit(false); fetchData(); } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };
  const addRx = async () => {
    try { await visitAPI.addPrescription({ patientId, ...rxForm }); alert('Prescription added'); setShowAddRx(false); fetchData(); } catch (e) { alert('Failed'); }
  };

  return (
    <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight dark:text-white">Visits & Prescriptions — {patientId}</h1>
        {role === 'DOCTOR' && <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => setShowAddVisit(!showAddVisit)}><Plus className="w-4 h-4" /> Add Visit</Button><Button size="sm" variant="teal" onClick={() => setShowAddRx(!showAddRx)}><Pill className="w-4 h-4" /> Add Prescription</Button></div>}
      </div>

      {showAddVisit && (
        <Card className="p-6 mb-6">
          <h3 className="font-bold mb-4 dark:text-white">Add Visit — Doctor-Entered Distinguishable from AI-Extracted</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input label="Reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Chief complaint" />
            <div className="sm:col-span-2"><Textarea label="Clinical Notes" value={form.clinicalNotes} onChange={e => setForm({ ...form, clinicalNotes: e.target.value })} placeholder="History, examination..." /></div>
            <Textarea label="Findings" value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} />
            <Textarea label="Assessment" value={form.assessment} onChange={e => setForm({ ...form, assessment: e.target.value })} />
            <Textarea label="Plan" value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} />
            <Input label="Follow-up" value={form.followUp} onChange={e => setForm({ ...form, followUp: e.target.value })} />
          </div>
          <Button onClick={addVisit} variant="teal" className="mt-5">Save Visit & Update Timeline</Button>
        </Card>
      )}

      {showAddRx && (
        <Card className="p-6 mb-6">
          <h3 className="font-bold mb-4 dark:text-white">Add Prescription — Never AI-prescribed, Doctor-only</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Input label="Date" type="date" value={rxForm.date} onChange={e => setRxForm({ ...rxForm, date: e.target.value })} />
            <Input label="Instructions" value={rxForm.instructions} onChange={e => setRxForm({ ...rxForm, instructions: e.target.value })} placeholder="General instructions" />
          </div>
          {rxForm.medications.map((med, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
              <Input placeholder="Medication" value={med.medication} onChange={e => { const m = [...rxForm.medications]; m[idx].medication = e.target.value; setRxForm({ ...rxForm, medications: m }); }} />
              <Input placeholder="Dosage" value={med.dosage} onChange={e => { const m = [...rxForm.medications]; m[idx].dosage = e.target.value; setRxForm({ ...rxForm, medications: m }); }} />
              <Input placeholder="Frequency" value={med.frequency} onChange={e => { const m = [...rxForm.medications]; m[idx].frequency = e.target.value; setRxForm({ ...rxForm, medications: m }); }} />
              <Input placeholder="Duration" value={med.duration} onChange={e => { const m = [...rxForm.medications]; m[idx].duration = e.target.value; setRxForm({ ...rxForm, medications: m }); }} />
            </div>
          ))}
          <div className="flex gap-2 mt-4"><Button size="sm" variant="secondary" onClick={() => setRxForm({ ...rxForm, medications: [...rxForm.medications, { medication: '', dosage: '', frequency: '', duration: '' }] })}>+ Add Medication</Button><Button size="sm" variant="teal" onClick={addRx}>Save Prescription</Button></div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6"><h3 className="font-bold mb-4 dark:text-white">Visits ({visits.length})</h3><div className="space-y-3">{visits.map(v => <div key={v.id} className="border dark:border-slate-700 rounded-xl p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"><p className="text-sm font-bold dark:text-white">{new Date(v.date).toLocaleDateString()} — {v.doctor?.name} <Badge variant="teal" className="ml-2">{v.sourceType}</Badge></p><p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{v.reason} • {v.assessment?.substring(0,100)}</p></div>)}{visits.length===0 && <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No visits yet</p>}</div></Card>
        <Card className="p-6"><h3 className="font-bold mb-4 dark:text-white">Prescriptions ({prescriptions.length})</h3><div className="space-y-3">{prescriptions.map(p => <div key={p.id} className="border dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900"><p className="text-sm font-bold dark:text-white">{new Date(p.date).toLocaleDateString()} — {p.doctor?.name}</p><div className="mt-3 space-y-2">{p.medications.map(m => <p key={m.id} className="text-xs bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-3">{m.medication} {m.dosage} {m.frequency} {m.duration}</p>)}</div></div>)}{prescriptions.length===0 && <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No prescriptions yet</p>}</div></Card>
      </div>
    </PageLayout>
  );
};

export const PatientDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { patientAPI.getPatientDashboard().then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <PageLayout sidebar="patient"><div className="p-8 text-center dark:text-white">Loading...</div></PageLayout>;

  return (
    <PageLayout sidebar="patient">
      <h1 className="text-2xl font-bold tracking-tight mb-2 dark:text-white">My Health Dashboard</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Welcome, {data?.patient?.name} • {data?.patient?.patientId} • Your medical records with visual timeline and advanced AI assistant</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="p-5 hover:shadow-lg transition"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-3 shadow-md"><FileText className="w-6 h-6 text-white" /></div><p className="text-2xl font-bold dark:text-white">{data?.stats?.totalDocuments || 0}</p><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Documents</p></Card>
        <Card className="p-5 hover:shadow-lg transition"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center mb-3 shadow-md"><Clock className="w-6 h-6 text-white" /></div><p className="text-2xl font-bold dark:text-white">{data?.stats?.totalEvents || 0}</p><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Timeline Events</p></Card>
        <Card className="p-5 hover:shadow-lg transition"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mb-3 shadow-md"><Activity className="w-6 h-6 text-white" /></div><p className="text-2xl font-bold dark:text-white">{data?.stats?.totalVisits || 0}</p><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Visits</p></Card>
        <Card className="p-5 hover:shadow-lg transition"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3 shadow-md"><Shield className="w-6 h-6 text-white" /></div><p className="text-2xl font-bold dark:text-white">{data?.stats?.activeDoctorAccess || 0}</p><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Doctor Access</p>{data?.stats?.pendingRequests > 0 && <Badge variant="warning" className="mt-2">{data.stats.pendingRequests} pending</Badge>}</Card>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold flex items-center gap-2 dark:text-white"><FileText className="w-5 h-5" /> Recent Documents — With Image Preview</h3>
              <Link to="/patient/records" className="text-xs font-bold text-violet-700 dark:text-violet-300 hover:underline">View all →</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {data?.recentDocuments?.map(d => (
                <Link key={d.id} to={`/patient/document/${d.documentId}`} className="group border dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 border dark:border-violet-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                      {d.fileType?.includes('image') ? <ImageIcon className="w-5 h-5 text-violet-700 dark:text-violet-300" /> : <FileText className="w-5 h-5 text-violet-700 dark:text-violet-300" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300">{d.originalName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{d.category} • {new Date(d.uploadDate).toLocaleDateString()} • {d.processingStatus}</p>
                      <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-1.5 flex items-center gap-1"><Eye className="w-3 h-3" /> {d.fileType?.includes('image') ? 'Image • Fullscreen view' : 'PDF • View with zoom'}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {!data?.recentDocuments?.length && <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center col-span-2">No documents yet</p>}
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-bold mb-5 flex items-center gap-2 dark:text-white"><Clock className="w-5 h-5" /> Recent Timeline — Visual Graph</h3>
            {data?.recentEvents?.length ? <TimelineGraph events={[{ date: new Date().toISOString(), events: data.recentEvents.slice(0,4) }]} labResults={data.labResults || []} /> : <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No timeline events</p>}
          </Card>
        </div>
        
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-0 shadow-xl">
            <div className="flex items-center gap-2 mb-3"><Brain className="w-6 h-6" /><h3 className="font-bold">AI Assistant — Advanced</h3><span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">NEW</span></div>
            <p className="text-xs text-violet-100 leading-relaxed mb-4">Ask in simple language with beautiful formatting, no ** symbols, visual graphs, and source traceability. "Explain my report", "Show lab trends".</p>
            <Link to="/patient/assistant"><Button variant="secondary" size="sm" className="w-full bg-white text-violet-700 hover:bg-violet-50 font-bold">Open Advanced AI Assistant</Button></Link>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-bold mb-4 dark:text-white flex items-center gap-2"><Activity className="w-4 h-4" /> Lab Results Trend</h3>
            <div className="space-y-3">
              {data?.labResults?.slice(0,5).map(l => (
                <div key={l.id} className="flex justify-between items-center text-sm border-b dark:border-slate-800 last:border-0 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 px-2 rounded-lg transition">
                  <div><p className="font-medium dark:text-white">{l.testName}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">{new Date(l.testDate).toLocaleDateString()} • {l.status}</p></div>
                  <span className="font-mono font-bold dark:text-white">{l.result} {l.unit}</span>
                </div>
              ))}
              {!data?.labResults?.length && <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">No labs yet</p>}
            </div>
            <Link to="/patient/labs" className="text-xs font-bold text-violet-700 dark:text-violet-300 hover:underline mt-4 block">View all labs with trends →</Link>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-bold mb-4 dark:text-white">Active Doctor Access</h3>
            <div className="space-y-2.5">
              {data?.activeAccess?.map(a => (
                <div key={a.id} className="flex justify-between items-center text-sm border dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs">{a.doctor.name[0]}</div><span className="font-medium dark:text-white">{a.doctor.name}</span></div>
                  <Badge variant="success">{a.accessType}</Badge>
                </div>
              ))}
              {!data?.activeAccess?.length && <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">No active doctor access</p>}
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export const ProfilePage = () => {
  const { role } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../services/api').then(({ authAPI }) => {
      authAPI.getProfile().then(res => setProfile(res.data)).catch(console.error).finally(() => setLoading(false));
    });
  }, []);

  if (loading) return <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}><div className="p-8 text-center dark:text-white">Loading profile...</div></PageLayout>;

  return (
    <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight mb-6 dark:text-white">Profile — {profile?.role}</h1>
        <Card className="p-8">
          <div className="flex gap-5 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 flex items-center justify-center font-bold text-3xl shadow-lg">{profile?.profile?.name?.[0] || 'U'}</div>
            <div>
              <h3 className="font-bold text-xl dark:text-white">{profile?.profile?.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{profile?.profile?.doctorId || profile?.profile?.patientId} • {profile?.role}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border dark:border-slate-700 inline-block">{profile?.profile?.email}</p>
              <div className="mt-3 flex gap-2"><Badge variant="teal">Verified</Badge><Badge variant="success">Active</Badge></div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 text-sm">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700"><p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">ID</p><p className="font-mono font-bold mt-1 dark:text-white">{profile?.profile?.doctorId || profile?.profile?.patientId}</p></div>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700"><p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Email</p><p className="mt-1 dark:text-white">{profile?.profile?.email}</p></div>
            {profile?.profile?.designation && <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 dark:border-teal-800"><p className="text-xs text-teal-600 dark:text-teal-400 uppercase tracking-wider font-semibold">Designation</p><p className="mt-1 font-bold dark:text-white">{profile.profile.designation} ({profile.profile.specialtyCode})</p></div>}
            {profile?.profile?.phone && <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700"><p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Phone</p><p className="mt-1 dark:text-white">{profile.profile.phone}</p></div>}
            {profile?.profile?.dob && <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700"><p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Date of Birth</p><p className="mt-1 dark:text-white">{new Date(profile.profile.dob).toLocaleDateString()}</p></div>}
            {profile?.profile?.primaryDoctor && <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-xl border border-violet-100 dark:border-violet-800"><p className="text-xs text-violet-600 dark:text-violet-400 uppercase tracking-wider font-semibold">Primary Doctor</p><p className="mt-1 font-bold dark:text-white">{profile.profile.primaryDoctor.name} ({profile.profile.primaryDoctor.doctorId})</p></div>}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};
