import React, { useState, useEffect } from 'react';
import "../index.css";
import LeftBar from "../components/sidebar";
import { ChevronRight, X, Calendar, Mail, Globe, MessageSquare } from "lucide-react";
import { FaSearch, FaStar, FaFilter, FaGithub, FaLinkedin } from 'react-icons/fa';
import { AppAPI } from "../services/api";
import { useAuth } from "../components/authContext";

function Mentors() {
    const [mentors, setMentors] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortByRating, setSortByRating] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({
        skills: [],
        experience: 'all',
        rating: 0,
        availability: false
    });
    const [isMobile, setIsMobile] = useState(false);
    const [allSkills, setAllSkills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { API_URL } = useAuth();

    // Fetch mentors data from API
    useEffect(() => {
        const fetchMentors = async () => {
            try {
                setIsLoading(true);
                console.log("Fetching mentors from API...");
                const response = await AppAPI.getMentors();
                
                console.log("API Response:", response);
                
                if (response.success && response.data) {
                    console.log("Mentors data:", response.data.mentors);
                    setMentors(response.data.mentors);
                    
                    // Extract unique skills from all mentors
                    const skills = new Set();
                    response.data.mentors.forEach(mentor => {
                        if (mentor.skills && Array.isArray(mentor.skills)) {
                            mentor.skills.forEach(skill => {
                                skills.add(skill);
                            });
                        }
                    });
                    
                    setAllSkills(Array.from(skills).sort());
                } else {
                    throw new Error("Failed to load mentors data");
                }
            } catch (err) {
                console.error("Error fetching mentors:", err);
                setError("Failed to load mentors. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchMentors();
    }, []);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);


    let filteredMentors = mentors.filter(mentor => {
        // Search filter (name or skills)
        const searchMatch = mentor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mentor.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Availability filter
        const availabilityMatch = !filters.availability || mentor.available;
        
        // Skills filter
        const skillsMatch = filters.skills.length === 0 || 
            filters.skills.some(skill => mentor.skills?.includes(skill));
            
        // Experience filter
        let experienceMatch = true;
        if (filters.experience !== 'all' && mentor.experience) {
            // Parse experience string like "5+ years" to extract the number
            const yearsText = mentor.experience.split(' ')[0]; // Get "5+"
            const years = parseInt(yearsText.replace('+', '')); // Remove "+" and parse
            
            switch(filters.experience) {
                case '1-3':
                    experienceMatch = years >= 1 && years <= 3;
                    break;
                case '3-5':
                    experienceMatch = years >= 3 && years <= 5;
                    break;
                case '5+':
                    experienceMatch = years >= 5;
                    break;
                default:
                    experienceMatch = true;
            }
        }
        
        // Rating filter
        const ratingMatch = (mentor.rating || 0) >= filters.rating;
        
        return searchMatch && availabilityMatch && skillsMatch && experienceMatch && ratingMatch;
    });

    // Apply sorting
    if (sortByRating) {
        filteredMentors = [...filteredMentors].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    // Format experience string
    const formatExperience = (years) => {
        if (!years && years !== 0) return "Not specified";
        return `${years}+ years`;
    };

    return (
        <LeftBar>
            <div className={`${isMobile ? "mt-16" : ""} p-4 md:p-6 bg-dark-50 dark:bg-dark-950 min-h-screen`}>
                {/* Header section */}
                <div className="max-w-7xl mx-auto mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-dark-900 dark:text-base-white">
                        Find Your Perfect Mentor
                    </h1>
                    <p className="text-dark-600 dark:text-dark-300 max-w-2xl">
                        Connect with expert mentors who can guide you through your learning journey. 
                        Get personalized feedback, code reviews, and career advice.
                    </p>
                </div>

                {/* Search and filters */}
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <input
                                type="text"
                                placeholder="Search mentors..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 
                                         focus:ring-primary-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="availableOnly"
                                    checked={filters.availability}
                                    onChange={() => setFilters({...filters, availability: !filters.availability})}
                                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="availableOnly" className="text-sm text-gray-700 dark:text-gray-300">
                                    Available Only
                                </label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="sortByRating"
                                    checked={sortByRating}
                                    onChange={() => setSortByRating(!sortByRating)}
                                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="sortByRating" className="text-sm text-gray-700 dark:text-gray-300">
                                    Best Rated
                                </label>
                            </div>
                            
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg 
                                         hover:bg-primary-600 transition-colors"
                            >
                                <FaFilter />
                                <span>Filters</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Skills Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Skills
                                    </label>
                                    <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-lg p-2">
                                        {allSkills.map(skill => (
                                            <label key={skill} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={filters.skills.includes(skill)}
                                                    onChange={() => {
                                                        const updatedSkills = filters.skills.includes(skill) 
                                                            ? filters.skills.filter(s => s !== skill) 
                                                            : [...filters.skills, skill];
                                                        setFilters({...filters, skills: updatedSkills});
                                                    }}
                                                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{skill}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Experience Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Experience
                                    </label>
                                    <select
                                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 
                                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        value={filters.experience}
                                        onChange={(e) => setFilters({...filters, experience: e.target.value})}
                                    >
                                        <option value="all">All</option>
                                        <option value="1-3">1-3 years</option>
                                        <option value="3-5">3-5 years</option>
                                        <option value="5+">5+ years</option>
                                    </select>
                                </div>

                                {/* Rating Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Minimum Rating
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setFilters({ ...filters, rating: star })}
                                                className={`text-2xl ${
                                                    star <= filters.rating ? 'text-yellow-400' : 'text-gray-300'
                                                }`}
                                            >
                                                <FaStar />
                                            </button>
                                        ))}
                                        {filters.rating > 0 && (
                                            <button
                                                onClick={() => setFilters({ ...filters, rating: 0 })}
                                                className="ml-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={() => {
                                        setFilters({
                                            skills: [],
                                            experience: 'all',
                                            rating: 0,
                                            availability: false
                                        });
                                        setSortByRating(false);
                                    }}
                                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="max-w-7xl mx-auto text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-r-transparent"></div>
                        <p className="mt-2 text-dark-600 dark:text-dark-300">Loading mentors...</p>
                    </div>
                ) : error ? (
                    <div className="max-w-7xl mx-auto text-center py-12">
                        <p className="text-red-500">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredMentors.map(mentor => (
                                <div 
                                    key={mentor.id} 
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl 
                                             transition-all duration-300 overflow-hidden border border-gray-100 
                                             dark:border-gray-700 group relative"
                                >
                                    {/* Status Badge */}
                                    {!mentor.available && (
                                        <div className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm text-white 
                                                      px-3 py-1 rounded-full text-xs font-medium z-10">
                                            Unavailable
                                        </div>
                                    )}
                                    
                                    {/* Profile Image Section */}
                                    <div className="relative">
                                        <div className="overflow-hidden h-48 bg-gray-100 dark:bg-gray-700">
                                            <img 
                                                src={
                                                    mentor.avatar_url
                                                        ? mentor.avatar_url.startsWith('http')
                                                            ? mentor.avatar_url
                                                            : `${API_URL}${mentor.avatar_url}`
                                                        : "https://via.placeholder.com/300x200?text=No+Image"
                                                } 
                                                alt={mentor.name} 
                                                className="w-full h-full object-cover transition-transform duration-300 
                                                         group-hover:scale-105" 
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                                                }}
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 
                                                      group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-5">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white 
                                                           group-hover:text-primary-500 dark:group-hover:text-primary-400 
                                                           transition-colors">
                                                    {mentor.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {formatExperience(mentor.years_of_experience)} experience
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <FaStar className="text-yellow-400" />
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    {mentor.rating ? mentor.rating.toFixed(1) : "N/A"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Skills */}
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {mentor.skills?.slice(0, 3).map((skill) => (
                                                <span 
                                                    key={skill}
                                                    className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 
                                                             text-gray-700 dark:text-gray-300 rounded-full"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {mentor.skills?.length > 3 && (
                                                <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 
                                                             text-gray-700 dark:text-gray-300 rounded-full">
                                                    +{mentor.skills.length - 3}
                                                </span>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 
                                                      dark:border-gray-700">
                                            <div className="text-primary-500 dark:text-primary-400 font-semibold">
                                                ${mentor.hourly_rate || 0}/hour
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedMentor(mentor);
                                                    setShowModal(true);
                                                }}
                                                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 
                                                         dark:text-gray-400 hover:text-primary-500 
                                                         dark:hover:text-primary-400 transition-colors"
                                            >
                                                View Profile
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mentor Profile Modal */}
                        {showModal && selectedMentor && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                                    <div className="relative">
                                        <button 
                                            onClick={() => setShowModal(false)}
                                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                        >
                                            <X className="text-gray-500 dark:text-gray-400" size={24} />
                                        </button>
                                        
                                        <div className="p-6 md:p-8">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="md:w-1/3">
                                                    <div className="overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700 shadow-lg" style={{ height: '250px' }}>
                                                        <img 
                                                            src={
                                                                selectedMentor.avatar_url
                                                                    ? selectedMentor.avatar_url.startsWith('http')
                                                                        ? selectedMentor.avatar_url
                                                                        : `${API_URL}${selectedMentor.avatar_url}`
                                                                    : "https://via.placeholder.com/300x200?text=No+Image"
                                                            } 
                                                            alt={selectedMentor.name}
                                                            className="w-full h-full object-cover" 
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mt-6 space-y-4">
                                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                                            <Mail size={20} />
                                                            <span>{selectedMentor.email || "Contact Mentor"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                                            <Calendar size={20} />
                                                            <span>Schedule Session</span>
                                                        </div>
                                                        {selectedMentor.website && (
                                                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                                                <Globe size={20} />
                                                                <span>{selectedMentor.website}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex gap-4 mt-4">
                                                            {selectedMentor.github && (
                                                                <a href={selectedMentor.github} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                                                    <FaGithub size={24} className="text-gray-600 dark:text-gray-300" />
                                                                </a>
                                                            )}
                                                            {selectedMentor.linkedin && (
                                                                <a href={selectedMentor.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                                                    <FaLinkedin size={24} className="text-gray-600 dark:text-gray-300" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="md:w-2/3">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                            {selectedMentor.name}
                                                        </h2>
                                                        <div className="flex items-center gap-2">
                                                            <FaStar className="text-yellow-400" size={20} />
                                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                {selectedMentor.rating ? selectedMentor.rating.toFixed(1) : "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Experience</p>
                                                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                                                                {formatExperience(selectedMentor.years_of_experience)}
                                                            </p>
                                                        </div>
                                                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Hourly Rate</p>
                                                            <p className="text-lg font-medium text-primary-500">
                                                                ${selectedMentor.hourly_rate || 0}/hour
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mb-6">
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                                            Skills & Expertise
                                                        </h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedMentor.skills?.map((skill) => (
                                                                <span 
                                                                    key={skill}
                                                                    className="px-3 py-1.5 text-sm font-medium bg-primary-100 dark:bg-primary-900 
                                                                             text-primary-700 dark:text-primary-300 rounded-full"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="mb-6">
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                                            About
                                                        </h3>
                                                        <p className="text-gray-600 dark:text-gray-300">
                                                            {selectedMentor.bio || 
                                                                `Experienced mentor specializing in ${selectedMentor.skills?.join(", ") || "various technologies"}. 
                                                                Passionate about helping others grow in their tech journey with ${formatExperience(selectedMentor.years_of_experience)} of industry experience.`}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-4">
                                                        <button className="flex-1 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 
                                                                         transition-colors flex items-center justify-center gap-2">
                                                            <MessageSquare size={20} />
                                                            <span>Start Chat</span>
                                                        </button>
                                                        <button className="flex-1 py-3 border-2 border-primary-500 text-primary-500 rounded-lg 
                                                                         hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors 
                                                                         flex items-center justify-center gap-2">
                                                            <Calendar size={20} />
                                                            <span>Book Session</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {filteredMentors.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-dark-500 dark:text-dark-400">
                                    No mentors found matching your search criteria.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </LeftBar>
    );
}

export default Mentors;
