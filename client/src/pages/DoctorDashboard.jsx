import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Clock, CheckCircle, Shield, Plus, Activity, Brain, TrendingUp, Upload, Eye, BarChart3 } from 'lucide-react';
import { PageLayout } from '../components/Layout';
import { Card, Badge, Button, Skeleton } from '../components/UI';
import { patientAPI, aiAPI } from '../services/api';

export default function DoctorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    patientAPI.getDoctorDashboard().then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const createDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await aiAPI.createDemo();
      alert(`Demo created: ${res.data.patients.map(p => p.patientId).join(', ')} — Synthetic data for testing workflow`);
      const dash = await patientAPI.getDoctorDashboard();
      setData(dash.data);
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setDemoLoading(false); }
  };

  if (loading) return (
    <PageLayout sidebar="doctor" showBackButton={false}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    </PageLayout>
  );

  const stats = data?.stats || {};

  return (
    <PageLayout sidebar="doctor" showBackButton={false}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Doctor Dashboard</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Medical document intelligence and patient timeline overview — Dark/Light mode supported</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={createDemo} loading={demoLoading} className="shadow-sm">Create Demo Data</Button>
          <Link to="/doctor/add-patient"><Button variant="teal" className="shadow-md"><Plus className="w-4 h-4" /> Add Patient</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 flex items-center justify-center shadow-md group-hover:scale-110 transition"><Users className="w-6 h-6 text-white dark:text-slate-900" /></div>
            <Badge variant="default" className="font-bold">{stats.accessiblePatients || 0} shared</Badge>
          </div>
          <p className="text-3xl font-bold dark:text-white">{stats.totalPatients || 0}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">Total Patients</p>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5"><div className="bg-slate-900 dark:bg-white h-1.5 rounded-full" style={{ width: `${Math.min(100, (stats.totalPatients||0)*10)}%` }} /></div>
        </Card>
        <Card className="p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-md group-hover:scale-110 transition"><FileText className="w-6 h-6 text-white" /></div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold dark:text-white">{stats.totalDocuments || 0}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">Documents</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-800 w-fit"><Clock className="w-3 h-3" />{stats.processingDocuments || 0} processing</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-md group-hover:scale-110 transition"><CheckCircle className="w-6 h-6 text-white" /></div>
            <Badge variant="success" className="font-bold">AI</Badge>
          </div>
          <p className="text-3xl font-bold dark:text-white">{stats.completedAnalyses || 0}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">Completed Analyses</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-3">✓ Real OCR + extraction pipeline</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md group-hover:scale-110 transition"><Shield className="w-6 h-6 text-white" /></div>
            {(stats.pendingAccessRequests || 0) > 0 && <Badge variant="warning" className="animate-pulse">{stats.pendingAccessRequests} pending</Badge>}
          </div>
          <p className="text-3xl font-bold dark:text-white">{stats.pendingAccessRequests || 0}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">Access Requests</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Improved upload dashboard section - not congested */}
          <Card className="p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 transition">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shrink-0"><Upload className="w-7 h-7 text-white" /></div>
                <div>
                  <h3 className="font-bold text-base dark:text-white">Upload Medical Documents — Improved Dashboard</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Perfectly placed upload area with no congestion. Drag & drop PDFs, images. Real AI processing: OCR → Classification → Extraction → Timeline Graph.</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[11px] bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 px-2.5 py-1 rounded-full">PDF, JPG, PNG, WEBP</span>
                    <span className="text-[11px] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-2.5 py-1 rounded-full">Up to 20MB • 10 files</span>
                    <span className="text-[11px] bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 px-2.5 py-1 rounded-full">✨ Visual Timeline Graph</span>
                  </div>
                </div>
              </div>
              <Link to="/doctor/patients" className="shrink-0"><Button variant="teal" className="shadow-md"><Eye className="w-4 h-4" /> Go to Patients to Upload</Button></Link>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-base flex items-center gap-2 dark:text-white"><Users className="w-5 h-5" /> Recent Patients — With Visual Indicators</h3>
              <Link to="/doctor/patients" className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline bg-teal-50 dark:bg-teal-900/30 px-3 py-1 rounded-full border border-teal-100 dark:border-teal-800">View all →</Link>
            </div>
            <div className="grid gap-3">
              {data?.recentPatients?.length ? data.recentPatients.map(p => (
                <Link key={p.id} to={`/doctor/patient/${p.patientId}`} className="flex items-center justify-between p-4 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md transition group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 group-hover:scale-110 transition shadow-sm">{p.name[0]}</div>
                    <div>
                      <p className="text-sm font-bold dark:text-white flex items-center gap-2">{p.name} <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">{p.patientId}</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">{p.age}y • {p.gender} • {p.totalDocuments} docs • {p.isActivated ? '✓ Active' : '⏳ Pending'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-2.5 py-1 rounded-full"><BarChart3 className="w-3 h-3" />{p.totalDocuments} docs</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                </Link>
              )) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-slate-400" /></div>
                  <p className="font-bold dark:text-white">No patients yet</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add your first patient to start document intelligence workflow</p>
                  <Link to="/doctor/add-patient"><Button variant="teal" size="sm" className="mt-4">Add Patient</Button></Link>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-5 flex items-center gap-2 dark:text-white"><Activity className="w-5 h-5" /> Recent Medical Events — With Source Traceability</h3>
            <div className="space-y-3">
              {data?.recentEvents?.length ? data.recentEvents.map(evt => (
                <div key={evt.id} className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border dark:border-slate-700 hover:shadow-md transition group">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border dark:border-slate-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition"><Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold dark:text-white">{evt.eventType} • {evt.description.substring(0,80)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">{evt.patient?.name} ({evt.patient?.patientId}) • {new Date(evt.eventDate).toLocaleDateString()} • <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px] border dark:border-slate-600">{evt.verificationStatus}</span></p>
                  </div>
                </div>
              )) : <div className="text-center py-8"><Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">No events yet. Upload documents to generate visual timeline with graphs.</p></div>}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-100 dark:border-teal-800">
            <div className="flex items-center gap-2 mb-4"><Brain className="w-5 h-5 text-teal-700 dark:text-teal-400" /><h3 className="font-bold text-teal-900 dark:text-teal-100">AI Pipeline — Real Processing</h3></div>
            <div className="space-y-2.5 text-xs">
              {[
                "Upload → Secure Storage",
                "PDF/Text Extraction / OCR (pdfjs-dist)",
                "Classification + Confidence",
                "Medical Info Extraction",
                "Normalization & Events",
                "Relationship Detection",
                "Timeline Graph + Source Traceability"
              ].map((step, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-teal-100/50 dark:border-teal-800/50"><span className="text-teal-800 dark:text-teal-200 font-medium">{i+1}. {step}</span><span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span></div>
              ))}
            </div>
            <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-4 leading-relaxed bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-teal-100/50 dark:border-teal-800/50">Every extracted fact preserves original value, source document, page, confidence, and verification status. Conflicts preserved, not overwritten. Visual graphs for timeline.</p>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-4 dark:text-white">Quick Actions — Improved Layout</h3>
            <div className="grid gap-3">
              <Link to="/doctor/add-patient" className="flex items-center gap-4 p-4 rounded-xl border dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 hover:shadow-md transition group"><div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition"><Plus className="w-5 h-5 text-white dark:text-slate-900" /></div><div><p className="text-sm font-bold dark:text-white">Add New Patient</p><p className="text-xs text-slate-500 dark:text-slate-400">Auto Patient ID: DOCTOR_ID + P + Seq</p></div></Link>
              <Link to="/doctor/search" className="flex items-center gap-4 p-4 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md transition group"><div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition"><Users className="w-5 h-5 text-white" /></div><div><p className="text-sm font-bold dark:text-white">Search Patient ID</p><p className="text-xs text-slate-500 dark:text-slate-400">Secure access control enforced</p></div></Link>
              <Link to="/doctor/access-requests" className="flex items-center gap-4 p-4 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md transition group"><div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition"><Shield className="w-5 h-5 text-white" /></div><div><p className="text-sm font-bold dark:text-white">Access Requests</p><p className="text-xs text-slate-500 dark:text-slate-400">Manage shared patients</p></div></Link>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
