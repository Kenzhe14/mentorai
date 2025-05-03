import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { useAuth } from "./authContext";
import photo from "../static/media/profile2.jpg";

export default function SettingsPopup({ isOpen, onClose }) {
    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(photo);
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    
    const { API_URL, currentUser, refreshUser } = useAuth();

    useEffect(() => {
        if (!isOpen || !currentUser) return;
        
        // Set initial values from currentUser
        setDisplayName(currentUser.displayName || currentUser.username || "");
        setAvatarUrl(
            currentUser.avatarUrl 
                ? currentUser.avatarUrl.startsWith('http')
                    ? currentUser.avatarUrl
                    : `${API_URL}${currentUser.avatarUrl}`
                : photo
        );
        
        // Clear messages
        setErrorMessage("");
        setSuccessMessage("");
    }, [isOpen, currentUser, API_URL]);

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            // Check file size (limit to 2MB)
            const file = acceptedFiles[0];
            const fileSize = file.size / 1024 / 1024; // convert to MB
            
            if (fileSize > 2) {
                setErrorMessage("Image is too large. Maximum file size is 2MB.");
                return;
            }
            
            setFile(file);
            const preview = URL.createObjectURL(file);
            setAvatarUrl(preview); // Local preview before upload
            setErrorMessage(""); // Clear error message if previously set
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/webp": [".webp"]
        },
        maxFiles: 1,
        maxSize: 2097152, // 2MB in bytes
        onDropRejected: (rejectedFiles) => {
            if (rejectedFiles.length > 0) {
                const errors = rejectedFiles[0].errors;
                if (errors.some(err => err.code === 'file-too-large')) {
                    setErrorMessage("Image is too large. Maximum file size is 2MB.");
                } else if (errors.some(err => err.code === 'file-invalid-type')) {
                    setErrorMessage("Invalid file type. Please upload PNG, JPG, or WebP images only.");
                } else {
                    setErrorMessage("There was an error with the file. Please try another one.");
                }
            }
        }
    });

    const handleSave = async () => {
        setIsLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        
        try {
            // Upload avatar if a file is selected
            if (file) {
                const formData = new FormData();
                formData.append("avatar", file);

                const uploadRes = await axios.post(
                    `${API_URL}/api/profile/avatar`, 
                    formData, 
                    { withCredentials: true }
                );

                if (!uploadRes.data.success) {
                    throw new Error(uploadRes.data.error || "Failed to upload avatar");
                }
            }

            // Update profile if display name is changed
            if (displayName && displayName !== (currentUser.displayName || currentUser.username)) {
                const updateRes = await axios.put(
                    `${API_URL}/api/profile`,
                    { displayName },
                    { withCredentials: true }
                );

                if (!updateRes.data.success) {
                    throw new Error(updateRes.data.error || "Failed to update profile");
                }
            }

            // Refresh user data
            await refreshUser();
            
            setSuccessMessage("Profile updated successfully");
            setTimeout(() => {
                onClose(); // Close popup after a short delay
            }, 1500);
            
        } catch (error) {
            console.error("Error updating profile:", error);
            setErrorMessage(error.message || "An error occurred while updating your profile");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-xl w-96 text-black dark:text-white space-y-4">
                <h2 className="text-xl font-semibold">Profile Settings</h2>

                <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary-500">
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = photo;
                            }}
                        />
                    </div>
                </div>

                <div
                    {...getRootProps()}
                    className={`border-dashed border-2 border-gray-300 dark:border-gray-600 p-4 rounded-lg cursor-pointer text-center transition
                        ${isDragActive ? "bg-primary-100 dark:bg-primary-900/20" : "bg-gray-50 dark:bg-dark-700"}`}
                >
                    <input {...getInputProps()} />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {isDragActive
                            ? "Drop the file here"
                            : "Drag and drop an image, or click to select"}
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Display Name
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg dark:bg-dark-700 dark:border-dark-600"
                        placeholder="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />
                </div>

                {errorMessage && (
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                        {errorMessage}
                    </div>
                )}
                
                {successMessage && (
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
                        {successMessage}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-200 dark:bg-dark-600 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-500 transition"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
