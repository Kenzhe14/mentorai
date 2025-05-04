import React, { useState, useEffect } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import { useAuth } from "../components/authContext";
import { Users, Clock, DollarSign, Star, Calendar, BookOpen, MessageSquare } from "lucide-react";
import { MentorAPI } from "../services/api";

function MentorDashboard() {
  const { currentUser } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mentorStats, setMentorStats] = useState({
    studentsCount: 0,
    hoursCompleted: 0,
    totalEarnings: 0,
    averageRating: 0,
    upcomingSessions: []
  });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Load mentor data from API
  useEffect(() => {
    const fetchMentorDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await MentorAPI.getDashboardData();
        
        if (response.success && response.data) {
          setMentorStats({
            studentsCount: response.data.studentsCount,
            hoursCompleted: response.data.hoursCompleted,
            totalEarnings: response.data.totalEarnings,
            averageRating: response.data.mentorInfo?.rating || 4.0,
            upcomingSessions: response.data.upcomingSessions.map(session => ({
              id: session.id,
              studentName: session.studentName,
              topic: session.topic,
              date: formatSessionDate(session.date),
              duration: session.duration
            }))
          });
        } else {
          throw new Error("Failed to load mentor data");
        }
      } catch (err) {
        console.error("Error fetching mentor dashboard data:", err);
        setError("Failed to load mentor data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentorDashboardData();
  }, []);

  // Format session date to readable string
  const formatSessionDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString([], { weekday: 'long' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  return (
    <LeftBar>
      <div className={`${isMobile ? "mt-16" : ""} p-4 bg-dark-50 dark:bg-dark-950 min-h-screen`}>
        {/* Mentor Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600 
                     rounded-xl p-6 mb-8 ml-2 text-base-white shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 select-none">
            Welcome to your Mentor Dashboard, {currentUser?.displayName || currentUser?.name || "Mentor"}!
          </h1>
          <p className="mb-4 opacity-90 select-none">Manage your sessions, students, and content from here.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-r-transparent"></div>
            <p className="mt-2 text-dark-600 dark:text-dark-300">Loading your dashboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <h2 className="text-2xl font-bold mb-4 ml-2 text-dark-900 dark:text-base-white">Stats Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4 shadow-md border border-dark-200/10 dark:border-dark-800/50">
                <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mb-3 text-base-white shadow-md">
                  <Users size={24} />
                </div>
                <h3 className="font-bold text-lg text-dark-900 dark:text-base-white">{mentorStats.studentsCount}</h3>
                <p className="text-sm text-dark-600 dark:text-dark-300">Active Students</p>
              </div>
              
              <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4 shadow-md border border-dark-200/10 dark:border-dark-800/50">
                <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center mb-3 text-base-white shadow-md">
                  <Clock size={24} />
                </div>
                <h3 className="font-bold text-lg text-dark-900 dark:text-base-white">{mentorStats.hoursCompleted}</h3>
                <p className="text-sm text-dark-600 dark:text-dark-300">Hours Completed</p>
              </div>
              
              <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4 shadow-md border border-dark-200/10 dark:border-dark-800/50">
                <div className="bg-amber-500 w-12 h-12 rounded-lg flex items-center justify-center mb-3 text-base-white shadow-md">
                  <DollarSign size={24} />
                </div>
                <h3 className="font-bold text-lg text-dark-900 dark:text-base-white">${mentorStats.totalEarnings}</h3>
                <p className="text-sm text-dark-600 dark:text-dark-300">Total Earnings</p>
              </div>
              
              <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4 shadow-md border border-dark-200/10 dark:border-dark-800/50">
                <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center mb-3 text-base-white shadow-md">
                  <Star size={24} />
                </div>
                <h3 className="font-bold text-lg text-dark-900 dark:text-base-white">{mentorStats.averageRating.toFixed(1)}</h3>
                <p className="text-sm text-dark-600 dark:text-dark-300">Average Rating</p>
              </div>
            </div>

            {/* Upcoming Sessions and Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming Sessions */}
              <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-dark-200/10 dark:border-dark-800/50">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-dark-900 dark:text-base-white">
                  <Calendar size={20} className="text-primary-500" />
                  Upcoming Sessions
                </h2>
                
                <div className="space-y-4">
                  {mentorStats.upcomingSessions.length > 0 ? (
                    mentorStats.upcomingSessions.map(session => (
                      <div key={session.id} className="p-3 rounded-lg border border-dark-200/10 dark:border-dark-800/50 
                                                  hover:bg-dark-50 dark:hover:bg-dark-800/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-dark-900 dark:text-base-white">{session.studentName}</h3>
                            <p className="text-sm text-dark-600 dark:text-dark-300 mt-1">{session.topic}</p>
                          </div>
                          <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 
                                        px-2 py-1 rounded-full">
                            {session.date}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-dark-500 dark:text-dark-400 py-4">No upcoming sessions</p>
                  )}
                </div>
                
                <button 
                  className="w-full mt-4 py-2 text-sm text-primary-600 dark:text-primary-400 font-medium 
                          hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  View All Sessions
                </button>
              </div>

              {/* Quick Actions */}
              <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-dark-200/10 dark:border-dark-800/50">
                <h2 className="text-xl font-bold mb-4 text-dark-900 dark:text-base-white">Quick Actions</h2>
                
                <div className="grid grid-cols-1 gap-3">
                  <button className="flex items-center gap-3 p-3 text-left rounded-lg border border-dark-200/10 dark:border-dark-800/50 
                                  hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                    <div className="bg-green-500 w-10 h-10 rounded-lg flex items-center justify-center text-white">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-dark-900 dark:text-base-white">Schedule Session</h3>
                      <p className="text-xs text-dark-500 dark:text-dark-400">Create a new mentoring session</p>
                    </div>
                  </button>
                  
                  <button className="flex items-center gap-3 p-3 text-left rounded-lg border border-dark-200/10 dark:border-dark-800/50 
                                  hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                    <div className="bg-blue-500 w-10 h-10 rounded-lg flex items-center justify-center text-white">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-dark-900 dark:text-base-white">Create Content</h3>
                      <p className="text-xs text-dark-500 dark:text-dark-400">Add new lectures or exercises</p>
                    </div>
                  </button>
                  
                  <button className="flex items-center gap-3 p-3 text-left rounded-lg border border-dark-200/10 dark:border-dark-800/50 
                                  hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                    <div className="bg-purple-500 w-10 h-10 rounded-lg flex items-center justify-center text-white">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-dark-900 dark:text-base-white">Messages</h3>
                      <p className="text-xs text-dark-500 dark:text-dark-400">Check student messages</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </LeftBar>
  );
}

export default MentorDashboard; 