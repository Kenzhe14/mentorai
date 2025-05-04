import React, { useState, useEffect } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Clock, Trophy, Download, MessageSquare, Star, ArrowLeft, Lock, BookOpen, Code, List, BarChart, ExternalLink, Github, CheckCircle, ArrowRight } from "lucide-react";
import axios from "axios";

// Add API_URL constant
const API_URL = "http://localhost:5000";

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
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState("");
  const [generationSteps, setGenerationSteps] = useState([
    { id: 'research', label: 'Researching topic', complete: false },
    { id: 'outline', label: 'Creating outline', complete: false },
    { id: 'content', label: 'Generating content', complete: false },
    { id: 'examples', label: 'Adding examples', complete: false },
    { id: 'exercises', label: 'Creating exercises', complete: false },
    { id: 'finalize', label: 'Finalizing lecture', complete: false }
  ]);
  const contentRef = React.useRef(null);

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
      
      // Use the isTopicCompleted helper to check all possible completion formats
      const isPrevCompleted = isTopicCompleted(prevTopicName);
      console.log(`Previous topic ${prevTopicName} completed status:`, isPrevCompleted);
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

  // Track reading progress
  useEffect(() => {
    if (!currentLecture) return;

    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const totalHeight = element.scrollHeight - element.clientHeight;
      const currentPosition = element.scrollTop;
      const progress = (currentPosition / totalHeight) * 100;
      setReadingProgress(Math.min(Math.max(progress, 0), 100));
      
      // Detect active section based on scroll position
      const headings = element.querySelectorAll('h2, h3');
      if (headings.length > 0) {
        let activeHeading = headings[0].id;
        
        for (const heading of headings) {
          const rect = heading.getBoundingClientRect();
          if (rect.top <= 150) {
            activeHeading = heading.id;
          } else {
            break;
          }
        }
        
        setActiveSection(activeHeading);
      }
    };
    
    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      
      // Add ids to headings for navigation
      const headings = contentElement.querySelectorAll('h2, h3');
      headings.forEach((heading, index) => {
        if (!heading.id) {
          heading.id = `section-${index}`;
        }
      });
      
      return () => {
        contentElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [currentLecture]);

  // Function to load lecture for a topic
  const loadLecture = async (topicName) => {
    setIsLoadingLecture(true);
    setCurrentLecture(null);
    setGenerationProgress(0);
    setGenerationStep("Initializing...");
    
    setGenerationSteps(prev => prev.map(step => ({ ...step, complete: false })));

    try {
      // Record start time for tracking time spent
      sessionStorage.setItem(`${topicName}_view_start`, Date.now().toString());
      
      // Simulate progress steps (this would be integrated with real API progress in production)
      const simulateProgress = () => {
        const steps = [...generationSteps];
        let currentStepIndex = 0;
        
        const interval = setInterval(() => {
          if (currentStepIndex >= steps.length) {
            clearInterval(interval);
          return;
          }
          
          // Update current step
          const currentStep = steps[currentStepIndex];
          setGenerationStep(currentStep.label);
          
          // Mark step as complete
          steps[currentStepIndex] = { ...currentStep, complete: true };
          setGenerationSteps(steps);
          
          // Update progress percentage
          const progress = Math.round(((currentStepIndex + 1) / steps.length) * 100);
          setGenerationProgress(progress);
          
          currentStepIndex++;
        }, 800); // Simulate steps with delay
        
        return interval;
      };
      
      // Start progress simulation
      const progressInterval = simulateProgress();
      
      // Fetch lecture content from the API
      const response = await axios.post(`${API_URL}/en/api/web/lecture`, {
        topic: topicName
      });
      
      // Clear the interval when response is received
      clearInterval(progressInterval);
      
      if (response.data && response.data.lecture) {
        console.log(`Loaded lecture for: ${topicName}`);
        
        // Ensure all progress steps are complete
        setGenerationSteps(prev => prev.map(step => ({ ...step, complete: true })));
        setGenerationProgress(100);
        setGenerationStep("Lecture ready!");
        
        // Short delay before showing lecture to ensure progress is visible
    setTimeout(() => {
          setCurrentLecture(response.data.lecture);
          
          // Mark topic as viewed in progress with consistent format
          const viewedStatus = {
            viewed: true,
            lastViewed: new Date().toISOString(),
            completed: false
          };
          
          // Update topic progress on server
          updateTopicProgress(topicName, viewedStatus);
          
          // Calculate time spent for analytics
          const startTime = sessionStorage.getItem(`${topicName}_view_start`);
          const timeSpent = startTime ? Math.floor((Date.now() - parseInt(startTime)) / 1000) : 0;
          
          // Track topic view in analytics
          trackAnalytics('topic-view', {
            topic: topicName,
            timeSpent: timeSpent
          });
        }, 500);
      } else {
        console.error("Invalid lecture data format:", response.data);
        // Fallback to sample lecture if API fails
      const sampleLecture = generateSampleLecture(topicName);
        
        // Ensure all steps are completed
        setGenerationSteps(prev => prev.map(step => ({ ...step, complete: true })));
        setGenerationProgress(100);
        
        setTimeout(() => {
      setCurrentLecture(sampleLecture);
        }, 500);
      }
    } catch (error) {
      console.error("Error fetching lecture:", error);
      // Fallback to sample lecture if API fails
      const sampleLecture = generateSampleLecture(topicName);
      
      // Ensure all steps are completed but indicate error
      setGenerationSteps(prev => prev.map(step => ({ ...step, complete: true })));
      setGenerationProgress(100);
      setGenerationStep("Generated fallback lecture due to error");
      
      setTimeout(() => {
        setCurrentLecture(sampleLecture);
      }, 500);
    } finally {
      // Keep loading state active until lecture is displayed
      setTimeout(() => {
      setIsLoadingLecture(false);
      }, 1000);
    }
  };

  // Helper function to generate a sample lecture structure
  const generateSampleLecture = (topic) => {
    // Format topic name for code examples
    const formatTopicForCode = topic.replace(/\s+/g, '');
    
    return {
      id: `lecture-${Date.now()}`,
      title: topic,
      estimatedTime: "20 minutes",
      content: `
        <h1>Understanding ${topic}: Core Concepts & Practical Applications</h1>
        <p>Welcome to this comprehensive exploration of <span class="key-term">${topic}</span>. This lecture will guide you through fundamental principles, practical implementations, and advanced techniques that will build your expertise in this important subject area.</p>
        
        <p>Important: This lecture is designed to be both theoretical and practical. You'll gain the most value by working through the code examples and reflecting on the real-world applications.</p>
        
        <h2>1. Fundamental Principles of ${topic}</h2>
        <p>Before diving into implementation details, it's crucial to establish a solid understanding of the core principles that govern ${topic}. These principles form the foundation upon which all practical applications are built.</p>
        
        <h3>1.1 Conceptual Framework</h3>
        <p>The ${topic} domain is structured around several key paradigms that guide how systems are designed, implemented, and evaluated:</p>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Core Principle</th>
                <th>Definition</th>
                <th>Practical Implication</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Abstraction</td>
                <td>Hiding complexity behind simple interfaces</td>
                <td>Enables focus on solving high-level problems without getting lost in details</td>
              </tr>
              <tr>
                <td>Modularity</td>
                <td>Building systems from smaller, reusable components</td>
                <td>Facilitates maintenance, testing, and collaborative development</td>
              </tr>
              <tr>
                <td>Consistency</td>
                <td>Applying uniform patterns and practices</td>
                <td>Reduces cognitive load and improves predictability</td>
              </tr>
              <tr>
                <td>Optimization</td>
                <td>Maximizing efficiency with available resources</td>
                <td>Ensures systems perform reliably under varied conditions</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <p>Tip: When learning ${topic}, focus first on understanding these fundamental principles rather than jumping directly to implementation details. A solid conceptual foundation will make practical applications much easier to master.</p>
        
        <h3>1.2 Historical Context and Evolution</h3>
        <p>To fully appreciate ${topic}'s current state, it's valuable to understand its historical development:</p>
        
        <ul>
          <li><strong>Early Foundations (Origin Phase):</strong> ${topic} emerged as a response to challenges in related domains, with early pioneers developing the initial frameworks and methodologies.</li>
          <li><strong>Standardization Period:</strong> As adoption increased, formal standards and best practices were established to ensure consistency and interoperability.</li>
          <li><strong>Modern Transformation:</strong> Recent advancements have significantly expanded ${topic}'s capabilities and application areas, particularly with the integration of new technologies.</li>
        </ul>
        
        <p>Note: Understanding this evolution helps contextualize why certain practices in ${topic} exist and how they might continue to evolve in the future.</p>
        
        <h2>2. Essential Techniques and Implementations</h2>
        <p>Now that we've established the fundamental principles, let's examine how these translate into practical implementations and techniques.</p>
        
        <h3>2.1 Basic Implementation Pattern</h3>
        <p>The following code example demonstrates a foundational implementation pattern in ${topic}:</p>
        
        <pre><code>/**
 * A foundational implementation of ${topic} concepts
 * 
 * This pattern demonstrates core principles including:
 * - Encapsulation of state and behavior
 * - Configuration through options
 * - Event-driven architecture
 */
class ${formatTopicForCode}Implementation {
  constructor(options = {}) {
    // Default configuration with sensible values
    this.config = {
      mode: 'standard',
      logLevel: 'info',
      maxRetries: 3,
      timeout: 5000,
      ...options
    };
    
    this.state = {
      initialized: false,
      active: false,
      errorCount: 0
    };
    
    this.eventHandlers = {};
  }
  
  // Initialization with error handling
  initialize() {
    try {
      console.log(\`Initializing ${topic} with config: \${JSON.stringify(this.config)}\`);
      // Initialization logic would go here
      this.state.initialized = true;
      this._triggerEvent('initialized', { timestamp: Date.now() });
      return true;
    } catch (error) {
      this._handleError('Initialization failed', error);
      return false;
    }
  }
  
  // Core operational method
  process(data) {
    if (!this.state.initialized) {
      throw new Error('Must initialize before processing data');
    }
    
    this.state.active = true;
    this._triggerEvent('processingStarted', { data });
    
    try {
      // Main processing logic would be implemented here
      const result = { processed: true, data, timestamp: Date.now() };
      
      this._triggerEvent('processingCompleted', result);
      this.state.active = false;
      return result;
    } catch (error) {
      this.state.errorCount++;
      this._handleError('Processing failed', error);
      this.state.active = false;
      
      // Implement retry logic if configured
      if (this.state.errorCount <= this.config.maxRetries) {
        console.log(\`Retrying operation (${this.state.errorCount}/${this.config.maxRetries})\`);
        return this.process(data);
      }
      
      throw error;
    }
  }
  
  // Event subscription system
  on(eventName, handler) {
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = [];
    }
    this.eventHandlers[eventName].push(handler);
    return this; // Enable method chaining
  }
  
  // Private method for event triggering
  _triggerEvent(eventName, data) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(\`Error in event handler for \${eventName}\`, error);
        }
      });
    }
  }
  
  // Private error handling method
  _handleError(message, error) {
    const errorData = {
      message,
      originalError: error,
      timestamp: Date.now()
    };
    
    console.error(\`${topic} error: \${message}\`, error);
    this._triggerEvent('error', errorData);
  }
}</code></pre>
        
        <p>This implementation showcases several key features essential to effective ${topic} systems:</p>
        <ul>
          <li>Configuration management with sensible defaults</li>
          <li>State tracking and validation</li>
          <li>Robust error handling with retry mechanisms</li>
          <li>Event-based architecture for extensibility</li>
        </ul>
        
        <h3>2.2 Advanced Usage Patterns</h3>
        <p>Building on the basic implementation, here's how to leverage more advanced patterns:</p>
        
        <pre><code>// Advanced usage example for ${formatTopicForCode}Implementation

// 1. Create an instance with custom configuration
const ${formatTopicForCode.toLowerCase()} = new ${formatTopicForCode}Implementation({
  mode: 'advanced',
  logLevel: 'debug',
  timeout: 10000,
  customFeature: true
});

// 2. Subscribe to events for better observability
${formatTopicForCode.toLowerCase()}.on('initialized', (data) => {
  console.log(\`System initialized at \${new Date(data.timestamp).toLocaleString()}\`);
})
.on('error', (error) => {
  // Send error to monitoring system
  monitoringSystem.reportError(error);
})
.on('processingCompleted', (result) => {
  // Persist or analyze results
  dataStore.save(result);
});

// 3. Initialize and use the implementation
if (${formatTopicForCode.toLowerCase()}.initialize()) {
  // 4. Process data in batch with error handling
  try {
    const dataBatch = [
      { id: 1, value: 'sample-1' },
      { id: 2, value: 'sample-2' }
    ];
    
    const results = dataBatch.map(item => ${formatTopicForCode.toLowerCase()}.process(item));
    console.log(\`Successfully processed \${results.length} items\`);
  } catch (error) {
    console.error('Batch processing failed', error);
  }
}</code></pre>
        
        <p>Important: Notice how the advanced usage pattern incorporates <span class="key-term">event handling</span>, <span class="key-term">batch processing</span>, and <span class="key-term">error management</span> to create a more robust solution.</p>
        
        <h2>3. Real-World Applications and Case Studies</h2>
        <p>To truly understand ${topic}'s value, let's examine how it's applied in various professional contexts.</p>
        
        <h3>3.1 Industry Applications</h3>
        <p>The principles and techniques of ${topic} have been successfully applied across numerous industries:</p>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Industry</th>
                <th>Application</th>
                <th>Key Benefit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Finance</td>
                <td>Risk assessment and fraud detection systems</td>
                <td>Improved accuracy and reduced false positives</td>
              </tr>
              <tr>
                <td>Healthcare</td>
                <td>Patient data management and treatment optimization</td>
                <td>Enhanced patient outcomes and operational efficiency</td>
              </tr>
              <tr>
                <td>E-commerce</td>
                <td>Recommendation engines and customer journey optimization</td>
                <td>Increased conversion rates and customer satisfaction</td>
              </tr>
              <tr>
                <td>Manufacturing</td>
                <td>Supply chain optimization and quality control</td>
                <td>Reduced costs and improved product reliability</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <h3>3.2 Case Study: Enterprise Implementation</h3>
        <blockquote>
          <p>A Fortune 500 company implemented ${topic} methodologies to transform their core business operations. By applying the principles we've discussed, they achieved a 35% reduction in operational costs, 40% faster time-to-market for new products, and significantly improved customer satisfaction scores.</p>
          <p>Key to their success was careful attention to the foundational principles, particularly focusing on modular design that allowed for incremental implementation and continuous improvement.</p>
        </blockquote>
        
        <p>The case study highlights how thoughtful application of ${topic} principles can lead to transformative business outcomes when implemented systematically.</p>
        
        <h2>4. Best Practices and Common Pitfalls</h2>
        <p>As you apply ${topic} in your own work, keep these best practices and common pitfalls in mind:</p>
        
        <h3>4.1 Best Practices</h3>
        <ul>
          <li><strong>Start With Clear Requirements:</strong> Define success criteria and constraints before implementation.</li>
          <li><strong>Adopt Incremental Implementation:</strong> Build systems progressively rather than attempting complete solutions immediately.</li>
          <li><strong>Invest in Testing:</strong> Comprehensive testing ensures reliability and helps document expected behavior.</li>
          <li><strong>Document Decisions:</strong> Record the reasoning behind significant implementation choices.</li>
          <li><strong>Design for Observability:</strong> Build in metrics, logging, and monitoring from the beginning.</li>
        </ul>
        
        <h3>4.2 Common Pitfalls</h3>
        <div class="important-note">
          <span class="note-icon">⚠️</span>
          <p><strong>Watch out:</strong> These common mistakes can significantly impact your ${topic} implementation success:</p>
        </div>
        
        <ol>
          <li><strong>Over-engineering:</strong> Adding unnecessary complexity that increases maintenance burden without proportional benefit.</li>
          <li><strong>Ignoring Edge Cases:</strong> Failing to handle exceptional conditions that inevitably occur in production.</li>
          <li><strong>Premature Optimization:</strong> Optimizing before understanding actual performance bottlenecks.</li>
          <li><strong>Insufficient Error Handling:</strong> Not providing meaningful error information or recovery mechanisms.</li>
          <li><strong>Poor Documentation:</strong> Making systems difficult to use, maintain, and extend.</li>
        </ol>
        
        <p>Tip: When encountering issues in your ${topic} implementation, return to first principles. Many complex problems can be resolved by re-examining and correctly applying fundamental concepts.</p>
        
        <h2>5. Future Trends and Emerging Developments</h2>
        <p>The field of ${topic} continues to evolve. Here are key trends to watch:</p>
        
        <ul>
          <li><strong>Integration with AI and Machine Learning:</strong> Enhancing ${topic} systems with predictive capabilities and adaptive behavior.</li>
          <li><strong>Increased Automation:</strong> Reducing manual intervention through automated deployment, testing, and optimization.</li>
          <li><strong>Standardization:</strong> Development of more comprehensive standards for interoperability.</li>
          <li><strong>Focus on Sustainability:</strong> Optimizing resource usage and environmental impact of ${topic} implementations.</li>
        </ul>
        
        <h2>Conclusion</h2>
        <p>${topic} represents a powerful approach to solving complex problems across diverse domains. By understanding its fundamental principles, mastering implementation techniques, and learning from real-world applications, you'll be well-equipped to apply these concepts effectively in your own work.</p>
        
        <p>Remember: Mastery of ${topic} comes through consistent practice and thoughtful application. The concepts presented in this lecture provide a foundation, but your own experimentation and application will be essential to developing true expertise.</p>
        
        <div class="important-note">
          <span class="note-icon">🔑</span>
          <p><strong>Key Takeaway:</strong> Successful ${topic} implementation balances theoretical understanding with practical application, technical excellence with business value, and current capabilities with future adaptability.</p>
        </div>
      `,
      exercises: [
        {
          type: "quiz",
          question: `Which of the following best describes the concept of modularity in ${topic}?`,
          options: [
            "The process of optimizing code for maximum performance",
            "Building systems from smaller, independent, and reusable components",
            "Hiding implementation details behind simple interfaces",
            "Converting complex algorithms into simpler ones"
          ],
          correctAnswer: 1,
          explanation: `Modularity refers to the practice of breaking down complex systems into smaller, self-contained components that can be developed, tested, and maintained independently. This is a fundamental principle in ${topic} that promotes code reuse and maintainability.`
        },
        {
          type: "quiz",
          question: `What is a primary benefit of applying event-driven architecture in ${topic} implementations?`,
          options: [
            "It makes the code run faster with fewer resources",
            "It ensures all code is executed sequentially",
            "It enables loose coupling between components that can react to changes",
            "It automatically handles all error conditions without explicit coding"
          ],
          correctAnswer: 2,
          explanation: `Event-driven architecture allows components to communicate through events rather than direct method calls. This promotes loose coupling, as components don't need to know about each other directly, only about the events they're interested in. This creates more flexible, maintainable, and extensible systems.`
        },
        {
          type: "coding",
          prompt: `Implement a function that demonstrates effective error handling in a ${topic} context. Your function should:

1. Accept an array of data items to process
2. Handle potential errors for each item without stopping the entire batch
3. Return a summary of successes and failures
4. Implement retry logic for failed items (maximum 2 retries)`,
          starterCode: `function process${formatTopicForCode}Batch(dataItems) {
  // Your implementation here
  
  // Return an object with:
  // - successful: array of successfully processed items
  // - failed: array of items that could not be processed
  // - summary: object with counts of total, successful, and failed items
}`,
          solution: `function process${formatTopicForCode}Batch(dataItems) {
  // Initialize result tracking
  const result = {
    successful: [],
    failed: [],
    summary: {
      total: dataItems.length,
      successful: 0,
      failed: 0
    }
  };

  // Process each item with retry logic
  for (const item of dataItems) {
    let success = false;
    let attempts = 0;
    let lastError = null;
    
    // Try up to 3 times (initial + 2 retries)
    while (!success && attempts < 3) {
      attempts++;
      try {
        // Simulate processing logic
        const processedItem = processItem(item);
        
        // If we get here, processing succeeded
        result.successful.push({
          originalItem: item,
          processedResult: processedItem,
          attempts
        });
        
        result.summary.successful++;
        success = true;
      } catch (error) {
        lastError = error;
        console.log(\`Processing attempt \${attempts} failed for item: \${JSON.stringify(item)}\`);
        
        // If this is the last attempt, mark as failed
        if (attempts >= 3) {
          result.failed.push({
            originalItem: item,
            error: lastError.message,
            attempts
          });
          
          result.summary.failed++;
        }
        
        // Wait briefly before retry (could use exponential backoff in production)
        if (attempts < 3) {
          // In real implementation, you might use await sleep(100 * attempts)
          console.log(\`Retrying processing for item: \${JSON.stringify(item)}\`);
        }
      }
    }
  }
  
  return result;
  
  // Helper function to simulate item processing
  function processItem(item) {
    // Simulating random failures (20% chance)
    if (Math.random() < 0.2) {
      throw new Error(\`Failed to process item \${JSON.stringify(item)}\`);
    }
    
    // Return processed item (in real implementation, this would transform the data)
    return {
      id: item.id,
      processedValue: item.value ? item.value.toUpperCase() : null,
      timestamp: Date.now()
    };
  }
}`,
          difficulty: "Advanced",
          hints: [
            "Consider how to track both successful and failed operations",
            "Implement a try/catch block for each processing attempt",
            "Use a counter to keep track of retry attempts for each item",
            "Return detailed information about successes and failures for analysis"
          ]
        },
        {
          type: "coding",
          prompt: `Design a configuration validation system for ${topic} implementations. Your function should:

1. Accept a configuration object
2. Validate that required properties exist and have correct types
3. Apply default values for missing optional properties
4. Return a validated configuration or throw detailed error messages`,
          starterCode: `function validate${formatTopicForCode}Config(config) {
  // Define the configuration schema with required fields and defaults
  
  // Implement validation logic
  
  // Return validated configuration or throw meaningful errors
}`,
          solution: `function validate${formatTopicForCode}Config(config) {
  // Define schema with validation rules
  const schema = {
    // Required fields with type checking
    required: {
      apiKey: { type: 'string', validate: (val) => val.length >= 10 },
      maxConcurrent: { type: 'number', validate: (val) => val > 0 && val <= 100 },
      endpoints: { type: 'object' }
    },
    // Optional fields with default values
    optional: {
      timeout: { type: 'number', default: 5000, validate: (val) => val >= 1000 },
      retryCount: { type: 'number', default: 3, validate: (val) => val >= 0 && val <= 10 },
      logLevel: { 
        type: 'string', 
        default: 'info',
        validate: (val) => ['debug', 'info', 'warn', 'error'].includes(val)
      },
      enableMetrics: { type: 'boolean', default: false }
    }
  };
  
  // Validate the configuration
  const errors = [];
  const validated = {};
  
  // Check for missing required fields
  for (const [field, rules] of Object.entries(schema.required)) {
    if (config[field] === undefined) {
      errors.push(\`Missing required field: \${field}\`);
    } else {
      // Check type
      const actualType = typeof config[field];
      if (actualType !== rules.type) {
        errors.push(\`Field \${field} should be of type \${rules.type}, but got \${actualType}\`);
      } else if (rules.validate && !rules.validate(config[field])) {
        errors.push(\`Field \${field} failed validation\`);
      } else {
        validated[field] = config[field];
      }
    }
  }
  
  // Apply defaults for optional fields
  for (const [field, rules] of Object.entries(schema.optional)) {
    if (config[field] === undefined) {
      validated[field] = rules.default;
    } else {
      // Check type
      const actualType = typeof config[field];
      if (actualType !== rules.type) {
        errors.push(\`Field \${field} should be of type \${rules.type}, but got \${actualType}\`);
      } else if (rules.validate && !rules.validate(config[field])) {
        errors.push(\`Field \${field} failed validation\`);
      } else {
        validated[field] = config[field];
      }
    }
  }
  
  // Handle unknown fields (could warn or ignore)
  const knownFields = [...Object.keys(schema.required), ...Object.keys(schema.optional)];
  const unknownFields = Object.keys(config).filter(key => !knownFields.includes(key));
  
  if (unknownFields.length > 0) {
    validated._unknownFields = unknownFields;
    console.warn(\`Unknown configuration fields: \${unknownFields.join(', ')}\`);
  }
  
  // If any errors, throw with details
  if (errors.length > 0) {
    throw new Error(\`Configuration validation failed: \${errors.join('; ')}\`);
  }
  
  return validated;
}`,
          difficulty: "Intermediate",
          hints: [
            "Define a schema object that specifies the rules for each configuration field",
            "Separate required fields from optional fields with defaults",
            "Include type checking and additional validation rules",
            "Collect all validation errors before throwing to provide comprehensive feedback"
          ]
        }
      ],
      resources: [
        { 
          type: "article", 
          title: `Comprehensive Guide to ${topic}`, 
          url: "#",
          description: "An in-depth exploration of principles, patterns, and best practices."
        },
        { 
          type: "video", 
          title: `${topic} in Practice: Expert Implementation Techniques`, 
          url: "#",
          description: "Video tutorials demonstrating advanced implementation strategies."
        },
        { 
          type: "github", 
          title: `${formatTopicForCode}-Reference-Implementation`, 
          url: "#",
          description: "Open-source reference implementation with extensive documentation and examples."
        }
      ],
      createdAt: new Date().toISOString()
    };
  };

  // Track analytics for user interactions
  const trackAnalytics = async (eventType, data) => {
    try {
      console.log(`Tracking analytics event: ${eventType}`, data);
      let endpoint = '';
      
      switch(eventType) {
        case 'topic-view':
          endpoint = '/analytics/topic-view';
          break;
        case 'topic-completion':
          endpoint = '/analytics/topic-completion';
          break;
        case 'exercise-activity':
          endpoint = '/analytics/exercise-activity';
          break;
        case 'rate-topic':
          endpoint = '/analytics/rate-topic';
          break;
        default:
          console.warn(`Unknown analytics event type: ${eventType}`);
          return;
      }
      
      // Send analytics data to server
      const response = await axios.post(`${API_URL}/en/api/web${endpoint}`, data);
      console.log(`Analytics tracked successfully for ${eventType}:`, response.data);
      return true;
    } catch (error) {
      console.error(`Error tracking analytics for ${eventType}:`, error);
      // Non-critical error, so we don't need to fail the user action
      return false;
    }
  };

  // Update topic progress
  const updateTopicProgress = async (topic, status) => {
    try {
      console.log(`Updating progress for topic: ${topic}`, status);
      
      // Check authentication
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("No authentication token found. Topic progress may not be saved on the server.");
      }
      
      // Prepare server data format
      const requestData = {
        topic,
        viewed: true,
        completed: status.completed === true
      };
      
      // Add additional fields only if defined
      if (status.quizScore) requestData.quizScore = status.quizScore;
      if (status.codeScore) requestData.codeScore = status.codeScore;
      
      console.log("Sending data to server:", requestData);
      
      const response = await axios.post(`${API_URL}/en/api/web/progress`, requestData);
      
      if (response.data && response.data.progress) {
        console.log(`Progress updated successfully for topic: ${topic}`);
        
        // Update local progress state
        const updatedProgress = { ...topicProgress };
        if (!updatedProgress[topic]) {
          updatedProgress[topic] = status;
        } else {
          updatedProgress[topic] = {
            ...updatedProgress[topic],
            ...status
          };
        }
        
        // Update state and localStorage
        setTopicProgress(updatedProgress);
        localStorage.setItem("topicProgress", JSON.stringify(updatedProgress));
        
        return true;
      } else {
        console.warn("Server response does not contain progress data");
        return false;
      }
    } catch (error) {
      console.error("Error updating topic progress:", error);
      
      // Fallback to local update
      console.log("Using local fallback for topic progress");
      const updatedProgress = { ...topicProgress };
      
      if (!updatedProgress[topic]) {
        updatedProgress[topic] = {
          viewed: true,
          completed: status.completed || false,
          lastViewed: new Date().toISOString()
        };
      } else {
        updatedProgress[topic] = {
          ...updatedProgress[topic],
          viewed: true,
          lastViewed: new Date().toISOString()
        };
        
        if (status.completed) {
          updatedProgress[topic].completed = true;
          updatedProgress[topic].completedAt = new Date().toISOString();
        }
        
        if (status.quizScore) updatedProgress[topic].quizScore = status.quizScore;
        if (status.codeScore) updatedProgress[topic].codeScore = status.codeScore;
      }
      
      // Update state and localStorage
      setTopicProgress(updatedProgress);
      localStorage.setItem("topicProgress", JSON.stringify(updatedProgress));
      
      return true;
    }
  };

  // Handle rating submission
  const handleRatingSubmit = async () => {
    if (!userRating || userRating === 0) {
      console.warn("Cannot submit rating: No rating selected");
      return;
    }

    try {
      const topicName = decodeURIComponent(topic);
      console.log(`Submitting rating ${userRating} for lecture: ${topicName}`);
      
      // Track rating in analytics
      const ratingData = {
        topic: topicName,
        rating: userRating
      };
      await trackAnalytics('rate-topic', ratingData);
      
      // Reset rating after successful submission
      setUserRating(0);
      
      // Show success message or feedback
      alert("Thank you for your rating!");
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again later.");
    }
  };

  // Start practice mode
  const startPractice = () => {
    if (!topic) {
      console.error("Cannot start practice: No topic specified");
      return;
    }
    
    try {
      const decodedTopic = decodeURIComponent(topic);
      
      // Log the transition
      console.log(`Navigating to practice page for topic: ${decodedTopic}`);
      
      // Navigate to the practice page
      navigate(`/skills/practice/${topic}`);
    } catch (error) {
      console.error("Error navigating to practice page:", error);
    }
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

  // Function to check if a topic is completed
  const isTopicCompleted = (topic) => {
    if (!topicProgress || !topic) return false;
    
    const progress = topicProgress[topic];
    
    // Handle different progress tracking formats
    if (!progress) return false;
    
    // New format as object with properties
    if (typeof progress === 'object') {
      return progress.completed === true || !!progress.completedAt;
    }
    
    // Old format as string
    return progress === "completed";
  };
  
  // Function to check if a lecture is viewed
  const isLectureViewed = (topic) => {
    if (!topicProgress || !topic) return false;
    
    const progress = topicProgress[topic];
    
    // Handle different progress tracking formats
    if (!progress) return false;
    
    // New format as object with properties
    if (typeof progress === 'object') {
      return progress.viewed === true || !!progress.lastViewed;
    }
    
    // Old format had no 'viewed' status, but any progress means it was viewed
    return !!progress;
  };

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

  // Generate table of contents from lecture content
  const generateTableOfContents = () => {
    if (!currentLecture || !currentLecture.content) return [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentLecture.content, 'text/html');
    const headings = Array.from(doc.querySelectorAll('h2, h3'));
    
    return headings.map((heading, index) => {
      const id = heading.id || `section-${index}`;
      return {
        id,
        title: heading.textContent.replace(/^[📚📝🔍📌\s]+/, ''), // Remove emoji and spaces
        level: heading.tagName === 'H2' ? 2 : 3,
        isActive: activeSection === id
      };
    });
  };

  // Scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element && contentRef.current) {
      contentRef.current.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  // Debug useEffect to check if analytics is working
  useEffect(() => {
    if (topic) {
      try {
        const decodedTopic = decodeURIComponent(topic);
        console.log("=== LECTURE PAGE ANALYTICS DEBUG ===");
        console.log(`Current topic: ${decodedTopic}`);
        console.log(`Topic progress state:`, topicProgress);
        console.log(`Is topic viewed: ${isLectureViewed(decodedTopic)}`);
        console.log(`Is topic completed: ${isTopicCompleted(decodedTopic)}`);
        
        // Check if we have a stored view start time
        const viewStartTime = sessionStorage.getItem(`${decodedTopic}_view_start`);
        console.log(`View start time: ${viewStartTime ? new Date(parseInt(viewStartTime)).toLocaleString() : 'Not set'}`);
        
        console.log("=== END DEBUG ===");
      } catch (error) {
        console.error("Error in debug logging:", error);
      }
    }
  }, [topic, topicProgress]);

  return (
    <LeftBar>
      <div className={`${isMobile ? "mt-16" : ""} p-4 bg-dark-50 dark:bg-dark-950 min-h-screen`}>
        <div className="max-w-5xl mx-auto">
          {/* Header with back button */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/skills')}
                className="px-3 py-1.5 text-sm rounded-lg border border-dark-200 dark:border-dark-700 bg-base-white dark:bg-dark-800 flex items-center space-x-1 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Back to Skills</span>
              </button>
              
              {isTopicCompleted(decodeURIComponent(topic)) && (
                <div className="flex items-center space-x-1 px-2 py-1.5 text-sm rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  <CheckCircle size={16} />
                  <span>Completed</span>
                </div>
              )}
          </div>

            <div className="flex space-x-2">
              <button
                onClick={startPractice}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors flex items-center space-x-1"
              >
                <Code size={16} />
                <span>Practice Now</span>
              </button>
              
              {/* Next Topic Button */}
              {roadmap.length > 0 && (
                (() => {
                  const decodedTopic = decodeURIComponent(topic);
                  const currentIndex = roadmap.findIndex(item => {
                    const itemName = item.includes(":") ? item.split(":")[0].trim() : item;
                    return itemName === decodedTopic;
                  });
                  
                  if (currentIndex < roadmap.length - 1) {
                    const nextTopic = roadmap[currentIndex + 1];
                    const nextTopicName = nextTopic.includes(":") ? nextTopic.split(":")[0].trim() : nextTopic;
                    
                    // Check if next topic is accessible
                    const isNextAccessible = isTopicCompleted(decodedTopic);
                    
                    return (
                      <button
                        onClick={() => isNextAccessible && navigate(`/skills/lecture/${encodeURIComponent(nextTopicName)}`)}
                        disabled={!isNextAccessible}
                        className={`px-3 py-1.5 text-sm rounded-lg flex items-center space-x-1 ${
                          isNextAccessible
                            ? "bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700"
                            : "bg-dark-100/50 dark:bg-dark-800/50 text-dark-400 dark:text-dark-500 cursor-not-allowed"
                        }`}
                      >
                        <span>Next Topic</span>
                        <ArrowRight size={16} />
                      </button>
                    );
                  }
                  return null;
                })()
              )}
            </div>
          </div>

          {/* Reading progress bar */}
          <div className="sticky top-0 z-10 py-2 bg-dark-50 dark:bg-dark-950">
            <div className="h-2 bg-dark-200 dark:bg-dark-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${readingProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Lecture content with table of contents */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Table of Contents - visible on larger screens */}
            {!isLoadingLecture && currentLecture && !isAccessible === false && (
              <div className="hidden md:block w-64 sticky top-12 self-start">
                <div className="bg-base-white dark:bg-dark-900 rounded-xl shadow-sm p-4 border border-dark-200/10 dark:border-dark-800/50">
                  <h3 className="font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-primary-500" />
                    <span>Contents</span>
                  </h3>
                  <ul className="space-y-1">
                    {generateTableOfContents().map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => scrollToSection(item.id)}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                            item.level === 3 ? 'pl-4' : ''
                          } ${
                            item.isActive 
                              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' 
                              : 'text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800/50'
                          }`}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-3 border-t border-dark-200/10 dark:border-dark-800/50 text-xs text-dark-500 dark:text-dark-400">
                    <div className="flex items-center justify-between mb-1">
                      <span>Reading progress</span>
                      <span>{Math.round(readingProgress)}%</span>
                    </div>
                    <div className="h-1.5 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full transition-all duration-300"
                        style={{ width: `${readingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main content */}
            <div className="flex-1">
              <div 
                ref={contentRef}
                className="bg-base-white dark:bg-dark-900 rounded-xl shadow-lg overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto"
              >
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
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-full max-w-md mb-8">
                        <div className="flex justify-between text-sm text-dark-500 dark:text-dark-300 mb-2">
                          <span>{generationStep}</span>
                          <span>{generationProgress}%</span>
                        </div>
                        <div className="h-2 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full transition-all duration-500"
                            style={{ width: `${generationProgress}%` }}
                          ></div>
                        </div>
                        <div className="mt-6 space-y-3">
                          {generationSteps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                                step.complete 
                                  ? "bg-green-500 text-white" 
                                  : "bg-dark-200 dark:bg-dark-700 text-dark-400 dark:text-dark-500"
                              }`}>
                                {step.complete && (
                                  <CheckCircle size={12} />
                                )}
                              </div>
                              <span className={`text-sm ${
                                step.complete 
                                  ? "text-dark-900 dark:text-dark-100" 
                                  : "text-dark-400 dark:text-dark-500"
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-dark-600 dark:text-dark-300">Please wait while we generate your lecture content...</p>
                </div>
              ) : currentLecture ? (
                <>
                      <div className="flex items-center gap-2 mb-4 text-sm text-dark-500 dark:text-dark-300">
                    <Clock size={16} />
                        <span>Estimated reading time: {currentLecture.estimatedTime || '15 minutes'}</span>
                  </div>
                  
                  <div 
                        className="lecture-content dark:text-white prose dark:prose-invert max-w-none mb-8"
                        dangerouslySetInnerHTML={{ __html: enhancedLectureContent(currentLecture.content) }}
                      />
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

              {/* Interactive Elements Box */}
              {currentLecture && (
                <div className="bg-dark-100 dark:bg-dark-800/70 rounded-lg p-4 mt-6 mb-8 border border-dark-200/20 dark:border-dark-700/30">
                  <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-3 flex items-center">
                    <Code size={20} className="mr-2 text-primary-500" />
                    Interactive Practice
                  </h3>
                    {currentLecture.exercises && currentLecture.exercises.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                        <p className="text-dark-700 dark:text-dark-200 mb-2">
                            {isTopicCompleted(currentLecture.title) 
                              ? "You've successfully completed all practice exercises for this topic!" 
                              : `This lecture includes ${currentLecture.exercises.length} practice exercises to reinforce your learning.`}
                          </p>
                          {isTopicCompleted(currentLecture.title) && (
                            <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md flex items-center gap-1 text-sm font-medium">
                              <CheckCircle size={16} />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={startPractice}
                          className={`${
                            isTopicCompleted(currentLecture.title)
                              ? "bg-green-600 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600"
                              : "bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600"
                          } text-base-white px-4 py-2 rounded-lg transition-colors shadow-md inline-flex items-center gap-2`}
                        >
                          {isTopicCompleted(currentLecture.title) ? (
                            <>
                              <CheckCircle size={16} />
                              Review Practice
                            </>
                          ) : (
                            <>
                          <Trophy size={16} />
                          Start Practice Mode
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
              )}
                  
                  {/* Resources */}
              {currentLecture?.resources && currentLecture.resources.length > 0 && (
                    <div className="mb-8 bg-dark-50 dark:bg-dark-900/50 p-4 rounded-lg border border-dark-200/20 dark:border-dark-700/30">
                  <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-3 flex items-center">
                    <BookOpen size={20} className="mr-2 text-primary-500" />
                    Additional Resources
                  </h3>
                      <ul className="space-y-2">
                        {currentLecture.resources.map((resource, i) => (
                          <li key={i} className="text-primary-600 dark:text-primary-400 hover:underline">
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                          {resource.type === "article" && <ExternalLink size={16} />}
                              {resource.type === "video" && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>}
                          {resource.type === "github" && <Github size={16} />}
                              {resource.title}
                            </a>
                        {resource.description && (
                          <p className="text-dark-500 dark:text-dark-400 text-sm ml-6">{resource.description}</p>
                        )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Rating and Actions */}
              {currentLecture && (
                <div className="border-t border-dark-200/20 dark:border-dark-700/30 pt-6 mt-8 bg-dark-50/50 dark:bg-dark-900/40 p-6 rounded-xl shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                      <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-2 flex items-center">
                        <BarChart size={18} className="mr-2 text-primary-500" />
                        Rate this lecture
                      </h3>
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
                          className={`inline-flex items-center gap-2 px-3 py-2 
                            ${isTopicCompleted(currentLecture.title)
                              ? "bg-green-600 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600"
                              : "bg-primary-600 hover:bg-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600"
                            } text-white rounded-lg transition-colors shadow-sm`}
                        >
                          {isTopicCompleted(currentLecture.title) ? (
                            <>
                              <CheckCircle size={16} />
                              Review Practice
                            </>
                          ) : (
                            <>
                          <Trophy size={16} />
                          Practice
                            </>
                          )}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </LeftBar>
  );
}

export default LecturePage; 