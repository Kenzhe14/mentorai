import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const API_URL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios to always send credentials (cookies)
  axios.defaults.withCredentials = true;

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      if (response.data.success) {
        setCurrentUser(response.data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      setCurrentUser(null);
      console.log('Not authenticated or error fetching user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password
      });
      
      if (response.data.success) {
        setCurrentUser(response.data.user);
        return { success: true };
      } else {
        setError(response.data.message || 'Login failed');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An error occurred during login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      
      // Add createRoadmap flag to tell backend to create roadmap entry
      const dataToSend = {
        ...userData,
        createRoadmap: true
      };
      
      const response = await axios.post(`${API_URL}/api/auth/register`, dataToSend);
      
      if (response.data.success) {
        setCurrentUser(response.data.user);
        return { success: true };
      } else {
        setError(response.data.message || 'Registration failed');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An error occurred during registration';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };
  
  const registerMentor = async (mentorData) => {
    try {
      setError(null);
      // Prepare mentor data with properly formatted arrays
      const dataToSend = {
        ...mentorData,
        role: 'mentor',
        phone: mentorData.phone || `+${Math.floor(Math.random() * 9000000000) + 1000000000}`, // Generate random phone if not provided
        skills: Array.isArray(mentorData.skills) ? mentorData.skills : [],
        specializations: Array.isArray(mentorData.specializations) ? mentorData.specializations : [],
        languages: Array.isArray(mentorData.languages) ? mentorData.languages : ["English"]
      };
      
      // Ensure required arrays have values
      if (dataToSend.skills.length === 0) {
        setError("Skills are required");
        return { success: false, error: "Skills are required" };
      }
      
      const response = await axios.post(`${API_URL}/api/auth/register-mentor`, dataToSend);
      
      if (response.data.success) {
        // Update currentUser with the user data
        setCurrentUser({
          ...response.data.user,
          role: 'mentor',
          isMentor: true,
          mentorInfo: response.data.mentor
        });
        
        // Store mentor-specific information
        localStorage.setItem('mentorInfo', JSON.stringify(response.data.mentor));
        
        return { success: true };
      } else {
        setError(response.data.message || 'Mentor registration failed');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An error occurred during mentor registration';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Call the backend logout endpoint
      await axios.post(`${API_URL}/api/auth/logout`);
      
      // Clear all application data from localStorage
      const preserveTheme = localStorage.getItem('theme'); // Save theme preference
      
      // Clear all localStorage items
      localStorage.clear();
      
      // Restore theme preference if needed
      if (preserveTheme) {
        localStorage.setItem('theme', preserveTheme);
      }
      
      // Clear user state
      setCurrentUser(null);
      
      return { success: true };
    } catch (err) {
      console.error("Logout error:", err);
      // Even if the server call fails, clear local state
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('onboardingData');
      localStorage.removeItem('chat_messages');
      localStorage.removeItem('lastTopic');
      localStorage.removeItem('lastRoadmap');
      localStorage.removeItem('savedCode');
      
      setCurrentUser(null);
      return { success: true, error: 'Server logout failed but local state was cleared' };
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    registerMentor,
    logout,
    refreshUser: fetchCurrentUser,
    API_URL
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 