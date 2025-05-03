import React, { useState, useEffect } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import axios from "axios";
import { LanguageProvider } from "../components/languagecontext.js";
import { useNavigate } from "react-router-dom";

// Import the extracted components
import ProgressOverview from "../components/skills/ProgressOverview";
import RecommendedTopics from "../components/skills/RecommendedTopics";
import SearchSkills from "../components/skills/SearchSkills";
import RoadmapWorm from "../components/skills/RoadmapWorm";

// Configure axios to send credentials (cookies)
axios.defaults.withCredentials = true;

const API_URL = "http://localhost:5000";
function Skills() {
  const [query, setQuery] = useState("");
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendedTopics, setRecommendedTopics] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [topicProgress, setTopicProgress] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendedTopics();
    const savedTopic = localStorage.getItem("lastTopic");
    const savedRoadmap = localStorage.getItem("lastRoadmap");
    const savedProgress = localStorage.getItem("topicProgress");

    if (savedProgress) {
      try {
        setTopicProgress(JSON.parse(savedProgress));
      } catch (error) {
        console.error("Error parsing saved progress:", error);
        setTopicProgress({});
      }
    }

    if (savedTopic && savedRoadmap) {
      setQuery(savedTopic);
      try {
        const parsedRoadmap = JSON.parse(savedRoadmap);
        if (Array.isArray(parsedRoadmap)) {
          setRoadmap(parsedRoadmap);
        } else {
          setRoadmap([]);
        }
      } catch (error) {
        console.error("Error parsing saved roadmap:", error);
        setRoadmap([]);
      }
    }
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const fetchRecommendedTopics = async () => {
    setLoadingRecommended(true);
    try {
      const response = await axios.post(
        `${API_URL}/en/api/web/personalized-content`,
        { contentType: "recommended-topics" }
      );

      if (response && response.data && response.data.recommendedTopics) {
        setRecommendedTopics(response.data.recommendedTopics || []);
      } else {
        setRecommendedTopics([]);
      }
    } catch (error) {
      console.error("Error fetching recommended topics:", error);
      setRecommendedTopics([]);
    } finally {
      setLoadingRecommended(false);
    }
  };

  const fetchRoadmap = async (topic = query) => {
    if (!topic || !topic.trim()) return;
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/en/api/web/roadmap`, {
        topic,
      });

      if (response && response.data && response.data.roadmap) {
        const roadmapSteps = response.data.roadmap || [];
      setRoadmap(roadmapSteps);
      localStorage.setItem("lastTopic", topic);
      localStorage.setItem("lastRoadmap", JSON.stringify(roadmapSteps));
      } else {
        setRoadmap([]);
      }
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      setRoadmap(["Try again later!"]);
    } finally {
      setLoading(false);
    }
  };

  // Function to load lecture for a roadmap item
  const loadLecture = (topic) => {
    navigate(`/skills/lecture/${encodeURIComponent(topic)}`);
  };

  // Update progress for a topic
  const updateTopicProgress = (topic, status) => {
    const newProgress = { ...topicProgress, [topic]: status };
    setTopicProgress(newProgress);
    localStorage.setItem("topicProgress", JSON.stringify(newProgress));
  };

  const clearSearch = () => {
    setQuery("");
    setRoadmap([]);
  };

  const handleTopicSelect = (topic) => {
    setQuery(topic);
    fetchRoadmap(topic);
  };

  return (
    <LanguageProvider>
      <LeftBar>
        <div className={`${isMobile ? "mt-16" : ""} p-4 md:p-6`}>
          {/* Header */}
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-dark-900 dark:text-base-white">
              Skills Development
            </h1>
            <p className="text-dark-600 dark:text-dark-300 max-w-2xl mb-6">
              Explore personalized learning paths and develop new skills with our interactive roadmaps.
            </p>
            
            {/* ProgressOverview (visible in other pages) */}
          </div>

          {/* Recommended Topics Component */}
          <RecommendedTopics 
            loadingRecommended={loadingRecommended} 
            recommendedTopics={recommendedTopics}
            onTopicSelect={handleTopicSelect} 
          />

          {/* Search Skills Component */}
          <SearchSkills 
            query={query} 
            setQuery={setQuery} 
            fetchRoadmap={fetchRoadmap} 
            roadmap={roadmap} 
            clearSearch={clearSearch} 
          />

          {/* Roadmap Component */}
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
                <p className="text-dark-600 dark:text-dark-300">Generating your learning roadmap...</p>
              </div>
            ) : (
              roadmap.length > 0 && (
                <RoadmapWorm 
                  roadmap={roadmap} 
                  isMobile={isMobile} 
                  topicProgress={topicProgress} 
                  onTopicClick={loadLecture} 
                />
              )
            )}
          </div>
        </div>
      </LeftBar>
    </LanguageProvider>
  );
}

export default Skills;