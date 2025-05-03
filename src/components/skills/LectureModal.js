import React, { useState } from "react";
import { Clock, Trophy, Download, MessageSquare, Star, ChevronDown, ChevronUp, BookOpen, List, Code, CheckCircle, Coffee, BookmarkIcon, LightbulbIcon, Asterisk, Zap } from "lucide-react";

// Template component for lecture content generation
const LectureTemplate = ({ title, intro, sections }) => {
  return (
    <div className="lecture-template">
      {/* Lecture Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-4">{title}</h1>
        <div className="bg-dark-50 dark:bg-dark-800/40 p-4 rounded-lg border-l-4 border-primary-500 text-dark-700 dark:text-dark-200">
          {intro}
        </div>
      </div>
      
      {/* Lecture Sections */}
      {sections.map((section, index) => (
        <div key={index} className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
              {index + 1}
            </div>
            <h2 className="text-xl font-bold text-dark-900 dark:text-white">{section.title}</h2>
          </div>
          
          <div className="pl-10">
            {/* Section Content */}
            <div className="mb-4 text-dark-700 dark:text-dark-200">
              {section.content}
            </div>
            
            {/* Key Concepts */}
            {section.keyPoints && section.keyPoints.length > 0 && (
              <div className="mb-4">
                <h3 className="text-md font-semibold text-dark-800 dark:text-dark-100 mb-2 flex items-center gap-2">
                  <LightbulbIcon size={18} className="text-yellow-500" /> Key Concepts
                </h3>
                <ul className="space-y-2 pl-6">
                  {section.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Code Examples */}
            {section.codeExample && (
              <div className="mb-4">
                <h3 className="text-md font-semibold text-dark-800 dark:text-dark-100 mb-2 flex items-center gap-2">
                  <Code size={18} className="text-blue-500" /> Code Example
                </h3>
                <div className="bg-dark-900 text-gray-100 p-4 rounded-md overflow-x-auto font-mono text-sm whitespace-pre">
                  {section.codeExample}
                </div>
              </div>
            )}
            
            {/* Section Notes */}
            {section.note && (
              <div className="bg-dark-50 dark:bg-dark-850 border-l-4 border-yellow-500 p-3 rounded-r-md mb-4 text-dark-700 dark:text-dark-300 text-sm">
                <span className="font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-1 mb-1">
                  <Asterisk size={16} /> Note:
                </span>
                {section.note}
              </div>
            )}
            
            {/* Tips */}
            {section.tips && section.tips.length > 0 && (
              <div className="mb-4">
                <h3 className="text-md font-semibold text-dark-800 dark:text-dark-100 mb-2 flex items-center gap-2">
                  <Zap size={18} className="text-amber-500" /> Pro Tips
                </h3>
                <ul className="space-y-1 pl-6 text-dark-700 dark:text-dark-200">
                  {section.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Coffee size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Summary Section */}
      <div className="mt-8 p-4 bg-dark-50 dark:bg-dark-800/40 rounded-lg border border-dark-200/40 dark:border-dark-700/40">
        <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-2 flex items-center gap-2">
          <BookmarkIcon size={18} /> Summary
        </h2>
        <p className="text-dark-700 dark:text-dark-200">
          In this lecture, we've covered the essential aspects of Math Fundamentals from basic principles to advanced applications. 
          Continue to the practice section to reinforce your learning.
        </p>
      </div>
    </div>
  );
};

const LectureModal = ({
  showLectureModal,
  setShowLectureModal,
  isLoadingLecture,
  currentLecture,
  userRating,
  setUserRating,
  handleRatingSubmit,
  startPractice,
  exportLecture
}) => {
  const [activeModule, setActiveModule] = useState(0);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  
  if (!showLectureModal) return null;

  // Check if lecture has modular structure
  const hasModules = currentLecture && currentLecture.modules && currentLecture.modules.length > 0;
  
  // Example template data - in real implementation this would come from the API
  const templateData = {
    title: "Introduction to Math Fundamentals",
    intro: "Welcome to this comprehensive lecture on Math Fundamentals. This course will help you understand the fundamental concepts and practical applications of this important subject.",
    sections: [
      {
        title: "Fundamentals of Math Fundamentals",
        content: "The basic principles of Math Fundamentals involve understanding its core components and how they interact with each other. Let's explore these principles in detail.",
        keyPoints: [
          "Definition and importance - Math fundamentals form the foundation of all mathematical reasoning",
          "Historical development - From ancient civilizations to modern applications",
          "Core components - Numbers, operations, algebraic thinking, and problem-solving"
        ],
        note: "Understanding these fundamentals is crucial before moving on to more advanced topics."
      },
      {
        title: "Practical Applications",
        content: "Now that we understand the fundamentals, let's look at how Math Fundamentals is applied in real-world scenarios:",
        codeExample: `// Example implementation
function implementMathFundamentals() {
  const components = setupComponents();
  const result = process(components);
  return optimize(result);
}`,
        tips: [
          "Always start with the simplest solution and refine as needed",
          "Practice daily to build intuition for mathematical patterns",
          "Connect abstract concepts to real-world examples for better understanding"
        ]
      },
      {
        title: "Advanced Concepts",
        content: "For those looking to master Math Fundamentals, these advanced concepts will provide deeper insights:",
        keyPoints: [
          "Advanced technique 1 with comprehensive examples and implementation details",
          "Advanced technique 2 with case studies showing practical applications",
          "Integration with related technologies and mathematical disciplines"
        ],
        note: "These advanced concepts build upon the foundations covered earlier."
      }
    ]
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-base-white dark:bg-dark-900 p-4 border-b border-dark-200/10 dark:border-dark-800/50 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-dark-900 dark:text-base-white">
            {isLoadingLecture ? "Loading lecture..." : currentLecture?.title}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowTableOfContents(!showTableOfContents)}
              className="text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200 p-1 rounded-md hover:bg-dark-100 dark:hover:bg-dark-800"
              title="Table of Contents"
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setShowLectureModal(false)}
              className="text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200 p-1 rounded-md hover:bg-dark-100 dark:hover:bg-dark-800"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row">
          {/* Table of Contents / Lecture Modules */}
          {hasModules && showTableOfContents && (
            <div className="w-full md:w-72 border-r border-dark-200/10 dark:border-dark-800/50 p-4 md:max-h-[calc(90vh-130px)] overflow-auto bg-dark-50 dark:bg-dark-850">
              <div className="mb-4">
                <h3 className="font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                  <BookOpen size={16} />
                  <span>Table of Contents</span>
                </h3>
              </div>
              <ul className="space-y-1">
                {currentLecture.modules.map((module, index) => (
                  <li key={index}>
                    <button
                      onClick={() => setActiveModule(index)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-1
                        ${activeModule === index 
                          ? 'bg-primary-500 text-white' 
                          : 'text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800'
                        }`}
                    >
                      <span className="font-medium">{index + 1}.</span>
                      <span className="flex-1 truncate">{module.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="pt-4 text-xs text-dark-500 dark:text-dark-400 border-t border-dark-200/10 dark:border-dark-800/50 mt-4">
                <p>Estimated reading time: {currentLecture?.estimatedTime}</p>
                {currentLecture?.difficulty && (
                  <p className="mt-1">Difficulty: {currentLecture.difficulty}</p>
                )}
              </div>
            </div>
          )}
          
          <div className={`p-6 ${hasModules && showTableOfContents ? 'md:flex-1' : 'w-full'}`}>
            {isLoadingLecture ? (
              <div className="flex flex-col items-center justify-center h-60">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
                <p className="text-dark-600 dark:text-dark-300">Generating lecture content...</p>
              </div>
            ) : currentLecture ? (
              <>
                {/* Module Navigation */}
                {hasModules && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-dark-500 dark:text-white">
                        <Clock size={16} />
                        <span>Reading time: {currentLecture.estimatedTime}</span>
                      </div>
                      <div className="text-sm text-dark-500 dark:text-white">
                        {activeModule + 1} of {currentLecture.modules.length}
                      </div>
                    </div>
                    
                    {currentLecture.description && (
                      <div className="text-dark-700 dark:text-dark-300 mb-4 bg-dark-50 dark:bg-dark-800/30 p-3 rounded-md border border-dark-100 dark:border-dark-700/50">
                        {currentLecture.description}
                      </div>
                    )}
                    
                    {/* Module Navigation Buttons */}
                    <div className="flex flex-wrap gap-2 mb-1">
                      {currentLecture.modules.map((module, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveModule(index)}
                          className={`px-2 py-1 rounded-md text-sm font-medium transition-colors
                            ${activeModule === index 
                              ? 'bg-primary-500 text-white' 
                              : 'bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-700'
                            }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    
                    {/* Active Module Info */}
                    <div className="border-b border-dark-200/20 dark:border-dark-700/30 pb-4 mb-6">
                      <h3 className="text-lg font-bold text-dark-900 dark:text-white">
                        {activeModule + 1}. {currentLecture.modules[activeModule]?.title}
                      </h3>
                    </div>
                  </div>
                )}
                
                {/* Example Template - Replace with dynamic content in production */}
                <LectureTemplate {...templateData} />
                
                {/* Original Lecture Content (uncomment to use original content instead of template) */}
                {/* <div 
                  className="dark:text-white prose dark:prose-invert max-w-none mb-8 prose-headings:text-dark-900 dark:prose-headings:text-white prose-p:text-dark-700 dark:prose-p:text-dark-200 prose-code:bg-dark-100 dark:prose-code:bg-dark-800 prose-code:text-dark-900 dark:prose-code:text-dark-100 prose-pre:bg-dark-100 dark:prose-pre:bg-dark-800 prose-li:text-dark-700 dark:prose-li:text-dark-200"
                  dangerouslySetInnerHTML={{ __html: hasModules 
                    ? currentLecture.modules[activeModule]?.content 
                    : currentLecture.content 
                  }}
                /> */}
                
                {/* Module Navigation Controls */}
                {hasModules && currentLecture.modules.length > 1 && (
                  <div className="flex justify-between mb-8">
                    <button
                      onClick={() => setActiveModule(prev => Math.max(0, prev - 1))}
                      disabled={activeModule === 0}
                      className="px-4 py-2 rounded-md bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-300 
                                hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors disabled:opacity-50 
                                disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronUp size={16} className="rotate-90" /> Previous
                    </button>
                    <button
                      onClick={() => setActiveModule(prev => Math.min(currentLecture.modules.length - 1, prev + 1))}
                      disabled={activeModule === currentLecture.modules.length - 1}
                      className="px-4 py-2 rounded-md bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-300 
                                hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors disabled:opacity-50 
                                disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Next <ChevronDown size={16} className="rotate-90" />
                    </button>
                  </div>
                )}
                
                {/* Keywords / Tags */}
                {currentLecture.keywords && currentLecture.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {currentLecture.keywords.map((keyword, index) => (
                      <span 
                        key={index}
                        className="bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 
                                  px-2 py-1 rounded-md text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
                
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
                          {resource.description && (
                            <p className="text-dark-500 dark:text-dark-400 text-sm pl-6 mt-1">{resource.description}</p>
                          )}
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
  );
};

export default LectureModal; 