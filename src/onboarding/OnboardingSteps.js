import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";

// API URL
const API_URL = "http://localhost:5000";

// Configure axios to send credentials (cookies)
axios.defaults.withCredentials = true;

// Step components
const AgeStep = ({ age, setAge, nextStep }) => {
  const ageOptions = [
    { label: "18-24", value: "18-24" },
    { label: "25-34", value: "25-34" },
    { label: "35-44", value: "35-44" },
    { label: "45+", value: "45+" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <h2 className="text-3xl font-bold mb-8 text-center text-white">
        Let's create your personalized mentoring plan
      </h2>
      <p className="text-xl mb-10 text-center text-gray-300">
        What is your age range?
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ageOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setAge(option.value);
              nextStep();
            }}
            className={`p-6 rounded-lg border-2 transition-all transform hover:scale-105 ${
              age === option.value
                ? "border-cyan-400 bg-gray-800"
                : "border-gray-600 bg-gray-900"
            }`}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {option.label}
              </span>
            </div>
            <p className="text-center text-white font-medium">{option.label}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

const ExperienceStep = ({ experience, setExperience, nextStep, prevStep }) => {
  const experienceOptions = [
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Advanced", value: "advanced" },
    { label: "Expert", value: "expert" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <h2 className="text-3xl font-bold mb-8 text-center text-white">
        What's your experience level?
      </h2>
      <p className="text-xl mb-10 text-center text-gray-300">
        This helps us tailor your learning journey
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {experienceOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setExperience(option.value);
              nextStep();
            }}
            className={`p-6 rounded-lg border-2 transition-all transform hover:scale-105 ${
              experience === option.value
                ? "border-cyan-400 bg-gray-800"
                : "border-gray-600 bg-gray-900"
            }`}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <span className="text-lg font-bold text-white text-center">
                {option.label}
              </span>
            </div>
            <p className="text-center text-white font-medium">{option.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={prevStep}
          className="px-6 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition"
        >
          Back
        </button>
      </div>
    </motion.div>
  );
};

const InterestsStep = ({ interests, setInterests, nextStep, prevStep }) => {
  const interestOptions = [
    { label: "Web Development", value: "web-development" },
    { label: "Mobile Development", value: "mobile-development" },
    { label: "Data Science", value: "data-science" },
    { label: "Machine Learning", value: "machine-learning" },
    { label: "DevOps", value: "devops" },
    { label: "Cybersecurity", value: "cybersecurity" },
    { label: "UI/UX Design", value: "ui-ux-design" },
    { label: "Game Development", value: "game-development" },
  ];

  const toggleInterest = (value) => {
    if (interests.includes(value)) {
      setInterests(interests.filter((i) => i !== value));
    } else {
      setInterests([...interests, value]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <h2 className="text-3xl font-bold mb-8 text-center text-white">
        What are you interested in learning?
      </h2>
      <p className="text-xl mb-10 text-center text-gray-300">
        Select up to 3 areas (click to select/deselect)
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {interestOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => toggleInterest(option.value)}
            className={`p-6 rounded-lg border-2 transition-all transform hover:scale-105 ${
              interests.includes(option.value)
                ? "border-cyan-400 bg-gray-800"
                : "border-gray-600 bg-gray-900"
            }`}
          >
            <p className="text-center text-white font-medium">{option.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={prevStep}
          className="px-6 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={interests.length === 0}
          className={`px-6 py-2 rounded-full transition ${
            interests.length > 0
              ? "bg-gradient-to-r from-cyan-500 to-blue-700 text-white hover:opacity-90"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </motion.div>
  );
};

const GoalsStep = ({ goals, setGoals, nextStep, prevStep }) => {
  const goalOptions = [
    { label: "Learn new skills", value: "learn-new-skills" },
    { label: "Career advancement", value: "career-advancement" },
    { label: "Personal project", value: "personal-project" },
    { label: "Academic requirement", value: "academic-requirement" },
    { label: "Career change", value: "career-change" },
    { label: "Stay updated with trends", value: "stay-updated" },
  ];

  const toggleGoal = (value) => {
    if (goals.includes(value)) {
      setGoals(goals.filter((g) => g !== value));
    } else {
      setGoals([...goals, value]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <h2 className="text-3xl font-bold mb-8 text-center text-white">
        What are your learning goals?
      </h2>
      <p className="text-xl mb-10 text-center text-gray-300">
        Select all that apply (click to select/deselect)
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {goalOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => toggleGoal(option.value)}
            className={`p-6 rounded-lg border-2 transition-all transform hover:scale-105 ${
              goals.includes(option.value)
                ? "border-cyan-400 bg-gray-800"
                : "border-gray-600 bg-gray-900"
            }`}
          >
            <p className="text-center text-white font-medium">{option.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={prevStep}
          className="px-6 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={goals.length === 0}
          className={`px-6 py-2 rounded-full transition ${
            goals.length > 0
              ? "bg-gradient-to-r from-cyan-500 to-blue-700 text-white hover:opacity-90"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </motion.div>
  );
};

const LearningStyleStep = ({
  learningStyle,
  setLearningStyle,
  submitForm,
  prevStep,
}) => {
  const styleOptions = [
    {
      label: "Visual",
      value: "visual",
      description: "Learn through images, diagrams, and videos",
    },
    {
      label: "Auditory",
      value: "auditory",
      description: "Learn by listening to explanations",
    },
    {
      label: "Reading/Writing",
      value: "reading-writing",
      description: "Learn through text-based materials",
    },
    {
      label: "Kinesthetic",
      value: "kinesthetic",
      description: "Learn by doing and practicing",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <h2 className="text-3xl font-bold mb-8 text-center text-white">
        What's your preferred learning style?
      </h2>
      <p className="text-xl mb-10 text-center text-gray-300">
        This helps us recommend the best resources for you
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {styleOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setLearningStyle(option.value)}
            className={`p-6 rounded-lg border-2 transition-all transform hover:scale-105 ${
              learningStyle === option.value
                ? "border-cyan-400 bg-gray-800"
                : "border-gray-600 bg-gray-900"
            }`}
          >
            <h3 className="text-xl font-bold text-white mb-2">
              {option.label}
            </h3>
            <p className="text-gray-300">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={prevStep}
          className="px-6 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition"
        >
          Back
        </button>
        <button
          onClick={submitForm}
          disabled={!learningStyle}
          className={`px-6 py-2 rounded-full transition ${
            learningStyle
              ? "bg-gradient-to-r from-cyan-500 to-blue-700 text-white hover:opacity-90"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          Continue to Registration
        </button>
      </div>
    </motion.div>
  );
};

const OnboardingSteps = () => {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState("");
  const [experience, setExperience] = useState("");
  const [interests, setInterests] = useState([]);
  const [goals, setGoals] = useState([]);
  const [learningStyle, setLearningStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const submitForm = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Convert interests and goals from values to labels for better readability
      const interestLabels = interests.map((value) => {
        const option = interestOptions.find((opt) => opt.value === value);
        return option ? option.label : value;
      });

      const goalLabels = goals.map((value) => {
        const option = goalOptions.find((opt) => opt.value === value);
        return option ? option.label : value;
      });

      // Create onboarding data object
      const onboardingData = {
        age,
        experience,
        interests: interestLabels,
        goals: goalLabels,
        learningStyle,
      };
      
      // Store data in localStorage for registration process
      localStorage.setItem("onboardingData", JSON.stringify(onboardingData));

      // Try to send data to server if user is already logged in
      try {
        const response = await axios.post(`${API_URL}/api/onboarding/save`, onboardingData);
        console.log("Onboarding data saved to server:", response.data);
        
        // If successful and user is logged in, redirect to home
        if (response.data.success) {
          navigate("/home");
          return;
        }
      } catch (error) {
        // If unauthorized (401) or other error, continue to registration
        console.log("Not logged in yet or error saving onboarding data:", error);
      }

      // If not logged in or error saving, redirect to registration page
      navigate("/login", { state: { fromOnboarding: true } });
    } catch (err) {
      console.error("Error processing onboarding data:", err);
      setError("Failed to save your preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Define options here for reference in submitForm
  const interestOptions = [
    { label: "Web Development", value: "web-development" },
    { label: "Mobile Development", value: "mobile-development" },
    { label: "Data Science", value: "data-science" },
    { label: "Machine Learning", value: "machine-learning" },
    { label: "DevOps", value: "devops" },
    { label: "Cybersecurity", value: "cybersecurity" },
    { label: "UI/UX Design", value: "ui-ux-design" },
    { label: "Game Development", value: "game-development" },
  ];

  const goalOptions = [
    { label: "Learn new skills", value: "learn-new-skills" },
    { label: "Career advancement", value: "career-advancement" },
    { label: "Personal project", value: "personal-project" },
    { label: "Academic requirement", value: "academic-requirement" },
    { label: "Career change", value: "career-change" },
    { label: "Stay updated with trends", value: "stay-updated" },
  ];

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return <AgeStep age={age} setAge={setAge} nextStep={nextStep} />;
      case 2:
        return (
          <ExperienceStep
            experience={experience}
            setExperience={setExperience}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <InterestsStep
            interests={interests}
            setInterests={setInterests}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <GoalsStep
            goals={goals}
            setGoals={setGoals}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 5:
        return (
          <LearningStyleStep
            learningStyle={learningStyle}
            setLearningStyle={setLearningStyle}
            submitForm={submitForm}
            prevStep={prevStep}
          />
        );
      default:
        return <AgeStep age={age} setAge={setAge} nextStep={nextStep} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-black via-gray-900 to-black p-6 sm:p-10 md:p-16 text-white">
      {/* Progress indicator */}
      <div className="w-full max-w-4xl mb-12">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Step {step} of 5</span>
          <span className="text-sm text-gray-400">
            {(step / 5) * 100}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Current step */}
      {renderStep()}

      {/* Error message */}
      {error && (
        <div className="mt-6 p-4 bg-red-900 border border-red-500 rounded-lg text-white">
          {error}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-white">Saving your preferences...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingSteps;
