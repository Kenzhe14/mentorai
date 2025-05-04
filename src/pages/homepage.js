import React, { useState, useEffect } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Calendar, ChartBar } from "lucide-react";
import ProgressOverview from "../components/skills/ProgressOverview";

function Homepage() {
    const [user, setUser] = useState({ username: "" });
    const [currentUser, setCurrentUser] = useState({ displayName: "" });
    const [isMobile, setIsMobile] = useState(false);
    const [topicProgress, setTopicProgress] = useState({});
    const [roadmap, setRoadmap] = useState([]);
    const [quickAccessItems, setQuickAccessItems] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

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

        // Load progress data
        let parsedProgress = {};
        const savedProgress = localStorage.getItem("topicProgress");
        if (savedProgress) {
            try {
                parsedProgress = JSON.parse(savedProgress);
                setTopicProgress(parsedProgress);
            } catch (error) {
                console.error("Error parsing progress data:", error);
            }
        }

        // Load roadmap data
        const savedRoadmap = localStorage.getItem("lastRoadmap");
        const savedTopic = localStorage.getItem("lastTopic");
        if (savedRoadmap) {
            try {
                const parsedRoadmap = JSON.parse(savedRoadmap);
                setRoadmap(parsedRoadmap);

                // Generate dynamic quick access items
                const dynamicItems = [
                    { 
                        title: "Continue Learning", 
                        description: savedTopic || "JavaScript Basics",
                        link: "/skills", 
                        icon: <BookOpen size={24} />,
                        color: "bg-primary-500 dark:bg-primary-500"
                    },
                    { 
                        title: "Upcoming Session", 
                        description: "React Hooks with Alex - Tomorrow, 3 PM", 
                        link: "/dashboard", 
                        icon: <Calendar size={24} />,
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
                        description: `${Object.values(parsedProgress || {}).filter(s => s === "completed").length} completed, ${Object.values(parsedProgress || {}).filter(s => s === "in-progress").length} in progress`, 
                        link: "/dashboard", 
                        icon: <ChartBar size={24} />,
                        color: "bg-primary-500 dark:bg-primary-500"
                    }
                ];
                setQuickAccessItems(dynamicItems);

                // Generate dynamic recent activities
                // This uses the progress data to create realistic recent activities
                const completedTopics = Object.entries(parsedProgress || {})
                    .filter(([_, status]) => status === "completed")
                    .map(([topic]) => ({
                        activity: `Completed ${topic}`,
                        time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
                        progress: 100
                    }));

                const inProgressTopics = Object.entries(parsedProgress || {})
                    .filter(([_, status]) => status === "in-progress")
                    .map(([topic]) => ({
                        activity: `Started ${topic}`,
                        time: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Random date within last 2 weeks
                        progress: Math.floor(Math.random() * 50) + 30 // Random progress between 30-80%
                    }));

                // Sort combined activities by time (most recent first) and take first 4
                const allActivities = [...completedTopics, ...inProgressTopics]
                    .sort((a, b) => b.time - a.time)
                    .slice(0, 4)
                    .map(item => ({
                        ...item,
                        time: formatTimeAgo(item.time)
                    }));

                if (allActivities.length === 0) {
                    // If no activities, add a default one
                    allActivities.push({ 
                        activity: "Created your account", 
                        time: "Just now", 
                        progress: 100 
                    });
                }
                
                setRecentActivities(allActivities);
            } catch (error) {
                console.error("Error parsing roadmap data:", error);
            }
        }
    }, []);

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

                    {/* Recommended for you */}
                    <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-dark-200/10 dark:border-dark-800/50">
                        <div className="flex flex-col space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-4 text-dark-900 dark:text-base-white">Learning Progress</h2>
                                <ProgressOverview 
                                    isCompact={true} 
                                    showViewAll={true} 
                                    roadmap={roadmap} 
                                    topicProgress={topicProgress}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LeftBar>
    );
}

export default Homepage;
