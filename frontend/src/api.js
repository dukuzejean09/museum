import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Public API (with visitor token interceptor)
const API = axios.create({ baseURL: API_BASE });

API.interceptors.request.use((config) => {
  const visitorToken = localStorage.getItem('visitorToken');
  const adminToken = localStorage.getItem('adminToken');
  const token = visitorToken || adminToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('visitorToken');
      localStorage.removeItem('visitorExpiresAt');
      if (!window.location.pathname.startsWith('/admin') && window.location.pathname !== '/enter') {
        window.location.href = '/enter';
      }
    }
    return Promise.reject(error);
  }
);

// Public content
export const fetchGuides = () => API.get('/guides');
export const sendMessage = (data) => API.post('/messages', data);

// Admin API (with JWT interceptor)
const AdminAPI = axios.create({ baseURL: API_BASE });

AdminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const loginAdmin = (data) => AdminAPI.post('/auth/login', data);
export const registerAdmin = (data) => AdminAPI.post('/auth/register', data);
export const changePassword = (data) => AdminAPI.put('/auth/password', data);

// User Management (admin only)
export const fetchUsers = () => AdminAPI.get('/auth/users');
export const updateUserRole = (id, data) => AdminAPI.put(`/auth/users/${id}/role`, data);
export const toggleUserStatus = (id) => AdminAPI.put(`/auth/users/${id}/status`);
export const deleteUser = (id) => AdminAPI.delete(`/auth/users/${id}`);

