import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, FileText, Clock, Activity, Filter, Upload, Eye, BarChart3, Image as ImageIcon } from 'lucide-react';
import { PageLayout } from '../components/Layout';
import { Card, Input, Button, Badge, Skeleton, Select } from '../components/UI';
import { patientAPI } from '../services/api';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await patientAPI.getPatients({ search, page, limit: 20 });
      setPatients(res.data.patients);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetch(); }, 400); return () => clearTimeout(t); }, [search]);

  return (
    <PageLayout sidebar="doctor">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div><h1 className="text-3xl font-bold tracking-tight dark:text-white">Patients</h1><p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Manage your patients and authorized access — upload with improved dashboard</p></div>
        <Link to="/doctor/add-patient"><Button variant="teal" className="shadow-md"><Plus className="w-4 h-4" /> Add Patient</Button></Link>
      </div>

      <Card className="p-5 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, Patient ID, email, phone..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-slate-500" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-[11px] bg-slate-100 dark:bg-slate-800 dark:border dark:border-slate-700 px-2.5 py-1 rounded-full border">💡 Improved upload: go to patient profile for drag-drop dashboard</span>
          <span className="text-[11px] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-2.5 py-1 rounded-full">📊 Timeline Graph Visual</span>
        </div>
      </Card>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-44" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {patients.map(p => (
            <Link key={p.id} to={`/doctor/patient/${p.patientId}`}>
              <Card hover className="p-6 h-full group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition">{p.name[0]}</div>
                    <div><p className="text-sm font-bold leading-tight dark:text-white">{p.name}</p><p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-2 py-0.5 rounded-full mt-1.5 inline-block">{p.patientId}</p></div>
                  </div>
                  {p.isPrimary ? <Badge variant="teal">Primary</Badge> : <Badge variant="info">Shared</Badge>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-4 border-y dark:border-slate-700 my-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2"><p className="text-lg font-bold dark:text-white">{p.totalDocuments}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">Docs</p></div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2"><p className="text-lg font-bold dark:text-white">{p.totalEvents}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">Events</p></div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2"><p className="text-lg font-bold dark:text-white">{p.totalVisits}</p><p className="text-[11px] text-slate-500 dark:text-slate-400">Visits</p></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{p.age}y • {p.gender} • {p.bloodGroup || 'N/A'}</span>
                  <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${p.isActivated ? 'bg-emerald-500' : 'bg-amber-500'}`} />{p.isActivated ? 'Active' : 'Pending'}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && patients.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5"><Search className="w-10 h-10 text-slate-400" /></div>
          <h3 className="font-bold text-lg dark:text-white">No patients found</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6">{search ? `No results for "${search}"` : 'Add your first patient to get started with document analysis.'}</p>
          <Link to="/doctor/add-patient"><Button variant="teal">Add Patient</Button></Link>
        </Card>
      )}
    </PageLayout>
  );
}

export const AddPatient = () => {
  const [form, setForm] = useState({ name: '', dob: '', gender: 'Male', phone: '', email: '', address: '', emergencyContact: '', bloodGroup: '', medicalInfo: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await patientAPI.addPatient(form);
      setResult(res.data.patient);
      setForm({ name: '', dob: '', gender: 'Male', phone: '', email: '', address: '', emergencyContact: '', bloodGroup: '', medicalInfo: '' });
    } catch (err) { setError(err.response?.data?.error || 'Failed to create patient'); }
    finally { setLoading(false); }
  };

  return (
    <PageLayout sidebar="doctor">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight dark:text-white mb-2">Add Patient</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Patient ID auto-generated: DOCTOR_ID + P + Seq (e.g., 26GP001P001). Patient ID is identifier only, not auth credential. Improved form with better spacing.</p>

        {result && (
          <Card className="p-6 mb-6 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shrink-0">✓</div>
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-100">Patient created: {result.patientId}</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">{result.name} • {result.email} • Activation pending. Patient can activate via email.</p>
                <Link to={`/doctor/patient/${result.patientId}`} className="inline-flex mt-3 text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:underline bg-white dark:bg-emerald-800 px-3 py-1 rounded-full border dark:border-emerald-700">View Profile →</Link>
              </div>
            </div>
          </Card>
        )}

        {error && <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200">{error}</Card>}

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2"><Input label="Patient Name *" placeholder="John Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <Input label="Date of Birth *" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} required />
              <div className="space-y-1.5"><label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Gender *</label><select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white"><option>Male</option><option>Female</option><option>Other</option></select></div>
              <Input label="Phone *" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
              <Input label="Email *" type="email" placeholder="patient@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              <div className="space-y-1.5"><label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Blood Group</label><select value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white"><option value="">Select</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}</select></div>
              <div className="sm:col-span-2"><Input label="Address" placeholder="Full address with city" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <Input label="Emergency Contact" placeholder="Name & phone" value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} />
              <div className="sm:col-span-2"><label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Optional Medical Info</label><textarea value={form.medicalInfo} onChange={e => setForm({ ...form, medicalInfo: e.target.value })} placeholder="Known allergies, chronic conditions, etc." className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white min-h-[90px]" /></div>
            </div>
            <Button type="submit" loading={loading} variant="teal" size="lg" className="w-full sm:w-auto shadow-md">Generate Patient ID & Create</Button>
          </form>
        </Card>
      </div>
    </PageLayout>
  );
};

export const PatientSearch = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await patientAPI.searchPatient(query.trim());
      setResult(res.data.patient);
    } catch (err) {
      if (err.response?.data?.code === 'ACCESS_REQUIRED') setError(err.response.data);
      else setError({ message: err.response?.data?.error || 'Patient not found' });
    } finally { setLoading(false); }
  };

  const requestAccess = async () => {
    setRequestLoading(true);
    try {
      const { accessAPI } = await import('../services/api');
      await accessAPI.requestAccess({ patientId: result.id || result.patientId, requestedAccessType: 'FULL', message: 'Requesting access to provide consultation' });
      alert('Access request sent to patient');
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setRequestLoading(false); }
  };

  return (
    <PageLayout sidebar="doctor">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Patient Search</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6">Search by Patient ID (e.g., 26GP001P001). Access control enforced server-side. Patient ID alone never grants access.</p>

        <Card className="p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="Enter Patient ID..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
            </div>
            <Button onClick={search} loading={loading} variant="teal">Search</Button>
          </div>
        </Card>

        {error && (
          <Card className="p-8 mt-6">
            {error.code === 'ACCESS_REQUIRED' ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-5"><Search className="w-8 h-8 text-amber-600 dark:text-amber-400" /></div>
                <h3 className="font-bold text-xl dark:text-white">Access Required</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">Patient: {error.patientName} ({error.patientId})</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Primary Doctor: {error.primaryDoctor?.name} ({error.primaryDoctor?.doctorId})</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 max-w-md mx-auto bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-3">{error.message}</p>
                <div className="flex gap-3 justify-center mt-6">
                  <Button variant="teal" onClick={requestAccess} loading={requestLoading}>Request Access</Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8"><p className="text-sm text-red-600 dark:text-red-400">{error.message}</p></div>
            )}
          </Card>
        )}

        {result && (
          <Card className="p-6 mt-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 flex items-center justify-center font-bold text-xl shadow-md">{result.name[0]}</div>
                <div>
                  <h3 className="font-bold dark:text-white">{result.name} <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 px-2 py-0.5 rounded-full ml-2">{result.patientId}</span></h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{result.age}y • {result.gender} • {result.bloodGroup || 'N/A'} • {result.email}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Primary: {result.primaryDoctor?.name} ({result.primaryDoctor?.doctorId})</p>
                </div>
              </div>
              <Badge variant={result.isPrimary ? 'teal' : 'info'}>{result.isPrimary ? 'Primary' : result.access}</Badge>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-6 text-center">
              <div className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-3"><p className="text-xl font-bold dark:text-white">{result.totalDocuments}</p><p className="text-[11px] text-slate-500">Docs</p></div>
              <div className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-3"><p className="text-xl font-bold dark:text-white">{result.totalEvents}</p><p className="text-[11px] text-slate-500">Events</p></div>
              <div className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-3"><p className="text-xl font-bold dark:text-white">{result.totalVisits}</p><p className="text-[11px] text-slate-500">Visits</p></div>
              <div className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-3"><p className="text-xl font-bold dark:text-white">{result.totalPrescriptions || 0}</p><p className="text-[11px] text-slate-500">Rx</p></div>
            </div>
            <Link to={`/doctor/patient/${result.patientId}`} className="block mt-6"><Button className="w-full shadow-md" variant="teal">Open Patient Profile — With Timeline Graph</Button></Link>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};
