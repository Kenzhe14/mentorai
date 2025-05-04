import React, { useState, useEffect } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import axios from "axios";
import { Send, User, Bot, Search, Clock, Menu, X, Pin, Share2 } from "lucide-react";
import { useAuth } from "../components/authContext";
import { useNavigate } from "react-router-dom";

// API URL for our Go backend
const API_URL = "http://localhost:5000";

// Configure axios to send credentials (cookies)
axios.defaults.withCredentials = true;

function Chat() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            content: 'Привет! Я AI-ментор от Mentor&AI. Чем я могу вам помочь сегодня?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    
    const [chatSessions, setChatSessions] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const messagesEndRef = React.useRef(null);
    
    // Load user's chat sessions
    useEffect(() => {
        if (currentUser) {
            fetchChatSessions();
        }
    }, [currentUser]);
    
    // Auto scroll to bottom of chat
    useEffect(() => {
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const checkScreenSize = () => {
            const isMobileView = window.innerWidth < 768;
            setIsMobile(isMobileView);
            // On initial load, show sidebar on desktop, hide on mobile
            if (!showSidebar && !isMobileView) {
                setShowSidebar(true);
            } else if (showSidebar && isMobileView) {
                setShowSidebar(false);
            }
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);
    
    // Fetch chat sessions from backend
    const fetchChatSessions = async () => {
        setIsLoadingSessions(true);
        try {
            const response = await axios.get(`${API_URL}/en/api/web/chat/sessions`);
            if (response.data && Array.isArray(response.data.sessions)) {
                // Make sure we have valid sessions
                const validSessions = response.data.sessions.filter(session => session && session.ID);
                setChatSessions(validSessions);
                
                // If there are sessions and no session is selected, select the first one
                if (validSessions.length > 0 && !selectedChat) {
                    loadChatHistory(validSessions[0].ID);
                } else if (validSessions.length === 0) {
                    // If there are no sessions, set default welcome message
                    setMessages([
                        {
                            id: 1,
                            type: 'bot',
                            content: 'Привет! Я AI-ментор от Mentor&AI. Чем я могу вам помочь сегодня?',
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                    ]);
                    setSelectedChat(null);
                }
            } else {
                // Handle unexpected API response format
                console.error('Unexpected API response format:', response.data);
                setMessages([
                    {
                        id: 1,
                        type: 'bot',
                        content: 'Привет! Я AI-ментор от Mentor&AI. Чем я могу вам помочь сегодня?',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
                setChatSessions([]);
            }
        } catch (error) {
            console.error('Error fetching chat sessions:', error);
            // Show welcome message in case of error
            setMessages([
                {
                    id: 1,
                    type: 'bot',
                    content: 'Привет! Я AI-ментор от Mentor&AI. Чем я могу вам помочь сегодня?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
            setChatSessions([]);
        } finally {
            setIsLoadingSessions(false);
        }
    };
    
    // Load chat history for a session
    const loadChatHistory = async (sessionId) => {
        if (!sessionId) {
            console.error('Invalid session ID:', sessionId);
            return;
        }
        
        setIsLoadingHistory(true);
        setSelectedChat(sessionId);
        
        try {
            const response = await axios.get(`${API_URL}/en/api/web/chat/history/${sessionId}`);
            
            if (response.data && Array.isArray(response.data.messages)) {
                // Transform to our frontend message format
                const formattedMessages = response.data.messages
                    .filter(msg => msg && (msg.Content || msg.content)) // Filter out invalid messages
                    .map(msg => ({
                        id: msg.ID || msg.id || Date.now() + Math.random(),
                        type: (msg.SenderType === "user" || msg.senderType === "user") ? 'user' : 'bot',
                        content: msg.Content || msg.content || "Empty message",
                        timestamp: msg.CreatedAt || msg.createdAt
                            ? new Date(msg.CreatedAt || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isRead: msg.IsRead || msg.isRead || false
                    }));
                
                if (formattedMessages.length > 0) {
                    setMessages(formattedMessages);
                } else {
                    // If no messages, set a welcome message
                    setMessages([
                        {
                            id: 1,
                            type: 'bot',
                            content: 'This is the beginning of your conversation.',
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                    ]);
                }
                
                // Update chat sessions to mark this one as read
                setChatSessions(prevSessions => 
                    prevSessions.map(session => 
                        session.ID === sessionId 
                            ? { ...session, UnreadCount: 0 } 
                            : session
                    )
                );
            } else {
                // Handle unexpected API response format
                console.error('Unexpected API response format:', response.data);
                setMessages([
                    {
                        id: Date.now(),
                        type: 'system',
                        content: 'Error loading chat history. Unexpected format.',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isError: true
                    }
                ]);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            // If error, set empty chat with system error message
            setMessages([
                {
                    id: Date.now(),
                    type: 'system',
                    content: 'Error loading chat history. Please try again.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isError: true
                }
            ]);
        } finally {
            setIsLoadingHistory(false);
            if (isMobile) setShowSidebar(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        // Check word count limit
        const wordCount = newMessage.trim().split(/\s+/).length;
        if (wordCount > 100) {
            // Add error message if exceeding word limit
            const errorMessage = {
                id: Date.now(),
                type: 'system',
                content: 'Message exceeds the 100-word limit. Please shorten your message.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Save the message text before clearing the input
        const messageText = newMessage;
        
        // Update UI immediately
        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        setLoading(true);

        try {
            // Call our Go backend API with the session ID if we have one
            const response = await axios.post(`${API_URL}/en/api/web/chat`, {
                message: messageText,
                sessionId: selectedChat || 0 // Send 0 for new session
            });

            // Validate response
            if (!response.data) {
                throw new Error('Empty response from server');
            }

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: response.data.message || 'No response content',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, botMessage]);
            
            // If we got a new session ID back, make sure we select it
            if (response.data.sessionId && (!selectedChat || selectedChat === 0)) {
                setSelectedChat(response.data.sessionId);
                
                // Refresh the session list to get the new session
                await fetchChatSessions();
            } else {
                // Update the existing chat session's last message and timestamp
                setChatSessions(prevSessions => 
                    prevSessions.map(session => 
                        session.ID === selectedChat 
                            ? { 
                                ...session, 
                                LastMessage: response.data.message?.substring(0, 47) + (response.data.message?.length > 50 ? '...' : ''),
                                LastMessageType: 'ai',
                                UpdatedAt: new Date().toISOString(),
                                UnreadCount: 0
                              } 
                            : session
                    )
                );
            }
        } catch (error) {
            console.error('Error getting bot response:', error);

            let errorMessage = 'Sorry, I encountered an error processing your request.';
            
            // Get more specific error message if available
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }

            const errorResponse = {
                id: Date.now() + 1,
                type: 'bot',
                content: errorMessage,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isError: true
            };

            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setLoading(false);
        }
    };

    // Start a new chat
    const startNewChat = () => {
        setSelectedChat(null);
        setMessages([
            {
                id: 1,
                type: 'bot',
                content: 'Привет! Я AI-ментор от Mentor&AI. Чем я могу вам помочь сегодня?',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
        if (isMobile) setShowSidebar(false);
    };

    // Create a new chat session
    const createNewChat = () => {
        setSelectedChat(null);
        setMessages([
            {
                id: 1,
                type: 'bot',
                content: 'Привет! Я AI-ментор от Mentor&AI. Чем я могу вам помочь сегодня?',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    // Check if user is logged in
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    // Add authentication error handler to axios
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    // Unauthorized - token might be expired
                    logout();
                    navigate('/login');
                }
                return Promise.reject(error);
            }
        );

        return () => {
            // Remove interceptor when component unmounts
            axios.interceptors.response.eject(interceptor);
        };
    }, [logout, navigate]);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
    };
    
    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Chat sessions UI in sidebar - simplified version
    const renderChatSessionList = () => {
        return chatSessions
            .filter(chat => chat && chat.Title && chat.Title.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(chat => (
                <button
                    key={chat.ID}
                    onClick={() => loadChatHistory(chat.ID)}
                    className={`w-full p-2.5 rounded-lg flex items-center justify-between transition-colors
                        ${selectedChat === chat.ID
                            ? 'bg-primary-500 text-white'
                            : 'hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-900 dark:text-base-white'}`}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center relative">
                            <Bot className="text-primary-500" size={16} />
                            {chat.UnreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                                    {chat.UnreadCount > 9 ? '9+' : chat.UnreadCount}
                                </div>
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="font-medium text-sm truncate">{chat.Title || "Untitled Chat"}</h3>
                        </div>
                    </div>
                    <span className="text-xs opacity-80">
                        {chat.UpdatedAt ? new Date(chat.UpdatedAt).toLocaleDateString() : ""}
                    </span>
                </button>
            ));
    };

    // Delete all chat sessions
    const clearAllChats = async () => {
        if (window.confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
            try {
                await axios.delete(`${API_URL}/en/api/web/chat/all`);
                
                // Reset UI state
                setChatSessions([]);
                setSelectedChat(null);
                
                // Show welcome message
                setMessages([
                    {
                        id: 1,
                        type: 'bot',
                        content: 'Привет! Я AI-ментор от Mentor&AI. Чем я могу вам помочь сегодня?',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
                
                // Show confirmation message
                const confirmMessage = {
                    id: Date.now(),
                    type: 'system',
                    content: 'All chat history has been deleted.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, confirmMessage]);
                
            } catch (error) {
                console.error('Error clearing chat history:', error);
                
                const errorMessage = {
                    id: Date.now(),
                    type: 'system',
                    content: 'Failed to clear chat history. Please try again.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isError: true
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        }
    };

    return (
        <LeftBar>
            <div className={`${isMobile ? "mt-16" : ""} h-[calc(100vh-4rem)] bg-dark-200  dark:bg-dark-950`}>
                <div className="flex h-full relative max-w-[1920px] mx-auto">
                    {/* Chat List Sidebar */}
                    <div className={`${showSidebar
                        ? "translate-x-0 md:w-[300px] lg:w-[320px]"
                        : "-translate-x-full md:w-0"
                        } transform transition-all duration-300 absolute md:relative z-40
                        h-full border-r border-dark-200 dark:border-dark-800 bg-base-white dark:bg-dark-950
                        shadow-lg md:shadow-none overflow-hidden`}
                    >
                        <div className="flex flex-col h-full">
                            <div className="p-3 border-b border-dark-200 dark:border-dark-800">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="font-medium text-dark-900 dark:text-base-white">Сообщения</h2>
                                    <div className="flex items-center gap-1">
                                        {/* Clear chats button */}
                                        <button 
                                            onClick={clearAllChats}
                                            className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-400 hover:text-red-500 transition-colors"
                                            title="Очистить историю"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                        <button 
                                            onClick={toggleSidebar}
                                            className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-400 hover:text-primary-500 transition-colors"
                                            title="Скрыть панель"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="relative mb-3">
                                    <input
                                        type="text"
                                        placeholder="Поиск чатов..."
                                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-dark-200 dark:border-dark-700 
                                                 bg-base-white dark:bg-dark-800 text-dark-900 dark:text-base-white text-sm
                                                 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
                                </div>
                                
                                {/* New Chat Button */}
                                <button
                                    onClick={createNewChat}
                                    className="w-full mb-2 py-2 px-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 5v14M5 12h14"></path>
                                    </svg>
                                    <span>Новый чат</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {isLoadingSessions ? (
                                    <div className="flex justify-center p-6">
                                        <div className="flex space-x-2">
                                            <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"></div>
                                            <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 space-y-2">
                                        {renderChatSessionList()}
                                        
                                        {chatSessions.length === 0 && (
                                            <div className="text-center p-4 text-dark-400">
                                                No conversations yet. Start a new chat!
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* User Profile Section */}
                            {currentUser && (
                                <div className="p-4 border-t border-dark-200 dark:border-dark-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                            <User className="text-primary-500" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-dark-900 dark:text-base-white">{currentUser.username}</h3>
                                            <p className="text-sm text-dark-500">{currentUser.email || ""}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col h-full bg-base-white dark:bg-dark-900">
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b border-dark-200 dark:border-dark-800">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    {!showSidebar && (
                                        <button
                                            onClick={toggleSidebar}
                                            className="p-2 rounded-lg bg-primary-500 text-white shadow-md hover:bg-primary-600 transition-colors"
                                            title="Показать панель"
                                        >
                                            <Menu size={20} />
                                        </button>
                                    )}
                                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center shadow-sm">
                                        <Bot className="text-primary-500" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg text-dark-900 dark:text-base-white">AI Mentor</h2>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <p className="text-sm text-dark-500">Online</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Chat Actions */}
                                <div className="flex items-center gap-3">
                                    <button
                                        className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-all text-dark-400 hover:text-primary-500"
                                        title="Pin conversation"
                                    >
                                        <Pin size={20} />
                                    </button>
                                    <button
                                        className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-all text-dark-400 hover:text-primary-500"
                                        title="Share conversation"
                                    >
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" ref={messagesEndRef}>
                            {isLoadingHistory ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="animate-pulse flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-primary-200 dark:bg-primary-900"></div>
                                        <div className="h-4 w-32 bg-dark-200 dark:bg-dark-700 rounded"></div>
                                        <div className="h-2 w-24 bg-dark-200 dark:bg-dark-700 rounded"></div>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div 
                                        key={message.id} 
                                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div 
                                            className={`
                                                relative max-w-[80%] rounded-2xl p-4 
                                                ${message.type === 'user' 
                                                    ? 'bg-primary-500 text-white' 
                                                    : message.isError
                                                        ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/30'
                                                        : message.type === 'system'
                                                            ? 'bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-200'
                                                            : 'bg-dark-100 dark:bg-dark-800 text-dark-900 dark:text-base-white'
                                                }
                                            `}
                                        >
                                            {message.type !== 'user' && !message.isError && message.type !== 'system' && (
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-dark-200/30 dark:border-dark-700/30">
                                                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                        <Bot className="text-primary-500" size={12} />
                                                    </div>
                                                    <span className="text-sm font-medium">Mentor AI</span>
                                                </div>
                                            )}
                                            
                                            {message.isError && (
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-200/30 dark:border-red-800/30">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                    </svg>
                                                    <span className="text-sm font-medium">Ошибка</span>
                                                </div>
                                            )}
                                            
                                            <div className="whitespace-pre-wrap break-words">
                                                {message.content}
                                            </div>
                                            <div className="text-xs opacity-70 mt-1 text-right">
                                                {message.timestamp}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            
                            {/* Loading indicator for message being sent */}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="relative max-w-[80%] rounded-2xl p-4 bg-dark-100 dark:bg-dark-800 text-dark-900 dark:text-base-white">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-dark-200/30 dark:border-dark-700/30">
                                            <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                <Bot className="text-primary-500" size={12} />
                                            </div>
                                            <span className="text-sm font-medium">Mentor AI</span>
                                        </div>
                                        <div className="flex space-x-2 items-center">
                                            <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"></div>
                                            <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat Input */}
                        <div className="px-4 py-3 border-t border-dark-200 dark:border-dark-800">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <div className="flex-grow relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Сообщение..."
                                        className="w-full p-3 pl-4 pr-12 bg-dark-50 dark:bg-dark-950 rounded-xl border border-dark-200/30 dark:border-dark-800/20 text-dark-900 dark:text-base-white focus:outline-none focus:border-primary-500"
                                        disabled={loading}
                                    />
                                    {/* Word count indicator */}
                                    {newMessage.trim() !== '' && (
                                        <div className={`absolute right-3 bottom-3 text-xs ${
                                            newMessage.trim().split(/\s+/).length > 100 
                                                ? 'text-red-500' 
                                                : 'text-dark-500 dark:text-dark-400'
                                        }`}>
                                            {newMessage.trim().split(/\s+/).length}/100
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className={`p-3 rounded-xl ${
                                        loading 
                                            ? 'bg-dark-200 dark:bg-dark-700 cursor-not-allowed' 
                                            : 'bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700'
                                    } text-white transition-colors`}
                                    disabled={loading || newMessage.trim() === '' || newMessage.trim().split(/\s+/).length > 100}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Send size={18} />
                                    )}
                                </button>
                            </form>
                            <div className="text-xs text-dark-400 mt-2 text-center">
                                AI-ментор powered by Mentor&AI
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LeftBar>
    );
}

export default Chat;
