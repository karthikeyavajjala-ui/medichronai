import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Brain, Clock, FileText, Shield, Stethoscope, Users, Zap, CheckCircle, ArrowRight, Play } from 'lucide-react';
import { Navbar } from '../components/Layout';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
      <Navbar />
      
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-teal-950/30 dark:via-cyan-950/20 dark:to-slate-900" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-teal-200 rounded-full blur-3xl opacity-30 dark:opacity-20" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-200 rounded-full blur-3xl opacity-20 dark:opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-full px-4 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 shadow-sm mb-6">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                MediChron AI — Medical Intelligence Platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
                MediChron AI
                <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent"> Intelligence</span>
                <br />with Patient Timeline
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-xl">
                Transform medical documents into structured intelligence. Automatic OCR, extraction, timeline building, and AI assistant—built for doctors and patients.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link to="/signup" className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-lg">
                  Start as Doctor <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                  <Play className="w-4 h-4" /> Patient Login
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /><span className="text-slate-600 dark:text-slate-400">No fake data</span></div>
                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /><span className="text-slate-600 dark:text-slate-400">Real OCR & AI</span></div>
                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /><span className="text-slate-600 dark:text-slate-400">HIPAA-aware</span></div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative lg:ml-8">
              <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 p-2">
                <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-[16px] border border-slate-100 dark:border-slate-700 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center"><FileText className="w-5 h-5 text-white" /></div>
                      <div><p className="text-sm font-bold dark:text-white">Blood_Report_March.pdf</p><p className="text-xs text-slate-500 dark:text-slate-400">Detected: Blood Test • 96% confidence</p></div>
                    </div>
                    <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded-full font-semibold">Completed</span>
                  </div>
                  <div className="space-y-3 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-4">
                    <div className="flex justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Hemoglobin</span><span className="font-mono font-bold dark:text-white">12.4 g/dL <span className="text-emerald-600">↑</span></span></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5"><div className="bg-teal-600 h-1.5 rounded-full w-[85%]" /></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Source</span><span className="text-teal-700 dark:text-teal-300 font-medium">Page 2 • View Source</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-3 text-center"><p className="text-[11px] text-slate-500 dark:text-slate-400">Timeline</p><p className="text-sm font-bold dark:text-white">12 Events</p></div>
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-3 text-center"><p className="text-[11px] text-slate-500 dark:text-slate-400">Lab Results</p><p className="text-sm font-bold dark:text-white">24 Tests</p></div>
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-3 text-center"><p className="text-[11px] text-slate-500 dark:text-slate-400">Confidence</p><p className="text-sm font-bold dark:text-white">94%</p></div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl p-4 shadow-xl hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-slate-900/10 flex items-center justify-center"><Brain className="w-5 h-5" /></div>
                  <div><p className="text-sm font-bold">AI Assistant</p><p className="text-xs text-slate-400 dark:text-slate-500">“Hemoglobin improved from 11.2 → 12.4”</p></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-y dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4 dark:text-white">Complete Medical Intelligence Workflow</h2>
            <p className="text-slate-600 dark:text-slate-400">From document upload to timeline, AI assistant, and exports—everything connected with source traceability.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: 'Smart Document Upload', desc: 'PDF, JPG, PNG, WEBP with real OCR and text extraction. Preserves original with page numbers.' },
              { icon: Brain, title: 'Medical AI Extraction', desc: 'Extracts labs, vitals, diagnoses, meds, procedures with confidence scores and source references.' },
              { icon: Clock, title: 'Patient Timeline Graph', desc: 'Chronological events sorted by medical date, visual graph with trends, auto-updates with relationships.' },
              { icon: Shield, title: 'Access Control', desc: 'Doctor requests, patient approves full/limited/temporary access. Server-side enforced with audit logs.' },
              { icon: Activity, title: 'Lab & Report Comparison', desc: 'Compare two reports side-by-side with increased/decreased/unchanged indicators and sources.' },
              { icon: Zap, title: 'AI Assistant + Export', desc: 'Report/Timeline/Health Record modes with beautiful formatting, visual graphs, View Source, Excel & PDF export.' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6 hover:shadow-lg dark:hover:shadow-slate-900 transition">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 flex items-center justify-center mb-4"><f.icon className="w-5 h-5 text-teal-700 dark:text-teal-400" /></div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-[24px] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6"><Stethoscope className="w-6 h-6" /></div>
                <h3 className="text-2xl font-bold mb-3">For Doctors</h3>
                <p className="text-slate-300 mb-6">Create patients with auto Patient ID, upload & analyze documents, view visual timeline graph, add visits/prescriptions, compare reports, AI assistant, request access to other doctors' patients.</p>
                <ul className="space-y-2 text-sm text-slate-300 mb-8">
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-teal-400" /> Doctor ID: YY + Specialty + Sequential (e.g., 26GP001)</li>
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-teal-400" /> Patient ID: DoctorID + P + Seq (e.g., 26GP001P001)</li>
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-teal-400" /> 28 designations, real processing pipeline, dark/light mode</li>
                </ul>
                <Link to="/signup" className="inline-flex bg-white text-slate-900 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-100">Create Doctor Account</Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[24px] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-6"><Users className="w-6 h-6" /></div>
                <h3 className="text-2xl font-bold mb-3">For Patients</h3>
                <p className="text-violet-100 mb-6">Activate account, view your records, visual timeline graph, lab results with trends, prescriptions, ask advanced AI assistant in simple language, control doctor access.</p>
                <ul className="space-y-2 text-sm text-violet-100 mb-8">
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-violet-200" /> Patient ID alone never grants access—secure auth</li>
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-violet-200" /> Approve/reject access, full/limited/temporary, dark/light</li>
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-violet-200" /> Image fullscreen view, visual graphs, revoke anytime</li>
                </ul>
                <Link to="/login" className="inline-flex bg-white text-violet-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-violet-50">Patient Login</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t dark:border-slate-800 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>© 2026 MediChron AI — Health Timeline Platform with Visual Graphs • Production-ready • Real OCR, extraction, timeline graph, advanced AI assistant with beautiful formatting</p>
      </footer>
    </div>
  );
}
