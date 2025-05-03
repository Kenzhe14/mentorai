import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import mainLogo from "../assets/Logo.svg";
import { FaGoogle, FaPhoneAlt, FaApple, FaEnvelope } from "react-icons/fa";
import { useAuth } from "../components/authContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, currentUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isPhoneLogin, setIsPhoneLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    identifier: "", // email или телефон
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [hasOnboardingData, setHasOnboardingData] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (currentUser) {
      navigate('/home');
    }
  }, [currentUser, navigate]);

  // Check if coming from onboarding and set signup mode
  useEffect(() => {
    // Check if there's a message in location state
    if (location.state?.message) {
      setMessage(location.state.message);
    }

    // Check if coming from onboarding
    if (location.state?.fromOnboarding) {
      setIsLogin(false); // Set to signup mode
    }

    // Check if onboarding data exists
    const onboardingData = localStorage.getItem("onboardingData");
    if (onboardingData) {
      setHasOnboardingData(true);
      // If coming from onboarding, automatically set to signup mode
      if (location.state?.fromOnboarding) {
        setIsLogin(false);
      }
    }
  }, [location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const toggleLoginMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  const toggleIdentifierType = () => {
    setIsPhoneLogin(!isPhoneLogin);
    setFormData({
      ...formData,
      identifier: "",
    });
    setError("");
  };

  const validateForm = () => {
    if (!isLogin && !formData.username) {
      setError("Username is required");
      return false;
    }

    if (isLogin && !formData.username) {
      setError("Username is required");
      return false;
    }

    if (!isLogin && !formData.identifier) {
      setError(`${isPhoneLogin ? "Phone number" : "Email"} is required`);
      return false;
    }

    if (
      isPhoneLogin &&
      formData.identifier &&
      !/^\+7\d{10}$/.test(formData.identifier)
    ) {
      setError("Phone number must be in format +7XXXXXXXXXX");
      return false;
    }

    if (
      !isPhoneLogin &&
      formData.identifier &&
      !/^\S+@\S+\.\S+$/.test(formData.identifier)
    ) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!formData.password) {
      setError("Password is required");
      return false;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Handle login
        const result = await login(formData.username, formData.password);
        if (result.success) {
          navigate('/home');
        } else {
          setError(result.error || "Login failed");
        }
      } else {
        // Handle registration
        // Get onboarding data if it exists
        let onboardingDataObj = null;
        if (hasOnboardingData) {
          try {
            const onboardingDataStr = localStorage.getItem("onboardingData");
            if (onboardingDataStr) {
              onboardingDataObj = JSON.parse(onboardingDataStr);
              
              // Ensure arrays are initialized (not null)
              if (!onboardingDataObj.interests) onboardingDataObj.interests = [];
              if (!onboardingDataObj.goals) onboardingDataObj.goals = [];
              
              // Set completed flag
              onboardingDataObj.completed = true;
            }
          } catch (err) {
            console.error("Error parsing onboarding data:", err);
          }
        }

        const userData = {
          username: formData.username,
          [isPhoneLogin ? "phone" : "email"]: formData.identifier,
          password: formData.password,
        };
        
        // Only add onboardingData if it exists and has actual data
        if (onboardingDataObj && (
            onboardingDataObj.interests?.length > 0 || 
            onboardingDataObj.goals?.length > 0)) {
          userData.onboardingData = onboardingDataObj;
        }

        const result = await register(userData);
        if (result.success) {
          // Clear onboarding data after successful registration
          if (hasOnboardingData) {
            localStorage.removeItem("onboardingData");
          }
          navigate('/home');
        } else {
          setError(result.error || "Registration failed");
        }
      }
    } catch (error) {
      console.error("Login/Register error:", error);
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`${provider} login clicked`);
    // Social login logic would go here
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black to-gray-900 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md transform transition-all duration-300 hover:scale-[1.02] ">
        <div className="bg-second-500 rounded-3xl border-2 border-primary-400 border-opacity-70 shadow-2xl backdrop-blur-sm p-6 sm:p-8 md:p-10">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <img
              src={mainLogo}
              className="w-20 h-20 md:w-24 md:h-24 object-contain bg-primary-400 rounded-2xl"
              alt="logo"
              draggable="false"
            />
            <h1 className="text-wsecond-500 text-2xl md:text-3xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">
              {isLogin ? "Welcome Back!" : "Create Account"}
            </h1>
          </div>

          {/* Messages Section */}
          {message && (
            <div className="bg-blue-600/90 text-white p-3 rounded-xl mb-4 text-sm backdrop-blur-sm animate-fadeIn">
              {message}
            </div>
          )}

          {hasOnboardingData && !isLogin && (
            <div className="bg-green-600/90 text-white p-3 rounded-xl mb-4 text-sm backdrop-blur-sm animate-fadeIn">
              Your preferences have been saved! Complete registration to continue.
            </div>
          )}

          {error && (
            <div className="bg-red-500/90 text-white p-3 rounded-xl mb-4 text-sm backdrop-blur-sm animate-fadeIn">
              {error}
            </div>
          )}

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            {(!isLogin || isLogin) && (
              <div className="relative group">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 bg-black/80 rounded-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50 "
                />
              </div>
            )}

            {/* Email/Phone Toggle Button */}
            {!isLogin && (
              <div className="flex justify-center my-4">
                <button
                  type="button"
                  onClick={toggleIdentifierType}
                  className="flex items-center gap-2 text-primary-400 hover:text-primary-400 
                           transition-all duration-300 transform hover:scale-105 px-4 py-2 rounded-lg
                           hover:bg-primary-400/10"
                >
                  {isPhoneLogin ? (
                    <FaEnvelope className="text-lg" />
                  ) : (
                    <FaPhoneAlt className="text-lg" />
                  )}
                  <span>Switch to {isPhoneLogin ? "Email" : "Phone"}</span>
                </button>
              </div>
            )}

            {/* Email/Phone Input */}
            {!isLogin && (
              <div className="relative group">
                <input
                  type={isPhoneLogin ? "tel" : "email"}
                  name="identifier"
                  placeholder={isPhoneLogin ? "+7XXXXXXXXXX" : "Email"}
                  value={formData.identifier}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 bg-black/80 rounded-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                />
              </div>
            )}

            {/* Password Input */}
            <div className="relative group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full h-12 px-4 bg-black/80 rounded-xl text-white placeholder-gray-400 
                         border-2 border-transparent focus:border-primary-400 transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-primary-400/50"
              />
            </div>

            {/* Confirm Password Input */}
            {!isLogin && (
              <div className="relative group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 bg-black/80 rounded-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                />
              </div>
            )}

            {/* Divider */}
            <div className="relative py-4">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white to-transparent"></div>
            </div>

            {/* Social Login Buttons */}
            <div className="flex justify-center gap-6">
              <button
                type="button"
                onClick={() => handleSocialLogin("Google")}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 
                         transform hover:scale-110 group"
              >
                <FaGoogle className="w-6 h-6 text-white group-hover:text-primary-400" />
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("Apple")}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 
                         transform hover:scale-110 group"
              >
                <FaApple className="w-6 h-6 text-white group-hover:text-primary-400" />
              </button>
            </div>

            {/* Toggle Login/Signup */}
            <button
              type="button"
              onClick={toggleLoginMode}
              className="w-full text-center text-primary-400 hover:text-primary-300 transition-colors duration-300 
                       text-sm font-medium mt-4 hover:underline"
            >
              {isLogin
                ? "Need an account? Sign up"
                : "Already have an account? Log in"}
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white 
                       transition-all duration-300 transform hover:scale-[1.02]
                       ${loading
                ? "bg-primary-600/50 cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-500 active:bg-primary-700"
              } shadow-lg hover:shadow-primary-500/50`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                <span>{isLogin ? "LOG IN" : "SIGN UP"}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
