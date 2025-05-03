import React, { useState, useEffect } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Clock, Trophy, Download, MessageSquare, Star, ArrowLeft, Lock } from "lucide-react";

function LecturePage() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const [isLoadingLecture, setIsLoadingLecture] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [topicProgress, setTopicProgress] = useState({});
  const [isMobile, setIsMobile] = useState(false);
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
    return {
      id: `lecture-${Date.now()}`,
      title: topic,
      content: `
        <h2>Introduction to ${topic}</h2>
        <p>Welcome to this comprehensive lecture on ${topic}. This course will help you understand the fundamental concepts and practical applications of this important subject.</p>
        
        <h3>1. Fundamentals of ${topic}</h3>
        <p>The basic principles of ${topic} involve understanding its core components and how they interact with each other. Let's explore these principles in detail.</p>
        <ul>
          <li>Key concept 1: Definition and importance</li>
          <li>Key concept 2: Historical development</li>
          <li>Key concept 3: Modern applications</li>
        </ul>
        
        <h3>2. Practical Applications</h3>
        <p>Now that we understand the fundamentals, let's look at how ${topic} is applied in real-world scenarios:</p>
        <pre><code>
        // Example implementation
        function implement${topic.replace(/\s+/g, '')}() {
          const components = setupComponents();
          const result = process(components);
          return optimize(result);
        }
        </code></pre>
        
        <h3>3. Advanced Concepts</h3>
        <p>For those looking to master ${topic}, these advanced concepts will provide deeper insights:</p>
        <ol>
          <li>Advanced technique 1 with examples</li>
          <li>Advanced technique 2 with case studies</li>
          <li>Integration with related technologies</li>
        </ol>
        
        <h3>Conclusion</h3>
        <p>In this lecture, we've covered the essential aspects of ${topic} from basic principles to advanced applications. Continue to the practice section to reinforce your learning.</p>
      `,
      exercises: [
        {
          type: "quiz",
          question: `What is the primary purpose of ${topic}?`,
          options: [
            "To optimize system performance",
            "To improve user experience",
            "To ensure data integrity",
            "All of the above"
          ],
          correctAnswer: 3
        },
        {
          type: "coding",
          prompt: `Write a function that implements a basic ${topic} solution`,
          starterCode: `function ${topic.replace(/\s+/g, '')}Solution() {\n  // Your code here\n}`,
          solution: `function ${topic.replace(/\s+/g, '')}Solution() {\n  // Implementation details would go here\n  return 'Implemented solution';\n}`
        }
      ],
      resources: [
        { type: "article", title: `Understanding ${topic}`, url: "#" },
        { type: "video", title: `${topic} in Practice`, url: "#" },
        { type: "github", title: `${topic} Sample Project`, url: "#" }
      ],
      createdAt: new Date().toISOString(),
      estimatedTime: "15 minutes"
    };
  };

  // Update progress for a topic
  const updateTopicProgress = (topic, status) => {
    const newProgress = { ...topicProgress, [topic]: status };
    setTopicProgress(newProgress);
    localStorage.setItem("topicProgress", JSON.stringify(newProgress));
  };

  // Handle rating submission
  const handleRatingSubmit = () => {
    if (currentLecture && userRating > 0) {
      // In a real implementation, this would be an API call
      console.log(`Submitted rating ${userRating} for lecture: ${currentLecture.title}`);
      
      // Mark the topic as completed
      updateTopicProgress(currentLecture.title, "completed");
      
      // Reset rating after submission
      setUserRating(0);
    }
  };

  // Start practice mode
  const startPractice = () => {
    if (!currentLecture) return;
    navigate(`/skills/practice/${encodeURIComponent(currentLecture.title)}`);
  };

  // Export lecture
  const exportLecture = (format = "pdf") => {
    if (!currentLecture) return;
    console.log(`Exporting lecture in ${format} format: ${currentLecture.title}`);
    // Implementation would go here
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
            <Link 
              to="/skills" 
              className="mr-4 p-2 rounded-full hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="text-dark-500 dark:text-dark-400" />
            </Link>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
              {isLoadingLecture ? "Loading lecture..." : currentLecture?.title || decodeURIComponent(topic)}
            </h1>
          </div>

          {/* Lecture content */}
          <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              {!isAccessible && previousTopic ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-dark-100 dark:bg-dark-800/50 flex items-center justify-center mx-auto mb-6">
                    <Lock size={40} className="text-dark-400 dark:text-dark-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-4">
                    Topic Locked
                  </h2>
                  <p className="text-dark-600 dark:text-dark-300 mb-8 max-w-md mx-auto">
                    You need to complete the previous topic <span className="font-semibold">{previousTopic}</span> before you can access this content.
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
                  <p className="text-dark-600 dark:text-dark-300">Generating lecture content...</p>
                </div>
              ) : currentLecture ? (
                <>
                  <div className="flex items-center gap-2 mb-4 text-sm text-dark-500 dark:text-white">
                    <Clock size={16} />
                    <span>Estimated reading time: {currentLecture.estimatedTime}</span>
                  </div>
                  
                  <div 
                    className="dark:text-white prose dark:prose-invert max-w-none mb-8 prose-headings:text-dark-900 dark:prose-headings:text-white prose-p:text-dark-700 dark:prose-p:text-dark-200 prose-code:bg-dark-100 dark:prose-code:bg-dark-800 prose-code:text-dark-900 dark:prose-code:text-dark-100 prose-pre:bg-dark-100 dark:prose-pre:bg-dark-800 prose-li:text-dark-700 dark:prose-li:text-dark-200"
                    dangerouslySetInnerHTML={{ __html: currentLecture.content }}
                  />
                  
                  {/* Interactive Elements */}
                  <div className="bg-dark-100 dark:bg-dark-800/70 rounded-lg p-4 mb-8 border border-dark-200/20 dark:border-dark-700/30">
                    <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-3">Interactive Practice</h3>
                    {currentLecture.exercises && currentLecture.exercises.length > 0 && (
                      <div className="mb-4">
                        <p className="text-dark-700 dark:text-dark-200 mb-2">
                          This lecture includes {currentLecture.exercises.length} practice exercises to reinforce your learning.
                        </p>
                        <button 
                          onClick={startPractice}
                          className="bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 
                                   text-base-white px-4 py-2 rounded-lg transition-colors shadow-md inline-flex items-center gap-2"
                        >
                          <Trophy size={16} />
                          Start Practice Mode
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Resources */}
                  {currentLecture.resources && currentLecture.resources.length > 0 && (
                    <div className="mb-8 bg-dark-50 dark:bg-dark-900/50 p-4 rounded-lg border border-dark-200/20 dark:border-dark-700/30">
                      <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-3">Additional Resources</h3>
                      <ul className="space-y-2">
                        {currentLecture.resources.map((resource, i) => (
                          <li key={i} className="text-primary-600 dark:text-primary-400 hover:underline">
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                              {resource.type === "article" && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>}
                              {resource.type === "video" && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>}
                              {resource.type === "github" && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>}
                              {resource.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Rating and Actions */}
                  <div className="border-t border-dark-200/20 dark:border-dark-700/30 pt-6 mt-8 bg-dark-50/50 dark:bg-dark-900/40 -mx-6 -mb-6 p-6 rounded-b-xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-2">Rate this lecture</h3>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              size={24}
                              onClick={() => setUserRating(star)}
                              className={`cursor-pointer ${
                                star <= userRating 
                                  ? 'text-yellow-500 fill-yellow-500' 
                                  : 'text-dark-300 dark:text-dark-500 hover:text-yellow-400 dark:hover:text-yellow-400'
                              }`}
                            />
                          ))}
                          <button
                            onClick={handleRatingSubmit}
                            disabled={userRating === 0}
                            className="ml-2 px-3 py-1 text-sm bg-primary-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-400 dark:bg-primary-600 dark:hover:bg-primary-500 transition-colors"
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={startPractice}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-lg transition-colors shadow-sm"
                        >
                          <Trophy size={16} />
                          Practice
                        </button>
                        <button 
                          onClick={() => exportLecture('pdf')}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-dark-200 hover:bg-dark-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-dark-900 dark:text-dark-200 rounded-lg transition-colors shadow-sm"
                        >
                          <Download size={16} />
                          Export PDF
                        </button>
                        <button 
                          className="inline-flex items-center gap-2 px-3 py-2 bg-dark-200 hover:bg-dark-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-dark-900 dark:text-dark-200 rounded-lg transition-colors shadow-sm"
                        >
                          <MessageSquare size={16} />
                          Discuss
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-dark-500 dark:text-dark-400">
                  Failed to load lecture content. Please try again.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LeftBar>
  );
}

export default LecturePage; 