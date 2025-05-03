import React, { useState, useEffect } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle, ArrowLeft, ArrowRight, HelpCircle, Award, Lock } from "lucide-react";

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
    
    // Check if previous topic is completed
    if (topicIndex > 0) {
      const prevTopic = roadmap[topicIndex - 1];
      const prevTopicName = prevTopic.includes(":") ? prevTopic.split(":")[0].trim() : prevTopic;
      
      setPreviousTopic(prevTopicName);
      const isPrevCompleted = topicProgress[prevTopicName] === "completed";
      setIsAccessible(isPrevCompleted);
    }
  }, [topic, roadmap, topicProgress]);

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

    // Check if we already have this lecture cached in localStorage
    const cachedLectures = localStorage.getItem("cachedLectures");
    let lecturesCache = {};

    if (cachedLectures) {
      try {
        lecturesCache = JSON.parse(cachedLectures);
        // If we have this lecture in cache, use it
        if (lecturesCache[topicName]) {
          console.log(`Loading cached lecture for: ${topicName}`);
          setCurrentLecture(lecturesCache[topicName]);
          setIsLoadingLecture(false);
          return;
        }
      } catch (error) {
        console.error("Error parsing cached lectures:", error);
      }
    }

    // In a real implementation, this would be an API call
    // For now, we'll simulate it with setTimeout
    setTimeout(() => {
      // Generate a sample lecture structure based on the topic
      const sampleLecture = generateSampleLecture(topicName);
      setCurrentLecture(sampleLecture);
      
      // Save the lecture to cache
      lecturesCache[topicName] = sampleLecture;
      localStorage.setItem("cachedLectures", JSON.stringify(lecturesCache));
      
      setIsLoadingLecture(false);
    }, 1500);
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

  // Update progress for a topic
  const updateTopicProgress = (topic, status) => {
    const newProgress = { ...topicProgress, [topic]: status };
    setTopicProgress(newProgress);
    localStorage.setItem("topicProgress", JSON.stringify(newProgress));
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

  // Complete practice session
  const completePractice = () => {
    if (currentLecture) {
      updateTopicProgress(currentLecture.title, "completed");
      setPracticeCompleted(true);
    }
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

  return (
    <LeftBar>
      <div className={`${isMobile ? "mt-16" : ""} p-4 bg-dark-50 dark:bg-dark-950 min-h-screen`}>
        <div className="max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6 flex items-center">
            <button 
              onClick={returnToLecture}
              className="mr-4 p-2 rounded-full hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="text-dark-500 dark:text-dark-400" />
            </button>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
              {isLoadingLecture ? "Loading practice..." : `Practice: ${currentLecture?.title || decodeURIComponent(topic)}`}
            </h1>
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
                    You need to complete the previous topic <span className="font-semibold">{previousTopic}</span> before you can access this practice session.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={goToPreviousTopic}
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-lg transition-colors shadow-md"
                    >
                      Go to Previous Topic
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
                  <p className="text-dark-600 dark:text-dark-300">Loading practice exercises...</p>
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