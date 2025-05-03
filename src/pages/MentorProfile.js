import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authContext";
import LeftBar from "../components/sidebar";
import { User, Upload, Camera, Check, X } from "lucide-react";
import { ProfileAPI } from "../services/api";

function MentorProfile() {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUser } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profileData, setProfileData] = useState({
    displayName: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  // Check screen size for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Load profile data
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        displayName: currentUser.displayName || "",
      });

      if (currentUser.avatarUrl) {
        // Use the full URL including the API base URL
        const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
        const fullAvatarUrl = currentUser.avatarUrl.startsWith("http") 
          ? currentUser.avatarUrl 
          : `${baseUrl}${currentUser.avatarUrl}`;
        setPreviewUrl(fullAvatarUrl);
      }
    }
  }, [currentUser]);

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Update profile
      const response = await ProfileAPI.updateProfile(profileData);
      
      if (response.success) {
        // Update avatar if a new file was selected
        if (avatar) {
          const avatarResponse = await ProfileAPI.uploadAvatar(avatar);
          
          if (avatarResponse.success) {
            // If avatar updated successfully, update local user data
            if (updateCurrentUser) {
              updateCurrentUser({
                ...currentUser,
                ...response.user,
                avatarUrl: avatarResponse.avatarUrl
              });
            }
            
            setMessage({ 
              type: "success", 
              text: "Profile and avatar updated successfully" 
            });
          }
        } else {
          // If no avatar uploaded, just update profile info
          if (updateCurrentUser) {
            updateCurrentUser({
              ...currentUser,
              ...response.user
            });
          }
          
          setMessage({ 
            type: "success", 
            text: "Profile updated successfully" 
          });
        }
      } else {
        setMessage({ 
          type: "error", 
          text: "Error updating profile" 
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ 
        type: "error", 
        text: "Error updating profile. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Trigger file dialog when clicking the avatar
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };
  
  // Clear selected avatar
  const handleClearAvatar = (e) => {
    e.stopPropagation();
    setAvatar(null);
    setPreviewUrl(currentUser?.avatarUrl ? `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${currentUser.avatarUrl}` : "");
  };

  return (
    <LeftBar>
      <div className={`${isMobile ? "mt-16" : ""} p-4 bg-dark-50 dark:bg-dark-950 min-h-screen`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600 
                      rounded-xl p-6 mb-8 ml-2 text-base-white shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 select-none flex items-center gap-2">
            <User size={28} />
            Edit Profile
          </h1>
          <p className="mb-2 opacity-90 select-none">
            Update your profile information and photo
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-dark-200/10 dark:border-dark-800/50">
          {/* Status message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === "success" 
                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400" 
                : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            {/* Avatar upload section */}
            <div className="mb-8 flex flex-col items-center">
              <div 
                className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer group"
                onClick={handleAvatarClick}
              >
                {previewUrl ? (
                  <>
                    <img 
                      src={previewUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera size={32} className="text-white" />
                    </div>
                    {/* Option to clear selected avatar */}
                    {avatar && (
                      <button 
                        type="button"
                        onClick={handleClearAvatar}
                        className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Upload size={32} className="text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <p className="mt-2 text-dark-600 dark:text-dark-400 text-sm">
                Click to upload profile photo
              </p>
            </div>

            {/* Form fields */}
            <div className="mb-6">
              <label 
                htmlFor="displayName" 
                className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2"
              >
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={profileData.displayName}
                onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 
                         bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:ring-2 
                         focus:ring-primary-500 focus:border-transparent"
                placeholder="Your display name"
              />
            </div>

            {/* Submit button */}
            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 
                          ${isLoading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-primary-500 hover:bg-primary-600'} 
                          text-white transition-colors`}
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </LeftBar>
  );
}

export default MentorProfile; 