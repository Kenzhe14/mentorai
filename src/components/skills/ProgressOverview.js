import React from "react";

const ProgressOverview = ({ 
  roadmap, 
  topicProgress, 
  showViewAll = false,
  isCompact = false
}) => {
  // Handle case when we don't have roadmap data directly (for homepage/dashboard)
  if (!roadmap && !topicProgress) {
    // Get data from localStorage as fallback
    try {
      const savedRoadmap = localStorage.getItem("lastRoadmap");
      const savedProgress = localStorage.getItem("topicProgress");
      
      if (savedRoadmap && savedProgress) {
        roadmap = JSON.parse(savedRoadmap);
        topicProgress = JSON.parse(savedProgress);
      } else {
        return null; // No data available
      }
    } catch (error) {
      console.error("Error parsing saved progress:", error);
      return null;
    }
  }
  
  if (!roadmap || roadmap.length === 0) return null;
  
  const completedCount = Object.values(topicProgress).filter(status => status === "completed").length;
  const inProgressCount = Object.values(topicProgress).filter(status => status === "in-progress").length;
  const notStartedCount = roadmap.length - Object.keys(topicProgress).length;
  const progressPercentage = Math.round((completedCount / roadmap.length) * 100);
  
  // Compact version for homepage/dashboard
  if (isCompact) {
    return (
      <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4">
        
        <div className="w-full bg-dark-200 dark:bg-dark-700 rounded-full h-2.5 mb-3">
          <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="text-xl font-bold text-primary-600 dark:text-primary-400">{completedCount}</div>
            <div className="text-xs text-dark-500 dark:text-dark-400">Completed</div>
          </div>
          <div>
            <div className="text-xl font-bold text-yellow-500">{inProgressCount}</div>
            <div className="text-xs text-dark-500 dark:text-dark-400">In Progress</div>
          </div>
          <div>
            <div className="text-xl font-bold text-dark-400 dark:text-dark-500">{notStartedCount}</div>
            <div className="text-xs text-dark-500 dark:text-dark-400">Not Started</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Full version for skills page
  return (
    <div className="bg-base-white dark:bg-dark-900 rounded-xl p-4 border border-dark-200/10 dark:border-dark-800/50 shadow-md mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-dark-900 dark:text-base-white">Learning Progress</h2>
          <p className="text-dark-500 dark:text-dark-400 text-sm">Track your progress on the current roadmap</p>
        </div>
        
        {/* Progress Stats */}
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {completedCount}
            </div>
            <div className="text-xs text-dark-500 dark:text-dark-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {inProgressCount}
            </div>
            <div className="text-xs text-dark-500 dark:text-dark-400">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-dark-400 dark:text-dark-500">
              {notStartedCount}
            </div>
            <div className="text-xs text-dark-500 dark:text-dark-400">Not Started</div>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-dark-200 dark:bg-dark-700 rounded-full h-2.5">
        <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-dark-500 dark:text-dark-400">
        <span>Progress: {progressPercentage}%</span>
        <span>Total Topics: {roadmap.length}</span>
      </div>
    </div>
  );
};

export default ProgressOverview; 