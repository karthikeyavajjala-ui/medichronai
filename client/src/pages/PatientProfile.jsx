import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Clock, Activity, ClipboardList, Upload, Brain, Download, Eye, AlertTriangle, CheckCircle, User, Phone, Mail, MapPin, Droplets, Edit3, Save, X, Image as ImageIcon, File, TrendingUp } from 'lucide-react';
import { PageLayout } from '../components/Layout';
import { Card, Button, Badge, Alert, Input, Select, Textarea, TimelineGraph } from '../components/UI';
import { patientAPI, documentAPI, timelineAPI, visitAPI, aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PatientProfile({ isDoctorView = true }) {
  const { patientId } = useParams();
  const { role } = useAuth();
  const [patient, setPatient] = useState(null);
  const [docs, setDocs] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [labs, setLabs] = useState([]);
  const [visits, setVisits] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dragOver, setDragOver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Blood Test');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profileRes, docsRes, timelineRes, labsRes, visitsRes, rxRes] = await Promise.all([
        patientAPI.getProfile(patientId),
        documentAPI.getPatientDocs(patientId, { limit: 30 }),
        timelineAPI.getTimeline(patientId, { limit: 100 }),
        documentAPI.getLabResults(patientId),
        visitAPI.getVisits(patientId),
        visitAPI.getPrescriptions(patientId)
      ]);
      setPatient(profileRes.data.patient);
      setDocs(docsRes.data.documents);
      setTimeline(timelineRes.data.groupedByDate || []);
      setLabs(labsRes.data.labResults);
      setVisits(visitsRes.data.visits);
      setPrescriptions(rxRes.data.prescriptions);
      setEditForm({
        name: profileRes.data.patient.name,
        phone: profileRes.data.patient.phone,
        address: profileRes.data.patient.address || '',
        emergencyContact: profileRes.data.patient.emergencyContact || '',
        bloodGroup: profileRes.data.patient.bloodGroup || '',
        medicalInfo: profileRes.data.patient.medicalInfo || ''
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [patientId]);

  const handleUpload = async (files, category = selectedCategory) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('patientId', patient.id);
      fd.append('category', category);
      Array.from(files).forEach(f => fd.append('documents', f));
      await documentAPI.upload(fd);
      alert(`${files.length} document(s) uploaded. Processing started — you'll see timeline update automatically.`);
      setTimeout(fetchAll, 1500);
    } catch (e) { alert(e.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      await patientAPI.updatePatient(patient.patientId, editForm);
      alert('Patient details updated successfully');
      setIsEditing(false);
      fetchAll();
    } catch (e) { alert(e.response?.data?.error || 'Update failed'); }
    finally { setEditLoading(false); }
  };

  const handleDownload = async (type) => {
    try {
      const api = type === 'excel' ? aiAPI.exportExcel(patient.id) : aiAPI.exportPDF(patient.id);
      const res = await api;
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${patient.patientId}_${type === 'excel' ? 'medical_record.xlsx' : 'summary.pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed'); }
  };

  if (loading) return <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}><div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading patient profile...</div></PageLayout>;
  if (!patient) return <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}><div className="p-8 text-center dark:text-white">Patient not found or access denied</div></PageLayout>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'documents', label: `Documents (${docs.length})`, icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'labs', label: `Labs (${labs.length})`, icon: Activity },
    { id: 'visits', label: `Visits (${visits.length})`, icon: ClipboardList },
    { id: 'prescriptions', label: `Rx (${prescriptions.length})`, icon: ClipboardList },
  ];

  const categories = ["Blood Test","Lab Report","Imaging Report","X-Ray","CT","MRI","Ultrasound","ECG","Prescription","Discharge Summary","Consultation Note","Clinical Note","Pathology Report","Surgical Report","Other"];

  return (
    <PageLayout sidebar={role === 'DOCTOR' ? 'doctor' : 'patient'}>
      {/* Header with improved layout - not congested */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 flex items-center justify-center font-bold text-2xl shadow-lg shrink-0">
              {patient.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{patient.name}</h1>
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-300">{patient.patientId}</span>
                {patient.isActivated ? <Badge variant="success">Active</Badge> : <Badge variant="warning">Pending Activation</Badge>}
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><span>🎂</span> {patient.age}y • {patient.gender} • {patient.bloodGroup || 'N/A'}</p>
                <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {patient.phone}</p>
                <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5" /> {patient.email}</p>
                <p className="text-slate-500 dark:text-slate-500 text-xs">Primary: {patient.primaryDoctor?.name} ({patient.primaryDoctor?.doctorId}) • {patient.totalDocuments} docs • {patient.totalEvents} events</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleDownload('excel')} className="shadow-sm"><Download className="w-4 h-4" /> Excel</Button>
              <Button variant="secondary" size="sm" onClick={() => handleDownload('pdf')} className="shadow-sm"><Download className="w-4 h-4" /> PDF</Button>
            </div>
            <Link to={role === 'DOCTOR' ? `/doctor/patient/${patient.patientId}/assistant` : `/patient/assistant?patientId=${patient.patientId}`}>
              <Button variant="teal" size="sm" className="shadow-md w-full lg:w-auto"><Brain className="w-4 h-4" /> AI Assistant</Button>
            </Link>
            {role === 'DOCTOR' && (
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(!isEditing)} className="w-full lg:w-auto">
                {isEditing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit3 className="w-4 h-4" /> Edit Patient</>}
              </Button>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && role === 'DOCTOR' && (
          <div className="mt-6 pt-6 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Edit3 className="w-4 h-4" /> Edit Patient Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              <Input label="Phone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              <Select label="Blood Group" value={editForm.bloodGroup} onChange={e => setEditForm({ ...editForm, bloodGroup: e.target.value })}>
                <option value="">Select</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </Select>
              <Input label="Emergency Contact" value={editForm.emergencyContact} onChange={e => setEditForm({ ...editForm, emergencyContact: e.target.value })} />
              <div className="sm:col-span-2"><Input label="Address" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
              <div className="sm:col-span-2"><Textarea label="Medical Info" value={editForm.medicalInfo} onChange={e => setEditForm({ ...editForm, medicalInfo: e.target.value })} rows={3} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="teal" onClick={handleEditSave} loading={editLoading}><Save className="w-4 h-4" /> Save Changes</Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Improved, not congested */}
        <div className="lg:col-span-3 space-y-5">
          <Card className="p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Patient Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><User className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="font-medium text-slate-900 dark:text-white">{patient.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">Full Name</p></div></div>
              <div className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><Clock className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="font-medium text-slate-900 dark:text-white">{new Date(patient.dob).toLocaleDateString()} ({patient.age}y)</p><p className="text-xs text-slate-500 dark:text-slate-400">Date of Birth</p></div></div>
              <div className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><Phone className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="font-medium text-slate-900 dark:text-white">{patient.phone}</p><p className="text-xs text-slate-500 dark:text-slate-400">Phone</p></div></div>
              <div className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><Mail className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="font-medium text-slate-900 dark:text-white truncate max-w-[160px]">{patient.email}</p><p className="text-xs text-slate-500 dark:text-slate-400">Email</p></div></div>
              {patient.address && <div className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><MapPin className="w-4 h-4 text-slate-400 mt-0.5" /><div><p className="font-medium text-slate-900 dark:text-white text-xs">{patient.address}</p><p className="text-xs text-slate-500 dark:text-slate-400">Address</p></div></div>}
              <div className="flex gap-3 p-2 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800"><Droplets className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5" /><div><p className="font-bold text-teal-900 dark:text-teal-100">{patient.bloodGroup || 'N/A'}</p><p className="text-xs text-teal-700 dark:text-teal-300">Blood Group</p></div></div>
              {patient.emergencyContact && <div className="text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3"><p className="font-semibold text-amber-800 dark:text-amber-200">Emergency</p><p className="text-amber-700 dark:text-amber-300 mt-1">{patient.emergencyContact}</p></div>}
              <div className="pt-3 border-t dark:border-slate-800">
                <p className="text-xs font-bold mb-2 text-slate-700 dark:text-slate-300">Authorized Doctors</p>
                <div className="space-y-2">
                  {patient.authorizedDoctors?.length ? patient.authorizedDoctors.map((ad, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg p-2 border dark:border-slate-700">
                      <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-[10px]">{ad.doctor.name[0]}</div>
                      <div><p className="font-medium text-slate-900 dark:text-white">{ad.doctor.name}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">{ad.doctor.doctorId} • {ad.accessType}</p></div>
                    </div>
                  )) : <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">Only primary doctor</p>}
                </div>
              </div>
            </div>
          </Card>

          {role === 'DOCTOR' && (
            <Card className={`p-5 border-2 border-dashed transition-all ${dragOver ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 shadow-lg scale-[1.02]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Documents</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">Drag & drop or click to upload. Real AI pipeline: OCR → Classification → Extraction → Timeline. Supports PDF, JPG, PNG, WEBP up to 20MB.</p>
              
              <div className="space-y-3">
                <Select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="text-xs">
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Select>
                
                <label className="block w-full cursor-pointer">
                  <div className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition group">
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-teal-600 mx-auto mb-2 transition" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click to upload or drag files here</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{selectedCategory} • Max 10 files</p>
                  </div>
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => handleUpload(e.target.files)} className="hidden" />
                </label>
                
                {uploading && (
                  <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-3 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-medium text-teal-700 dark:text-teal-300">Uploading & processing with AI...</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-bold text-sm mb-3">Quick Navigation</h3>
            <div className="space-y-1.5">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${activeTab === tab.id ? 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                  <tab.icon className="w-4 h-4" />
                  <span className="flex-1">{tab.label}</span>
                  <span className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{tab.label.match(/\((\d+)\)/)?.[1] || ''}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content - Improved spacing, not congested */}
        <div className="lg:col-span-9">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards - Better spacing */}
              <div className="grid sm:grid-cols-3 gap-5">
                <Card className="p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Documents</p>
                      <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{patient.totalDocuments}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" />{patient.recentDocuments?.filter(d => d.processingStatus === 'COMPLETED').length} completed • {patient.recentDocuments?.filter(d => d.processingStatus !== 'COMPLETED').length} processing</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg"><FileText className="w-6 h-6 text-white" /></div>
                  </div>
                </Card>
                <Card className="p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timeline Events</p>
                      <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{patient.totalEvents}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Chronological medical events</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg"><Clock className="w-6 h-6 text-white" /></div>
                  </div>
                </Card>
                <Card className="p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lab Results</p>
                      <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{patient.totalLabResults}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">With source traceability</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"><Activity className="w-6 h-6 text-white" /></div>
                  </div>
                </Card>
              </div>

              {/* Recent Documents - Improved with image preview */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold flex items-center gap-2"><FileText className="w-5 h-5" /> Recent Documents</h3>
                  <button onClick={() => setActiveTab('documents')} className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline">View all →</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {patient.recentDocuments?.length ? patient.recentDocuments.map(doc => (
                    <Link key={doc.id} to={role === 'DOCTOR' ? `/doctor/document/${doc.documentId}` : `/patient/document/${doc.documentId}`} className="group border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                          {doc.fileType?.includes('image') ? <ImageIcon className="w-6 h-6 text-teal-700 dark:text-teal-300" /> : <FileText className="w-6 h-6 text-teal-700 dark:text-teal-300" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300">{doc.originalName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{doc.category} • {doc.detectedCategory} {doc.categoryConfidence ? `(${doc.categoryConfidence}%)` : ''}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={doc.processingStatus === 'COMPLETED' ? 'success' : 'warning'} className="text-[10px]">{doc.processingStatus}</Badge>
                            <span className="text-[11px] text-slate-400">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1"><Eye className="w-3 h-3" /> Click to view • {doc.fileType?.includes('image') ? 'Image preview available' : 'PDF preview'}</span>
                        <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 group-hover:underline">View →</span>
                      </div>
                    </Link>
                  )) : <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center col-span-2">No documents yet. Upload to start AI analysis.</p>}
                </div>
              </Card>

              {/* Timeline Preview with Graph */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Timeline Overview — Visual Graph</h3>
                  <button onClick={() => setActiveTab('timeline')} className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline">View full timeline →</button>
                </div>
                {timeline.length > 0 ? <TimelineGraph events={timeline.slice(0, 3)} labResults={labs} /> : <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No timeline events. Upload documents to build visual timeline.</p>}
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-lg">All Documents ({docs.length}) — With Image & Fullscreen View</h3>
                <Link to={role === 'DOCTOR' ? `/doctor/patient/${patient.patientId}/compare` : `/patient/compare?patientId=${patient.patientId}`}><Button size="sm" variant="secondary">Compare Reports</Button></Link>
              </div>
              <div className="grid gap-4">
                {docs.map(doc => (
                  <div key={doc.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition bg-white dark:bg-slate-900">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border dark:border-slate-700 flex items-center justify-center shrink-0">
                          {doc.fileType?.includes('image') ? <ImageIcon className="w-7 h-7 text-slate-600 dark:text-slate-300" /> : <File className="w-7 h-7 text-slate-600 dark:text-slate-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{doc.fileName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Category: {doc.category} | Detected: {doc.detectedCategory} ({doc.categoryConfidence}%) | {doc.fileType} | {Math.round(doc.fileSize/1024)}KB</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant={doc.processingStatus === 'COMPLETED' ? 'success' : doc.processingStatus === 'FAILED' ? 'danger' : doc.processingStatus === 'NEEDS_REVIEW' ? 'warning' : 'info'}>{doc.processingStatus}</Badge>
                            <Badge variant="default">{doc.verificationStatus}</Badge>
                            {doc.mismatchWarning && <Badge variant="warning">Mismatch</Badge>}
                            {doc.fileType?.includes('image') && <Badge variant="teal">Image • Fullscreen View</Badge>}
                          </div>
                          {doc.mismatchWarning && <Alert type="warning" className="mt-3 text-xs">{doc.mismatchWarning}</Alert>}
                        </div>
                      </div>
                      <Link to={role === 'DOCTOR' ? `/doctor/document/${doc.documentId}` : `/patient/document/${doc.documentId}`} className="shrink-0">
                        <Button size="sm" variant="teal" className="w-full sm:w-auto"><Eye className="w-4 h-4" /> View Document</Button>
                      </Link>
                    </div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border dark:border-slate-700">
                      <div><p className="text-slate-500 dark:text-slate-400 font-medium">Upload Date</p><p className="font-semibold text-slate-900 dark:text-white mt-1">{new Date(doc.uploadDate).toLocaleString()}</p></div>
                      <div><p className="text-slate-500 dark:text-slate-400 font-medium">Document Date</p><p className="font-semibold text-slate-900 dark:text-white mt-1">{doc.documentDate ? new Date(doc.documentDate).toLocaleDateString() : 'N/A'}</p></div>
                      <div><p className="text-slate-500 dark:text-slate-400 font-medium">Extracted Data</p><p className="font-semibold text-slate-900 dark:text-white mt-1">{doc.extractedCounts?.labResults} labs • {doc.extractedCounts?.entities} entities • {doc.extractedCounts?.events} events</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'timeline' && (
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Clock className="w-5 h-5" /> Chronological Patient Timeline — Visual Graph with Trends</h3>
              {timeline.length ? <TimelineGraph events={timeline} labResults={labs} /> : <p className="text-sm text-slate-500 dark:text-slate-400 py-12 text-center">No timeline events. Upload documents to build visual timeline with graphs.</p>}
            </Card>
          )}

          {activeTab === 'labs' && (
            <Card className="p-6">
              <h3 className="font-bold mb-4">Lab Results — Structured Table with Source Traceability</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400"><th className="text-left py-3">Date</th><th className="text-left">Test</th><th className="text-left">Result</th><th className="text-left">Unit</th><th className="text-left">Ref Range</th><th className="text-left">Status</th><th className="text-left">Source</th></tr></thead>
                  <tbody>{labs.map(lab => <tr key={lab.id} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800"><td className="py-3 text-xs">{lab.testDate ? new Date(lab.testDate).toLocaleDateString() : 'N/A'}</td><td className="font-medium text-slate-900 dark:text-white">{lab.testName}</td><td className="font-mono font-bold">{lab.result}</td><td>{lab.unit || 'N/A'}</td><td className="text-xs max-w-[150px] truncate">{lab.referenceRange || 'Reference range not provided'}</td><td><Badge variant={lab.status === 'Normal' ? 'success' : lab.status === 'High' || lab.status === 'Low' ? 'warning' : 'default'}>{lab.status || 'Unknown'}</Badge></td><td className="text-xs"><span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border dark:border-slate-700">Page {lab.pageNumber}</span> <span className="text-slate-500 dark:text-slate-400 truncate max-w-[80px] inline-block">{lab.document?.originalName?.substring(0,20)}</span></td></tr>)}</tbody>
                </table>
              </div>
              {labs.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No lab results extracted yet. Upload blood test / lab reports.</p>}
            </Card>
          )}

          {activeTab === 'visits' && (
            <Card className="p-6">
              <h3 className="font-bold mb-4">Visits — Doctor-Entered Distinguishable from AI-Extracted</h3>
              <div className="space-y-3">
                {visits.map(v => (
                  <div key={v.id} className="border dark:border-slate-700 rounded-xl p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 hover:shadow-md transition">
                    <div className="flex justify-between"><p className="font-semibold text-sm text-slate-900 dark:text-white">{new Date(v.date).toLocaleDateString()} — {v.doctor?.name}</p><Badge variant="teal">{v.sourceType}</Badge></div>
                    {v.reason && <p className="text-sm mt-2"><span className="font-semibold">Reason:</span> {v.reason}</p>}
                    {v.clinicalNotes && <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">{v.clinicalNotes}</p>}
                    {v.assessment && <p className="text-sm mt-1"><span className="font-semibold">Assessment:</span> {v.assessment}</p>}
                  </div>
                ))}
                {visits.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No visits yet. Doctors can add visits.</p>}
              </div>
            </Card>
          )}

          {activeTab === 'prescriptions' && (
            <Card className="p-6">
              <h3 className="font-bold mb-4">Prescriptions</h3>
              <div className="space-y-4">
                {prescriptions.map(p => (
                  <div key={p.id} className="border dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 hover:shadow-md transition">
                    <div className="flex justify-between"><p className="font-semibold text-sm text-slate-900 dark:text-white">{new Date(p.date).toLocaleDateString()} — {p.doctor?.name} ({p.doctor?.designation})</p><Badge variant="default">{p.sourceType}</Badge></div>
                    <div className="mt-3 space-y-2">
                      {p.medications.map(m => <div key={m.id} className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-3 flex justify-between"><div><p className="text-sm font-medium text-slate-900 dark:text-white">{m.medication}</p><p className="text-xs text-slate-600 dark:text-slate-400">{m.dosage} • {m.frequency} • {m.duration}</p></div><p className="text-xs text-slate-500 dark:text-slate-400">{m.instructions}</p></div>)}
                    </div>
                  </div>
                ))}
                {prescriptions.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No prescriptions yet.</p>}
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
