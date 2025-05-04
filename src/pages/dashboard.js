import React, { useState, useEffect } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import { ArrowRight, BookOpen, ChartBar, Clock, Award, Target, CheckCircle, BarChart2, PieChart, Calendar, Activity, ArrowUpRight } from "lucide-react";
import ProgressOverview from "../components/skills/ProgressOverview";
import axios from "axios";

// API URL
const API_URL = "http://localhost:5000";

function Dashboard() {
    const [userData, setUserData] = useState({});
    const [topicProgress, setTopicProgress] = useState({});
    const [roadmap, setRoadmap] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
    const [globalAnalytics, setGlobalAnalytics] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        // Load user data
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUserData(JSON.parse(storedUser));
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }

        // Load topic progress
        fetchTopicProgress();
        
        // Load analytics data
        fetchAnalytics();
        
        // Load global analytics
        fetchGlobalAnalytics();

        // Load roadmap data
        const savedRoadmap = localStorage.getItem("lastRoadmap");
        if (savedRoadmap) {
            try {
                setRoadmap(JSON.parse(savedRoadmap));
            } catch (error) {
                console.error("Error parsing roadmap:", error);
            }
        }
    }, []);

    // Fetch user analytics from API
    const fetchAnalytics = async () => {
        setIsLoadingAnalytics(true);
        try {
            const response = await axios.get(`${API_URL}/en/api/web/analytics`);
            if (response.data) {
                setAnalytics(response.data);
                console.log("Fetched analytics data:", response.data);
            }
        } catch (error) {
            console.error("Error fetching user analytics:", error);
        } finally {
            setIsLoadingAnalytics(false);
        }
    };
    
    // Fetch global analytics (platform-wide)
    const fetchGlobalAnalytics = async () => {
        try {
            const response = await axios.get(`${API_URL}/en/api/web/analytics/global`);
            if (response.data) {
                setGlobalAnalytics(response.data);
                console.log("Fetched global analytics:", response.data);
            }
        } catch (error) {
            console.error("Error fetching global analytics:", error);
        }
    };

    // Fetch topic progress from API
    const fetchTopicProgress = async () => {
        try {
            const response = await axios.get(`${API_URL}/en/api/web/progress`);
            if (response.data && response.data.progress && response.data.progress.TopicProgress) {
                setTopicProgress(response.data.progress.TopicProgress);
            }
        } catch (error) {
            console.error("Error fetching topic progress:", error);
            
            // Fallback to localStorage
            const localProgress = localStorage.getItem("topicProgress");
            if (localProgress) {
                try {
                    setTopicProgress(JSON.parse(localProgress));
                } catch (e) {
                    console.error("Error parsing local progress:", e);
                }
            }
        }
    };

    // Format time spent (minutes to hours:minutes)
    const formatTimeSpent = (minutes) => {
        if (!minutes) return "0 min";
        
        if (minutes < 60) {
            return `${minutes} min`;
        }
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        return `${hours}h ${mins}m`;
    };

    // Get user stats from analytics
    const getAnalyticsStats = () => {
        if (!analytics || !analytics.analytics) {
            return {
                streakDays: 0,
                totalTopics: 0,
                viewedTopics: 0,
                completedTopics: 0,
                totalTimeMinutes: 0,
                avgQuizScore: 0,
                completionRate: 0,
                exercisesCompleted: 0
            };
        }
        
        const data = analytics.analytics;
        return {
            streakDays: data.streakDays || 0,
            totalTopics: roadmap.length || 0,
            viewedTopics: data.topicsViewed || 0,
            completedTopics: data.topicsCompleted || 0,
            totalTimeMinutes: data.totalLearningTime || 0,
            avgQuizScore: data.averageQuizScore || 0,
            completionRate: data.topicsCompleted / (roadmap.length || 1) * 100,
            exercisesCompleted: data.exercisesCompleted || 0
        };
    };

    const stats = getAnalyticsStats();

    return (
        <LeftBar>
            <div className="p-6 bg-dark-50 dark:bg-dark-950 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Learning Dashboard</h1>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`px-4 py-2 rounded-lg transition ${
                                activeTab === "overview"
                                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                                    : "text-dark-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800"
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab("progress")}
                            className={`px-4 py-2 rounded-lg transition ${
                                activeTab === "progress"
                                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                                    : "text-dark-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800"
                            }`}
                        >
                            Progress
                        </button>
                        <button
                            onClick={() => setActiveTab("activity")}
                            className={`px-4 py-2 rounded-lg transition ${
                                activeTab === "activity"
                                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                                    : "text-dark-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800"
                            }`}
                        >
                            Activity
                        </button>
                    </div>
                </div>

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <>
                        {/* Stats cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-md border border-dark-200/10 dark:border-dark-800/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm text-dark-500 dark:text-dark-400">Learning Streak</span>
                                        <h3 className="text-2xl font-bold text-dark-900 dark:text-white">{stats.streakDays} days</h3>
                                    </div>
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                                        <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-md border border-dark-200/10 dark:border-dark-800/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm text-dark-500 dark:text-dark-400">Topics Completed</span>
                                        <h3 className="text-2xl font-bold text-dark-900 dark:text-white">
                                            {stats.completedTopics}/{stats.totalTopics}
                                        </h3>
                                    </div>
                                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-md border border-dark-200/10 dark:border-dark-800/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm text-dark-500 dark:text-dark-400">Total Learning Time</span>
                                        <h3 className="text-2xl font-bold text-dark-900 dark:text-white">{formatTimeSpent(stats.totalTimeMinutes)}</h3>
                                    </div>
                                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                                        <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-md border border-dark-200/10 dark:border-dark-800/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm text-dark-500 dark:text-dark-400">Average Quiz Score</span>
                                        <h3 className="text-2xl font-bold text-dark-900 dark:text-white">{Math.round(stats.avgQuizScore)}%</h3>
                                    </div>
                                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                                        <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Weekly activity and completion progress */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Weekly activity chart */}
                            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-md border border-dark-200/10 dark:border-dark-800/50">
                                <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Weekly Activity</h3>
                                
                                {analytics && analytics.dailyActivity && analytics.dailyActivity.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end h-40">
                                            {analytics.dailyActivity.slice(-7).map((day, i) => (
                                                <div key={i} className="flex flex-col items-center flex-1">
                                                    <div className="w-full flex justify-center">
                                                        <div 
                                                            className="w-4/5 bg-primary-500 dark:bg-primary-600 rounded-t transition-all duration-300"
                                                            style={{ 
                                                                height: `${Math.min(100, (day.learningTimeMin / 60) * 100)}%`,
                                                                minHeight: day.learningTimeMin > 0 ? '8px' : '0'
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-dark-500 dark:text-dark-400 mt-2">
                                                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                                    </div>
                                                    <div className="text-xs font-medium text-dark-700 dark:text-dark-300">
                                                        {day.learningTimeMin}m
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <div className="text-green-600 dark:text-green-400 font-medium flex items-center">
                                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                                {analytics.dailyActivity.length > 0 ? 
                                                    `${analytics.dailyActivity.reduce((sum, day) => sum + day.learningTimeMin, 0)} min this week` : 
                                                    'No data yet'}
                                            </div>
                                            <div className="text-dark-500 dark:text-dark-400">
                                                {analytics.dailyActivity.length > 0 ? 
                                                    `${analytics.dailyActivity.filter(day => day.learningTimeMin > 0).length} active days` : 
                                                    '0 active days'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-center items-center h-40 text-dark-400 dark:text-dark-500">
                                        No activity data available yet
                                    </div>
                                )}
                            </div>

                            {/* Completion progress */}
                            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-md border border-dark-200/10 dark:border-dark-800/50">
                                <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Learning Progress</h3>
                                
                                <div className="space-y-6">
                                    {/* Progress bars */}
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-dark-700 dark:text-dark-300">Topics Completion</span>
                                                <span className="text-sm font-medium text-dark-900 dark:text-white">
                                                    {stats.completedTopics}/{stats.totalTopics}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-dark-100 dark:bg-dark-800 rounded-full">
                                                <div 
                                                    className="h-2 bg-green-500 dark:bg-green-600 rounded-full"
                                                    style={{ width: `${(stats.completedTopics / (stats.totalTopics || 1)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-dark-700 dark:text-dark-300">Total Views</span>
                                                <span className="text-sm font-medium text-dark-900 dark:text-white">
                                                    {stats.viewedTopics}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-dark-100 dark:bg-dark-800 rounded-full">
                                                <div 
                                                    className="h-2 bg-blue-500 dark:bg-blue-600 rounded-full"
                                                    style={{ width: `${(stats.viewedTopics / (stats.totalTopics || 1)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-dark-700 dark:text-dark-300">Exercises Completed</span>
                                                <span className="text-sm font-medium text-dark-900 dark:text-white">
                                                    {stats.exercisesCompleted}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-dark-100 dark:bg-dark-800 rounded-full">
                                                <div 
                                                    className="h-2 bg-purple-500 dark:bg-purple-600 rounded-full"
                                                    style={{ width: `${Math.min(100, (stats.exercisesCompleted / 10) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Overall completion status */}
                                    <div className="bg-dark-50 dark:bg-dark-800/30 rounded-lg p-4 flex items-center justify-between">
                                        <div>
                                            <span className="text-sm text-dark-600 dark:text-dark-300">Overall Completion</span>
                                            <div className="text-lg font-bold text-dark-900 dark:text-white">{Math.round(stats.completionRate)}%</div>
                                        </div>
                                        <div className="h-16 w-16 rounded-full bg-dark-100 dark:bg-dark-700 flex items-center justify-center relative">
                                            <svg className="h-16 w-16 transform -rotate-90">
                                                <circle
                                                    cx="32"
                                                    cy="32"
                                                    r="24"
                                                    fill="none"
                                                    stroke="#e5e7eb"
                                                    strokeWidth="8"
                                                    className="dark:opacity-30"
                                                />
                                                <circle
                                                    cx="32"
                                                    cy="32"
                                                    r="24"
                                                    fill="none"
                                                    stroke="#10b981"
                                                    strokeWidth="8"
                                                    strokeDasharray={`${24 * 2 * Math.PI}`}
                                                    strokeDashoffset={`${24 * 2 * Math.PI - (stats.completionRate / 100) * 24 * 2 * Math.PI}`}
                                                    className="transition-all duration-1000"
                                                />
                                            </svg>
                                            <span className="absolute text-sm font-bold text-dark-900 dark:text-white">
                                                {Math.round(stats.completionRate)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Most viewed topics */}
                        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-md border border-dark-200/10 dark:border-dark-800/50 mb-6">
                            <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Most Viewed Topics</h3>
                            
                            {analytics && analytics.topInteractions && analytics.topInteractions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-dark-200 dark:divide-dark-700">
                                        <thead className="bg-dark-50 dark:bg-dark-800/30">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Topic</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Views</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Time Spent</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">Last Visited</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-dark-900 divide-y divide-dark-200 dark:divide-dark-700">
                                            {analytics.topInteractions.slice(0, 5).map((topic, index) => (
                                                <tr key={index} className="hover:bg-dark-50 dark:hover:bg-dark-800/30 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-dark-900 dark:text-white">{topic.topicName}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-dark-700 dark:text-dark-300">{topic.viewCount}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-dark-700 dark:text-dark-300">{formatTimeSpent(topic.timeSpent || 0)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {topic.completedAt ? (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                                Completed
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                                                                In Progress
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-700 dark:text-dark-300">
                                                        {topic.lastViewed ? new Date(topic.lastViewed).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-dark-500 dark:text-dark-400">
                                    No topic activity data available yet
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Progress Tab */}
                {activeTab === "progress" && (
                    <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-md border border-dark-200/10 dark:border-dark-800/50">
                        <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Your Learning Journey</h3>
                        <ProgressOverview 
                            roadmap={roadmap} 
                            topicProgress={topicProgress}
                            isCompact={false}
                            showViewAll={false} 
                        />
                    </div>
                )}

                {/* Activity Tab */}
                {activeTab === "activity" && (
                    <div className="space-y-6">
                        {/* Daily learning streak */}
                        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-md border border-dark-200/10 dark:border-dark-800/50">
                            <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Daily Learning Streak</h3>
                            
                            {analytics && analytics.dailyActivity && analytics.dailyActivity.length > 0 ? (
                                <div className="grid grid-cols-7 gap-2">
                                    {Array.from({ length: 28 }, (_, i) => {
                                        const dayIndex = analytics.dailyActivity.length - 28 + i;
                                        const day = dayIndex >= 0 ? analytics.dailyActivity[dayIndex] : null;
                                        
                                        let bgColor = "bg-dark-100 dark:bg-dark-800";
                                        if (day && day.learningTimeMin > 0) {
                                            if (day.learningTimeMin < 15) {
                                                bgColor = "bg-green-200 dark:bg-green-900/30";
                                            } else if (day.learningTimeMin < 30) {
                                                bgColor = "bg-green-300 dark:bg-green-800/50";
                                            } else if (day.learningTimeMin < 60) {
                                                bgColor = "bg-green-400 dark:bg-green-700/70";
                                            } else {
                                                bgColor = "bg-green-500 dark:bg-green-600";
                                            }
                                        }
                                        
                                        return (
                                            <div key={i} className={`h-10 rounded-md ${bgColor} flex items-center justify-center`}>
                                                {day && (
                                                    <span className="text-xs font-medium text-dark-900 dark:text-white">
                                                        {new Date(day.date).getDate()}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-dark-500 dark:text-dark-400">
                                    No activity data available yet
                                </div>
                            )}
                            
                            <div className="mt-4 flex items-center justify-between text-sm text-dark-500 dark:text-dark-400">
                                <div>Less</div>
                                <div className="flex space-x-1">
                                    <div className="w-4 h-4 rounded bg-dark-100 dark:bg-dark-800"></div>
                                    <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900/30"></div>
                                    <div className="w-4 h-4 rounded bg-green-300 dark:bg-green-800/50"></div>
                                    <div className="w-4 h-4 rounded bg-green-400 dark:bg-green-700/70"></div>
                                    <div className="w-4 h-4 rounded bg-green-500 dark:bg-green-600"></div>
                                </div>
                                <div>More</div>
                            </div>
                        </div>
                        
                        {/* Recent activities */}
                        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-md border border-dark-200/10 dark:border-dark-800/50">
                            <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Recent Activities</h3>
                            
                            {analytics && analytics.recentActivities && analytics.recentActivities.length > 0 ? (
                                <div className="space-y-4">
                                    {analytics.recentActivities.map((activity, index) => (
                                        <div key={index} className="border-l-2 border-primary-500 dark:border-primary-600 pl-4 py-2">
                                            <div className="text-sm font-medium text-dark-900 dark:text-white">{activity.description}</div>
                                            <div className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                                                {new Date(activity.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-dark-500 dark:text-dark-400">
                                    No recent activities to display
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </LeftBar>
    );
}

export default Dashboard;
