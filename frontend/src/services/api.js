import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Admin APIs
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  importUsers: (file, role) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/users/import?role=${role}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportUsers: (role) => api.get(`/admin/users/export?role=${role}`, { responseType: 'blob' }),
  getTemplate: (type) => api.get(`/admin/templates/${type}`, { responseType: 'blob' }),
};

// Subject APIs
export const subjectAPI = {
  list: (params) => api.get('/subjects', { params }),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

// Attendance APIs
export const attendanceAPI = {
  mark: (data) => api.post('/attendance/mark', data),
  getSubjectAttendance: (subjectId, session) => api.get(`/attendance/subject/${subjectId}`, { params: { session } }),
  getStudentAttendance: (studentId) => api.get(`/attendance/student/${studentId}`),
  export: (subjectId) => api.get('/attendance/export', { params: { subject_id: subjectId }, responseType: 'blob' }),
};

// Marks APIs
export const marksAPI = {
  enter: (data) => api.post('/marks/enter', data),
  getSubjectMarks: (subjectId, semester) => api.get(`/marks/subject/${subjectId}`, { params: { semester } }),
  getStudentMarks: (studentId) => api.get(`/marks/student/${studentId}`),
  export: (subjectId) => api.get('/marks/export', { params: { subject_id: subjectId }, responseType: 'blob' }),
};

// Student APIs
export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
};

// Events APIs
export const eventsAPI = {
  list: (params) => api.get('/events', { params }),
  create: (data) => api.post('/events', data),
  delete: (id) => api.delete(`/events/${id}`),
};

// Announcements APIs
export const announcementsAPI = {
  list: (params) => api.get('/announcements', { params }),
  create: (data) => api.post('/announcements', data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

// Faculty Seats APIs
export const facultySeatsAPI = {
  list: (params) => api.get('/faculty-seats', { params }),
  updateMy: (data) => api.put('/faculty-seats/my', data),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/faculty-seats/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getTemplate: () => api.get('/admin/faculty-seats/template', { responseType: 'blob' }),
};

// Timetable APIs
export const timetableAPI = {
  get: (params) => api.get('/timetable', { params }),
  create: (data) => api.post('/timetable', data),
  delete: (id) => api.delete(`/timetable/${id}`),
};

// Utility function to download blob
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default api;
