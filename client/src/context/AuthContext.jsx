import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setToken(storedToken);
        setRole(parsed.role || (parsed.doctorId ? 'DOCTOR' : 'PATIENT'));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
    setRole(userData.role || (userData.doctorId ? 'DOCTOR' : 'PATIENT'));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const fetchProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      const profile = res.data.profile;
      const updatedUser = { ...user, ...profile, role: res.data.role };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setRole(res.data.role);
      return updatedUser;
    } catch (e) {
      console.error(e);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, role, loading, login, logout, fetchProfile, isDoctor: role === 'DOCTOR', isPatient: role === 'PATIENT' }}>
      {children}
    </AuthContext.Provider>
  );
};
