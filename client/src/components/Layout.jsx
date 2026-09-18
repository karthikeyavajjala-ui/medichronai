import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, Users, UserPlus, Search, FileText, Clock, 
  LogOut, Menu, X, Shield, Activity, Brain, Stethoscope, 
  ClipboardList, User, Sun, Moon, ArrowLeft, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full p-1 transition-all duration-300 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-inner"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center transition-all duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`}>
        {isDark ? <Moon className="w-3.5 h-3.5 text-violet-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
      </div>
      <div className="flex justify-between items-center w-full h-full px-1">
        <Sun className={`w-3 h-3 ${!isDark ? 'text-amber-600' : 'text-slate-400'}`} />
        <Moon className={`w-3 h-3 ${isDark ? 'text-violet-300' : 'text-slate-400'}`} />
      </div>
    </button>
  );
};

export const BackButton = ({ className = "", label = "Back", fallback = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (fallback) {
      navigate(fallback);
    } else {
      // Determine fallback based on current path
      if (location.pathname.startsWith('/doctor')) navigate('/doctor');
      else if (location.pathname.startsWith('/patient')) navigate('/patient');
      else navigate('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition shadow-sm ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
};

export const Navbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const handleLogout = () => { logout(); navigate('/'); };

  const showBackButton = location.pathname !== '/doctor' && location.pathname !== '/patient' && location.pathname !== '/' && user;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition lg:hidden">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <Link to={role === 'DOCTOR' ? '/doctor' : role === 'PATIENT' ? '/patient' : '/'} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-[15px] font-bold text-slate-900 dark:text-white leading-none tracking-tight">MediChron AI</h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Health Timeline Platform</p>
              </div>
            </Link>
            {showBackButton && (
              <div className="hidden lg:block ml-4">
                <BackButton label="Back" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-3 pl-3 pr-1 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-none">{user.name || user.doctorId || user.patientId}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{role} • {user.doctorId || user.patientId}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-white text-[12px] font-bold">
                    {(user.name || 'U')[0]}
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 sm:px-4 py-2">Sign In</Link>
                <Link to="/signup" className="text-sm font-semibold bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 sm:px-5 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export const DoctorSidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  const links = [
    { to: '/doctor', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/doctor/patients', icon: Users, label: 'Patients' },
    { to: '/doctor/add-patient', icon: UserPlus, label: 'Add Patient' },
    { to: '/doctor/search', icon: Search, label: 'Patient Search' },
    { to: '/doctor/access-requests', icon: Shield, label: 'Access Requests' },
    { to: '/doctor/profile', icon: User, label: 'Profile' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-teal-700 dark:text-teal-300 font-mono bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md mt-1">{user?.doctorId} • {user?.specialtyCode}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(link => {
          const active = link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to);
          return (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen?.(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <link.icon className="w-[18px] h-[18px]" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Theme</span>
          <ThemeToggle />
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-100 dark:border-teal-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-bold text-teal-800 dark:text-teal-200">AI Intelligence</span>
          </div>
          <p className="text-[11px] text-teal-700 dark:text-teal-300 leading-relaxed">Document analysis, timeline building, and health insights powered by AI.</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-[280px] shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col sticky top-16 h-[calc(100vh-4rem)]">
        <SidebarContent />
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="fixed left-0 top-0 bottom-0 w-[300px] bg-white dark:bg-slate-900 z-50 lg:hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
                <span className="font-bold dark:text-white">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X className="w-5 h-5 dark:text-white" /></button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const PatientSidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  const links = [
    { to: '/patient', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/patient/records', icon: FileText, label: 'My Documents' },
    { to: '/patient/timeline', icon: Clock, label: 'Timeline' },
    { to: '/patient/labs', icon: Activity, label: 'Lab Results' },
    { to: '/patient/prescriptions', icon: ClipboardList, label: 'Prescriptions' },
    { to: '/patient/access', icon: Shield, label: 'Doctor Access' },
    { to: '/patient/assistant', icon: Brain, label: 'AI Assistant' },
    { to: '/patient/profile', icon: User, label: 'Profile' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            {user?.name?.[0] || 'P'}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-violet-700 dark:text-violet-300 font-mono bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-md mt-1">{user?.patientId}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(link => {
          const active = link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to);
          return (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen?.(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-violet-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <link.icon className="w-[18px] h-[18px]" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-[280px] shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col sticky top-16 h-[calc(100vh-4rem)]">
        <SidebarContent />
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="fixed left-0 top-0 bottom-0 w-[300px] bg-white dark:bg-slate-900 z-50 lg:hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
                <span className="font-bold dark:text-white">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X className="w-5 h-5 dark:text-white" /></button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const PageLayout = ({ children, sidebar, showBackButton = true }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/doctor' || location.pathname === '/patient';

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors">
      <Navbar />
      <div className="flex">
        {sidebar === 'doctor' && <DoctorSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />}
        {sidebar === 'patient' && <PatientSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />}
        <main className="flex-1 min-w-0">
          <div className="lg:hidden p-4 flex items-center gap-3 border-b bg-white dark:bg-slate-900 dark:border-slate-800 sticky top-16 z-30">
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"><Menu className="w-5 h-5 dark:text-white" /></button>
            <span className="text-sm font-semibold dark:text-white">Menu</span>
            {showBackButton && !isDashboard && (
              <div className="ml-auto">
                <BackButton label="Back" />
              </div>
            )}
          </div>
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {showBackButton && !isDashboard && (
              <div className="hidden lg:flex items-center gap-3 mb-6">
                <BackButton />
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-sm text-slate-500 dark:text-slate-400">Go back to previous page</span>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
