import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LeftBar from "../components/sidebar";
import { useAuth } from "../components/authContext";
import { MentorAPI } from "../services/api";
import { 
  Users, MapPin, CheckCircle, Circle, ArrowLeft, Clock, Calendar, 
  BarChart4, TrendingUp, Award, BookOpen, GraduationCap, Code
} from "lucide-react";

function StudentRoadmaps() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { currentUser, API_URL } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeTab, setActiveTab] = useState('roadmaps');
  const [studentStats, setStudentStats] = useState({
    completionRate: 0,
    averageCompletionTime: 0,
    learningStreak: 0,
    topSkills: [],
    weakAreas: [],
    totalCompletedSteps: 0,
    totalSteps: 0,
    monthlyProgress: [
      { month: 'Jan', completed: 5 },
      { month: 'Feb', completed: 8 },
      { month: 'Mar', completed: 12 },
      { month: 'Apr', completed: 7 },
      { month: 'May', completed: 10 },
      { month: 'Jun', completed: 15 }
    ]
  });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Load student roadmaps data from API
  useEffect(() => {
    const fetchStudentRoadmaps = async () => {
      if (!studentId) return;
      
      try {
        setIsLoading(true);
        const response = await MentorAPI.getStudentRoadmaps(studentId);
        
        if (response.success && response.data) {
          setStudentData(response.data.student);
          setRoadmaps(response.data.roadmaps);
          
          // Calculate statistics based on roadmaps data
          calculateStudentStatistics(response.data.roadmaps);
        } else {
          throw new Error("Failed to load student roadmaps");
        }
      } catch (err) {
        console.error("Error fetching student roadmaps:", err);
        setError("Failed to load student roadmaps. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentRoadmaps();
  }, [studentId]);
  
  // Calculate student statistics based on roadmaps data
  const calculateStudentStatistics = (roadmapsData) => {
    if (!roadmapsData || roadmapsData.length === 0) return;
    
    // Count total steps and completed steps
    let totalSteps = 0;
    let completedSteps = 0;
    let skillsCount = {};
    let weakAreasCount = {};
    
    roadmapsData.forEach(roadmap => {
      if (roadmap.steps && roadmap.steps.length > 0) {
        totalSteps += roadmap.steps.length;
        const roadmapCompletedSteps = roadmap.steps.filter(step => step.completed).length;
        completedSteps += roadmapCompletedSteps;
        
        // Track skill areas (from topic)
        const skill = roadmap.topic.split(' ')[0]; // Simplistic - just take first word
        if (skillsCount[skill]) {
          skillsCount[skill] += roadmapCompletedSteps;
        } else {
          skillsCount[skill] = roadmapCompletedSteps;
        }
        
        // Track weak areas (incomplete steps)
        roadmap.steps.forEach(step => {
          if (!step.completed) {
            const area = step.name.split(' ')[0]; // Simplistic approach
            if (weakAreasCount[area]) {
              weakAreasCount[area]++;
            } else {
              weakAreasCount[area] = 1;
            }
          }
        });
      }
    });
    
    // Convert skills object to sorted array
    const topSkills = Object.entries(skillsCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
      
    // Convert weak areas object to sorted array
    const weakAreas = Object.entries(weakAreasCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    // Calculate completion rate percentage
    const completionRate = totalSteps > 0 
      ? Math.round((completedSteps / totalSteps) * 100) 
      : 0;
      
    // Calculate mock learning streak (would be from real data)
    const learningStreak = Math.floor(Math.random() * 15) + 1; // Random 1-15 for demo
    
    // Calculate mock average completion time (would be from real data)
    const averageCompletionTime = Math.floor(Math.random() * 5) + 2; // Random 2-6 days for demo
    
    setStudentStats({
      ...studentStats,
      completionRate,
      learningStreak,
      averageCompletionTime,
      topSkills,
      weakAreas,
      totalCompletedSteps: completedSteps,
      totalSteps
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

  // Calculate roadmap progress
  const calculateProgress = (steps) => {
    if (!steps || steps.length === 0) return 0;
    const completedSteps = steps.filter(step => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  };
  
  // Get highest bar in the chart for scaling
  const getMaxBarValue = () => {
    return Math.max(...studentStats.monthlyProgress.map(item => item.completed));
  };

  return (
    <LeftBar>
      <div className={`${isMobile ? "mt-16" : ""} p-4 bg-dark-50 dark:bg-dark-950 min-h-screen`}>
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600 
                     rounded-xl p-6 mb-8 ml-2 text-base-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <button 
              onClick={() => navigate('/mentor-students')}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold select-none flex items-center gap-2">
              <Users size={28} />
              Student Profile
            </h1>
          </div>
          {studentData && (
            <p className="mb-2 opacity-90 select-none">
              Detailed information and learning progress for {studentData.name}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-r-transparent"></div>
            <p className="mt-2 text-dark-600 dark:text-dark-300">Loading student data...</p>
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
            {/* Student Info */}
            {studentData && (
              <div className="mb-8 bg-base-white dark:bg-dark-900 p-6 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  {studentData.avatar_url ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mr-4 flex-shrink-0">
                      <img
                        src={
                          studentData.avatar_url.startsWith('http')
                            ? studentData.avatar_url
                            : `${API_URL}${studentData.avatar_url}`
                        }
                        alt={studentData.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/100x100?text=Student";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full mr-4 bg-primary-100 dark:bg-primary-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 dark:text-primary-300 font-bold text-xl">
                        {studentData.name ? studentData.name.charAt(0).toUpperCase() : "S"}
                      </span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-dark-900 dark:text-white">{studentData.name}</h2>
                    <p className="text-dark-600 dark:text-dark-400">{studentData.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={18} className="text-primary-500" />
                      <span className="text-dark-600 dark:text-dark-400 text-sm">Joined</span>
                    </div>
                    <p className="font-medium text-dark-900 dark:text-white">{formatDate(studentData.joinedDate)}</p>
                  </div>
                  
                  <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={18} className="text-primary-500" />
                      <span className="text-dark-600 dark:text-dark-400 text-sm">Total Hours</span>
                    </div>
                    <p className="font-medium text-dark-900 dark:text-white">{studentData.totalHours} hours</p>
                  </div>
                  
                  <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={18} className="text-primary-500" />
                      <span className="text-dark-600 dark:text-dark-400 text-sm">Last Session</span>
                    </div>
                    <p className="font-medium text-dark-900 dark:text-white">{formatDate(studentData.lastSession)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                className={`py-3 px-6 font-medium text-sm transition-colors ${
                  activeTab === 'statistics'
                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400'
                }`}
                onClick={() => setActiveTab('statistics')}
              >
                <div className="flex items-center gap-2">
                  <BarChart4 size={18} />
                  <span>Statistics</span>
                </div>
              </button>
              <button
                className={`py-3 px-6 font-medium text-sm transition-colors ${
                  activeTab === 'roadmaps'
                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400'
                }`}
                onClick={() => setActiveTab('roadmaps')}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={18} />
                  <span>Roadmaps</span>
                </div>
              </button>
            </div>

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-dark-900 dark:text-white flex items-center gap-2">
                  <BarChart4 size={20} className="text-primary-500" />
                  Learning Statistics
                </h2>

                {/* Progress Overview */}
                <div className="bg-base-white dark:bg-dark-900 p-6 rounded-xl shadow-md mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-dark-900 dark:text-white">Progress Overview</h3>
                  
                  <div className="flex flex-col md:flex-row mb-6">
                    <div className="w-full md:w-2/3 p-4">
                      <div className="h-48 flex items-end justify-between gap-2">
                        {studentStats.monthlyProgress.map((item, index) => (
                          <div key={index} className="flex flex-col items-center w-full">
                            <div 
                              className="w-full bg-primary-500 hover:bg-primary-600 transition-colors rounded-t-sm" 
                              style={{ 
                                height: `${(item.completed / getMaxBarValue()) * 100}%`,
                                maxHeight: '90%'
                              }}
                            ></div>
                            <span className="text-xs text-dark-500 dark:text-dark-400 mt-2">{item.month}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-center mt-4 text-dark-600 dark:text-dark-400 text-sm">
                        Monthly completed steps
                      </p>
                    </div>
                    
                    <div className="w-full md:w-1/3 p-4">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-dark-600 dark:text-dark-400">Overall Completion</span>
                            <span className="text-sm font-medium text-primary-500">{studentStats.completionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div 
                              className="bg-primary-500 h-2.5 rounded-full" 
                              style={{ width: `${studentStats.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-dark-900 dark:text-white">
                          <Award className="text-primary-500" size={18} />
                          <span className="text-sm">{studentStats.learningStreak} day learning streak</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-dark-900 dark:text-white">
                          <Clock className="text-primary-500" size={18} />
                          <span className="text-sm">Avg. {studentStats.averageCompletionTime} days per step</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-dark-900 dark:text-white">
                          <CheckCircle className="text-primary-500" size={18} />
                          <span className="text-sm">{studentStats.totalCompletedSteps} of {studentStats.totalSteps} steps completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Strongest Skills */}
                  <div className="bg-base-white dark:bg-dark-900 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-dark-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={18} className="text-green-500" />
                      Top Skills
                    </h3>
                    
                    {studentStats.topSkills.length > 0 ? (
                      <div className="space-y-4">
                        {studentStats.topSkills.map((skill, index) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-dark-600 dark:text-dark-400">{skill.name}</span>
                              <span className="text-sm font-medium text-green-500">{skill.count} completed</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div 
                                className="bg-green-500 h-2.5 rounded-full" 
                                style={{ width: `${(skill.count / (studentStats.topSkills[0]?.count || 1)) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-dark-500 dark:text-dark-400">No skill data available</p>
                    )}
                  </div>
                  
                  {/* Areas to Improve */}
                  <div className="bg-base-white dark:bg-dark-900 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-dark-900 dark:text-white flex items-center gap-2">
                      <BookOpen size={18} className="text-amber-500" />
                      Areas to Improve
                    </h3>
                    
                    {studentStats.weakAreas.length > 0 ? (
                      <div className="space-y-4">
                        {studentStats.weakAreas.map((area, index) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-dark-600 dark:text-dark-400">{area.name}</span>
                              <span className="text-sm font-medium text-amber-500">{area.count} pending</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div 
                                className="bg-amber-500 h-2.5 rounded-full" 
                                style={{ width: `${(area.count / (studentStats.weakAreas[0]?.count || 1)) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-dark-500 dark:text-dark-400">No improvement areas identified</p>
                    )}
                  </div>
                </div>
                
                {/* Mentor Recommendations */}
                <div className="bg-base-white dark:bg-dark-900 p-6 rounded-xl shadow-md mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-dark-900 dark:text-white flex items-center gap-2">
                    <GraduationCap size={18} className="text-primary-500" />
                    Recommended Actions
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 border-l-2 border-primary-500 bg-primary-50 dark:bg-primary-900/10 rounded-r-lg">
                      <h4 className="font-medium text-dark-800 dark:text-dark-200">Schedule a session on Advanced Concepts</h4>
                      <p className="text-sm text-dark-600 dark:text-dark-400 mt-1">
                        Based on the student's progress, they appear ready to tackle more advanced topics.
                      </p>
                    </div>
                    
                    <div className="p-4 border-l-2 border-amber-500 bg-amber-50 dark:bg-amber-900/10 rounded-r-lg">
                      <h4 className="font-medium text-dark-800 dark:text-dark-200">Review Async JavaScript</h4>
                      <p className="text-sm text-dark-600 dark:text-dark-400 mt-1">
                        The student seems to be struggling with Asynchronous JavaScript concepts.
                      </p>
                    </div>
                    
                    <div className="p-4 border-l-2 border-green-500 bg-green-50 dark:bg-green-900/10 rounded-r-lg">
                      <h4 className="font-medium text-dark-800 dark:text-dark-200">Congratulate on recent progress</h4>
                      <p className="text-sm text-dark-600 dark:text-dark-400 mt-1">
                        The student has been making consistent progress. Positive reinforcement can help maintain momentum.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Roadmaps Tab */}
            {activeTab === 'roadmaps' && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-dark-900 dark:text-white flex items-center gap-2">
                  <MapPin size={20} className="text-primary-500" />
                  Learning Roadmaps
                </h2>
                
                {roadmaps.length > 0 ? (
                  <div className="space-y-6">
                    {roadmaps.map((roadmap) => (
                      <div key={roadmap.id} className="bg-base-white dark:bg-dark-900 p-6 rounded-xl shadow-md">
                        <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-1">{roadmap.topic}</h3>
                            <p className="text-dark-600 dark:text-dark-400 text-sm">
                              Created: {formatDate(roadmap.createdAt)} • Last updated: {formatDate(roadmap.updatedAt)}
                            </p>
                          </div>
                          <div className="mt-3 md:mt-0">
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary-500" 
                                  style={{ width: `${calculateProgress(roadmap.steps)}%` }}
                                ></div>
                              </div>
                              <span className="text-dark-900 dark:text-white font-medium">
                                {calculateProgress(roadmap.steps)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 space-y-4">
                          {roadmap.steps.map((step) => (
                            <div 
                              key={step.id} 
                              className={`p-4 border-l-2 ${
                                step.completed 
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/10" 
                                  : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                              } rounded-r-lg`}
                            >
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mr-3 mt-0.5">
                                  {step.completed ? (
                                    <CheckCircle size={18} className="text-green-500" />
                                  ) : (
                                    <Circle size={18} className="text-gray-400 dark:text-gray-600" />
                                  )}
                                </div>
                                <div>
                                  <h4 className={`font-medium ${
                                    step.completed 
                                      ? "text-green-700 dark:text-green-400" 
                                      : "text-dark-800 dark:text-dark-200"
                                  }`}>
                                    {step.order}. {step.name}
                                  </h4>
                                  <p className="text-xs text-dark-600 dark:text-dark-400 mt-1">
                                    {step.completed ? "Completed" : "In progress"} • Last updated: {formatDate(step.updatedAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-base-white dark:bg-dark-900 rounded-xl shadow-md">
                    <p className="text-dark-500 dark:text-dark-400">No roadmaps found for this student.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </LeftBar>
  );
}

export default StudentRoadmaps; 