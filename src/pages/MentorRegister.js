import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import mainLogo from "../assets/logo.svg";
import { FaGithub, FaLinkedin, FaTwitter, FaGlobe, FaTimes, FaPlus } from "react-icons/fa";
import { useAuth } from "../components/authContext";

const MentorRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { registerMentor, currentUser, setAuth } = useAuth();
  
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    skills: [],
    experience: "",
    hourlyRate: "",
    bio: "",
    socialLinks: {
      linkedin: "",
      github: "",
      twitter: "",
      website: ""
    },
    specializations: [],
    languages: ["English"],
    timezone: "UTC",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [skill, setSkill] = useState("");
  const [specialization, setSpecialization] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (currentUser) {
      navigate('/home');
    }
  }, [currentUser, navigate]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested social links
    if (name.includes("social_")) {
      const socialNetwork = name.split("_")[1];
      setFormData({
        ...formData,
        socialLinks: {
          ...formData.socialLinks,
          [socialNetwork]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle adding a skill
  const handleAddSkill = () => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill.trim()]
      });
      setSkill("");
    }
  };

  // Handle removing a skill
  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skillToRemove)
    });
  };

  // Handle adding a specialization
  const handleAddSpecialization = () => {
    if (specialization.trim() && !formData.specializations.includes(specialization.trim())) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, specialization.trim()]
      });
      setSpecialization("");
    }
  };

  // Handle removing a specialization
  const handleRemoveSpecialization = (specializationToRemove) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter(s => s !== specializationToRemove)
    });
  };

  // Handle form validation
  const validateForm = () => {
    if (!formData.username) {
      setError("Username is required");
      return false;
    }

    if (!formData.name) {
      setError("Full name is required");
      return false;
    }

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError("Valid email is required");
      return false;
    }

    if (!formData.password) {
      setError("Password is required");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.skills.length === 0) {
      setError("At least one skill is required");
      return false;
    }

    if (!formData.experience) {
      setError("Experience level is required");
      return false;
    }

    if (!formData.hourlyRate || isNaN(formData.hourlyRate) || formData.hourlyRate <= 0) {
      setError("Valid hourly rate is required");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      // Transform data for API
      const mentorData = {
        ...formData,
        hourlyRate: parseFloat(formData.hourlyRate),
        // Ensure arrays are properly formatted
        skills: Array.isArray(formData.skills) ? formData.skills : [],
        specializations: Array.isArray(formData.specializations) ? formData.specializations : [],
        languages: Array.isArray(formData.languages) ? formData.languages : ["English"]
      };

      if (mentorData.skills.length === 0) {
        setError("At least one skill is required");
        setLoading(false);
        return;
      }

      const result = await registerMentor(mentorData);
      if (result.success) {
        setAuth({ user: { role: "mentor", ...formData }, isAuthenticated: true });
        navigate('/mentor-dashboard');
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (error) {
      console.error("Mentor registration error:", error);
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black to-gray-900 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl transform transition-all duration-300">
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
              Become a Mentor
            </h1>
            <p className="text-center text-gray-400 mt-2 max-w-md">
              Join our community of mentors and share your expertise with students around the world.
            </p>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="bg-red-500/90 text-white p-3 rounded-xl mb-4 text-sm backdrop-blur-sm animate-fadeIn">
              {error}
            </div>
          )}

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-white">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 bg-black/80 rounded-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50 mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 bg-black/80 rounded-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50 mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 bg-black/80 rounded-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50 mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Experience</label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 bg-black/80 rounded-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50 mt-1"
                >
                  <option value="">Select experience</option>
                  <option value="1+ years">1+ years</option>
                  <option value="2+ years">2+ years</option>
                  <option value="3+ years">3+ years</option>
                  <option value="5+ years">5+ years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 bg-black/80 rounded-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50 mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 bg-black/80 rounded-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50 mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Hourly Rate ($)</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  min="1"
                  step="0.01"
                  className="w-full h-12 px-4 bg-black/80 rounded-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50 mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white">Timezone</label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 bg-black/80 rounded-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50 mt-1"
                >
                  <option value="UTC">UTC</option>
                  <option value="UTC+1">UTC+1</option>
                  <option value="UTC+2">UTC+2</option>
                  <option value="UTC+3">UTC+3</option>
                  <option value="UTC+4">UTC+4</option>
                  <option value="UTC-5">UTC-5</option>
                  <option value="UTC-8">UTC-8</option>
                </select>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Skills</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  placeholder="Add a skill"
                  className="w-full h-12 px-4 bg-black/80 rounded-l-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="h-12 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-r-xl"
                >
                  <FaPlus />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full flex items-center">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 text-primary-400 hover:text-white"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Specializations */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Specializations</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Add a specialization"
                  className="w-full h-12 px-4 bg-black/80 rounded-l-xl text-white placeholder-gray-400 
                           border-2 border-transparent focus:border-primary-400 transition-all duration-300
                           focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialization())}
                />
                <button
                  type="button"
                  onClick={handleAddSpecialization}
                  className="h-12 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-r-xl"
                >
                  <FaPlus />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.specializations.map((spec, index) => (
                  <div key={index} className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full flex items-center">
                    {spec}
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialization(spec)}
                      className="ml-2 text-primary-400 hover:text-white"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-black/80 rounded-xl text-white placeholder-gray-400 
                         border-2 border-transparent focus:border-primary-400 transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                placeholder="Tell us about yourself and your expertise..."
              ></textarea>
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Social Links</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className="bg-primary-500/20 p-3 rounded-l-lg">
                    <FaLinkedin className="text-primary-400" />
                  </div>
                  <input
                    type="text"
                    name="social_linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={handleInputChange}
                    placeholder="LinkedIn Profile URL"
                    className="w-full h-12 px-4 bg-black/80 rounded-r-xl text-white placeholder-gray-400 
                             border-2 border-transparent focus:border-primary-400 transition-all duration-300
                             focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  />
                </div>

                <div className="flex items-center">
                  <div className="bg-primary-500/20 p-3 rounded-l-lg">
                    <FaGithub className="text-primary-400" />
                  </div>
                  <input
                    type="text"
                    name="social_github"
                    value={formData.socialLinks.github}
                    onChange={handleInputChange}
                    placeholder="GitHub Profile URL"
                    className="w-full h-12 px-4 bg-black/80 rounded-r-xl text-white placeholder-gray-400 
                             border-2 border-transparent focus:border-primary-400 transition-all duration-300
                             focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  />
                </div>

                <div className="flex items-center">
                  <div className="bg-primary-500/20 p-3 rounded-l-lg">
                    <FaTwitter className="text-primary-400" />
                  </div>
                  <input
                    type="text"
                    name="social_twitter"
                    value={formData.socialLinks.twitter}
                    onChange={handleInputChange}
                    placeholder="Twitter Profile URL"
                    className="w-full h-12 px-4 bg-black/80 rounded-r-xl text-white placeholder-gray-400 
                             border-2 border-transparent focus:border-primary-400 transition-all duration-300
                             focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  />
                </div>

                <div className="flex items-center">
                  <div className="bg-primary-500/20 p-3 rounded-l-lg">
                    <FaGlobe className="text-primary-400" />
                  </div>
                  <input
                    type="text"
                    name="social_website"
                    value={formData.socialLinks.website}
                    onChange={handleInputChange}
                    placeholder="Personal Website URL"
                    className="w-full h-12 px-4 bg-black/80 rounded-r-xl text-white placeholder-gray-400 
                             border-2 border-transparent focus:border-primary-400 transition-all duration-300
                             focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  />
                </div>
              </div>
            </div>

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
                <span>Register as Mentor</span>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center">
              <Link to="/login" className="text-primary-400 hover:text-primary-300 text-sm">
                Already have an account? Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MentorRegister; 