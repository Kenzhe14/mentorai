import React, { useState, useEffect } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle, ArrowLeft, ArrowRight, HelpCircle, Award, Lock, BookOpen } from "lucide-react";
import axios from "axios";

// API URL constant
const API_URL = "http://localhost:5000";

function PracticePage() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const [currentLecture, setCurrentLecture] = useState(null);
  const [isLoadingLecture, setIsLoadingLecture] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [topicProgress, setTopicProgress] = useState({});
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [roadmap, setRoadmap] = useState([]);
  const [isAccessible, setIsAccessible] = useState(true);
  const [previousTopic, setPreviousTopic] = useState(null);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  // Add states for exercise generation progress
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState("");
  const [generationSteps, setGenerationSteps] = useState([
    { id: 'analyze', label: 'Analyzing topic knowledge', complete: false },
    { id: 'outline', label: 'Creating exercise outline', complete: false },
    { id: 'questions', label: 'Generating quiz questions', complete: false },
    { id: 'coding', label: 'Creating coding challenges', complete: false },
    { id: 'solutions', label: 'Generating solutions', complete: false },
    { id: 'finalize', label: 'Finalizing practice set', complete: false }
  ]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Load roadmap and progress data from localStorage
  useEffect(() => {
    const savedRoadmap = localStorage.getItem("lastRoadmap");
    const savedProgress = localStorage.getItem("topicProgress");
    
    if (savedRoadmap) {
      try {
        const parsedRoadmap = JSON.parse(savedRoadmap);
        setRoadmap(parsedRoadmap);
      } catch (error) {
        console.error("Error parsing saved roadmap:", error);
      }
    }
    
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress);
        setTopicProgress(parsedProgress);
      } catch (error) {
        console.error("Error parsing saved progress:", error);
      }
    }
  }, []);

  // Check if topic is accessible (based on progression)
  useEffect(() => {
    if (!topic || !roadmap.length) return;
    
    const decodedTopic = decodeURIComponent(topic);
    
    // Find topic index in roadmap
    const topicIndex = roadmap.findIndex(item => {
      const itemName = item.includes(":") ? item.split(":")[0].trim() : item;
      return itemName === decodedTopic;
    });
    
    // First topic is always accessible
    if (topicIndex === 0) {
      setIsAccessible(true);
      return;
    }

    // If the lecture for this topic has been viewed, always allow practice access
    // This is the main case - user has already seen the lecture for this topic
    if (isLectureViewed(decodedTopic)) {
      console.log(`Lecture for ${decodedTopic} has been viewed, allowing practice access`);
      setIsAccessible(true);
      return;
    }
    
    // Alternative cases - check if previous topic is completed
    // This is only a fallback in case lecture viewing wasn't properly recorded
    if (topicIndex > 0) {
      const prevTopic = roadmap[topicIndex - 1];
      const prevTopicName = prevTopic.includes(":") ? prevTopic.split(":")[0].trim() : prevTopic;
      
      setPreviousTopic(prevTopicName);
      
      // If previous topic is completed, allow access to this topic's practice
      const isPrevCompleted = isTopicCompleted(prevTopicName);
      console.log(`Previous topic ${prevTopicName} completed status:`, isPrevCompleted);
      
      if (isPrevCompleted) {
        setIsAccessible(true);
        return;
      }
    }
    
    // If we reach here, the topic is not accessible
    setIsAccessible(false);
  }, [topic, roadmap, topicProgress]);

  // Function to check if a topic is completed (unified helper)
  const isTopicCompleted = (topic) => {
    if (!topicProgress || !topic) return false;
    
    const progress = topicProgress[topic];
    
    // Handle different progress tracking formats
    if (!progress) return false;
    
    // New format as object with properties
    if (typeof progress === 'object') {
      return progress.completed === true || !!progress.completedAt || progress.Completed === true;
    }
    
    // Old format as string
    return progress === "completed" || progress === "Completed";
  };

  // Function to check if a lecture has been viewed
  const isLectureViewed = (topic) => {
    if (!topicProgress || !topic) return false;
    
    const progress = topicProgress[topic];
    
    // Handle different progress tracking formats
    if (!progress) return false;
    
    // New format as object with properties
    if (typeof progress === 'object') {
      return progress.viewed === true || !!progress.lastViewed;
    }
    
    // Old format had no 'viewed' status, but any progress means it was viewed
    return !!progress;
  };

  // Load lecture content based on the topic parameter
  useEffect(() => {
    if (!topic) return;
    
    // Skip loading if topic is not accessible
    if (!isAccessible && previousTopic) return;
    
    loadLecture(decodeURIComponent(topic));
  }, [topic, isAccessible, previousTopic]);

  // Function to load lecture for a topic
  const loadLecture = (topicName) => {
    setIsLoadingLecture(true);
    setCurrentLecture(null);
    // Reset generation progress
    setGenerationProgress(0);
    setGenerationStep("Initializing practice...");
    
    // Reset generation steps
    setGenerationSteps(prev => prev.map(step => ({ ...step, complete: false })));

    try {
      // Record start time for tracking time spent
      sessionStorage.setItem(`${topicName}_practice_start`, Date.now().toString());

      // Simulate progress steps (this would be integrated with real API progress in production)
      const simulateProgress = () => {
        const steps = [...generationSteps];
        let currentStepIndex = 0;
        
        const interval = setInterval(() => {
          if (currentStepIndex >= steps.length) {
            clearInterval(interval);
            return;
          }
          
          // Update current step
          const currentStep = steps[currentStepIndex];
          setGenerationStep(currentStep.label);
          
          // Mark step as complete
          steps[currentStepIndex] = { ...currentStep, complete: true };
          setGenerationSteps(steps);
          
          // Update progress percentage
          const progress = Math.round(((currentStepIndex + 1) / steps.length) * 100);
          setGenerationProgress(progress);
          
          currentStepIndex++;
        }, 800); // Simulate steps with delay
        
        return interval;
      };
      
      // Start progress simulation
      const progressInterval = simulateProgress();

      // Fetch exercises from the API
      axios.post(`${API_URL}/en/api/web/exercises`, {
        topic: topicName,
        difficulty: "beginner", // Default difficulty
        count: 5 // Default number of exercises
      })
      .then(response => {
        // Clear the interval when response is received
        clearInterval(progressInterval);
        
        // Ensure all progress steps are complete
        setGenerationSteps(prev => prev.map(step => ({ ...step, complete: true })));
        setGenerationProgress(100);
        setGenerationStep("Practice exercises ready!");
        
        if (response.data && response.data.exercises && response.data.exercises.length > 0) {
          console.log(`Generated ${response.data.exercises.length} exercises for topic: ${topicName}`);
          
          // Short delay before showing exercises to ensure progress is visible
          setTimeout(() => {
            // Create a lecture object with the exercises
            const lectureData = {
              id: `lecture-${Date.now()}`,
              title: topicName,
              content: `<h2>Practice exercises for ${topicName}</h2>`,
              exercises: response.data.exercises,
              estimatedTime: "20 minutes"
            };
            
            setCurrentLecture(lectureData);
            
            // Track exercise start in analytics
            const exerciseData = {
              topic: topicName,
              exerciseId: 'practice-session',
              completed: false,
              timeSpent: 0
            };
            trackAnalytics('exercise-activity', exerciseData);
            
            setIsLoadingLecture(false);
          }, 500);
        } else {
          console.warn("No exercises returned from API, using sample exercises");
          
          setTimeout(() => {
            const sampleLecture = generateSampleLecture(topicName);
            setCurrentLecture(sampleLecture);
            setIsLoadingLecture(false);
          }, 500);
        }
      })
      .catch(error => {
        console.error("Error fetching exercises:", error);
        
        // Clear the interval when there's an error
        clearInterval(progressInterval);
        
        // Ensure all steps are completed but indicate error
        setGenerationSteps(prev => prev.map(step => ({ ...step, complete: true })));
        setGenerationProgress(100);
        setGenerationStep("Generated fallback exercises due to error");
        
        setTimeout(() => {
          const sampleLecture = generateSampleLecture(topicName);
          setCurrentLecture(sampleLecture);
          setIsLoadingLecture(false);
        }, 500);
      });
    } catch (error) {
      console.error("Error in loadLecture:", error);
      
      // Ensure all steps are completed but indicate error
      setGenerationSteps(prev => prev.map(step => ({ ...step, complete: true })));
      setGenerationProgress(100);
      setGenerationStep("Generated fallback exercises due to error");
      
      setTimeout(() => {
        const sampleLecture = generateSampleLecture(topicName);
        setCurrentLecture(sampleLecture);
        setIsLoadingLecture(false);
      }, 500);
    }
  };

  // Helper function to generate a sample lecture structure
  const generateSampleLecture = (topic) => {
    // Simulate AI-generated content based on the topic
    const aiGeneratedExercises = generateAIExercises(topic);
    
    return {
      id: `lecture-${Date.now()}`,
      title: topic,
      content: `
        <h2>Introduction to ${topic}</h2>
        <p>Welcome to this comprehensive lecture on ${topic}. This course will help you understand the fundamental concepts and practical applications of this important subject.</p>
      `,
      exercises: aiGeneratedExercises,
      estimatedTime: "15 minutes"
    };
  };
  
  // Function to simulate AI-generated exercises and quizzes
  const generateAIExercises = (topic) => {
    // In a real implementation, this would be an API call to an AI service
    // For now, we'll simulate different exercises based on the topic
    
    const topicKeywords = topic.toLowerCase();
    let exercises = [];
    
    // Generate different types of exercises based on topic keywords
    if (topicKeywords.includes("javascript") || topicKeywords.includes("programming")) {
      exercises = [
        {
          type: "quiz",
          question: `What is a key feature of ${topic} that makes it different from other programming paradigms?`,
          options: [
            "Static typing",
            "Dynamic typing",
            "Manual memory management",
            "Compilation to machine code"
          ],
          correctAnswer: 1
        },
        {
          type: "coding",
          prompt: `Write a function called "${topic.replace(/\s+/g, '')}Helper" that takes an array of numbers and returns the sum of all even numbers.`,
          starterCode: `function ${topic.replace(/\s+/g, '')}Helper(numbers) {\n  // Your code here\n  \n}`,
          solution: `function ${topic.replace(/\s+/g, '')}Helper(numbers) {\n  return numbers.filter(num => num % 2 === 0).reduce((sum, num) => sum + num, 0);\n}`
        },
        {
          type: "quiz",
          question: `In the context of ${topic}, what does the term "hoisting" refer to?`,
          options: [
            "Moving elements up in the DOM",
            "Lifting state to parent components",
            "Variable and function declarations being moved to the top of their scope",
            "Optimizing code execution by the compiler"
          ],
          correctAnswer: 2
        }
      ];
    } else if (topicKeywords.includes("data") || topicKeywords.includes("algorithm")) {
      exercises = [
        {
          type: "quiz",
          question: `Which data structure would be most efficient for implementing a ${topic} search operation?`,
          options: [
            "Array",
            "Linked List",
            "Hash Table",
            "Binary Tree"
          ],
          correctAnswer: 2
        },
        {
          type: "coding",
          prompt: `Implement a function to perform a basic ${topic} operation on a collection of data.`,
          starterCode: `function perform${topic.replace(/\s+/g, '')}(data) {\n  // Your implementation here\n  \n}`,
          solution: `function perform${topic.replace(/\s+/g, '')}(data) {\n  // Sort the data first\n  const sortedData = [...data].sort((a, b) => a - b);\n  \n  // Then perform the operation\n  return sortedData.filter(item => item > 0);\n}`
        },
        {
          type: "quiz",
          question: `What is the time complexity of the best-known algorithm for solving the ${topic} problem?`,
          options: [
            "O(1)",
            "O(log n)",
            "O(n)",
            "O(n log n)"
          ],
          correctAnswer: 3
        }
      ];
    } else if (topicKeywords.includes("design") || topicKeywords.includes("ui") || topicKeywords.includes("ux")) {
      exercises = [
        {
          type: "quiz",
          question: `Which principle is most important when designing ${topic} interfaces?`,
          options: [
            "Consistency",
            "Visual appeal",
            "Animation",
            "Technical complexity"
          ],
          correctAnswer: 0
        },
        {
          type: "coding",
          prompt: `Write CSS code to create a responsive ${topic} component that adapts to different screen sizes.`,
          starterCode: `.${topic.replace(/\s+/g, '-').toLowerCase()} {\n  /* Your CSS here */\n  \n}`,
          solution: `.${topic.replace(/\s+/g, '-').toLowerCase()} {\n  display: flex;\n  flex-direction: column;\n  padding: 1rem;\n  \n  @media (min-width: 768px) {\n    flex-direction: row;\n    justify-content: space-between;\n  }\n}`
        },
        {
          type: "quiz",
          question: `What research method is most effective for evaluating the usability of a ${topic} interface?`,
          options: [
            "A/B testing",
            "User interviews",
            "Usability testing with think-aloud protocol",
            "Analytics review"
          ],
          correctAnswer: 2
        }
      ];
    } else {
      // Default exercises for any other topic
      exercises = [
        {
          type: "quiz",
          question: `What is considered the foundation of ${topic}?`,
          options: [
            "Historical context",
            "Theoretical principles",
            "Practical applications",
            "Community contributions"
          ],
          correctAnswer: 1
        },
        {
          type: "coding",
          prompt: `Design a simple function that demonstrates a basic concept from ${topic}.`,
          starterCode: `function demonstrate${topic.replace(/\s+/g, '')}() {\n  // Your implementation\n  \n}`,
          solution: `function demonstrate${topic.replace(/\s+/g, '')}() {\n  // This is a simple demonstration\n  const result = {\n    name: "${topic}",\n    category: "Learning",\n    importance: "High"\n  };\n  return result;\n}`
        },
        {
          type: "quiz",
          question: `Which of the following statements about ${topic} is FALSE?`,
          options: [
            `${topic} is widely used in modern applications`,
            `${topic} originated in the early 2000s`,
            `${topic} is considered essential knowledge for professionals`,
            `${topic} will likely be replaced by newer technologies soon`
          ],
          correctAnswer: 3
        }
      ];
    }
    
    return exercises;
  };

  // Update topic progress
  const updateTopicProgress = async (topic, status) => {
    try {
      console.log(`Updating progress for topic: ${topic}`, status);
      
      // Check authentication
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("No authentication token found. Topic progress may not be saved on the server.");
      }
      
      // Prepare server data format
      const requestData = {
        topic,
        viewed: true,
        completed: status.completed === true
      };
      
      // Add additional fields only if defined
      if (status.quizScore) requestData.quizScore = status.quizScore;
      if (status.codeScore) requestData.codeScore = status.codeScore;
      
      console.log("Sending data to server:", requestData);
      
      const response = await axios.post(`${API_URL}/en/api/web/progress`, requestData);
      
      if (response.data && response.data.progress) {
        console.log(`Progress updated successfully for topic: ${topic}`);
        
        // Update local progress state
        const updatedProgress = { ...topicProgress };
        if (!updatedProgress[topic]) {
          updatedProgress[topic] = status;
        } else {
          updatedProgress[topic] = {
            ...updatedProgress[topic],
            ...status
          };
        }
        
        // Update state and localStorage
        setTopicProgress(updatedProgress);
        localStorage.setItem("topicProgress", JSON.stringify(updatedProgress));
        
        return true;
      } else {
        console.warn("Server response does not contain progress data");
        return false;
      }
    } catch (error) {
      console.error("Error updating topic progress:", error);
      
      // Fallback to local update
      console.log("Using local fallback for topic progress");
      const updatedProgress = { ...topicProgress };
      
      if (!updatedProgress[topic]) {
        updatedProgress[topic] = {
          viewed: true,
          completed: status.completed || false,
          lastViewed: new Date().toISOString()
        };
      } else {
        updatedProgress[topic] = {
          ...updatedProgress[topic],
          viewed: true,
          lastViewed: new Date().toISOString()
        };
        
        if (status.completed) {
          updatedProgress[topic].completed = true;
          updatedProgress[topic].completedAt = new Date().toISOString();
        }
        
        if (status.quizScore) updatedProgress[topic].quizScore = status.quizScore;
        if (status.codeScore) updatedProgress[topic].codeScore = status.codeScore;
      }
      
      // Update state and localStorage
      setTopicProgress(updatedProgress);
      localStorage.setItem("topicProgress", JSON.stringify(updatedProgress));
      
      return true;
    }
  };

  // Check answer for quiz questions
  const checkAnswer = (selectedOption) => {
    if (!currentLecture || !currentLecture.exercises || currentExercise >= currentLecture.exercises.length) return;
    
    const exercise = currentLecture.exercises[currentExercise];
    setUserAnswer(selectedOption);
    
    if (exercise.type === "quiz") {
      const isCorrect = selectedOption === exercise.correctAnswer;
      setIsAnswerCorrect(isCorrect);
      
      // Auto advance to next question after a short delay if correct
      if (isCorrect) {
        setTimeout(() => {
          nextExercise();
        }, 1500);
      }
    }
  };

  // Move to next exercise
  const nextExercise = () => {
    if (!currentLecture || !currentLecture.exercises) return;
    
    // Reset state for next exercise
    setUserAnswer("");
    setIsAnswerCorrect(null);
    setShowSolution(false);
    
    // If we've reached the end of exercises
    if (currentExercise >= currentLecture.exercises.length - 1) {
      completePractice();
    } else {
      setCurrentExercise(prev => prev + 1);
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

  // Complete practice and update progress
  const completePractice = async () => {
    const topicName = decodeURIComponent(topic);
    console.log("Completing practice for topic:", topicName);

    try {
      // Calculate scores based on actual performance if available
      // For now, using random scores between 60-100 for demonstration
      const quizScore = calculateQuizScore();
      const codeScore = calculateCodeScore();
      
      console.log(`Calculated scores - Quiz: ${quizScore}, Code: ${codeScore}`);
      
      // Update viewing start time to compute total time spent
      const startTime = sessionStorage.getItem(`${topicName}_practice_start`);
      const timeToComplete = startTime ? Math.floor((Date.now() - parseInt(startTime)) / 1000) : 0;
      
      console.log("=== PRACTICE COMPLETION DEBUG ===");
      console.log("Topic progress before completion:", JSON.stringify(topicProgress[topicName]));
      
      // Track exercise completion in analytics with detailed scores
      const exerciseData = {
        topic: topicName,
        exerciseId: 'practice-session',
        completed: true,
        score: quizScore,
        codeScore: codeScore,
        timeSpent: timeToComplete,
        timestamp: new Date().toISOString()
      };
      await trackAnalytics('exercise-activity', exerciseData);
      
      // Update topic progress to mark as completed with scores
      const completedStatus = {
        viewed: true,
        completed: true,
        lastViewed: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        quizScore,
        codeScore,
        averageScore: Math.round((quizScore + codeScore) / 2) // Add average score for easier display
      };
      
      console.log("Setting completion status:", JSON.stringify(completedStatus));
      const updateResult = await updateTopicProgress(topicName, completedStatus);
      console.log("Update result:", updateResult);
      
      // Force update the local state to ensure UI reflects completion
      const updatedProgress = { ...topicProgress };
      updatedProgress[topicName] = completedStatus;
      setTopicProgress(updatedProgress);
      
      // Also update localStorage to ensure persistence between page refreshes
      localStorage.setItem("topicProgress", JSON.stringify(updatedProgress));
      
      // Track topic completion in analytics with comprehensive data
      const completionData = {
        topic: topicName,
        timeToComplete: timeToComplete,
        attempts: 1,
        quizScore: quizScore,
        codeScore: codeScore,
        averageScore: Math.round((quizScore + codeScore) / 2),
        successRate: quizScore,
        completedAt: new Date().toISOString(),
        difficulty: 3 // Default middle difficulty
      };
      await trackAnalytics('topic-completion', completionData);

      console.log(`Practice completed with scores - Quiz: ${quizScore}, Code: ${codeScore}`);
      console.log("Topic progress after completion:", JSON.stringify(updatedProgress[topicName]));
      console.log("=== END PRACTICE COMPLETION DEBUG ===");
      
      // Show completion message
      setPracticeCompleted(true);
      setShowCompletionMessage(true);
      
      // Hide completion message after 3 seconds
      setTimeout(() => {
        setShowCompletionMessage(false);
      }, 3000);
    } catch (error) {
      console.error("Error completing practice:", error);
    }
  };

  // Calculate quiz score based on user performance
  const calculateQuizScore = () => {
    if (!currentLecture || !currentLecture.exercises) {
      // Return a default score if no exercises are available
      return Math.floor(Math.random() * 40) + 60;
    }

    // Find all quiz-type exercises
    const quizExercises = currentLecture.exercises.filter(ex => ex.type === "quiz");
    if (quizExercises.length === 0) return 75; // Default score if no quiz exercises

    // In a real implementation, you would count correct answers from user responses
    // For now, using a random score for demonstration
    return Math.floor(Math.random() * 40) + 60; // Random score 60-100
  };

  // Calculate code score based on user submissions
  const calculateCodeScore = () => {
    if (!currentLecture || !currentLecture.exercises) {
      // Return a default score if no exercises are available
      return Math.floor(Math.random() * 40) + 60;
    }

    // Find all coding-type exercises
    const codingExercises = currentLecture.exercises.filter(ex => ex.type === "coding");
    if (codingExercises.length === 0) return 75; // Default score if no coding exercises

    // In a real implementation, you would evaluate code solutions
    // For now, using a random score for demonstration
    return Math.floor(Math.random() * 40) + 60; // Random score 60-100
  };

  // Return to lecture
  const returnToLecture = () => {
    navigate(`/skills/lecture/${encodeURIComponent(topic)}`);
  };

  // Return to skills page
  const returnToSkills = () => {
    navigate('/skills');
  };

  // Navigate to previous topic
  const goToPreviousTopic = () => {
    if (previousTopic) {
      navigate(`/skills/lecture/${encodeURIComponent(previousTopic)}`);
    } else {
      navigate('/skills');
    }
  };

  // Debug useEffect to check if analytics is working
  useEffect(() => {
    if (topic) {
      try {
        const decodedTopic = decodeURIComponent(topic);
        console.log("=== PRACTICE PAGE ANALYTICS DEBUG ===");
        console.log(`Current topic: ${decodedTopic}`);
        console.log(`Topic progress state:`, topicProgress);
        
        // Check if we have a stored practice start time
        const practiceStartTime = sessionStorage.getItem(`${decodedTopic}_practice_start`);
        console.log(`Practice start time: ${practiceStartTime ? new Date(parseInt(practiceStartTime)).toLocaleString() : 'Not set'}`);
        
        console.log(`Practice completion state: ${practiceCompleted}`);
        console.log("=== END DEBUG ===");
      } catch (error) {
        console.error("Error in debug logging:", error);
      }
    }
  }, [topic, topicProgress, practiceCompleted]);

  return (
    <LeftBar>
      <div className={`${isMobile ? "mt-16" : ""} p-4 bg-dark-50 dark:bg-dark-950 min-h-screen`}>
        <div className="max-w-4xl mx-auto">
          {/* Completion Message */}
          {showCompletionMessage && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
              <div className="bg-base-white dark:bg-dark-800 rounded-xl shadow-xl p-8 max-w-md text-center">
                <div className="flex justify-center mb-4">
                  <Award size={80} className="text-primary-500" />
                </div>
                <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Practice Completed!</h2>
                <p className="text-dark-600 dark:text-dark-300 mb-6">
                  Congratulations! You've completed this practice session and this topic is now marked as completed in your roadmap.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => navigate('/skills')}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                  >
                    Return to Skills
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header with back button */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/skills/lecture/${topic}`)}
                className="px-3 py-1.5 text-sm rounded-lg border border-dark-200 dark:border-dark-700 bg-base-white dark:bg-dark-800 flex items-center space-x-1 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Back to Lecture</span>
              </button>
              
              <button
                onClick={() => navigate('/skills')}
                className="px-3 py-1.5 text-sm rounded-lg border border-dark-200 dark:border-dark-700 bg-base-white dark:bg-dark-800 flex items-center space-x-1 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
              >
                <BookOpen size={16} />
                <span>All Topics</span>
              </button>
            </div>
            
            <div className="flex space-x-2">
              {practiceCompleted && (
                <div className="flex items-center space-x-1 px-2 py-1.5 text-sm rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  <CheckCircle size={16} />
                  <span>Completed</span>
                </div>
              )}
              
              {/* Next Topic Button */}
              {roadmap.length > 0 && (
                (() => {
                  const decodedTopic = decodeURIComponent(topic);
                  const currentIndex = roadmap.findIndex(item => {
                    const itemName = item.includes(":") ? item.split(":")[0].trim() : item;
                    return itemName === decodedTopic;
                  });
                  
                  if (currentIndex < roadmap.length - 1) {
                    const nextTopic = roadmap[currentIndex + 1];
                    const nextTopicName = nextTopic.includes(":") ? nextTopic.split(":")[0].trim() : nextTopic;
                    
                    // Check if next topic is accessible - only if current is completed
                    const isCurrentCompleted = practiceCompleted;
                    
                    return (
                      <button
                        onClick={() => isCurrentCompleted && navigate(`/skills/lecture/${encodeURIComponent(nextTopicName)}`)}
                        disabled={!isCurrentCompleted}
                        className={`px-3 py-1.5 text-sm rounded-lg flex items-center space-x-1 ${
                          isCurrentCompleted
                            ? "bg-primary-600 text-white hover:bg-primary-700"
                            : "bg-dark-100/50 dark:bg-dark-800/50 text-dark-400 dark:text-dark-500 cursor-not-allowed"
                        }`}
                      >
                        <span>Next Topic</span>
                        <ArrowRight size={16} />
                      </button>
                    );
                  }
                  return null;
                })()
              )}
            </div>
          </div>

          {/* Practice content */}
          <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              {!isAccessible && previousTopic ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-dark-100 dark:bg-dark-800/50 flex items-center justify-center mx-auto mb-6">
                    <Lock size={40} className="text-dark-400 dark:text-dark-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-4">
                    Practice Locked
                  </h2>
                  <p className="text-dark-600 dark:text-dark-300 mb-8 max-w-md mx-auto">
                    You need to view the lecture for <span className="font-semibold">{decodeURIComponent(topic)}</span> before you can access the practice session. 
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={returnToLecture}
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-lg transition-colors shadow-md"
                    >
                      Go to Lecture
                    </button>
                    <Link
                      to="/skills"
                      className="px-6 py-2 bg-dark-200 hover:bg-dark-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-dark-900 dark:text-white rounded-lg transition-colors"
                    >
                      Back to Skills
                    </Link>
                  </div>
                </div>
              ) : isLoadingLecture ? (
                <div className="flex flex-col items-center justify-center h-60">
                  <div className="w-full max-w-md mb-8">
                    <div className="flex justify-between text-sm text-dark-500 dark:text-dark-300 mb-2">
                      <span>{generationStep}</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <div className="h-2 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${generationProgress}%` }}
                      ></div>
                    </div>
                    <div className="mt-6 space-y-3">
                      {generationSteps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                            step.complete 
                              ? "bg-green-500 text-white" 
                              : "bg-dark-200 dark:bg-dark-700 text-dark-400 dark:text-dark-500"
                          }`}>
                            {step.complete && (
                              <CheckCircle size={12} />
                            )}
                          </div>
                          <span className={`text-sm ${
                            step.complete 
                              ? "text-dark-900 dark:text-dark-100" 
                              : "text-dark-400 dark:text-dark-500"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-dark-600 dark:text-dark-300">Creating practice exercises for {decodeURIComponent(topic)}...</p>
                </div>
              ) : practiceCompleted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                    <Award size={40} className="text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-4">
                    Practice Completed!
                  </h2>
                  <p className="text-dark-600 dark:text-dark-300 mb-8 max-w-md mx-auto">
                    Congratulations! You have successfully completed all practice exercises for this topic.
                    Your progress has been saved.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={returnToLecture}
                      className="px-6 py-2 bg-dark-200 hover:bg-dark-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-dark-900 dark:text-white rounded-lg transition-colors"
                    >
                      Back to Lecture
                    </button>
                    <button
                      onClick={returnToSkills}
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-lg transition-colors shadow-md"
                    >
                      Continue Learning
                    </button>
                  </div>
                </div>
              ) : currentLecture && currentLecture.exercises && currentLecture.exercises.length > 0 ? (
                <div>
                  {/* Progress indicator */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-dark-500 dark:text-dark-400 mb-2">
                      <span>Progress</span>
                      <span>{currentExercise + 1} of {currentLecture.exercises.length}</span>
                    </div>
                    <div className="h-2 bg-dark-100 dark:bg-dark-800 rounded-full">
                      <div 
                        className="h-2 bg-primary-500 rounded-full transition-all duration-300"
                        style={{ width: `${((currentExercise + 1) / currentLecture.exercises.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Current exercise */}
                  <div className="bg-dark-50/50 dark:bg-dark-800/30 rounded-lg p-6 mb-6 border border-dark-200/10 dark:border-dark-700/50">
                    {currentLecture?.exercises && currentLecture.exercises[currentExercise] && currentLecture.exercises[currentExercise].type === "quiz" ? (
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-dark-900 dark:text-white">
                          {currentLecture.exercises[currentExercise].question}
                        </h3>
                        <div className="space-y-3 mb-6">
                          {currentLecture.exercises[currentExercise].options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => checkAnswer(index)}
                              disabled={isAnswerCorrect !== null}
                              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                                userAnswer === index 
                                  ? isAnswerCorrect === true
                                    ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700"
                                    : isAnswerCorrect === false
                                      ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700"
                                      : "bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700"
                                  : "border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800/50"
                              } ${
                                isAnswerCorrect !== null && index === currentLecture.exercises[currentExercise].correctAnswer
                                  ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center">
                                <div className="mr-3 w-5">
                                  {userAnswer === index && isAnswerCorrect === true && <CheckCircle className="text-green-500" size={20} />}
                                  {userAnswer === index && isAnswerCorrect === false && <XCircle className="text-red-500" size={20} />}
                                </div>
                                <span className="text-dark-900 dark:text-white">{option}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {isAnswerCorrect === false && (
                          <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4 rounded-lg mb-4">
                            <p className="text-red-700 dark:text-red-300 font-medium mb-1">Incorrect answer</p>
                            <p className="text-red-600 dark:text-red-400 text-sm">
                              The correct answer is: {currentLecture.exercises[currentExercise].options[currentLecture.exercises[currentExercise].correctAnswer]}
                            </p>
                          </div>
                        )}
                        
                        {isAnswerCorrect === true && (
                          <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-4 rounded-lg mb-4">
                            <p className="text-green-700 dark:text-green-300 font-medium">Correct! Moving to next question...</p>
                          </div>
                        )}
                      </div>
                    ) : currentLecture?.exercises && currentLecture.exercises[currentExercise] && currentLecture.exercises[currentExercise].type === "coding" ? (
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-dark-900 dark:text-white">
                          {currentLecture.exercises[currentExercise].prompt}
                        </h3>
                        <div className="bg-dark-900 text-white p-4 rounded-lg font-mono text-sm mb-4">
                          <pre>{currentLecture.exercises[currentExercise].starterCode}</pre>
                        </div>
                        <textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          className="w-full h-40 p-4 rounded-lg bg-dark-900 text-white font-mono text-sm border border-dark-700 focus:border-primary-500 focus:ring focus:ring-primary-500/20"
                          placeholder="Write your solution here..."
                        />
                        
                        {showSolution && (
                          <div className="mt-4 bg-dark-100 dark:bg-dark-800 p-4 rounded-lg">
                            <h4 className="font-bold text-dark-900 dark:text-white mb-2">Sample Solution:</h4>
                            <div className="bg-dark-900 text-white p-4 rounded-lg font-mono text-sm">
                              <pre>{currentLecture.exercises[currentExercise].solution}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-dark-500 dark:text-dark-400">
                        Exercise content could not be loaded. Please try again.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    {/* View solution button for coding exercises */}
                    {currentLecture?.exercises && currentLecture.exercises[currentExercise] && currentLecture.exercises[currentExercise].type === "coding" && !showSolution && (
                      <button
                        onClick={() => setShowSolution(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-dark-200 hover:bg-dark-300 dark:bg-dark-800 dark:hover:bg-dark-700 text-dark-900 dark:text-white rounded-lg transition-colors"
                      >
                        <HelpCircle size={18} />
                        View Solution
                      </button>
                    )}
                    
                    {/* Next and Finish buttons */}
                    <button
                      onClick={nextExercise}
                      className={`ml-auto inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-lg transition-colors ${
                        (currentLecture?.exercises && currentLecture.exercises[currentExercise] && currentLecture.exercises[currentExercise].type === "quiz" && isAnswerCorrect === null) ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={currentLecture?.exercises && currentLecture.exercises[currentExercise] && currentLecture.exercises[currentExercise].type === "quiz" && isAnswerCorrect === null}
                    >
                      {currentExercise === (currentLecture?.exercises?.length || 0) - 1 ? "Finish" : "Next"}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-dark-500 dark:text-dark-400">
                  No practice exercises available for this topic.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LeftBar>
  );
}

export default PracticePage; 