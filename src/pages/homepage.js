import React, { useState, useEffect } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Calendar, ChartBar, Clock, Award, FlameIcon, TrendingUp, Target } from "lucide-react";
import ProgressOverview from "../components/skills/ProgressOverview";
import axios from "axios";

// API URL for our backend
const API_URL = "http://localhost:5000";

function Homepage() {
    const [user, setUser] = useState({ username: "" });
    const [currentUser, setCurrentUser] = useState({ displayName: "" });
    const [isMobile, setIsMobile] = useState(false);
    const [quickAccessItems, setQuickAccessItems] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [userProgress, setUserProgress] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

    // Load user data from localStorage on component mount
    useEffect(() => {
        // Load user data
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }

        // Load current user data with displayName
        const currentUserData = localStorage.getItem("currentUser");
        if (currentUserData) {
            try {
                const parsedCurrentUser = JSON.parse(currentUserData);
                setCurrentUser(parsedCurrentUser);
            } catch (error) {
                console.error("Error parsing current user data:", error);
            }
        }

        // Load roadmap data for quick access items
        const savedRoadmap = localStorage.getItem("lastRoadmap");
        const savedTopic = localStorage.getItem("lastTopic");
        
        // Fetch user progress data from API
        fetchUserProgress();
        
        // Fetch user analytics
        fetchUserAnalytics();
        
        if (savedRoadmap) {
            try {
                const parsedRoadmap = JSON.parse(savedRoadmap);

                // Generate dynamic quick access items
                generateQuickAccessItems(savedTopic, parsedRoadmap);
                
            } catch (error) {
                console.error("Error parsing roadmap data:", error);
            }
        }
    }, []);

    // Fetch user analytics from API
    const fetchUserAnalytics = async () => {
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

    // Fetch user progress from API
    const fetchUserProgress = async () => {
        try {
            const response = await axios.get(`${API_URL}/en/api/web/progress`);
            if (response.data && response.data.progress) {
                setUserProgress(response.data);
                
                // Generate activity history from progress data
                generateActivityHistory(response.data.progress);
            }
        } catch (error) {
            console.error("Error fetching user progress:", error);
        }
    };
    
    // Generate quick access items
    const generateQuickAccessItems = (savedTopic, roadmap) => {
        const dynamicItems = [
            { 
                title: "Continue Learning", 
                description: savedTopic || "JavaScript Basics",
                link: "/skills", 
                icon: <BookOpen size={24} />,
                color: "bg-primary-500 dark:bg-primary-500"
            },
            { 
                title: "Learning Analytics", 
                description: "View your learning statistics", 
                link: "/dashboard", 
                icon: <ChartBar size={24} />,
                color: "bg-primary-500 dark:bg-primary-500"
            },
            { 
                title: "Latest Chats", 
                description: "AI Mentor", 
                link: "/chat", 
                icon: <BookOpen size={24} />,
                color: "bg-primary-500 dark:bg-primary-500"
            },
            { 
                title: "Your Progress", 
                description: "Track your learning journey", 
                link: "/dashboard", 
                icon: <Target size={24} />,
                color: "bg-primary-500 dark:bg-primary-500"
            }
        ];
        
        setQuickAccessItems(dynamicItems);
    };
    
    // Generate activity history from progress data
    const generateActivityHistory = (progress) => {
        if (!progress || !progress.TopicProgress) {
            setRecentActivities([{
                activity: "Created your account",
                time: "Just now",
                progress: 100
            }]);
            return;
        }
        
        // Create activities from topic progress
        const activities = [];
        
        Object.entries(progress.TopicProgress).forEach(([topic, status]) => {
            if (status.Completed || status.completed) {
                activities.push({
                    activity: `Completed ${topic}`,
                    time: status.CompletedAt || status.completedAt || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    progress: 100
                });
            } else if (status.Viewed || status.viewed) {
                activities.push({
                    activity: `Started ${topic}`,
                    time: status.LastViewed || status.lastViewed || new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
                    progress: 50
                });
            }
        });
        
        // Sort activities by time (most recent first) and take first 4
        const sortedActivities = activities
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 4)
            .map(item => ({
                ...item,
                time: formatTimeAgo(new Date(item.time))
            }));
            
        if (sortedActivities.length === 0) {
            sortedActivities.push({
                activity: "Created your account",
                time: "Just now",
                progress: 100
            });
        }
        
        setRecentActivities(sortedActivities);
    };

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    // Function to format a date
    const formatTimeAgo = (date) => {
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) return "Today";
        if (diffInDays === 1) return "Yesterday";
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 14) return "1 week ago";
        if (diffInDays < 30) return `${Math.floor(diffInDays/7)} weeks ago`;
        return `${Math.floor(diffInDays/30)} months ago`;
    };

    // Get user stats from analytics or default values
    const getAnalyticsStats = () => {
        if (!analytics || !analytics.analytics) {
            return {
                streakDays: 0,
                totalTime: 0,
                completedTopics: userProgress?.progress?.CompletedTopics || 0,
                completionRate: userProgress?.stats?.completionRate || 0
            };
        }
        
        const data = analytics.analytics;
        return {
            streakDays: data.streakDays || 0,
            totalTime: data.totalLearningTime || 0,
            completedTopics: data.topicsCompleted || userProgress?.progress?.CompletedTopics || 0,
            completionRate: data.topicCompletionRate || userProgress?.stats?.completionRate || 0
        };
    };

    const stats = getAnalyticsStats();

    return (
        <LeftBar>
            <div className={`${isMobile ? "mt-16" : ""} p-4 bg-dark-50 dark:bg-dark-950 min-h-screen`}>
                {/* Welcome section */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600 
                              rounded-xl p-6 mb-8 ml-2 text-base-white shadow-lg">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2 select-none">
                        Welcome back, {currentUser.displayName || user.username || "User"}!
                    </h1>
                    <p className="mb-4 opacity-90 select-none">Ready to continue your learning journey?</p>
                    <Link
                        to="/skills"
                        className="inline-flex items-center bg-base-white dark:bg-dark-900 text-primary-600 dark:text-primary-400 
                                 px-4 py-2 rounded-lg font-medium hover:scale-105 transition-transform shadow-md"
                    >
                        Go to Skills <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </div>

                {/* Learning statistics section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4 shadow-md border border-dark-200/10 dark:border-dark-800/50">
                        <div className="flex items-center">
                            <div className="bg-blue-500 p-3 rounded-lg text-white mr-4">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <p className="text-dark-500 dark:text-dark-400 text-sm">Streak</p>
                                <h3 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center">
                                    {stats.streakDays} {stats.streakDays === 1 ? "day" : "days"}
                                    {stats.streakDays > 0 && <FlameIcon size={18} className="ml-2 text-orange-500" />}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4 shadow-md border border-dark-200/10 dark:border-dark-800/50">
                        <div className="flex items-center">
                            <div className="bg-green-500 p-3 rounded-lg text-white mr-4">
                                <Award size={20} />
                            </div>
                            <div>
                                <p className="text-dark-500 dark:text-dark-400 text-sm">Topics Completed</p>
                                <h3 className="text-2xl font-bold text-dark-900 dark:text-white">{stats.completedTopics}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4 shadow-md border border-dark-200/10 dark:border-dark-800/50">
                        <div className="flex items-center">
                            <div className="bg-purple-500 p-3 rounded-lg text-white mr-4">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-dark-500 dark:text-dark-400 text-sm">Learning Time</p>
                                <h3 className="text-2xl font-bold text-dark-900 dark:text-white">{stats.totalTime} min</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4 shadow-md border border-dark-200/10 dark:border-dark-800/50">
                        <div className="flex items-center">
                            <div className="bg-yellow-500 p-3 rounded-lg text-white mr-4">
                                <Target size={20} />
                            </div>
                            <div>
                                <p className="text-dark-500 dark:text-dark-400 text-sm">Completion Rate</p>
                                <h3 className="text-2xl font-bold text-dark-900 dark:text-white">{Math.round(stats.completionRate)}%</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick access section */}
                <h2 className="text-2xl font-bold mb-4 ml-2 text-dark-900 dark:text-base-white">Quick Access</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {quickAccessItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.link}
                            className="bg-base-white dark:bg-dark-900 rounded-xl p-4 transition-all hover:scale-105 
                                     hover:shadow-lg border border-dark-200/10 dark:border-dark-800/50
                                     text-dark-900 dark:text-base-white shadow-md"
                        >
                            <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 text-base-white shadow-md`}>
                                {item.icon}
                            </div>
                            <h3 className="font-bold text-lg">{item.title}</h3>
                            <p className="text-sm text-dark-600 dark:text-dark-300 mt-1">{item.description}</p>
                        </Link>
                    ))}
                </div>

                {/* Recent activity and recommended sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent activity */}
                    <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-dark-200/10 dark:border-dark-800/50">
                        <h2 className="text-xl font-bold mb-4 text-dark-900 dark:text-base-white">Recent Activity</h2>
                        <div className="space-y-4">
                            {recentActivities.map((item, index) => (
                                <div key={index} className="border-b border-dark-200/10 dark:border-dark-800/50 pb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-dark-800 dark:text-dark-200">{item.activity}</p>
                                        <span className="text-sm text-dark-500 dark:text-dark-400">{item.time}</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-dark-100 dark:bg-dark-800">
                                        <div
                                            className="h-2 rounded-full bg-primary-500 dark:bg-primary-600 transition-all duration-300"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-dark-200/10 dark:border-dark-800/50">
                        <div className="flex flex-col space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-4 text-dark-900 dark:text-base-white">Learning Progress</h2>
                                {analytics && analytics.dailyActivity && analytics.dailyActivity.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm text-dark-500 dark:text-dark-400 mb-2">
                                            <span>Learning activity (last 7 days)</span>
                                        </div>
                                        <div className="flex h-20 items-end space-x-2">
                                            {analytics.dailyActivity.slice(-7).map((day, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center">
                                                    <div 
                                                        className="w-full bg-primary-500 dark:bg-primary-600 rounded-t transition-all duration-300"
                                                        style={{ 
                                                            height: `${Math.min(100, (day.learningTimeMin / 60) * 100)}%`,
                                                            minHeight: day.learningTimeMin > 0 ? '8px' : '0'
                                                        }}
                                                    />
                                                    <span className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                                                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }).charAt(0)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <ProgressOverview 
                                        isCompact={true} 
                                        showViewAll={true} 
                                        roadmap={userProgress?.roadmap || []} 
                                        topicProgress={userProgress?.TopicProgress || {}}
                                    />
                                )}
                                
                                {analytics && analytics.topInteractions && analytics.topInteractions.length > 0 && (
                                    <div className="mt-6 pt-4 border-t border-dark-200/20 dark:border-dark-700/30">
                                        <h3 className="font-semibold text-dark-900 dark:text-white mb-3">Your Top Topics</h3>
                                        <div className="space-y-2">
                                            {analytics.topInteractions.slice(0, 3).map((interaction, i) => (
                                                <Link 
                                                    key={i}
                                                    to={`/skills/lecture/${encodeURIComponent(interaction.topicName)}`}
                                                    className="flex items-center justify-between p-2 hover:bg-dark-100 dark:hover:bg-dark-800/30 rounded-md transition-colors"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium text-dark-900 dark:text-white">{interaction.topicName}</span>
                                                        {interaction.completedAt && (
                                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded">
                                                                Completed
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-dark-500 dark:text-dark-400">
                                                        {interaction.viewCount} views
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LeftBar>
    );
}

export default Homepage;
