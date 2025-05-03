import React from "react";
import { Sparkles, Clock, ArrowRight } from "lucide-react";

const RecommendedTopics = ({ 
  loadingRecommended, 
  recommendedTopics, 
  onTopicSelect 
}) => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="text-primary-500" size={24} />
        <h2 className="text-2xl font-bold text-dark-900 dark:text-base-white">
          Recommended for You
        </h2>
      </div>

      {loadingRecommended ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedTopics && recommendedTopics.length > 0 ? (
            recommendedTopics.slice(0, 3).map((topic, index) => (
              <div
                key={index}
                onClick={() => onTopicSelect(topic.title)}
                className="group relative cursor-pointer h-full"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative h-full p-6 bg-base-white dark:bg-dark-900 rounded-xl border border-dark-200/10 dark:border-dark-800/50 shadow-lg hover:shadow-xl transition-all flex flex-col">
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-dark-900 dark:text-base-white mb-3 line-clamp-2">
                      {topic.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-dark-500 dark:text-dark-400 mb-3">
                      <Clock size={16} />
                      <span>{topic.duration}</span>
                    </div>
                    <p className="text-dark-600 dark:text-dark-300 line-clamp-3">
                      {topic.description}
                    </p>
                  </div>
                  <div className="flex items-center text-primary-500 dark:text-primary-400 font-medium mt-4 pt-4 border-t border-dark-200/10 dark:border-dark-800/50">
                    <span>Start Learning</span>
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-dark-500 dark:text-dark-400">
              No recommended topics available. Try searching for a skill above.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendedTopics; 