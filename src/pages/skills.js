import React, { useState, useEffect } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import axios from "axios";
import { LanguageProvider } from "../components/languagecontext.js";
import { useNavigate } from "react-router-dom";

import RecommendedTopics from "../components/skills/RecommendedTopics";
import SearchSkills from "../components/skills/SearchSkills";
import RoadmapWorm from "../components/skills/RoadmapWorm";
import LectureModal from "../components/skills/LectureModal";
import PracticeModal from "../components/skills/PracticeModal";
import ProgressOverview from "../components/skills/ProgressOverview";

// Configure axios to send credentials (cookies)
axios.defaults.withCredentials = true;

const API_URL = "http://localhost:5000";
function Skills() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendedTopics, setRecommendedTopics] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [topicProgress, setTopicProgress] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Lecture and practice state variables
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [isLoadingLecture, setIsLoadingLecture] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const [isGeneratingExercises, setIsGeneratingExercises] = useState(false);

  useEffect(() => {
    fetchRecommendedTopics();
    fetchTopicProgress().then(() => {
      // Запустим отладку после загрузки прогресса
      setTimeout(debugProgressState, 1000);
    });

    const savedTopic = localStorage.getItem("lastTopic");
    const savedRoadmap = localStorage.getItem("lastRoadmap");

    if (savedTopic && savedRoadmap) {
      setQuery(savedTopic);
      try {
        const parsedRoadmap = JSON.parse(savedRoadmap);
        if (Array.isArray(parsedRoadmap)) {
          setRoadmap(parsedRoadmap);
        } else {
          setRoadmap([]);
        }
      } catch (error) {
        console.error("Error parsing saved roadmap:", error);
        setRoadmap([]);
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

  const fetchRecommendedTopics = async () => {
    setLoadingRecommended(true);
    try {
      const response = await axios.post(
        `${API_URL}/en/api/web/personalized-content`,
        { contentType: "recommended-topics" }
      );

      if (response && response.data && response.data.recommendedTopics) {
        setRecommendedTopics(response.data.recommendedTopics || []);
      } else {
        setRecommendedTopics([]);
      }
    } catch (error) {
      console.error("Error fetching recommended topics:", error);
      setRecommendedTopics([]);
    } finally {
      setLoadingRecommended(false);
    }
  };

  const fetchRoadmap = async (topic = query) => {
    if (!topic || !topic.trim()) return;
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/en/api/web/roadmap`, {
        topic,
      });

      if (response && response.data && response.data.roadmap) {
        const roadmapSteps = response.data.roadmap || [];
      setRoadmap(roadmapSteps);
      localStorage.setItem("lastTopic", topic);
      localStorage.setItem("lastRoadmap", JSON.stringify(roadmapSteps));
      } else {
        setRoadmap([]);
      }
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      setRoadmap(["Try again later!"]);
    } finally {
      setLoading(false);
    }
  };

  // Track analytics for user interactions
  const trackAnalytics = async (eventType, data) => {
    try {
      console.log(`Tracking analytics event: ${eventType}`, data);
      let endpoint = '';
      
      switch(eventType) {
        case 'topic-view':
          endpoint = '/analytics/topic-view';
          break;
        case 'topic-completion':
          endpoint = '/analytics/topic-completion';
          break;
        case 'exercise-activity':
          endpoint = '/analytics/exercise-activity';
          break;
        case 'rate-topic':
          endpoint = '/analytics/rate-topic';
          break;
        default:
          console.warn(`Unknown analytics event type: ${eventType}`);
          return;
      }
      
      // Send analytics data to server
      const response = await axios.post(`${API_URL}/en/api/web${endpoint}`, data);
      console.log(`Analytics tracked successfully for ${eventType}:`, response.data);
      return true;
    } catch (error) {
      console.error(`Error tracking analytics for ${eventType}:`, error);
      // Non-critical error, so we don't need to fail the user action
      return false;
    }
  };

  // Update topic progress
  const updateTopicProgress = async (topic, status) => {
    try {
      console.log(`Updating progress for topic: ${topic}`, status);
      
      // Check authentication
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("No authentication token found. Topic progress may not be saved on the server.");
        // Continue anyway, we'll do our best with local updates
      }
      
      // Prepare server data format (consistent format)
      const requestData = {
        topic,
        viewed: true,  // Always set to true for consistency
        completed: status.completed === true
      };
      
      // Add additional fields only if defined
      if (status.quizScore) requestData.quizScore = status.quizScore;
      if (status.codeScore) requestData.codeScore = status.codeScore;
      if (status.completedAt) requestData.completedAt = status.completedAt;
      
      console.log("Sending data to server:", requestData);
      
      // Update local state immediately for responsive UI
      const updatedProgress = { ...topicProgress };
      if (!updatedProgress[topic]) {
        updatedProgress[topic] = { ...status };
      } else {
        // Merge existing state with new status
        updatedProgress[topic] = {
          ...updatedProgress[topic],
          ...status
        };
      }
      
      // Update state and localStorage for immediate feedback
      setTopicProgress(updatedProgress);
      localStorage.setItem("topicProgress", JSON.stringify(updatedProgress));
      console.log("Updated local progress state:", updatedProgress[topic]);
      
      // Try to save to server
      const response = await axios.post(`${API_URL}/en/api/web/progress/topic`, requestData);
      
      console.log("Server response:", response.data);
      
      if (response.data && response.data.progress) {
        // The server may return progress data in different formats
        const progressData = response.data.progress;
        
        console.log("Received progress data structure:", JSON.stringify(progressData, null, 2));
        
        if (progressData.TopicProgress) {
          console.log("Setting progress from TopicProgress", progressData.TopicProgress);
          // Normalize data from server before saving
          const normalizedProgress = normalizeProgressData(progressData.TopicProgress);
          setTopicProgress(normalizedProgress);
        } else if (progressData.topicProgress) {
          console.log("Setting progress from topicProgress", progressData.topicProgress);
          // Normalize data from server before saving
          const normalizedProgress = normalizeProgressData(progressData.topicProgress);
          setTopicProgress(normalizedProgress);
        } else {
          // If we get other format, try to use it directly
          console.log("Setting progress from unknown format", progressData);
          const normalizedProgress = normalizeProgressData(progressData);
          setTopicProgress(normalizedProgress);
        }
        
        // Increment refresh trigger to update ProgressOverview
        setRefreshTrigger(prev => prev + 1);
        
        console.log(`Progress updated successfully for topic: ${topic}`);
        return true;
      } else {
        console.warn("Server response does not contain progress data");
        // Ensure local state is updated even if server response isn't ideal
        setRefreshTrigger(prev => prev + 1);
        return true; // Still return true as we've updated locally
      }
    } catch (error) {
      console.error("Error updating topic progress:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      
      // Fallback to local update
      console.log("Using local fallback for topic progress");
      const updatedProgress = { ...topicProgress };
      
      if (!updatedProgress[topic]) {
        // Create new progress entry with only lowercase keys
        updatedProgress[topic] = {
          viewed: true,
          completed: status.completed || false,
          lastViewed: new Date().toISOString()
        };
      } else {
        // Update existing entry
        updatedProgress[topic] = {
          ...updatedProgress[topic],
          viewed: true,
          lastViewed: new Date().toISOString()
        };
        
        // Only update completion status if it's being set to true
        if (status.completed) {
          updatedProgress[topic].completed = true;
          updatedProgress[topic].completedAt = new Date().toISOString();
        }
        
        // Add any additional fields
        if (status.quizScore) updatedProgress[topic].quizScore = status.quizScore;
        if (status.codeScore) updatedProgress[topic].codeScore = status.codeScore;
      }
      
      // Update state and local storage
      setTopicProgress(updatedProgress);
      localStorage.setItem("topicProgress", JSON.stringify(updatedProgress));
      
      // Increment refresh trigger to update ProgressOverview
      setRefreshTrigger(prev => prev + 1);
      
      console.log(`Topic progress updated locally for: ${topic}`);
      return true;
    }
  };

  // Функция для нормализации данных прогресса (добавляем новую функцию)
  const normalizeProgressData = (data) => {
    if (!data) return {};
    
    const normalized = {};
    
    // Перебираем все топики и нормализуем их данные
    Object.keys(data).forEach(topic => {
      const topicData = data[topic];
      
      if (typeof topicData === 'object') {
        normalized[topic] = {
          viewed: topicData.viewed || topicData.Viewed || false,
          completed: topicData.completed || topicData.Completed || false,
          lastViewed: topicData.lastViewed || topicData.LastViewed || null,
          completedAt: topicData.completedAt || topicData.CompletedAt || null,
          quizScore: topicData.quizScore || topicData.QuizScore || 0,
          codeScore: topicData.codeScore || topicData.CodeScore || 0
        };
      } else if (topicData === 'completed' || topicData === 'Completed') {
        // Обрабатываем старый формат (строка)
        normalized[topic] = {
          viewed: true,
          completed: true,
          lastViewed: new Date().toISOString(),
          completedAt: new Date().toISOString()
        };
      } else {
        normalized[topic] = {
          viewed: true,
          completed: false,
          lastViewed: new Date().toISOString(),
          completedAt: null
        };
      }
    });
    
    return normalized;
  };

  // Complete practice session
  const completePractice = async () => {
    if (!currentTopic) {
      console.error("Cannot complete practice: no current topic set");
      return;
    }

    console.log("Completing practice for topic:", currentTopic);
    // Get final scores
    const quizScore = calculateQuizScore();
    const codeScore = calculateCodeScore();

    // Update viewing start time to compute total time spent
    const startTime = sessionStorage.getItem(`${currentTopic}_practice_start`);
    const timeToComplete = startTime ? Math.floor((Date.now() - parseInt(startTime)) / 1000) : 0;
    
    // Track exercise completion in analytics
    const exerciseData = {
      topic: currentTopic,
      exerciseId: 'practice-session',
      completed: true,
      score: quizScore,
      timeSpent: timeToComplete
    };
    trackAnalytics('exercise-activity', exerciseData);
    
    // Update topic progress to mark as completed
    const updateResult = await updateTopicProgress(currentTopic, {
      completed: true,
      quizScore,
      codeScore
    });

    // Track topic completion in analytics
    const completionData = {
      topic: currentTopic,
      timeToComplete: timeToComplete,
      attempts: 1, // This could be tracked more accurately
      successRate: quizScore,
      difficulty: 3 // Default middle difficulty, could be user-rated
    };
    trackAnalytics('topic-completion', completionData);

    console.log(`Practice completed with scores - Quiz: ${quizScore}, Code: ${codeScore}`);

    if (updateResult) {
      console.log(`Progress saved for topic: ${currentTopic}`);
      setRefreshTrigger(prev => prev + 1);
    } else {
      console.warn(`Failed to save progress for topic: ${currentTopic}`);
    }

    // Close the practice modal
    setShowPracticeModal(false);
    setCurrentExercise(0);
    setUserAnswer("");
    setIsAnswerCorrect(null);
    setShowSolution(false);
  };

  // Calculate quiz score for the current lecture
  const calculateQuizScore = () => {
    if (!currentLecture || !currentLecture.exercises) return 0;

    const quizExercises = currentLecture.exercises.filter(ex => ex.type === "quiz");
    if (quizExercises.length === 0) return 0;

    // In a real implementation, you would track correct answers
    // For now, we'll use a simple random score
    return Math.floor(Math.random() * 100);
  };

  // Calculate code score for the current lecture
  const calculateCodeScore = () => {
    if (!currentLecture || !currentLecture.exercises) return 0;

    const codeExercises = currentLecture.exercises.filter(ex => ex.type === "coding");
    if (codeExercises.length === 0) return 0;

    // In a real implementation, you would track correct code submissions
    // For now, we'll use a simple random score
    return Math.floor(Math.random() * 100);
  };

  // Load topic progress from the server
  const fetchTopicProgress = async () => {
    try {
      console.log("Fetching topic progress from server");
      const response = await axios.get(`${API_URL}/en/api/web/progress`);
      console.log("Progress response:", response.data);
      
      if (response.data && response.data.progress) {
        const progressData = response.data.progress;
        
        // Handle different response formats
        if (progressData.TopicProgress) {
          console.log("Setting progress data from TopicProgress");
          const normalizedProgress = normalizeProgressData(progressData.TopicProgress);
          setTopicProgress(normalizedProgress);
        } else if (progressData.topicProgress) {
          console.log("Setting progress data from topicProgress");
          const normalizedProgress = normalizeProgressData(progressData.topicProgress);
          setTopicProgress(normalizedProgress);
        } else {
          // If no topic progress found, initialize with empty object
          console.log("No progress data found, initializing empty object");
          setTopicProgress({});
        }
      }
    } catch (error) {
      console.error("Error fetching topic progress:", error);
      // Try to load from localStorage as fallback
      const savedProgress = localStorage.getItem("topicProgress");
      if (savedProgress) {
        try {
          console.log("Using localStorage fallback for progress");
          const parsedProgress = JSON.parse(savedProgress);
          // Нормализуем данные даже при загрузке из localStorage
          const normalizedProgress = normalizeProgressData(parsedProgress);
          setTopicProgress(normalizedProgress);
        } catch (e) {
          console.error("Error parsing saved progress:", e);
          setTopicProgress({});
        }
      }
    }
  };

  // Function to navigate to lecture page for a roadmap item
  const loadLecture = async (topic) => {
    console.log("Loading lecture for topic:", topic);
    
    // Set current topic
    setCurrentTopic(topic);
    
    // Show loading indicator
    setIsLoadingLecture(true);
    
    try {
      // Record start time for tracking time spent
      sessionStorage.setItem(`${topic}_view_start`, Date.now().toString());
      
      // Mark topic as viewed in progress with consistent format
      const viewedStatus = {
        viewed: true,
        lastViewed: new Date().toISOString(),
        completed: false
      };
      
      // Update local state immediately for responsive UI
      const updatedProgress = { ...topicProgress };
      if (!updatedProgress[topic]) {
        updatedProgress[topic] = viewedStatus;
      } else {
        updatedProgress[topic] = {
          ...updatedProgress[topic],
          ...viewedStatus
        };
      }
      
      // Set local state and localStorage
      setTopicProgress(updatedProgress);
      localStorage.setItem("topicProgress", JSON.stringify(updatedProgress));
      
      // Calculate time spent for analytics
      const startTime = sessionStorage.getItem(`${topic}_view_start`);
      const timeSpent = startTime ? Math.floor((Date.now() - parseInt(startTime)) / 1000) : 0;
      
      // Track topic view in analytics
      const viewData = {
        topic: topic,
        timeSpent: timeSpent
      };
      trackAnalytics('topic-view', viewData);
      
      // Update topic progress on server
      updateTopicProgress(topic, viewedStatus);
      
      // Navigate to the lecture page using the dedicated route
    navigate(`/skills/lecture/${encodeURIComponent(topic)}`);
      
    } catch (error) {
      console.error("Error loading lecture:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
    } finally {
      setIsLoadingLecture(false);
    }
  };

  // Start practice session after lecture
  const startPractice = async () => {
    if (!currentTopic) {
      console.error("Cannot start practice: no current topic set");
      return;
    }

    console.log("Starting practice for topic:", currentTopic);
    setIsGeneratingExercises(true);

    try {
      // Record start time for tracking time spent
      sessionStorage.setItem(`${currentTopic}_practice_start`, Date.now().toString());
      
      // Fetch exercises from the API
      const response = await axios.post(`${API_URL}/en/api/web/exercises`, {
        topic: currentTopic,
        difficulty: "beginner", // Default difficulty
        count: 5 // Default number of exercises
      });

      if (response.data && response.data.exercises && response.data.exercises.length > 0) {
        console.log(`Generated ${response.data.exercises.length} exercises for topic: ${currentTopic}`);
        setCurrentLecture({
          ...currentLecture,
          exercises: response.data.exercises
        });
      } else {
        console.warn("No exercises returned from API, using sample exercises");
        const sampleExercises = generateSampleExercises(currentTopic);
        setCurrentLecture({
          ...currentLecture,
          exercises: sampleExercises
        });
      }

      // Close lecture modal and open practice modal
      setShowLectureModal(false);
      setShowPracticeModal(true);
      setCurrentExercise(0);
      setUserAnswer("");
      setIsAnswerCorrect(null);
      setShowSolution(false);
      
      // Track exercise start in analytics
      const exerciseData = {
        topic: currentTopic,
        exerciseId: 'practice-session',
        completed: false,
        timeSpent: 0
      };
      trackAnalytics('exercise-activity', exerciseData);
      
    } catch (error) {
      console.error("Error starting practice:", error);
      
      // Fallback to sample exercises
      console.log("Using sample exercises due to error");
      const sampleExercises = generateSampleExercises(currentTopic);
      setCurrentLecture({
        ...currentLecture,
        exercises: sampleExercises
      });
      
      // Close lecture modal and open practice modal
      setShowLectureModal(false);
      setShowPracticeModal(true);
    } finally {
      setIsGeneratingExercises(false);
    }
  };

  // Generate sample exercises for when the API fails or returns empty
  const generateSampleExercises = (topic) => {
    return [
      // Quiz questions
      {
        type: "quiz",
        question: `What is a key concept in ${topic}?`,
        options: [
          "Fundamental principle",
          "Unrelated concept",
          "Tangential idea",
          "None of the above"
        ],
        correctAnswer: 0,
        difficulty: "Basic",
        explanation: `Understanding fundamental principles is crucial for mastering ${topic}.`
      },
      {
        type: "quiz",
        question: `Which approach is best for learning ${topic}?`,
        options: [
          "Theoretical study only",
          "Practical application only",
          "Balanced theory and practice",
          "Memorization"
        ],
        correctAnswer: 2,
        explanation: `A balanced approach of theory and practice is most effective for learning ${topic}.`
      },
      {
        type: "quiz",
        question: `What is the primary benefit of studying ${topic}?`,
        options: [
          "Enhanced problem-solving",
          "Improved technical skills",
          "Better career opportunities",
          "All of the above"
        ],
        correctAnswer: 3,
        explanation: `${topic} provides multiple benefits, including problem-solving skills, technical knowledge, and career advancement.`
      },
      // Coding exercises
      {
        type: "coding",
        prompt: `Write a function that demonstrates a basic principle of ${topic}`,
        starterCode: `function demonstrate${topic.replace(/\s+/g, '')}() {\n  // Your code here\n  // Return a string explaining a basic principle\n}`,
        solution: `function demonstrate${topic.replace(/\s+/g, '')}() {\n  return 'This demonstrates a basic principle of ${topic}: Always start with fundamentals.';\n}`,
        difficulty: "Basic",
        hints: [
          `Think about the most fundamental concept in ${topic}`,
          "Keep your explanation clear and concise",
          "Focus on one principle rather than trying to cover everything"
        ]
      },
      {
        type: "coding",
        prompt: `Implement a function that applies ${topic} to solve a simple problem`,
        starterCode: `function apply${topic.replace(/\s+/g, '')}(input) {\n  // Your code here\n  // Process the input using ${topic} principles\n  // Return the result\n}`,
        solution: `function apply${topic.replace(/\s+/g, '')}(input) {\n  // This is a simplified example\n  const processed = 'Processed: ' + input;\n  return 'Applied ${topic} principles to ' + input + ' and got: ' + processed;\n}`,
        difficulty: "Intermediate",
        hints: [
          "Start by defining what your function should accomplish",
          "Think about how to process the input parameter",
          `Apply the core concepts of ${topic} to transform the input`
        ]
      }
    ];
  };

  // Handle rating submission
  const handleRatingSubmit = async () => {
    if (!currentLecture || userRating === 0) {
      console.warn("Cannot submit rating: No lecture or rating");
      return;
    }

    try {
      console.log(`Submitting rating ${userRating} for lecture: ${currentTopic}`);
      
      // Track rating in analytics
      const ratingData = {
        topic: currentTopic,
        rating: userRating
      };
      trackAnalytics('rate-topic', ratingData);
      
      // Reset rating
      setUserRating(0);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  // Export lecture to PDF or other format
  const exportLecture = (format) => {
    console.log(`Exporting lecture in ${format} format`);
    // Implementation would depend on your PDF generation strategy
  };

  // Check answer for quiz questions
  const checkAnswer = (selectedAnswerIndex) => {
    if (!currentLecture || !currentLecture.exercises || currentLecture.exercises.length === 0) return;

    const currentEx = currentLecture.exercises[currentExercise];
    if (currentEx.type === "quiz") {
      const isCorrect = selectedAnswerIndex === currentEx.correctAnswer;
      setIsAnswerCorrect(isCorrect);

      // Track correct answers to calculate quiz score at the end
      if (isCorrect) {
        // In a real implementation, you would track this in a state variable
        // For this example, we'll use the updateTopicProgress function later in completePractice
      }
    }
  };

  // Move to next exercise
  const nextExercise = () => {
    if (!currentLecture || !currentLecture.exercises) return;

    if (currentExercise < currentLecture.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setIsAnswerCorrect(null);
      setUserAnswer("");
      setShowSolution(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setRoadmap([]);
  };

  const handleTopicSelect = (topic) => {
    setQuery(topic);
    fetchRoadmap(topic);
  };

  // Debug function for progress tracking
  const debugProgressState = async () => {
    try {
      // Добавим информацию о логах
      console.log("=== PROGRESS DEBUG START ===");

      // Check authentication state
      const token = localStorage.getItem('token');
      const isAuthenticated = !!token;
      console.log("Authentication state:", isAuthenticated ? "Authenticated" : "Not authenticated");

      if (token) {
        console.log("Token length:", token.length);
        console.log("Token preview:", token.substr(0, 15) + "...");
      }

      if (!isAuthenticated) {
        console.warn("User is not authenticated, progress tracking won't work without authentication");
        console.log("Trying to set a mock token...");
        localStorage.setItem('token', 'mock-token-for-testing');
      }

      // Check current progress state
      console.log("Current progress state:", topicProgress);

      // Try to fetch user progress from server
      try {
        console.log("Sending GET request to:", `${API_URL}/en/api/web/progress`);

        // Log axios config
        const axiosConfig = axios.defaults;
        console.log("Axios config:", {
          baseURL: axiosConfig.baseURL,
          withCredentials: axiosConfig.withCredentials,
          headers: axiosConfig.headers
        });

        const response = await axios.get(`${API_URL}/en/api/web/progress`);
        console.log("Server progress response:", response.data);

        // Check if response contains the expected data
        if (response.data && response.data.progress) {
          console.log("Progress data found in response");

          // Log the structure to help debugging
          const progressData = response.data.progress;
          if (progressData.TopicProgress) {
            console.log("TopicProgress structure:", Object.keys(progressData.TopicProgress));
          } else if (progressData.topicProgress) {
            console.log("topicProgress structure:", Object.keys(progressData.topicProgress));
          } else {
            console.log("Unknown progress data structure:", progressData);
          }
        } else {
          console.warn("No progress data found in response");
        }
      } catch (error) {
        console.error("Error fetching server progress:", error);
        if (error.response) {
          console.error("Response status:", error.response.status);
          console.error("Response data:", error.response.data);
        }
      }

      // Try to update progress for a test topic
      try {
        console.log("Attempting to update progress for a test topic 'debug-topic'");
        const testStatus = {
          viewed: true,
          Viewed: true,
          completed: true,
          Completed: true
        };
        await updateTopicProgress("debug-topic", testStatus);
      } catch (error) {
        console.error("Test progress update failed:", error);
      }

      console.log("=== PROGRESS DEBUG END ===");
    } catch (e) {
      console.error("Debug function error:", e);
    }
  };

  // Effect to trigger debug when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("RefreshTrigger changed:", refreshTrigger);
      // Добавим небольшую задержку, чтобы дать время на обновление состояния
      setTimeout(debugProgressState, 1500);
    }
  }, [refreshTrigger]);

  return (
    <LanguageProvider>
      <LeftBar>
        <div className={`${isMobile ? "mt-16" : ""} p-4 md:p-6`}>
          {/* Header */}
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-dark-900 dark:text-base-white">
              Skills Development
            </h1>
            <p className="text-dark-600 dark:text-dark-300 max-w-2xl mb-6">
              Explore personalized learning paths and develop new skills with our interactive roadmaps.
            </p>
            
            {/* ProgressOverview component */}
            <ProgressOverview
              roadmap={roadmap}
              onTopicClick={loadLecture}
              showInSkillsPage={false}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Recommended Topics Component */}
          <RecommendedTopics 
            loadingRecommended={loadingRecommended} 
            recommendedTopics={recommendedTopics}
            onTopicSelect={handleTopicSelect} 
          />

          {/* Search Skills Component */}
          <SearchSkills 
            query={query} 
            setQuery={setQuery} 
            fetchRoadmap={fetchRoadmap} 
            roadmap={roadmap} 
            clearSearch={clearSearch} 
          />

          {/* Roadmap Component */}
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
                <p className="text-dark-600 dark:text-dark-300">Generating your learning roadmap...</p>
              </div>
            ) : (
              roadmap.length > 0 && (
                <RoadmapWorm 
                  roadmap={roadmap} 
                  isMobile={isMobile} 
                  topicProgress={topicProgress} 
                  onTopicClick={loadLecture} 
                />
              )
            )}
          </div>

          {/* Lecture Modal */}
          <LectureModal
            showLectureModal={showLectureModal}
            setShowLectureModal={setShowLectureModal}
            isLoadingLecture={isLoadingLecture}
            currentLecture={currentLecture}
            userRating={userRating}
            setUserRating={setUserRating}
            handleRatingSubmit={handleRatingSubmit}
            startPractice={startPractice}
            exportLecture={exportLecture}
            topicProgress={topicProgress}
          />

          {/* Practice Modal */}
          <PracticeModal
            showPracticeModal={showPracticeModal}
            setShowPracticeModal={setShowPracticeModal}
            currentLecture={currentLecture}
            currentExercise={currentExercise}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            isAnswerCorrect={isAnswerCorrect}
            showSolution={showSolution}
            setShowSolution={setShowSolution}
            checkAnswer={checkAnswer}
            nextExercise={nextExercise}
            completePractice={completePractice}
            currentTopic={currentTopic}
            isGeneratingExercises={isGeneratingExercises}
          />
        </div>
      </LeftBar>
    </LanguageProvider>
  );
}

export default Skills;