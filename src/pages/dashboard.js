import React, { useEffect, useState } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import { ChartBar, BookOpen, Clock, Award, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProgressOverview from "../components/skills/ProgressOverview";

function Dashboard() {
    const [user, setUser] = useState({ username: "" });
    const [isMobile, setIsMobile] = useState(false);
    const [topicProgress, setTopicProgress] = useState({});
    const [roadmap, setRoadmap] = useState([]);
    const [nextTopics, setNextTopics] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [learningTime, setLearningTime] = useState({ current: 0, previous: 0, goal: 20 });

    // Load data from localStorage on component mount
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
        if (savedRoadmap) {
            try {
                const parsedRoadmap = JSON.parse(savedRoadmap);
                setRoadmap(parsedRoadmap);
                
                // Extract next topics (not completed topics)
                const inProgressOrNotStarted = parsedRoadmap
                    .filter(topic => {
                        // Get clean topic name
                        let topicName = topic;
                        if (topic && topic.includes && topic.includes(":")) {
                            topicName = topic.split(":")[0].trim();
                        }
                        const status = parsedProgress[topicName];
                        return status !== "completed";
                    })
                    .slice(0, 2); // Take first 2 uncompleted topics
                
                setNextTopics(inProgressOrNotStarted);
                
                // Extract achievements (completed topics)
                const completedTopics = Object.entries(parsedProgress)
                    .filter(([_, status]) => status === "completed")
                    .map(([topic]) => ({
                        name: topic,
                        date: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000) // Random date within last 2 weeks
                    }))
                    .sort((a, b) => b.date - a.date) // Sort most recent first
                    .slice(0, 3); // Take top 3
                
                setAchievements(completedTopics);
                
                // Simulate learning time data
                const timeData = {
                    current: Math.round((Object.values(parsedProgress).filter(s => s === "completed").length * 4) + 
                              (Object.values(parsedProgress).filter(s => s === "in-progress").length * 2)),
                    previous: Math.round((Object.values(parsedProgress).filter(s => s === "completed").length * 2.5) + 
                               (Object.values(parsedProgress).filter(s => s === "in-progress").length * 1.5)),
                    goal: 20
                };
                setLearningTime(timeData);
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

    // Compute stats for the dashboard
    const completedCount = Object.values(topicProgress).filter(status => status === "completed").length;
    const inProgressCount = Object.values(topicProgress).filter(status => status === "in-progress").length;
    const totalHours = completedCount * 4 + inProgressCount * 2; // Estimate 4 hours per completed topic, 2 for in-progress

    const stats = [
        { label: "Skills in Progress", value: inProgressCount, icon: <BookOpen size={20} />, color: "bg-blue-500" },
        { label: "Skills Completed", value: completedCount, icon: <Award size={20} />, color: "bg-green-500" },
        { label: "Hours Learned", value: totalHours, icon: <Clock size={20} />, color: "bg-purple-500" },
    ];

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
                {/* Header */}
                <div className="max-w-7xl mx-auto p-4 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-dark-900 dark:text-white">Dashboard</h1>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="bg-base-white dark:bg-dark-900 rounded-xl p-4 shadow-md border border-dark-200/10 dark:border-dark-800/50"
                            >
                                <div className="flex items-center">
                                    <div className={`${stat.color} p-3 rounded-lg text-white mr-4`}>
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <p className="text-dark-500 dark:text-dark-400 text-sm">{stat.label}</p>
                                        <h3 className="text-2xl font-bold text-dark-900 dark:text-white">{stat.value}</h3>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Skills Progress */}
                        <div className="md:col-span-2">
                            <h2 className="text-xl font-bold mb-4 text-dark-900 dark:text-white flex items-center">
                                <ChartBar className="mr-2 text-primary-500" size={24} />
                                Your Learning Progress
                            </h2>
                            <div className="bg-base-white dark:bg-dark-900 rounded-xl p-6 shadow-md border border-dark-200/10 dark:border-dark-800/50">
                                <ProgressOverview roadmap={roadmap} topicProgress={topicProgress} />

                                <div className="mt-6 pt-6 border-t border-dark-200/20 dark:border-dark-700/30">
                                    <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-4">Next Topics</h3>
                                    {nextTopics.length > 0 ? (
                                        <div className="space-y-3">
                                            {nextTopics.map((topic, index) => {
                                                let topicName = topic;
                                                if (topic && topic.includes && topic.includes(":")) {
                                                    topicName = topic.split(":")[0].trim();
                                                }
                                                
                                                // You can add more dynamic descriptions in the future
                                                const descriptions = {
                                                    "JavaScript": "Functions, Objects, Promises",
                                                    "React": "Components, Hooks, State Management",
                                                    "CSS": "Flexbox, Grid, Animations",
                                                    "HTML": "Semantic Elements, Accessibility, Forms",
                                                    "Node.js": "Express, APIs, Authentication",
                                                    "Python": "Data Types, Functions, OOP",
                                                };
                                                
                                                // Find a matching description or use a generic one
                                                let description = "Core concepts and practical applications";
                                                for (const [key, value] of Object.entries(descriptions)) {
                                                    if (topicName.toLowerCase().includes(key.toLowerCase())) {
                                                        description = value;
                                                        break;
                                                    }
                                                }
                                                
                                                return (
                                                    <div key={index} className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium text-dark-900 dark:text-white">{topicName}</p>
                                                            <p className="text-sm text-dark-500 dark:text-dark-400">{description}</p>
                                                        </div>
                                                        <Link 
                                                            to="/skills" 
                                                            className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                                                        >
                                                            <ArrowRight size={20} />
                                                        </Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-dark-500 dark:text-dark-400">
                                            You don't have any topics in progress. Start learning a new skill!
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Content */}
                        <div>
                            <h2 className="text-xl font-bold mb-4 text-dark-900 dark:text-white flex items-center">
                                <BookOpen className="mr-2 text-primary-500" size={24} />
                                Recent Achievements
                            </h2>
                            <div className="bg-base-white dark:bg-dark-900 rounded-xl p-6 shadow-md border border-dark-200/10 dark:border-dark-800/50 mb-6">
                                <div className="space-y-4">
                                    {achievements.length > 0 ? (
                                        achievements.map((achievement, index) => {
                                            // Assign a different color to each achievement
                                            const colors = ["green", "blue", "purple"];
                                            const color = colors[index % colors.length];
                                            
                                            return (
                                                <div key={index} className="flex items-start">
                                                    <div className={`bg-${color}-100 dark:bg-${color}-900/30 p-2 rounded-full mr-3`}>
                                                        <Award className={`text-${color}-500`} size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-dark-900 dark:text-white">{achievement.name}</p>
                                                        <p className="text-sm text-dark-500 dark:text-dark-400">
                                                            Completed {formatTimeAgo(achievement.date)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-dark-500 dark:text-dark-400">
                                            You haven't completed any topics yet. Keep learning!
                                        </p>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-xl font-bold mb-4 text-dark-900 dark:text-white flex items-center">
                                <Clock className="mr-2 text-primary-500" size={24} />
                                Time Spent
                            </h2>
                            <div className="bg-base-white dark:bg-dark-900 rounded-xl p-6 shadow-md border border-dark-200/10 dark:border-dark-800/50">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-dark-900 dark:text-white font-medium">This Week</p>
                                    <p className="text-primary-500 dark:text-primary-400 font-bold">{learningTime.current} hours</p>
                                </div>
                                <div className="h-2 bg-dark-200 dark:bg-dark-700 rounded-full mb-4">
                                    <div 
                                        className="h-2 bg-primary-500 rounded-full" 
                                        style={{ width: `${Math.min(100, (learningTime.current / learningTime.goal) * 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-sm text-dark-500 dark:text-dark-400">
                                    <span>Previous: {learningTime.previous} hours</span>
                                    <span>Goal: {learningTime.goal} hours</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LeftBar>
    );
}

export default Dashboard;
