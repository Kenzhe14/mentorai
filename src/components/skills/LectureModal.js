import React, { useState } from "react";
import { Clock, Trophy, Download, MessageSquare, Star, ChevronDown, ChevronUp, BookOpen, List, Code, CheckCircle, Coffee, BookmarkIcon, LightbulbIcon, Asterisk, Zap } from "lucide-react";

// Function to enhance lecture content with icons and styling
const enhancedLectureContent = (content) => {
  if (!content) return '';
  
  // Add icons to headings
  let enhanced = content
    .replace(/<h1([^>]*)>(.*?)<\/h1>/g, '<h1$1><span class="heading-icon">📚</span> $2</h1>')
    .replace(/<h2([^>]*)>(.*?)<\/h2>/g, '<h2$1><span class="heading-icon">📝</span> $2</h2>')
    .replace(/<h3([^>]*)>(.*?)<\/h3>/g, '<h3$1><span class="heading-icon">🔍</span> $2</h3>')
    .replace(/<h4([^>]*)>(.*?)<\/h4>/g, '<h4$1><span class="heading-icon">📌</span> $2</h4>');
  
  // Enhance code blocks
  enhanced = enhanced.replace(/<pre><code>(.*?)<\/code><\/pre>/gs, 
    '<div class="code-block"><div class="code-header"><span>Code Example</span><span class="code-lang">code</span></div><pre><code>$1</code></pre></div>');
  
  // Add styling to important notes
  enhanced = enhanced.replace(/(\<p\>\s*)(Note:|Important:|Remember:|Tip:)(\s+)(.+?)(\<\/p\>)/g, 
    '<div class="important-note"><span class="note-icon">💡</span><p><strong>$2</strong>$3$4</p></div>');
  
  // Add custom list styling
  enhanced = enhanced.replace(/<ul>/g, '<ul class="custom-list">');
  enhanced = enhanced.replace(/<ol>/g, '<ol class="custom-list">');
  
  // Wrap tables in a container for responsiveness
  enhanced = enhanced.replace(/(<table.*?>[\s\S]*?<\/table>)/g, '<div class="table-container">$1</div>');
  
  // Add styles for key terms
  enhanced = enhanced.replace(/\*\*(.*?)\*\*/g, '<span class="key-term">$1</span>');
  
  return enhanced;
};

