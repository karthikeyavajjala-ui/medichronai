import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Landing from './pages/Landing';
import { DoctorSignup, Login, PatientActivate, ForgotPassword, ResetPassword } from './pages/Auth';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatients, { AddPatient, PatientSearch } from './pages/DoctorPatients';
import PatientProfile from './pages/PatientProfile';
import { DocumentViewer, TimelinePage, AIAssistantPage, CompareReports, AccessRequestsPage, VisitsPage, PatientDashboard, ProfilePage } from './pages/OtherPages';

const Protected = ({ children, roles }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to={role === 'DOCTOR' ? '/doctor' : '/patient'} replace />;
  return children;
};

const PublicOnly = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">Loading...</div>;
  if (user) return <Navigate to={role === 'DOCTOR' ? '/doctor' : '/patient'} replace />;
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<PublicOnly><DoctorSignup /></PublicOnly>} />
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/activate" element={<PublicOnly><PatientActivate /></PublicOnly>} />
            <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
            <Route path="/reset-password" element={<PublicOnly><ResetPassword /></PublicOnly>} />

            {/* Doctor */}
            <Route path="/doctor" element={<Protected roles={['DOCTOR']}><DoctorDashboard /></Protected>} />
            <Route path="/doctor/patients" element={<Protected roles={['DOCTOR']}><DoctorPatients /></Protected>} />
            <Route path="/doctor/add-patient" element={<Protected roles={['DOCTOR']}><AddPatient /></Protected>} />
            <Route path="/doctor/search" element={<Protected roles={['DOCTOR']}><PatientSearch /></Protected>} />
            <Route path="/doctor/access-requests" element={<Protected roles={['DOCTOR']}><AccessRequestsPage /></Protected>} />
            <Route path="/doctor/patient/:patientId" element={<Protected roles={['DOCTOR']}><PatientProfile isDoctorView /></Protected>} />
            <Route path="/doctor/patient/:patientId/timeline" element={<Protected roles={['DOCTOR']}><TimelinePage /></Protected>} />
            <Route path="/doctor/patient/:patientId/compare" element={<Protected roles={['DOCTOR']}><CompareReports /></Protected>} />
            <Route path="/doctor/patient/:patientId/assistant" element={<Protected roles={['DOCTOR']}><AIAssistantPage /></Protected>} />
            <Route path="/doctor/patient/:patientId/visits" element={<Protected roles={['DOCTOR']}><VisitsPage /></Protected>} />
            <Route path="/doctor/document/:documentId" element={<Protected roles={['DOCTOR']}><DocumentViewer /></Protected>} />
            <Route path="/doctor/timeline/:patientId" element={<Protected roles={['DOCTOR']}><TimelinePage /></Protected>} />
            <Route path="/doctor/compare/:patientId" element={<Protected roles={['DOCTOR']}><CompareReports /></Protected>} />
            <Route path="/doctor/assistant/:patientId" element={<Protected roles={['DOCTOR']}><AIAssistantPage /></Protected>} />
            <Route path="/doctor/profile" element={<Protected roles={['DOCTOR']}><ProfilePage /></Protected>} />

            {/* Patient */}
            <Route path="/patient" element={<Protected roles={['PATIENT']}><PatientDashboard /></Protected>} />
            <Route path="/patient/records" element={<Protected roles={['PATIENT']}><PatientProfile isDoctorView={false} /></Protected>} />
            <Route path="/patient/timeline" element={<Protected roles={['PATIENT']}><TimelinePage /></Protected>} />
            <Route path="/patient/labs" element={<Protected roles={['PATIENT']}><PatientProfile isDoctorView={false} /></Protected>} />
            <Route path="/patient/prescriptions" element={<Protected roles={['PATIENT']}><VisitsPage /></Protected>} />
            <Route path="/patient/visits" element={<Protected roles={['PATIENT']}><VisitsPage /></Protected>} />
            <Route path="/patient/access" element={<Protected roles={['PATIENT']}><AccessRequestsPage /></Protected>} />
            <Route path="/patient/assistant" element={<Protected roles={['PATIENT']}><AIAssistantPage /></Protected>} />
            <Route path="/patient/compare" element={<Protected roles={['PATIENT']}><CompareReports /></Protected>} />
            <Route path="/patient/document/:documentId" element={<Protected roles={['PATIENT']}><DocumentViewer /></Protected>} />
            <Route path="/patient/profile" element={<Protected roles={['PATIENT']}><ProfilePage /></Protected>} />

            {/* Generic */}
            <Route path="/timeline/:patientId" element={<Protected roles={['DOCTOR','PATIENT']}><TimelinePage /></Protected>} />
            <Route path="/assistant/:patientId" element={<Protected roles={['DOCTOR','PATIENT']}><AIAssistantPage /></Protected>} />
            <Route path="/compare/:patientId" element={<Protected roles={['DOCTOR','PATIENT']}><CompareReports /></Protected>} />
            <Route path="/document/:documentId" element={<Protected roles={['DOCTOR','PATIENT']}><DocumentViewer /></Protected>} />

            <Route path="*" element={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="text-center"><h1 className="text-2xl font-bold dark:text-white">404 - Not Found</h1><p className="text-sm text-slate-600 dark:text-slate-400 mt-2">The page you are looking for does not exist.</p><a href="/" className="inline-flex mt-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 py-2 rounded-xl text-sm">Go Home</a></div></div>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
