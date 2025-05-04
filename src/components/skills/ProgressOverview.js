import React, { useState, useEffect } from "react";
import axios from "axios";
import { Loader } from "lucide-react";

const API_URL = "http://localhost:5000";

const ProgressOverview = ({ 
  roadmap = null, 
  onTopicClick = null,
  showViewAll = false,
  isCompact = false,
  showInSkillsPage = true,
  refreshTrigger = 0
}) => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if we're not on the skills page or we're explicitly showing it there
    if (!showInSkillsPage && window.location.pathname.includes('/skills')) {
      setLoading(false);
      return;
    }
    
    fetchProgressData();
  }, [showInSkillsPage, refreshTrigger]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/en/api/web/progress`);
      if (response.data && response.data.progress) {
        setProgressData(response.data);
      }
    } catch (error) {
      console.error("Error fetching progress data:", error);
      setError("Failed to load progress data");
    } finally {
      setLoading(false);
    }
  };

  // If we're on the skills page and shouldn't show there, return null
  if (!showInSkillsPage && window.location.pathname.includes('/skills')) {
    return null;
  }
  
  if (loading) {
    return (
      <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4 flex items-center justify-center">
        <Loader className="animate-spin text-primary-500" size={24} />
      </div>
    );
  }
  
  if (error || !progressData) {
    return (
      <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4 text-center text-dark-500 dark:text-dark-400">
        <p>Failed to load progress data.</p>
      </div>
    );
  }
  
  const { stats } = progressData;
  const { completedTopics, viewedTopics, totalTopics, completionRate } = stats;
  
  const notStartedCount = totalTopics > 0 
    ? totalTopics - (viewedTopics || 0) 
    : roadmap && roadmap.length > 0 ? roadmap.length : 0;
  
  const inProgressCount = viewedTopics - completedTopics;
  
  // Compact version for homepage/dashboard
  if (isCompact) {
    return (
      <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4">
        <div className="w-full bg-dark-200 dark:bg-dark-700 rounded-full h-2.5 mb-3">
          <div 
            className="bg-primary-600 h-2.5 rounded-full" 
            style={{ width: `${completionRate || 0}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="text-xl font-bold text-primary-600 dark:text-primary-400">{completedTopics || 0}</div>
            <div className="text-xs text-dark-500 dark:text-dark-400">Completed</div>
          </div>
          <div>
            <div className="text-xl font-bold text-yellow-500">{inProgressCount || 0}</div>
            <div className="text-xs text-dark-500 dark:text-dark-400">In Progress</div>
          </div>
          <div>
            <div className="text-xl font-bold text-dark-400 dark:text-dark-500">{notStartedCount || 0}</div>
            <div className="text-xs text-dark-500 dark:text-dark-400">Not Started</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Full version for other pages
  return (
    <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4 border border-dark-200/10 dark:border-dark-800/50 shadow-md mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-dark-900 dark:text-base-white">Learning Progress</h2>
          <p className="text-dark-500 dark:text-dark-400 text-sm">Track your progress across all topics</p>
        </div>
        
        {/* Progress Stats */}
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {completedTopics || 0}
            </div>
            <div className="text-xs text-dark-500 dark:text-dark-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {inProgressCount || 0}
            </div>
            <div className="text-xs text-dark-500 dark:text-dark-400">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-dark-400 dark:text-dark-500">
              {notStartedCount || 0}
            </div>
            <div className="text-xs text-dark-500 dark:text-dark-400">Not Started</div>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-dark-200 dark:bg-dark-700 rounded-full h-2.5">
        <div 
          className="bg-primary-600 h-2.5 rounded-full" 
          style={{ width: `${completionRate || 0}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-dark-500 dark:text-dark-400">
        <span>Progress: {completionRate.toFixed(1) || 0}%</span>
        <span>Total Topics: {totalTopics || 0}</span>
      </div>

      {/* Performance Metrics Section - Only show if there are completed topics */}
      {completedTopics > 0 && progressData.topicScores && (
        <div className="mt-6 pt-4 border-t border-dark-200/10 dark:border-dark-700/50">
          <h3 className="text-md font-bold text-dark-900 dark:text-base-white mb-3">Performance Metrics</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Quiz Performance */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Quiz Performance</div>
              <div className="flex justify-between items-center">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {progressData.topicScores?.avgQuizScore || "N/A"}
                </div>
                <div className="text-xs text-dark-500 dark:text-dark-400">Avg. Score</div>
              </div>
            </div>
            
            {/* Code Performance */}
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-xs text-green-700 dark:text-green-300 mb-1">Code Performance</div>
              <div className="flex justify-between items-center">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {progressData.topicScores?.avgCodeScore || "N/A"}
                </div>
                <div className="text-xs text-dark-500 dark:text-dark-400">Avg. Score</div>
              </div>
            </div>
            
            {/* Time Metrics */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="text-xs text-purple-700 dark:text-purple-300 mb-1">Time per Topic</div>
              <div className="flex justify-between items-center">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {progressData.topicScores?.avgTimeMinutes ? `${progressData.topicScores.avgTimeMinutes}m` : "N/A"}
                </div>
                <div className="text-xs text-dark-500 dark:text-dark-400">Avg. Time</div>
              </div>
            </div>
          </div>
          
          {/* Most Recent Completed Topic */}
          {progressData.lastCompletedTopic && (
            <div className="mt-4 bg-dark-50 dark:bg-dark-800/30 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs text-dark-600 dark:text-dark-300">Last Completed</div>
                <div className="text-xs text-dark-500 dark:text-dark-400">
                  {new Date(progressData.lastCompletedTopic.completedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="font-medium text-dark-900 dark:text-white">
                {progressData.lastCompletedTopic.topicName}
              </div>
              
              {/* Score breakdown */}
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                  <span className="text-dark-600 dark:text-dark-300">Quiz: </span>
                  <span className="font-medium text-dark-900 dark:text-white ml-1">
                    {progressData.lastCompletedTopic.quizScore || "N/A"}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                  <span className="text-dark-600 dark:text-dark-300">Code: </span>
                  <span className="font-medium text-dark-900 dark:text-white ml-1">
                    {progressData.lastCompletedTopic.codeScore || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressOverview; 