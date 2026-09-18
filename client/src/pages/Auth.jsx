import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Eye, EyeOff, Stethoscope, User, Mail, Phone, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Input, Select, Button, Alert } from '../components/UI';

export const DoctorSignup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', designation: '', phone: '' });
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    authAPI.getDesignations().then(res => setDesignations(res.data.designations)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.doctorSignup(form);
      login(res.data.token, { ...res.data.doctor, role: 'DOCTOR' });
      navigate('/doctor');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px]">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center"><Activity className="w-5 h-5 text-white" /></div>
            <span className="font-bold tracking-tight">MediChron AI</span>
          </Link>
          <div className="bg-white rounded-[24px] border shadow-sm p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Create Doctor Account</h1>
              <p className="text-sm text-slate-600 mt-2">Doctor ID auto-generated: YY + Specialty + Seq (e.g., 26GP001)</p>
            </div>
            {error && <Alert type="error" title="Signup failed" className="mb-6">{error}</Alert>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" placeholder="Dr. John Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <Input label="Email" type="email" placeholder="doctor@hospital.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              <Select label="Designation / Specialty" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} required>
                <option value="">Select designation</option>
                {designations.map(d => <option key={d.code} value={d.name}>{d.name} — {d.code}</option>)}
              </Select>
              <Input label="Phone (Optional)" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 pr-10" placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <Button type="submit" loading={loading} className="w-full" size="lg">Create Account <ArrowRight className="w-4 h-4" /></Button>
            </form>
            <p className="text-sm text-center text-slate-600 mt-6">Already have account? <Link to="/login" className="font-semibold text-slate-900 hover:underline">Sign in</Link></p>
          </div>
        </motion.div>
      </div>
      <div className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/20 to-cyan-600/20" />
        <div className="relative text-white max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6"><Stethoscope className="w-7 h-7" /></div>
          <h2 className="text-3xl font-bold leading-tight mb-4">Doctor ID auto-generated with specialty code</h2>
          <p className="text-slate-300 leading-relaxed mb-6">Example: General Physician in 2026 → 26GP001, Cardiologist → 26CARD001. Sequential, unique, never duplicated.</p>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
            <p className="text-sm font-mono">26GP001, 26CARD001, 26NEUR001, 26ORTH001</p>
            <p className="text-xs text-slate-400 mt-2">YY + SPECIALTY_CODE + Sequential</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Login = () => {
  const [role, setRole] = useState('DOCTOR');
  const [form, setForm] = useState({ email: '', password: '', doctorId: '', patientId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (role === 'DOCTOR') {
        res = await authAPI.doctorSignin({ email: form.email, doctorId: form.doctorId, password: form.password });
        login(res.data.token, { ...res.data.doctor, role: 'DOCTOR' });
        navigate('/doctor');
      } else {
        res = await authAPI.patientSignin({ email: form.email, patientId: form.patientId, password: form.password });
        login(res.data.token, { ...res.data.patient, role: 'PATIENT' });
        navigate('/patient');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px]">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center"><Activity className="w-5 h-5 text-white" /></div>
            <span className="font-bold tracking-tight">MediChron AI</span>
          </Link>
          <div className="bg-white rounded-[24px] border shadow-sm p-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome back</h1>
            <p className="text-sm text-slate-600 mb-6">Sign in to your healthcare account</p>

            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
              <button onClick={() => setRole('DOCTOR')} className={`py-2.5 rounded-lg text-sm font-semibold transition ${role === 'DOCTOR' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'}`}>Doctor</button>
              <button onClick={() => setRole('PATIENT')} className={`py-2.5 rounded-lg text-sm font-semibold transition ${role === 'PATIENT' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'}`}>Patient</button>
            </div>

            {error && <Alert type="error" className="mb-6">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {role === 'DOCTOR' ? (
                <>
                  <Input label="Email or Doctor ID" placeholder="doctor@hospital.com or 26GP001" value={form.email || form.doctorId} onChange={e => setForm({ ...form, email: e.target.value, doctorId: e.target.value })} required />
                </>
              ) : (
                <>
                  <Input label="Email or Patient ID" placeholder="patient@email.com or 26GP001P001" value={form.email || form.patientId} onChange={e => setForm({ ...form, email: e.target.value, patientId: e.target.value })} required />
                </>
              )}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 pr-10" placeholder="Your password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <Link to="/activate" className="text-slate-600 hover:text-slate-900">Patient activation?</Link>
                <Link to="/forgot-password" className="font-semibold text-slate-900 hover:underline">Forgot password?</Link>
              </div>
              <Button type="submit" loading={loading} className="w-full" size="lg">Sign In <ArrowRight className="w-4 h-4" /></Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center text-sm text-slate-600">
              {role === 'DOCTOR' ? <>No account? <Link to="/signup" className="font-semibold text-slate-900">Create doctor account</Link></> : <>Need to activate? <Link to="/activate" className="font-semibold text-slate-900">Activate patient account</Link></>}
            </div>
          </div>
        </motion.div>
      </div>
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-teal-600 to-cyan-700 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="relative text-white max-w-md">
          <h2 className="text-3xl font-bold leading-tight mb-4">Secure, role-based medical intelligence</h2>
          <p className="text-teal-50 leading-relaxed mb-6">Doctor creates patient → Patient ID auto-generated → Patient activates account → Full timeline, documents, AI assistant with source traceability.</p>
          <div className="space-y-3">
            <div className="flex gap-3 bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10"><ShieldCheck className="w-5 h-5 text-teal-200 shrink-0" /><p className="text-sm text-teal-50">Patient ID is identifier only, never an auth credential. Server-side access control.</p></div>
            <div className="flex gap-3 bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10"><Activity className="w-5 h-5 text-teal-200 shrink-0" /><p className="text-sm text-teal-50">Every extracted fact has source: document + page + confidence.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PatientActivate = () => {
  const [form, setForm] = useState({ patientId: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await authAPI.patientActivate(form);
      login(res.data.token, { ...res.data.patient, role: 'PATIENT' });
      navigate('/patient');
    } catch (err) {
      setError(err.response?.data?.error || 'Activation failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px]">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center"><Activity className="w-5 h-5 text-white" /></div>
          <span className="font-bold tracking-tight">MediChron AI</span>
        </Link>
        <div className="bg-white rounded-[24px] border shadow-sm p-8">
          <h1 className="text-2xl font-bold tracking-tight">Activate Patient Account</h1>
          <p className="text-sm text-slate-600 mt-2 mb-6">Enter Patient ID and email provided by your doctor to set your password.</p>
          {error && <Alert type="error" className="mb-6">{error}</Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Patient ID" placeholder="e.g., 26GP001P001" value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} required />
            <Input label="Email" type="email" placeholder="Your email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <Input label="Set Password" type="password" placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <Input label="Confirm Password" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
            <Button type="submit" loading={loading} className="w-full" size="lg">Activate Account</Button>
          </form>
          <p className="text-sm text-center text-slate-600 mt-6">Already activated? <Link to="/login" className="font-semibold text-slate-900">Sign in</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('DOCTOR');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email, role });
      setResult(res.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] border shadow-sm p-8">
        <h1 className="text-2xl font-bold tracking-tight">Forgot Password</h1>
        <p className="text-sm text-slate-600 mt-2 mb-6">Enter your email to receive reset token.</p>
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        {result ? (
          <div className="space-y-4">
            <Alert type="success" title="Token generated">{result.message}</Alert>
            {result.token && (
              <div className="bg-slate-50 border rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-700 mb-2">Reset Token (demo - in production sent via email):</p>
                <p className="text-xs font-mono break-all bg-white border p-2 rounded-lg">{result.token}</p>
                <Link to={`/reset-password?token=${result.token}`} className="inline-flex mt-3 text-sm font-semibold text-teal-700 hover:underline">Reset now →</Link>
              </div>
            )}
            <Link to="/login" className="block text-center text-sm font-semibold text-slate-900">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Role" value={role} onChange={e => setRole(e.target.value)}><option value="DOCTOR">Doctor</option><option value="PATIENT">Patient</option></Select>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Button type="submit" loading={loading} className="w-full" size="lg">Send Reset Token</Button>
            <Link to="/login" className="block text-center text-sm text-slate-600">Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
};

export const ResetPassword = () => {
  const [form, setForm] = useState({ token: new URLSearchParams(window.location.search).get('token') || '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword(form);
      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) { setError(err.response?.data?.error || 'Reset failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] border shadow-sm p-8">
        <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
        <p className="text-sm text-slate-600 mt-2 mb-6">Enter token and new password.</p>
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        {success && <Alert type="success" className="mb-4">{success}</Alert>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Reset Token" value={form.token} onChange={e => setForm({ ...form, token: e.target.value })} required />
          <Input label="New Password" type="password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required />
          <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
          <Button type="submit" loading={loading} className="w-full" size="lg">Reset Password</Button>
        </form>
      </div>
    </div>
  );
};
