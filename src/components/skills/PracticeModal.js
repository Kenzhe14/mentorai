import React, { useState, useEffect } from "react";
import { Clock, Loader } from "lucide-react";
import axios from "axios";

const PracticeModal = ({
  showPracticeModal,
  setShowPracticeModal,
  currentLecture,
  currentExercise,
  userAnswer,
  setUserAnswer,
  isAnswerCorrect,
  showSolution,
  setShowSolution,
  checkAnswer,
  nextExercise,
  completePractice,
  currentTopic,
  isGeneratingExercises
}) => {
  // We'll keep the internal state for backward compatibility but prioritize the prop
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [exerciseError, setExerciseError] = useState(null);
  const [progress, setProgress] = useState(0);
  const API_URL = "http://localhost:5000";

  // Use either the prop or internal state for loading state
  const isLoading = isGeneratingExercises || isLoadingExercises;

  // Update progress when exercise changes
  useEffect(() => {
    if (currentLecture?.exercises && currentLecture.exercises.length > 0) {
      setProgress(Math.round((currentExercise / currentLecture.exercises.length) * 100));
    }
  }, [currentExercise, currentLecture]);
  
  // Check if exercises are loading or if we have exercises
  useEffect(() => {
    // If we have exercises but previously had an error, clear it
    if (currentLecture?.exercises && currentLecture.exercises.length > 0) {
      setExerciseError(null);
    }
  }, [currentLecture]);

  // Fallback function to generate exercises if needed
  const generateSampleExercises = () => {
    // Create a safe version of the topic for variable names
    const safeTopicName = currentTopic 
      ? currentTopic.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
      : "Example";
    
    // Sample exercises for development/testing
    const sampleExercises = [
      // Quiz questions
      {
        type: "quiz",
        question: `What is the main purpose of a variable in ${currentTopic || "programming"}?`,
        options: [
          "To create visual elements on a screen",
          "To store and manipulate data",
          "To connect to the internet",
          "To create animation effects"
        ],
        correctAnswer: 1,
        difficulty: "Basic",
        explanation: `Variables are used to store and manipulate data in ${currentTopic || "programming"}.`
      },
      {
        type: "quiz",
        question: `Which of the following is NOT a common ${currentTopic || "programming"} concept?`,
        options: [
          "Fundamental principle",
          "Standard practice",
          "Best approach",
          "Magic solution"
        ],
        correctAnswer: 3,
        difficulty: "Basic",
        explanation: `In ${currentTopic || "programming"}, we rely on proven principles and methodologies, not 'magic solutions'.`
      },
      {
        type: "quiz",
        question: `What does successful application of ${currentTopic || "this topic"} require?`,
        options: [
          "Only theoretical knowledge",
          "Only practical experience",
          "Balanced understanding of theory and practice",
          "Special innate talent"
        ],
        correctAnswer: 2,
        difficulty: "Intermediate",
        explanation: `Success in ${currentTopic || "this field"} requires a balance of theoretical understanding and practical application.`
      },
      // Coding exercises
      {
        type: "coding",
        prompt: `Write a function that demonstrates a basic principle of ${currentTopic || "this topic"}.`,
        starterCode: `function demonstrate${safeTopicName}() {\n  // Your code here\n}`,
        solution: `function demonstrate${safeTopicName}() {\n  return 'This demonstrates a basic principle of ${currentTopic || "the topic"}: Always start with fundamentals.';\n}`,
        difficulty: "Basic",
        hints: ["Remember to follow best practices", "Focus on clarity in your implementation", "Consider edge cases in your solution"]
      },
      {
        type: "coding",
        prompt: `Create a function that applies ${currentTopic || "these concepts"} to process input data.`,
        starterCode: `function process${safeTopicName}(data) {\n  // Your code here\n}`,
        solution: `function process${safeTopicName}(data) {\n  // Example implementation\n  if (!data) return 'No data provided';\n  \n  if (Array.isArray(data)) {\n    return data.map(item => 'Processed: ' + item);\n  } else {\n    return 'Processed: ' + data;\n  }\n}`,
        difficulty: "Intermediate",
        hints: ["Consider different types of input", "Handle edge cases like empty inputs", "Think about how to transform the data"]
      }
    ];

    // Update the currentLecture with these exercises
    if (currentLecture) {
      currentLecture.exercises = sampleExercises;
    }
    
    return sampleExercises;
  };

  // Handle sample exercises generation with proper error state management
  const handleGenerateSampleExercises = () => {
    setIsLoadingExercises(true);
    setTimeout(() => {
      const samples = generateSampleExercises();
      // If generateSampleExercises was successful, clear the error
      if (samples && samples.length > 0) {
        setExerciseError(null);
      }
      setIsLoadingExercises(false);
    }, 500); // Slight delay for UX purposes
  };

  if (!showPracticeModal) return null;

  // Check if we have exercises in the currentLecture
  const hasExercises = currentLecture && 
                      currentLecture.exercises && 
                      currentLecture.exercises.length > 0;
  
  // Get the current exercise
  const currentEx = hasExercises ? currentLecture.exercises[currentExercise] : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-base-white dark:bg-dark-900 p-4 border-b border-dark-200/10 dark:border-dark-800/50 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-dark-900 dark:text-base-white">
            Practice: {currentTopic}
          </h2>
          <button 
            onClick={() => setShowPracticeModal(false)}
            className="text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="animate-spin h-10 w-10 text-primary-500 mb-4" />
              <p className="text-dark-700 dark:text-dark-200">Loading practice exercises...</p>
              <p className="text-dark-500 dark:text-dark-400 text-sm mt-2">This might take a moment</p>
            </div>
          ) : exerciseError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg mb-4 max-w-md mx-auto text-center">
                <p className="font-medium mb-2">Error loading exercises</p>
                <p className="text-sm">{exerciseError}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPracticeModal(false)}
                  className="px-4 py-2 bg-dark-200 hover:bg-dark-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-dark-700 dark:text-dark-200 rounded-lg transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleGenerateSampleExercises}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  Use Sample Exercises
                </button>
              </div>
            </div>
          ) : !hasExercises ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 p-4 rounded-lg mb-4 max-w-md mx-auto text-center">
                <p className="font-medium mb-2">No exercises available</p>
                <p className="text-sm">We couldn't find any practice exercises for this topic.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPracticeModal(false)}
                  className="px-4 py-2 bg-dark-200 hover:bg-dark-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-dark-700 dark:text-dark-200 rounded-lg transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleGenerateSampleExercises}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  Use Sample Exercises
                </button>
              </div>
            </div>
          ) : currentEx ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-dark-500 dark:text-white" />
                <span className="text-sm text-dark-500 dark:text-white">Exercise {currentExercise + 1} of {currentLecture.exercises.length}</span>
                
                {/* Progress bar */}
                <div className="flex-grow ml-2">
                  <div className="w-full bg-dark-200 dark:bg-dark-700 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Exercise type indicator */}
              <div className="mb-4">
                <span className={`text-xs font-medium rounded-full px-3 py-1 ${
                  currentEx && currentEx.type === "quiz" 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" 
                    : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                }`}>
                  {currentEx && currentEx.type === "quiz" ? "Quiz Question" : "Coding Challenge"}
                </span>
                
                {currentEx && currentEx.difficulty && (
                  <span className="text-xs ml-2 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 
                            px-2 py-1 rounded-full">
                    {currentEx.difficulty}
                  </span>
                )}
              </div>
              
              {currentEx && currentEx.type === "quiz" && (
                <div className="mb-4 bg-dark-50 dark:bg-dark-850 p-4 rounded-lg border border-dark-200/20 dark:border-dark-700/30">
                  <p className="text-dark-700 dark:text-dark-200 mb-4 text-lg">
                    {currentEx.question}
                  </p>
                  <div className="space-y-2">
                    {currentEx.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => checkAnswer(index)}
                        disabled={isAnswerCorrect !== null}
                        className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                          isAnswerCorrect !== null && index === currentEx.correctAnswer
                            ? 'bg-green-500/20 border-green-500 border text-green-700 dark:text-green-300'
                            : isAnswerCorrect === false && index === userAnswer
                            ? 'bg-red-500/20 border-red-500 border text-red-700 dark:text-red-300'
                            : 'bg-base-white dark:bg-dark-800 text-dark-900 dark:text-base-white hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-dark-200 dark:border-dark-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {isAnswerCorrect !== null && (
                    <div className={`mt-4 p-3 rounded-lg ${isAnswerCorrect ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                      <p className="font-medium mb-1">
                        {isAnswerCorrect 
                          ? 'Correct! You got it right.' 
                          : `Incorrect. The correct answer is: ${currentEx.options[currentEx.correctAnswer]}`
                        }
                      </p>
                      {currentEx.explanation && (
                        <p className="text-sm mt-2">{currentEx.explanation}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {currentEx && currentEx.type === "coding" && (
                <div className="mb-4 bg-dark-50 dark:bg-dark-850 p-4 rounded-lg border border-dark-200/20 dark:border-dark-700/30">
                  <p className="text-dark-700 dark:text-dark-200 mb-4">
                    {currentEx.prompt}
                  </p>
                  
                  {currentEx.hints && currentEx.hints.length > 0 && (
                    <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800/30">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Hints:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {currentEx.hints.map((hint, index) => (
                          <li key={index} className="text-sm text-blue-700 dark:text-blue-400">{hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-dark-700 dark:text-dark-300">Your Code:</h4>
                      {!showSolution && (
                        <button 
                          onClick={() => setShowSolution(true)}
                          className="text-primary-500 dark:text-primary-400 text-sm hover:underline flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                          View Solution
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                        {currentEx.starterCode}
                      </pre>
                      <textarea
                        value={userAnswer === "" && currentEx ? currentEx.starterCode : userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="absolute inset-0 font-mono p-4 bg-transparent text-slate-50 resize-none outline-none border-2 border-primary-500/0 focus:border-primary-500/50 rounded-lg transition-colors"
                        placeholder=""
                      />
                    </div>
                  </div>
                  
                  {showSolution && (
                    <div className="mt-6">
                      <h4 className="font-medium text-dark-700 dark:text-dark-300 mb-2">Solution:</h4>
                      <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                        {currentEx.solution}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              
              {/* Progress and Actions */}
              <div className="mt-8 border-t border-dark-200/20 dark:border-dark-700/30 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-dark-700 dark:text-dark-200">
                    {currentExercise < 5 ? 
                      `Quiz ${currentExercise + 1} of 5` : 
                      `Coding ${currentExercise - 4} of 5`}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  {currentExercise < currentLecture.exercises.length - 1 ? (
                    <button
                      onClick={nextExercise}
                      disabled={currentEx && currentEx.type === 'quiz' && isAnswerCorrect === null}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Next Exercise
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                  ) : (
                    <button
                      onClick={completePractice}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      Завершить практику
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowPracticeModal(false)}
                    className="px-4 py-2 bg-dark-200 hover:bg-dark-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-dark-900 dark:text-dark-200 rounded-lg transition-colors"
                  >
                    Exit Practice
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-dark-600 dark:text-dark-300">
              No exercise available. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeModal; 