// Admin CRUD - Trails
export const adminFetchTrails = () => AdminAPI.get('/admin/trails');
export const adminFetchTrail = (id) => AdminAPI.get(`/admin/trails/${id}`);
export const adminCreateTrail = (formData) =>
  AdminAPI.post('/admin/trails', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminUpdateTrail = (id, formData) =>
  AdminAPI.put(`/admin/trails/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminDeleteTrail = (id) => AdminAPI.delete(`/admin/trails/${id}`);

// Admin CRUD - Guides
export const adminFetchGuides = () => AdminAPI.get('/admin/guides');
export const adminFetchGuide = (id) => AdminAPI.get(`/admin/guides/${id}`);
export const adminCreateGuide = (formData) =>
  AdminAPI.post('/admin/guides', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminUpdateGuide = (id, formData) =>
  AdminAPI.put(`/admin/guides/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminDeleteGuide = (id) => AdminAPI.delete(`/admin/guides/${id}`);

// Guide self-service profile
export const guideFetchProfile = () => AdminAPI.get('/guide/profile');
export const guideUpdateProfile = (formData) =>
  AdminAPI.put('/guide/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Admin Messages (admin + guide can access)
export const adminFetchMessages = (params) => AdminAPI.get('/admin/messages', { params });
export const adminFetchMessage = (id) => AdminAPI.get(`/admin/messages/${id}`);
export const adminReplyToMessage = (id, data) => AdminAPI.post(`/admin/messages/${id}/reply`, data);
export const adminUpdateMessageStatus = (id, data) => AdminAPI.put(`/admin/messages/${id}/status`, data);
export const adminDeleteMessage = (id) => AdminAPI.delete(`/admin/messages/${id}`);
export const assignMessage = (id, data) => AdminAPI.put(`/admin/messages/${id}/assign`, data);

// Analytics
export const fetchAnalytics = (params) => AdminAPI.get('/admin/analytics', { params });
export const fetchContentAnalytics = (params) => AdminAPI.get('/admin/analytics/content', { params });
export const fetchVisitorAnalytics = (params) => AdminAPI.get('/admin/analytics/visitors', { params });

// QR Code
export const generateExhibitionQR = (id) => AdminAPI.get(`/qr/exhibition/${id}`);

// Bookings
export const createBooking = (data) => API.post('/bookings', data);
export const cancelBooking = (data) => API.post('/bookings/cancel', data);
export const adminFetchBookings = (params) => AdminAPI.get('/admin/bookings', { params });
export const adminUpdateBooking = (id, data) => AdminAPI.put(`/admin/bookings/${id}`, data);
export const adminGenerateBookingAccess = (id, data) => AdminAPI.post(`/admin/bookings/${id}/access-code`, data);
export const adminDeleteBooking = (id) => AdminAPI.delete(`/admin/bookings/${id}`);

// Surveys
export const createSurvey = (data) => API.post('/surveys', data);
export const adminFetchSurveys = () => AdminAPI.get('/admin/surveys');
export const adminFetchSurveyStats = () => AdminAPI.get('/admin/surveys/stats');
export const adminDeleteSurvey = (id) => AdminAPI.delete(`/admin/surveys/${id}`);

// AI Features
export const aiIdentify = (formData) =>
  API.post('/ai/identify', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const aiNarrate = (data) => API.post('/ai/narrate', data);

// Exhibitions
export const fetchExhibitions = (params) => API.get('/exhibitions', { params });
export const fetchExhibitionById = (id) => API.get(`/exhibitions/${id}`);
export const fetchFeaturedExhibitions = () => API.get('/exhibitions/featured');

// Artifacts
export const fetchArtifacts = (params) => API.get('/artifacts', { params });
export const fetchArtifactById = (id) => API.get(`/artifacts/${id}`);

// Stories
export const fetchStories = (params) => API.get('/stories', { params });
export const fetchStoryById = (id) => API.get(`/stories/${id}`);

// Trails (guided journeys)
export const fetchFeaturedTrails = () => API.get('/trails/featured');
export const fetchTrails = (params) => API.get('/trails', { params });
export const fetchTrailById = (id) => API.get(`/trails/${id}`);

// Global Search
export const globalSearch = (params) => API.get('/search', { params });

// Event tracking
export const trackEvent = (data) => API.post('/analytics/track', data);

// Admin Artifacts
export const adminFetchArtifacts = (params) => AdminAPI.get('/admin/artifacts', { params });
export const adminFetchArtifact = (id) => AdminAPI.get(`/admin/artifacts/${id}`);
export const adminCreateArtifact = (formData) =>
  AdminAPI.post('/admin/artifacts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminUpdateArtifact = (id, formData) =>
  AdminAPI.put(`/admin/artifacts/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminDeleteArtifact = (id) => AdminAPI.delete(`/admin/artifacts/${id}`);

// Admin Exhibitions
export const adminFetchExhibitions = (params) => AdminAPI.get('/admin/exhibitions', { params });
export const adminFetchExhibition = (id) => AdminAPI.get(`/admin/exhibitions/${id}`);
export const adminCreateExhibition = (formData) =>
  AdminAPI.post('/admin/exhibitions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminUpdateExhibition = (id, formData) =>
  AdminAPI.put(`/admin/exhibitions/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminDeleteExhibition = (id) => AdminAPI.delete(`/admin/exhibitions/${id}`);

// Admin Stories
export const adminFetchStories = (params) => AdminAPI.get('/admin/stories', { params });
export const adminFetchStory = (id) => AdminAPI.get(`/admin/stories/${id}`);
export const adminCreateStory = (data) => AdminAPI.post('/admin/stories', data);
export const adminUpdateStory = (id, data) => AdminAPI.put(`/admin/stories/${id}`, data);
export const adminDeleteStory = (id) => AdminAPI.delete(`/admin/stories/${id}`);

// Visitor Auth
export const validateVisitorCode = (code) => axios.post(`${API_BASE}/visitor/validate`, { code });
export const adminGenerateAccessCode = (data) => AdminAPI.post('/visitor/codes', data);
export const adminFetchAccessCodes = () => AdminAPI.get('/visitor/codes');
export const adminDeactivateCode = (id) => AdminAPI.put(`/visitor/codes/${id}/deactivate`);
