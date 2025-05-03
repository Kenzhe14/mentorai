import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API functions for mentor
export const MentorAPI = {
  // Get mentor dashboard data
  getDashboardData: async () => {
    try {
      const response = await api.get('/api/mentor/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get mentor students data
  getStudentsData: async () => {
    try {
      const response = await api.get('/api/mentor/students');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get student roadmaps
  getStudentRoadmaps: async (studentId) => {
    try {
      const response = await api.get(`/api/mentor/students/${studentId}/roadmaps`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// General API functions
export const AppAPI = {
  // Get all mentors
  getMentors: async (filters = {}) => {
    try {
      const response = await api.get('/api/mentors', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Profile API functions
export const ProfileAPI = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Upload avatar
  uploadAvatar: async (file) => {
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Use multipart/form-data for file uploads
      const response = await api.post('/api/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api; 