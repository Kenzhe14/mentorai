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
    const savedTopic = localStorage.getItem("lastTopic");
    const savedRoadmap = localStorage.getItem("lastRoadmap");
    const savedProgress = localStorage.getItem("topicProgress");

    if (savedProgress) {
      try {
        setTopicProgress(JSON.parse(savedProgress));
      } catch (error) {
        console.error("Error parsing saved progress:", error);
        setTopicProgress({});
      }
    }

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

  // Load lecture content from backend
  const fetchLectureContent = async (topic) => {
    setIsLoadingLecture(true);
    setCurrentTopic(topic);
    
    try {
      const response = await axios.post(`${API_URL}/en/api/web/lecture`, {
        topic
      });
      
      if (response.data && response.data.lecture) {
        setCurrentLecture(response.data.lecture);
      } else {
        console.error("Invalid lecture data format:", response.data);
        setCurrentLecture(null);
      }
    } catch (error) {
      console.error("Error fetching lecture:", error);
      setCurrentLecture(null);
    } finally {
      setIsLoadingLecture(false);
    }
  };

  // Function to navigate to lecture page for a roadmap item
  const loadLecture = (topic) => {
    // Navigate to the dedicated lecture page
    navigate(`/skills/lecture/${encodeURIComponent(topic)}`);
  };

  // Start practice session after lecture
  const startPractice = async () => {
    // Set initial state
    setCurrentExercise(0);
    setIsAnswerCorrect(null);
    setUserAnswer("");
    setShowSolution(false);
    
    try {
      // Show loader in practice modal by setting the loading flag
      setIsGeneratingExercises(true);
      setShowLectureModal(false);
      setShowPracticeModal(true);
      
      // Fetch exercises from the backend
      console.log(`Fetching exercises for topic: ${currentTopic}`);
      const response = await axios.post(`${API_URL}/en/api/web/exercises`, {
        topic: currentTopic,
        quizCount: 3,
        codingCount: 2
      });
      
      if (response.data && response.data.exercises && response.data.exercises.length > 0) {
        // Update the lecture with the fetched exercises
        const updatedLecture = {
          ...currentLecture,
          exercises: response.data.exercises
        };
        setCurrentLecture(updatedLecture);
        console.log(`Loaded ${response.data.exercises.length} exercises`);
      } else {
        console.error("No exercises returned from API:", response.data);
        // Fall back to sample exercises if API returns empty array
        if (currentLecture) {
          const sampleExercises = generateSampleExercises(currentTopic);
          const updatedLecture = {
            ...currentLecture,
            exercises: sampleExercises
          };
          setCurrentLecture(updatedLecture);
          console.log("Using sample exercises as fallback");
        }
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
      // Fall back to sample exercises if API call fails
      if (currentLecture) {
        const sampleExercises = generateSampleExercises(currentTopic);
        const updatedLecture = {
          ...currentLecture,
          exercises: sampleExercises
        };
        setCurrentLecture(updatedLecture);
        console.log("Using sample exercises as fallback due to API error");
      }
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
    try {
      await axios.post(`${API_URL}/en/api/web/rate-lecture`, {
        topic: currentTopic,
        rating: userRating
      });
      // You can add feedback for successful rating here
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
      
      // Update progress
      const updatedProgress = { ...topicProgress };
      if (!updatedProgress[currentTopic]) {
        updatedProgress[currentTopic] = { quizzes: 0, coding: 0, total: 0 };
      }
      
      if (isCorrect) {
        updatedProgress[currentTopic].quizzes += 1;
        updatedProgress[currentTopic].total += 1;
      }
      
      setTopicProgress(updatedProgress);
      localStorage.setItem("topicProgress", JSON.stringify(updatedProgress));
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

  // Complete practice session
  const completePractice = async () => {
    try {
      await axios.post(`${API_URL}/en/api/web/complete-practice`, {
        topic: currentTopic
      });
      
      // Update progress
      const updatedProgress = { ...topicProgress };
      if (!updatedProgress[currentTopic]) {
        updatedProgress[currentTopic] = { completed: true, viewed: true };
      } else {
        updatedProgress[currentTopic].completed = true;
        updatedProgress[currentTopic].viewed = true;
      }
      
      setTopicProgress(updatedProgress);
      localStorage.setItem("topicProgress", JSON.stringify(updatedProgress));
      
      // Show completion feedback
      alert(`Congratulations! You've completed the practice for ${currentTopic}. This topic is now marked as completed in your roadmap.`);
      
      setShowPracticeModal(false);
    } catch (error) {
      console.error("Error completing practice:", error);
      
      // Even if API fails, still mark as completed locally
      const updatedProgress = { ...topicProgress };
      if (!updatedProgress[currentTopic]) {
        updatedProgress[currentTopic] = { completed: true, viewed: true };
      } else {
        updatedProgress[currentTopic].completed = true;
        updatedProgress[currentTopic].viewed = true;
      }
      
      setTopicProgress(updatedProgress);
      localStorage.setItem("topicProgress", JSON.stringify(updatedProgress));
      
      setShowPracticeModal(false);
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
            
            {/* ProgressOverview (visible in other pages) */}
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