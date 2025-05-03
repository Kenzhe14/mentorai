import React from "react";
import { ArrowRight, BookOpen, Lock } from "lucide-react";

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
    // First topic is always accessible
    if (topicIndex === 0) return true;
    
    // Get previous topic
    const prevTopic = roadmap[topicIndex - 1];
    let prevTopicName = prevTopic;
    
    if (prevTopic && prevTopic.includes && prevTopic.includes(":")) {
      prevTopicName = prevTopic.split(":")[0].trim();
    }
    
    // Check if previous topic is completed
    return topicProgress[prevTopicName] === "completed";
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
                const progress = topicProgress[topicName] || "not-started";
                let statusColor = "bg-dark-400 dark:bg-dark-600"; // default - not started
                
                if (progress === "completed") {
                  statusColor = "bg-green-500";
                } else if (progress === "in-progress") {
                  statusColor = "bg-yellow-500";
                }

                // Check if this topic is accessible
                const accessible = isTopicAccessible(topicIndex);
                
                // Determine classes and content based on accessibility
                const cardClasses = `group relative w-full md:w-64 min-w-[150px] ${accessible ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`;
                
                // Tooltip text
                const tooltipText = accessible 
                  ? "Click to view lecture" 
                  : "Complete the previous topic to unlock";

                return (
                  <React.Fragment key={`step-${rowIndex}-${index}`}>
                    <div 
                      className={cardClasses}
                      onClick={() => accessible && onTopicClick(topicName)}
                    >
                      <div className={`absolute -inset-0.5 bg-gradient-to-r ${accessible ? "from-primary-600 to-primary-500" : "from-gray-600 to-gray-500"} rounded-xl blur opacity-30 ${accessible ? "group-hover:opacity-100" : ""} transition duration-1000`}></div>
                      <div className="relative p-3 md:p-4 bg-base-white dark:bg-dark-900 rounded-xl border border-dark-200/10 dark:border-dark-800/50 shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center mb-2">
                          <div className={`w-3 h-3 rounded-full ${statusColor} mr-2`}></div>
                          <p className="text-dark-900 dark:text-base-white font-medium break-words text-sm md:text-base flex-grow">
                            {topicName}
                          </p>
                          {accessible ? (
                            <BookOpen size={16} className="text-primary-500 ml-2" />
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