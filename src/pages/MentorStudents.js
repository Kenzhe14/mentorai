import React, { useState, useEffect } from "react";
import LeftBar from "../components/sidebar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authContext";
import { MentorAPI } from "../services/api";
import { Users, Calendar, Clock, MapPin, BookOpen, Award, BarChart4, CheckCircle } from "lucide-react";

function MentorStudents() {
  const navigate = useNavigate();
  const { currentUser, API_URL } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsStats, setStudentsStats] = useState({
    totalHours: 0,
    totalSessions: 0,
    activeStudents: 0,
    averageCompletionRate: 0
  });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Load students data from API
  useEffect(() => {
    const fetchMentorStudentsData = async () => {
      try {
        setIsLoading(true);
        const response = await MentorAPI.getStudentsData();
        
        if (response.success && response.data) {
          setStudents(response.data.students);
          calculateStudentsStats(response.data.students);
        } else {
          throw new Error("Failed to load students data");
        }
      } catch (err) {
        console.error("Error fetching mentor students data:", err);
        setError("Failed to load students data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentorStudentsData();
  }, []);
  
  // Calculate overall statistics for all students
  const calculateStudentsStats = (studentsData) => {
    if (!studentsData || studentsData.length === 0) return;
    
    const totalHours = studentsData.reduce((total, student) => total + student.totalHours, 0);
    const totalSessions = studentsData.reduce((total, student) => total + student.sessionsCount, 0);
    
    // Consider students active if they had a session in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeStudents = studentsData.filter(student => 
      new Date(student.lastSession) >= thirtyDaysAgo
    ).length;
    
    // Mock average completion rate (would be from real data)
    const averageCompletionRate = Math.floor(Math.random() * 30) + 40; // Random 40-70%
    
    setStudentsStats({
      totalHours,
      totalSessions,
      activeStudents,
      averageCompletionRate
    });
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get days since last session
  const getDaysSinceLastSession = (dateString) => {
    const lastSession = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - lastSession);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <LeftBar>
      <div className={`${isMobile ? "mt-16" : ""} p-4 bg-dark-50 dark:bg-dark-950 min-h-screen`}>
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600 
                     rounded-xl p-6 mb-8 ml-2 text-base-white shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 select-none flex items-center gap-2">
            <Users size={28} />
            My Students
          </h1>
          <p className="mb-2 opacity-90 select-none">
            Manage and track your student relationships and learning progress
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-r-transparent"></div>
            <p className="mt-2 text-dark-600 dark:text-dark-300">Loading students data...</p>
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
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-base-white dark:bg-dark-900 p-4 rounded-xl shadow-md flex items-center">
                <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center text-base-white shadow-md mr-4">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-dark-600 dark:text-dark-300 text-sm">Total Students</p>
                  <h3 className="font-bold text-2xl text-dark-900 dark:text-base-white">{students.length}</h3>
                  <p className="text-xs text-green-500">{studentsStats.activeStudents} active in last 30 days</p>
                </div>
              </div>
              
              <div className="bg-base-white dark:bg-dark-900 p-4 rounded-xl shadow-md flex items-center">
                <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center text-base-white shadow-md mr-4">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-dark-600 dark:text-dark-300 text-sm">Total Hours</p>
                  <h3 className="font-bold text-2xl text-dark-900 dark:text-base-white">{studentsStats.totalHours}</h3>
                  <p className="text-xs text-dark-500 dark:text-dark-400">Mentoring time</p>
                </div>
              </div>
              
              <div className="bg-base-white dark:bg-dark-900 p-4 rounded-xl shadow-md flex items-center">
                <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center text-base-white shadow-md mr-4">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-dark-600 dark:text-dark-300 text-sm">Total Sessions</p>
                  <h3 className="font-bold text-2xl text-dark-900 dark:text-base-white">{studentsStats.totalSessions}</h3>
                  <p className="text-xs text-dark-500 dark:text-dark-400">Learning sessions</p>
                </div>
              </div>
              
              <div className="bg-base-white dark:bg-dark-900 p-4 rounded-xl shadow-md flex items-center">
                <div className="bg-amber-500 w-12 h-12 rounded-lg flex items-center justify-center text-base-white shadow-md mr-4">
                  <BarChart4 size={24} />
                </div>
                <div>
                  <p className="text-dark-600 dark:text-dark-300 text-sm">Avg. Completion</p>
                  <h3 className="font-bold text-2xl text-dark-900 dark:text-base-white">{studentsStats.averageCompletionRate}%</h3>
                  <p className="text-xs text-dark-500 dark:text-dark-400">Roadmap progress</p>
                </div>
              </div>
            </div>

            {/* Students table */}
            <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-300">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium">Student</th>
                      <th className="py-3 px-4 text-left font-medium">Joined</th>
                      <th className="py-3 px-4 text-left font-medium">Progress</th>
                      <th className="py-3 px-4 text-left font-medium">Sessions</th>
                      <th className="py-3 px-4 text-left font-medium">Hours</th>
                      <th className="py-3 px-4 text-left font-medium">Last Activity</th>
                      <th className="py-3 px-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-200 dark:divide-dark-700">
                    {students.length > 0 ? (
                      students.map((student) => (
                        <tr key={student.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {student.avatar_url ? (
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mr-3 flex-shrink-0">
                                  <img
                                    src={
                                      student.avatar_url.startsWith('http')
                                        ? student.avatar_url
                                        : `${API_URL}${student.avatar_url}`
                                    }
                                    alt={student.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "https://via.placeholder.com/100x100?text=Student";
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full mr-3 bg-primary-100 dark:bg-primary-800 flex items-center justify-center flex-shrink-0">
                                  <span className="text-primary-700 dark:text-primary-300 font-medium text-sm">
                                    {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                                  </span>
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium text-dark-900 dark:text-base-white">{student.name}</h4>
                                <p className="text-xs text-dark-500 dark:text-dark-400">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-dark-700 dark:text-dark-300">
                            {formatDate(student.joinedDate)}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              {/* Mock random progress per student */}
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                                <div 
                                  className="bg-primary-500 h-1.5 rounded-full" 
                                  style={{ width: `${Math.floor(Math.random() * 60) + 20}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-dark-500 dark:text-dark-400">
                                  {Math.floor(Math.random() * 5) + 1} roadmaps
                                </span>
                                <span className="text-xs text-primary-500">
                                  {Math.floor(Math.random() * 60) + 20}%
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-dark-700 dark:text-dark-300">
                            <div className="flex items-center">
                              <Calendar size={16} className="mr-1 text-primary-500" />
                              {student.sessionsCount}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-dark-700 dark:text-dark-300">
                            <div className="flex items-center">
                              <Clock size={16} className="mr-1 text-primary-500" />
                              {student.totalHours}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-dark-700 dark:text-dark-300">
                            <div className="flex flex-col">
                              <span>{formatDate(student.lastSession)}</span>
                              <span className={`text-xs ${
                                getDaysSinceLastSession(student.lastSession) <= 7 
                                  ? "text-green-500" 
                                  : getDaysSinceLastSession(student.lastSession) <= 14
                                    ? "text-amber-500"
                                    : "text-red-500"
                              }`}>
                                {getDaysSinceLastSession(student.lastSession)} days ago
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => navigate(`/mentor-students/${student.id}/roadmaps`)}
                                className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 
                                          rounded-md text-xs hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors flex items-center gap-1"
                              >
                                <BarChart4 size={12} />
                                Stats
                              </button>
                              <button className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 
                                                rounded-md text-xs hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-1">
                                <MapPin size={12} />
                                Roadmaps
                              </button>
                              <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 
                                                rounded-md text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1">
                                <Calendar size={12} />
                                Schedule
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-dark-500 dark:text-dark-400">
                          No students found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </LeftBar>
  );
}

export default MentorStudents; 