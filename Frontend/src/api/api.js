import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// User APIs
export const userAPI = {
  getAll: () => api.get('/users'),
  getByRole: (role) => api.get(`/users/role/${role}`),
  getById: (id) => api.get(`/users/${id}`),
  delete: (id) => api.delete(`/users/${id}`),
  changeDoctor: (id, newDoctorId) => api.put(`/users/${id}/change-doctor`, { newDoctorId }),
};

// Diagnosis APIs
export const diagnosisAPI = {
  create: (data) => api.post('/diagnoses', data),
  getAll: () => api.get('/diagnoses'),
  getById: (id) => api.get(`/diagnoses/${id}`),
  getForPatient: (patientId) => api.get(`/diagnoses/patient/${patientId}`),
  getForDoctor: (doctorId) => api.get(`/diagnoses/doctor/${doctorId}`),
  getMyDiagnoses: () => api.get('/diagnoses/my/diagnoses'),
  getMyDoctorDiagnoses: () => api.get('/diagnoses/my/doctor-diagnoses'),
};

// Prescription APIs
export const prescriptionAPI = {
  create: (data) => api.post('/prescriptions', data),
  getAll: () => api.get('/prescriptions'),
  getPending: () => api.get('/prescriptions/pending'),
  getById: (id) => api.get(`/prescriptions/${id}`),
  getForPatient: (patientId) => api.get(`/prescriptions/patient/${patientId}`),
  getMyPrescriptions: () => api.get('/prescriptions/my'),
  getForDiagnosis: (diagnosisId) => api.get(`/prescriptions/diagnosis/${diagnosisId}`),
};

// Dispense APIs
export const dispenseAPI = {
  dispense: (prescriptionId, notes) =>
    api.post(`/dispenses/prescriptions/${prescriptionId}/dispense`, { notes }),
  checkDispensed: (prescriptionId) =>
    api.get(`/dispenses/prescriptions/${prescriptionId}/status`),
  getMyDispenses: () => api.get('/dispenses/my'),
};

// Analytics APIs
export const analyticsAPI = {
  getStats: () => api.get('/analytics'),
};

// Doctor APIs
export const doctorAPI = {
  saveProfile: (data) => api.post('/doctor/profile', data),
  getProfile: () => api.get('/doctor/profile'),
  getDashboard: () => api.get('/doctor/dashboard'),
  getRequests: () => api.get('/doctor/requests'),
  respondToRequest: (data) => api.post('/doctor/respond', data), // data = { requestId, status }
};

// Chemist APIs
export const chemistAPI = {
  saveProfile: (data) => api.post('/chemist/profile', data),
  getProfile: () => api.get('/chemist/profile'),
  requestMedicineChange: (data) => api.post('/chemist/request-medicine-change', data), // data = { prescriptionId, requestedMedicine }
  getRequests: () => api.get('/chemist/requests'),
  reportIssue: (data) => api.post('/chemist/report-issue', data), // data = { prescriptionId, reason }
};

// Admin APIs
export const adminAPI = {
  getIssues: () => api.get('/admin/issues'),
  resolveIssue: (data) => api.post('/admin/resolve', data), // data = { issueId, status }
  getDiseaseAnalytics: () => api.get('/admin/disease-analytics'),
};

export default api;
