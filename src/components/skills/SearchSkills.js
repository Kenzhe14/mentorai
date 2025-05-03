import React from "react";
import { Search, BookOpen, X, Target } from "lucide-react";

const SearchSkills = ({ 
  query, 
  setQuery, 
  fetchRoadmap, 
  roadmap, 
  clearSearch 
}) => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="bg-base-white dark:bg-dark-900 rounded-xl p-6 border border-dark-200/10 dark:border-dark-800/50 shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <Target className="text-primary-500" size={24} />
          <h2 className="text-2xl font-bold text-dark-900 dark:text-base-white">
            Search Skills
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
            <input
              type="text"
              placeholder="Search for any skill..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-dark-200 dark:border-dark-700 
                      bg-base-white dark:bg-dark-800 text-dark-900 dark:text-base-white
                      focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchRoadmap()}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchRoadmap()}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-base-white 
                      rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <BookOpen size={20} />
              Generate Roadmap
            </button>
            {(query || roadmap.length > 0) && (
              <button
                onClick={clearSearch}
                className="p-3 text-dark-600 dark:text-dark-300 hover:text-red-500 
                        dark:hover:text-red-400 rounded-lg transition-colors"
                title="Clear search"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchSkills; 