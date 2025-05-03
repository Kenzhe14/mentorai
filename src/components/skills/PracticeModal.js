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
  completePractice
}) => {
  const [isGeneratingExercises, setIsGeneratingExercises] = useState(false);
  const [dynamicExercises, setDynamicExercises] = useState(null);
  const [exerciseError, setExerciseError] = useState(null);

  // Generate AI exercises when modal opens or lecture changes
  useEffect(() => {
    if (showPracticeModal && currentLecture && !dynamicExercises) {
      generateAIExercises();
    }
  }, [showPracticeModal, currentLecture]);

  // Function to fetch AI-generated exercises from the backend
  const generateAIExercises = async () => {
    setIsGeneratingExercises(true);
    setExerciseError(null);
    
    try {
      const topic = currentLecture.title;
      const languagePrefix = window.location.pathname.startsWith('/ru') ? '/ru' : '/en';
      
      console.log(`Fetching exercises for topic: ${topic}`);
      
      // Use the public endpoint for better compatibility
      const response = await axios.post(`${languagePrefix}/api/public/exercises`, {
        topic: topic
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Check for different response formats
      if (response.data && response.data.exercises) {
        console.log(`Received ${response.data.exercises.length} exercises from backend`);
        setDynamicExercises(response.data.exercises);
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where response is a direct array
        console.log(`Received ${response.data.length} exercises from backend (array format)`);
        setDynamicExercises(response.data);
      } else {
        console.error("Invalid response format:", response.data);
        setExerciseError("Received invalid exercise data from server");
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
      
      // Detailed error logging
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        
        // Handle unauthorized errors specifically
        if (error.response.status === 401) {
          setExerciseError("Authentication required. Please log in to generate exercises.");
        } else {
          setExerciseError(error.response?.data?.error || "Failed to generate exercises");
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received:", error.request);
        setExerciseError("No response from server. Please check your connection.");
      } else {
        // Error in setting up the request
        console.error("Request error:", error.message);
        setExerciseError("Error setting up request: " + error.message);
      }
    } finally {
      setIsGeneratingExercises(false);
    }
  };

  if (!showPracticeModal || !currentLecture) return null;

  // Use dynamically generated exercises if available
  const exercises = dynamicExercises || (currentLecture.exercises || []);
  const currentEx = exercises[currentExercise] || null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-base-white dark:bg-dark-900 p-4 border-b border-dark-200/10 dark:border-dark-800/50 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-dark-900 dark:text-base-white">
            Practice Mode: {currentLecture.title}
          </h2>
          <button 
            onClick={() => setShowPracticeModal(false)}
            className="text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          {isGeneratingExercises ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="animate-spin h-10 w-10 text-primary-500 mb-4" />
              <p className="text-dark-700 dark:text-dark-200">Generating practice exercises with AI...</p>
              <p className="text-dark-500 dark:text-dark-400 text-sm mt-2">This might take a moment</p>
            </div>
          ) : exerciseError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg mb-4 max-w-md mx-auto text-center">
                <p className="font-medium mb-2">Error generating exercises</p>
                <p className="text-sm">{exerciseError}</p>
              </div>
              <button
                onClick={generateAIExercises}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-dark-700 dark:text-dark-300 mb-4">No exercises available for this topic.</p>
              <button
                onClick={generateAIExercises}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Generate Exercises
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4 text-sm text-dark-500 dark:text-white">
                <Clock size={16} />
                <span>Current Exercise: {currentExercise + 1} / {exercises.length}</span>
              </div>
              
              {currentEx && currentEx.type === "quiz" && (
                <div className="mb-4 bg-dark-50 dark:bg-dark-850 p-4 rounded-lg border border-dark-200/20 dark:border-dark-700/30">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg text-dark-900 dark:text-white">Quiz Question</h3>
                    {currentEx.difficulty && (
                      <span className="text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 
                                px-2 py-1 rounded-full">
                        {currentEx.difficulty}
                      </span>
                    )}
                  </div>
                  
                  {currentEx.learningObjective && (
                    <p className="text-sm text-dark-600 dark:text-dark-400 mb-3 italic">
                      Learning objective: {currentEx.learningObjective}
                    </p>
                  )}
                  
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
                            : isAnswerCorrect === false && index === currentEx.correctAnswer
                            ? 'bg-green-500/20 border-green-500 border text-green-700 dark:text-green-300'
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
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg text-dark-900 dark:text-white">Coding Exercise</h3>
                    {currentEx.difficulty && (
                      <span className="text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 
                                px-2 py-1 rounded-full">
                        {currentEx.difficulty}
                      </span>
                    )}
                  </div>
                  
                  {currentEx.learningObjective && (
                    <p className="text-sm text-dark-600 dark:text-dark-400 mb-3 italic">
                      Learning objective: {currentEx.learningObjective}
                    </p>
                  )}
                  
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
                        value={userAnswer || currentEx.starterCode}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="absolute inset-0 font-mono p-4 bg-transparent text-slate-50 resize-none outline-none border-2 border-primary-500/0 focus:border-primary-500/50 rounded-lg transition-colors"
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
                  <div className="text-dark-700 dark:text-dark-200 flex items-center gap-4">
                    <span>Exercise {currentExercise + 1} of {exercises.length}</span>
                    <div className="bg-dark-200 dark:bg-dark-700 rounded-full h-2 w-40">
                      <div 
                        className="bg-primary-500 h-2 rounded-full" 
                        style={{ width: `${((currentExercise + 1) / exercises.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  {currentExercise < exercises.length - 1 ? (
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
                      Complete Practice
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
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeModal; 