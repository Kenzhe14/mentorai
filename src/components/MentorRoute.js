import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './authContext';

const MentorRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is a mentor, if not redirect to home page
  if (!currentUser.isMentor && (!currentUser.role || currentUser.role !== 'mentor')) {
    return <Navigate to="/home" state={{ from: location }} replace />;
  }

  // Render the protected component
  return children;
};

export default MentorRoute; 