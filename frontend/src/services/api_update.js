// Add these to your existing api.js file

export const facultySeatsAPI = {
  list: (params) => api.get('/faculty-seats', { params }),
  updateMy: (data) => api.put('/faculty-seats/my', data),
  // NEW: Import and template endpoints
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/faculty-seats/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getTemplate: () => api.get('/admin/faculty-seats/template', { responseType: 'blob' }),
};

