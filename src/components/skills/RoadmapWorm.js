import React from "react";
import { ArrowRight, BookOpen, Lock, CheckCircle } from "lucide-react";

const RoadmapWorm = ({ 
  roadmap, 
  isMobile, 
  topicProgress, 
  onTopicClick 
}) => {
  if (!roadmap || !roadmap.length) return null;

  const rows = [];
  // For mobile, we'll show 2 items per row instead of 4
  const itemsPerRow = isMobile ? 2 : 4;
  
  for (let i = 0; i < roadmap.length; i += itemsPerRow) {
    rows.push(roadmap.slice(i, i + itemsPerRow));
  }

  // Function to check if a topic is accessible
  const isTopicAccessible = (topicIndex) => {
    try {
      // First topic is always accessible
      if (topicIndex === 0) return true;
      
      // Get previous topic
      const prevTopic = roadmap[topicIndex - 1];
      if (!prevTopic) {
        console.log(`Previous topic not found for index ${topicIndex}`);
        return false;
      }
      
      let prevTopicName = prevTopic;
      if (prevTopic && prevTopic.includes && prevTopic.includes(":")) {
        prevTopicName = prevTopic.split(":")[0].trim();
      }
      
      // Check if previous topic is completed
      if (!topicProgress) {
        console.log(`No progress data available, only first topic accessible`);
        return topicIndex === 0; 
      }
      
      if (!topicProgress[prevTopicName]) {
        console.log(`No progress data for prev topic: ${prevTopicName}, not accessible`);
        return false;
      }
      
      const status = topicProgress[prevTopicName];
      console.log(`Checking accessibility via prev topic ${prevTopicName}:`, status);
      
      // Improved check for completion status
      let isCompleted = false;
      
      // Check object format with properties
      if (typeof status === 'object') {
        isCompleted = 
          // Explicit completed flag
          status.completed === true || 
          // Check for presence of completedAt timestamp
          !!status.completedAt || 
          // Check for Completed property (capitalized variant)
          status.Completed === true;
      } 
      // Check string format
      else if (typeof status === 'string') {
        isCompleted = 
          status === 'completed' || 
          status === 'Completed';
      }
      
      // Use getTopicStatus also as a fallback
      if (!isCompleted) {
        isCompleted = getTopicStatus(prevTopicName) === "completed";
      }
      
      // Log for debugging
      if (isCompleted) {
        console.log(`Topic ${topicIndex} (${roadmap[topicIndex]}) is ACCESSIBLE`);
      } else {
        console.log(`Topic ${topicIndex} (${roadmap[topicIndex]}) is NOT ACCESSIBLE`);
      }
      
      return isCompleted;
    } catch (error) {
      console.error(`Error checking accessibility for topic index ${topicIndex}:`, error);
      return topicIndex === 0; // Allow access to first topic on error
    }
  };

  // Function to determine the progress status of a topic
  const getTopicStatus = (topicName) => {
    try {
      if (!topicProgress) {
        console.log(`No progress data available at all`);
        return "not-started";
      }
      
      if (!topicProgress[topicName]) {
        console.log(`No progress data for topic: ${topicName}`);
        return "not-started";
      }
      
      const status = topicProgress[topicName];
      console.log(`Progress data for ${topicName}:`, status);
      
      // Упрощенная проверка статуса завершенности
      let isCompleted = false;
      
      if (typeof status === 'object') {
        // Проверка булевого значения
        isCompleted = status.completed === true || 
          // Проверка наличия времени завершения
          !!status.completedAt;
      } else if (typeof status === 'string') {
        // Старый формат - строковый статус
        isCompleted = status === "completed";
      }
      
      if (isCompleted) {
        console.log(`Topic ${topicName} is COMPLETED`);
        return "completed";
      }
      
      // Упрощенная проверка на статус "in-progress"
      let isInProgress = false;
      
      if (typeof status === 'object') {
        isInProgress = 
          // Проверка viewed флага
          status.viewed === true || 
          // Проверка наличия lastViewed
          !!status.lastViewed ||
          // Проверка на наличие любых других полей состояния
          Object.keys(status).length > 0;
      } else {
        // Любой другой не пустой статус считаем "in-progress"
        isInProgress = !!status;
      }
      
      if (isInProgress) {
        console.log(`Topic ${topicName} is IN PROGRESS`);
        // Log the reason for marking as in-progress for easier debugging
        if (typeof status === 'object') {
          if (status.viewed === true) {
            console.log(`- Reason: viewed flag is true`);
          } else if (status.lastViewed) {
            console.log(`- Reason: lastViewed timestamp exists: ${status.lastViewed}`);
          } else {
            console.log(`- Reason: topic has some progress data`);
          }
        } else {
          console.log(`- Reason: topic has string status: ${status}`);
        }
        return "in-progress";
      }
      
      console.log(`Topic ${topicName} is NOT STARTED`);
      return "not-started";
    } catch (error) {
      console.error(`Error determining status for topic ${topicName}:`, error);
      return "not-started";
    }
  };

  // Flatten the rows to get topic indices in the original roadmap
  const getTopicIndex = (rowIndex, columnIndex) => {
    return rowIndex * itemsPerRow + columnIndex;
  };

  return (
    <div className="w-full mt-8 space-y-8 px-2 md:px-0">
      {rows && rows.map((row, rowIndex) => {
        const isEvenRow = rowIndex % 2 === 0;
        const isLastRow = rowIndex === rows.length - 1;

        return (
          <div key={`row-${rowIndex}`} className="relative">
            <div className={`flex ${isEvenRow ? "flex-row" : "flex-row-reverse"} justify-center items-center gap-2 md:gap-4 flex-wrap md:flex-nowrap`}>
              {row && row.map((step, index) => {
                const topicIndex = getTopicIndex(rowIndex, index);
                let topicName = step;
                if (step && step.includes && step.includes(":")) {
                  topicName = step.split(":")[0].trim();
                }

                // Determine the progress status for this topic
                const progress = getTopicStatus(topicName);
                let statusColor = "bg-dark-400 dark:bg-dark-600"; // default - not started
                
                if (progress === "completed") {
                  statusColor = "bg-green-500";
                } else if (progress === "in-progress") {
                  statusColor = "bg-yellow-500";
                }

                // Check if this topic is accessible
                const accessible = isTopicAccessible(topicIndex);
                
                // Determine classes and content based on accessibility and progress
                let cardClasses = `group relative w-full md:w-64 min-w-[150px] ${accessible ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`;
                
                // For completed topics, add a special styling
                const isCompleted = progress === "completed";
                if (isCompleted) {
                  cardClasses += " transform-gpu hover:scale-105 transition-all duration-300";
                }
                
                // Background gradient based on status
                let gradientClasses = accessible 
                  ? "from-primary-600 to-primary-500" 
                  : "from-gray-600 to-gray-500";
                
                if (isCompleted) {
                  gradientClasses = "from-green-600 to-green-500";
                }
                
                // Tooltip text based on progress status
                let tooltipText = "Завершите предыдущую тему для разблокировки";
                
                if (accessible) {
                  if (isCompleted) {
                    tooltipText = "Пройдено";
                  } else if (progress === "in-progress") {
                    tooltipText = "В процессе";
                  } else {
                    tooltipText = "Нажмите для просмотра";
                  }
                }

                return (
                  <React.Fragment key={`step-${rowIndex}-${index}`}>
                    <div 
                      className={cardClasses}
                      onClick={() => {
                        if (accessible) {
                          // Topic is accessible, handle the click
                          // If topic is already completed, go to practice directly
                          if (progress === "completed") {
                            // Navigate directly to practice for completed topics
                            window.location.href = `/skills/practice/${encodeURIComponent(topicName)}`;
                          } else {
                            // Navigate to lecture for new or in-progress topics
                            onTopicClick && onTopicClick(topicName);
                          }
                        } else {
                          // Topic is not accessible, show tooltip or message
                          console.log(`Topic ${topicName} is not accessible yet. Complete previous topics first.`);
                        }
                      }}
                    >
                      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradientClasses} rounded-xl blur opacity-30 ${accessible ? "group-hover:opacity-100" : ""} transition duration-1000`}></div>
                      <div className="relative p-3 md:p-4 bg-base-white dark:bg-dark-900 rounded-xl border border-dark-200/10 dark:border-dark-800/50 shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center mb-2">
                          <div className={`w-3 h-3 rounded-full ${statusColor} mr-2`}></div>
                          <p className={`text-dark-900 dark:text-base-white font-medium break-words text-sm md:text-base flex-grow ${isCompleted ? "text-green-700 dark:text-green-400" : ""}`}>
                            {topicName}
                          </p>
                          {accessible ? (
                            isCompleted ? (
                              <CheckCircle size={16} className="text-green-500 ml-2" />
                            ) : (
                              <BookOpen size={16} className="text-primary-500 ml-2" />
                            )
                          ) : (
                            <Lock size={16} className="text-dark-400 dark:text-dark-500 ml-2" />
                          )}
                        </div>
                        <div className="text-xs text-dark-500 dark:text-dark-400">
                          {tooltipText}
                        </div>
                      </div>
                    </div>
                    {row && index < row.length - 1 && (
                      <ArrowRight 
                        size={isMobile ? 16 : 24} 
                        className={`text-primary-500 flex-shrink-0 ${!isEvenRow && "rotate-180"} hidden md:block`} 
                      />
                    )}
                    {/* Mobile arrow - vertical for better spacing */}
                    {row && index < row.length - 1 && isMobile && (
                      <div className="flex md:hidden w-full justify-center my-2">
                        <ArrowRight 
                          size={16}
                          className={`text-primary-500 rotate-90`}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            
            {rows && !isLastRow && (
              <div className="flex justify-center mt-4 md:mt-8">
                <div className="w-0.5 h-4 md:h-8 bg-primary-500"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RoadmapWorm; 