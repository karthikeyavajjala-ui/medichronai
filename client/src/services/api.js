import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authAPI = {
  getDesignations: () => api.get('/auth/designations'),
  doctorSignup: (data) => api.post('/auth/doctor/signup', data),
  doctorSignin: (data) => api.post('/auth/doctor/signin', data),
  patientActivate: (data) => api.post('/auth/patient/activate', data),
  patientSignin: (data) => api.post('/auth/patient/signin', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile')
};

// Patients
export const patientAPI = {
  addPatient: (data) => api.post('/patients', data),
  getPatients: (params) => api.get('/patients', { params }),
  searchPatient: (patientId) => api.get(`/patients/search/${patientId}`),
  getProfile: (patientId) => api.get(`/patients/${patientId}`),
  updatePatient: (patientId, data) => api.put(`/patients/${patientId}`, data),
  getDoctorDashboard: () => api.get('/patients/doctor/dashboard'),
  getPatientDashboard: () => api.get('/patients/patient/dashboard')
};

// Documents
export const documentAPI = {
  upload: (formData) => api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getPatientDocs: (patientId, params) => api.get(`/documents/patient/${patientId}`, { params }),
  getDetails: (docId) => api.get(`/documents/${docId}`),
  getFile: (docId) =>
    `${import.meta.env.VITE_API_URL || '/api'}/documents/${encodeURIComponent(docId)}/file`,  retry: (docId) => api.post(`/documents/${docId}/retry`),
  updateCategory: (docId, category) => api.put(`/documents/${docId}/category`, { category }),
  getLabResults: (patientId) => api.get(`/documents/lab-results/${patientId}`),
  compare: (patientId, docId1, docId2) => api.get(`/documents/compare/${patientId}`, { params: { docId1, docId2 } })
};

// Timeline
export const timelineAPI = {
  getTimeline: (patientId, params) => api.get(`/timeline/${patientId}`, { params }),
  getStats: (patientId) => api.get(`/timeline/${patientId}/stats`)
};

// Visits
export const visitAPI = {
  addVisit: (data) => api.post('/visits', data),
  getVisits: (patientId) => api.get(`/visits/${patientId}`),
  addPrescription: (data) => api.post('/visits/prescription', data),
  getPrescriptions: (patientId) => api.get(`/visits/prescription/${patientId}`)
};

// Access
export const accessAPI = {
  requestAccess: (data) => api.post('/access/request', data),
  getDoctorRequests: () => api.get('/access/doctor/requests'),
  getPatientRequests: () => api.get('/access/patient/requests'),
  approve: (requestId, data) => api.post(`/access/approve/${requestId}`, data),
  reject: (requestId) => api.post(`/access/reject/${requestId}`),
  revoke: (accessId) => api.delete(`/access/revoke/${accessId}`),
  getActive: (patientId) => patientId ? api.get(`/access/active/${patientId}`) : api.get('/access/active'),
  getAudit: (patientId) => api.get(`/access/audit/${patientId}`)
};

// AI
export const aiAPI = {
  ask: (data) => api.post('/ai/ask', data),
  getConversations: (patientId) => api.get(`/ai/conversations/${patientId}`),
  getConversation: (convId) => api.get(`/ai/conversation/${convId}`),
  exportExcel: (patientId) => api.get(`/ai/export/excel/${patientId}`, { responseType: 'blob' }),
  exportPDF: (patientId) => api.get(`/ai/export/pdf/${patientId}`, { responseType: 'blob' }),
  createDemo: () => api.post('/ai/demo')
};