// Template component for lecture content rendering
const LectureContent = ({ lecture }) => {
  // More robust check for valid lecture data
  if (!lecture) {
    return (
      <div className="text-center py-8 text-dark-500 dark:text-dark-400">
        Lecture content unavailable. Please try again.
      </div>
    );
  }

  // If the lecture has sections, render them
  if (lecture.sections && lecture.sections.length > 0) {
    return (
      <div className="lecture-template">
        {/* Lecture Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-6 border-b border-primary-400 pb-2 inline-block">{lecture.title}</h1>
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 p-5 rounded-xl border-l-4 border-primary-500 text-dark-700 dark:text-dark-100 shadow-sm">
            {lecture.introduction || lecture.description}
          </div>
        </div>
        
        {/* Lecture Sections */}
        {lecture.sections.map((section, index) => (
          <div key={index} className="mb-12 bg-base-white dark:bg-dark-850/30 rounded-xl p-6 shadow-sm border border-dark-100/20 dark:border-dark-700/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white flex items-center justify-center font-bold shadow-md">
                {index + 1}
              </div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300">
                {section.title}
              </h2>
            </div>
            
            <div className="pl-0 md:pl-14">
              {/* Section Content */}
              <div className="mb-6 text-dark-700 dark:text-dark-200 text-lg leading-relaxed">
                {/* Render markdown or complex content if needed */}
                {typeof section.content === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: section.content }} />
                ) : (
                  section.content
                )}
              </div>
              
              {/* Key Concepts */}
              {section.keyPoints && section.keyPoints.length > 0 && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-100 dark:border-blue-800/30">
                  <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <LightbulbIcon size={20} className="text-blue-500" /> Key Concepts
                  </h3>
                  <ul className="space-y-3">
                    {section.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-3 pl-0 text-dark-700 dark:text-dark-200">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full flex-shrink-0 font-semibold text-sm">
                          {i + 1}
                        </span>
                        <span className="flex-1">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Code Examples with improved highlighting */}
              {section.codeExample && (
                <div className="mb-6 group">
                  <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                    <Code size={20} className="text-indigo-500" /> Code Example
                  </h3>
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-dark-900 text-gray-100 p-5 rounded-lg overflow-x-auto font-mono text-sm leading-relaxed">
                      <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="px-2 py-1 bg-dark-800 rounded-md">{section.codeLanguage || "code"}</span>
                      </div>
                      <pre className="whitespace-pre overflow-x-auto">
                        {/* Optional syntax highlighting */}
                        {section.codeExample}
                      </pre>
                    </div>
                  </div>
                  {section.codeExplanation && (
                    <div className="mt-3 text-sm text-dark-600 dark:text-dark-300 pl-4 border-l-2 border-indigo-300 dark:border-indigo-700">
                      {section.codeExplanation}
                    </div>
                  )}
                </div>
              )}
              
              {/* Section Notes with improved styling */}
              {section.note && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg mb-6">
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2 text-base">
                    <Asterisk size={18} /> Important Note
                  </span>
                  <p className="text-dark-700 dark:text-dark-300">{section.note}</p>
                </div>
              )}
              
              {/* Tips with more detailed styling */}
              {section.tips && section.tips.length > 0 && (
                <div className="mb-6 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/10 dark:to-teal-900/10 p-5 rounded-lg border border-green-100 dark:border-green-800/30">
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                    <Zap size={20} className="text-green-500" /> Pro Tips
                  </h3>
                  <ul className="space-y-2 text-dark-700 dark:text-dark-200 pl-0">
                    {section.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 border-b border-green-200/50 dark:border-green-800/20 pb-2 last:border-0 last:pb-0">
                        <Coffee size={18} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Interactive Examples/Diagrams - new section */}
              {section.interactive && (
                <div className="mb-6 bg-violet-50 dark:bg-violet-900/20 p-5 rounded-lg border border-violet-100 dark:border-violet-800/30">
                  <h3 className="text-lg font-semibold text-violet-700 dark:text-violet-400 mb-3 flex items-center gap-2">
                    <Zap size={20} className="text-violet-500" /> Interactive Example
                  </h3>
                  <div className="bg-white dark:bg-dark-800 p-4 rounded-lg">
                    {section.interactive}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Summary Section */}
        <div className="mt-12 p-6 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/10 rounded-xl border border-violet-200 dark:border-violet-800/30 shadow-sm">
          <h2 className="text-xl font-bold text-violet-800 dark:text-violet-300 mb-3 flex items-center gap-2">
            <BookmarkIcon size={22} className="text-violet-600 dark:text-violet-400" /> Summary & Key Takeaways
          </h2>
          <p className="text-dark-700 dark:text-dark-200 leading-relaxed">
            {lecture.summary || `In this lecture, we've covered the essential aspects of ${lecture.title} from basic principles to advanced applications. 
            You've learned about core concepts, practical implementations, and best practices that will help you in 
            real-world scenarios. Continue to the practice section to reinforce your learning and test your understanding.`}
          </p>
          <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-800/30 flex items-center gap-2 text-violet-700 dark:text-violet-300 text-sm">
            <CheckCircle size={18} />
            <span>You've completed this lecture! Ready for practice exercises?</span>
          </div>
        </div>
      </div>
    );
  }
  
  // If we have content but not in sections format, render the enhanced content
  if (lecture.content) {
    return (
      <div 
        className="lecture-content dark:text-white prose dark:prose-invert max-w-none mb-8"
        dangerouslySetInnerHTML={{ __html: enhancedLectureContent(lecture.content) }}
      />
    );
  }
  
  // Last resort fallback - render a minimal content if nothing else works
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-6">{lecture.title || "Lecture"}</h1>
      <p className="text-dark-700 dark:text-dark-200 text-lg">
        {lecture.introduction || lecture.description || `This lecture covers ${lecture.title || "the topic"}.`}
      </p>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 mt-4 rounded-lg border border-yellow-200 dark:border-yellow-800/40">
        <p className="text-dark-700 dark:text-dark-300">
          The full lecture content is being prepared. Please check back shortly or try refreshing the page.
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
  exportLecture,
  topicProgress
}) => {
  const [activeModule, setActiveModule] = useState(0);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  
  if (!showLectureModal) return null;

  // Check if lecture has modular structure
  const hasModules = currentLecture && currentLecture.modules && currentLecture.modules.length > 0;

  // Check if the current topic is completed
  const isTopicCompleted = () => {
    if (!currentLecture || !topicProgress) return false;
    
    const topicName = currentLecture.title || '';
    const status = topicProgress[topicName];
    
    if (!status) return false;
    
    // Check all variations of completed/Completed properties
    return (
      status.completed === true || 
      status.Completed === true ||
      status.completed === "true" || 
      status.Completed === "true"
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-base-white dark:bg-dark-900 p-4 border-b border-dark-200/10 dark:border-dark-800/50 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-dark-900 dark:text-base-white">
            {isLoadingLecture ? "Loading lecture..." : currentLecture?.title}
            {isTopicCompleted() && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                <CheckCircle size={12} className="mr-1" /> Пройдено
              </span>
            )}
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
                <p>Estimated reading time: {currentLecture?.estimatedTime || "10-15 minutes"}</p>
                {currentLecture?.difficulty && (
                  <p className="mt-1">Difficulty: {currentLecture.difficulty}</p>
                )}
              </div>
            </div>
          )}
          
          <div className={`p-6 ${hasModules && showTableOfContents ? 'md:flex-1' : 'w-full'}`}>
            {isLoadingLecture ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
                <p className="text-dark-600 dark:text-dark-300">Generating lecture content...</p>
              </div>
            ) : currentLecture && currentLecture.content ? (
              <>
                <div className="flex items-center gap-2 mb-4 text-sm text-dark-500 dark:text-dark-300">
                  <Clock size={16} />
                  <span>Estimated reading time: {currentLecture.estimatedTime || '15 minutes'}</span>
                </div>
                
                <div 
                  className="lecture-content dark:text-white prose dark:prose-invert max-w-none mb-8"
                  dangerouslySetInnerHTML={{ 
                    __html: enhancedLectureContent(currentLecture.content) 
                  }}
                />

                {/* Practice Button Section */}
                {currentLecture.exercises && currentLecture.exercises.length > 0 && (
                  <div className="mt-6 p-4 border border-dark-200/20 dark:border-dark-700/30 rounded-lg bg-dark-100/50 dark:bg-dark-800/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-dark-900 dark:text-white mb-1 flex items-center gap-2">
                          <Trophy size={16} className="text-primary-500"/>
                          Practice Exercises
                        </h3>
                        <p className="text-sm text-dark-600 dark:text-dark-400">
                          {isTopicCompleted() 
                            ? "Вы прошли все упражнения для этой темы!" 
                            : `Reinforce your learning with ${currentLecture.exercises.length} practice exercises.`}
                        </p>
                      </div>
                      <button
                        onClick={startPractice}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2
                          ${isTopicCompleted()
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800/30 dark:text-green-300 dark:hover:bg-green-800/50'
                            : 'bg-primary-600 text-white hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600'}`}
                      >
                        {isTopicCompleted()
                          ? <><CheckCircle size={14} /> Practice Again</>
                          : <><Trophy size={14} /> Start Practice</>}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg mb-4 max-w-md mx-auto text-center">
                  <p className="font-medium mb-2">Lecture content unavailable</p>
                  <p className="text-sm">We couldn't generate content for this topic. Please try again later or select a different topic.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LectureModal; 