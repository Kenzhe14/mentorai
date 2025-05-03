import React, { useState, useEffect } from "react";
import "../index.css";
import LeftBar from "../components/sidebar";
import axios from "axios";
import { Send, User, Bot, Search, Clock, Menu, X, Pin, Share2 } from "lucide-react";
import { useAuth } from "../components/authContext";

// API URL for our Go backend
const API_URL = "http://localhost:5000";

// Configure axios to send credentials (cookies)
axios.defaults.withCredentials = true;

function Chat() {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            content: 'Привет! Я AI-ментор от Mentor&AI. Чем я могу вам помочь сегодня?',
            timestamp: '10:00'
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
            if (response.data && response.data.sessions) {
                setChatSessions(response.data.sessions);
                
                // If there are sessions and no session is selected, select the first one
                if (response.data.sessions.length > 0 && !selectedChat) {
                    loadChatHistory(response.data.sessions[0].id);
                } else if (response.data.sessions.length === 0) {
                    // If there are no sessions, set default welcome message
                    setMessages([
                        {
                            id: 1,
                            type: 'bot',
                            content: 'Привет! Я AI-ментор от Mentor&AI. Чем я могу вам помочь сегодня?',
                            timestamp: '10:00'
                        }
                    ]);
                    setSelectedChat(null);
                }
            }
        } catch (error) {
            console.error('Error fetching chat sessions:', error);
        } finally {
            setIsLoadingSessions(false);
        }
    };
    
    // Load chat history for a session
    const loadChatHistory = async (sessionId) => {
        setIsLoadingHistory(true);
        setSelectedChat(sessionId);
        
        try {
            const response = await axios.get(`${API_URL}/en/api/web/chat/history/${sessionId}`);
            
            if (response.data && response.data.messages) {
                // Transform to our frontend message format
                const formattedMessages = response.data.messages.map(msg => ({
                    id: msg.id,
                    type: msg.isFromUser ? 'user' : 'bot',
                    content: msg.content,
                    timestamp: msg.timestamp
                }));
                
                setMessages(formattedMessages);
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

        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        setLoading(true);

        try {
            // Call our Go backend API with the session ID if we have one
            const response = await axios.post(`${API_URL}/en/api/web/chat`, {
                message: newMessage,
                sessionId: selectedChat || 0 // Send 0 for new session
            });

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: response.data.content || 'No response content',
                timestamp: response.data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, botMessage]);
            
            // If we got a new session ID back, make sure we select it
            if (response.data.sessionId && !selectedChat) {
                setSelectedChat(response.data.sessionId);
                // Refresh the session list
                fetchChatSessions();
            }
        } catch (error) {
            console.error('Error getting bot response:', error);

            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: error.response?.data?.error || 'Sorry, I encountered an error processing your request.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isError: true
            };

            setMessages(prev => [...prev, errorMessage]);
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

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
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
                            <div className="p-4 border-b border-dark-200 dark:border-dark-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-dark-900 dark:text-base-white">Messages</h2>
                                    <button 
                                        onClick={toggleSidebar}
                                        className="p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-400 hover:text-primary-500 transition-colors"
                                        title="Скрыть панель"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 
                                                 bg-base-white dark:bg-dark-800 text-dark-900 dark:text-base-white
                                                 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
                                </div>
                                
                                {/* New Chat Button */}
                                <button
                                    onClick={startNewChat}
                                    className="w-full mt-3 p-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>New Chat</span>
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
                                        {chatSessions
                                            .filter(chat => chat.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(chat => (
                                                <button
                                                    key={chat.id}
                                                    onClick={() => loadChatHistory(chat.id)}
                                                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all
                                                        ${selectedChat === chat.id
                                                            ? 'bg-primary-500 text-white shadow-md'
                                                            : 'hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-900 dark:text-base-white'}`}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                        <Bot className="text-primary-500" size={20} />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <h3 className="font-medium">{chat.title}</h3>
                                                        <p className="text-sm opacity-70">{new Date(chat.lastAccess).toLocaleString()}</p>
                                                    </div>
                                                </button>
                                            ))}
                                            
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
                        <div 
                            id="chat-messages" 
                            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
                        >
                            {isLoadingHistory ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="flex space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce"></div>
                                        <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.type === 'user' ? 'justify-end' : message.type === 'system' ? 'justify-center' : 'justify-start'}`}
                                    >
                                        {message.type === 'system' ? (
                                            // System message (error or notification)
                                            <div className={`px-4 py-2 rounded-xl ${message.isError ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'} max-w-[80%] text-sm`}>
                                                {message.content}
                                            </div>
                                        ) : message.type === 'user' ? (
                                            // User message
                                            <div className="max-w-[80%] sm:max-w-[70%]">
                                                <div className="bg-primary-500 text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-sm">
                                                    <p>{message.content}</p>
                                                </div>
                                                <div className="flex justify-end items-center gap-2 mt-1 text-xs text-dark-400">
                                                    <span>{message.timestamp}</span>
                                                    <Clock size={12} />
                                                </div>
                                            </div>
                                        ) : (
                                            // Bot message
                                            <div className="max-w-[80%] sm:max-w-[70%] flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex-shrink-0 flex items-center justify-center mt-1">
                                                    <Bot className="text-primary-500" size={16} />
                                                </div>
                                                <div>
                                                    <div className="bg-dark-100 dark:bg-dark-800 text-dark-900 dark:text-base-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                                                        <p>{message.content}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-dark-400">
                                                        <Clock size={12} />
                                                        <span>{message.timestamp}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            
                            {/* Loading indicator */}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="max-w-[80%] sm:max-w-[70%] flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex-shrink-0 flex items-center justify-center mt-1">
                                            <Bot className="text-primary-500" size={16} />
                                        </div>
                                        <div>
                                            <div className="bg-dark-100 dark:bg-dark-800 text-dark-900 dark:text-dark-400 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                                                <div className="flex space-x-2">
                                                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"></div>
                                                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat Input */}
                        <div className="px-4 py-3 border-t border-dark-200 dark:border-dark-800">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-3 bg-dark-100 dark:bg-dark-800 rounded-xl 
                                             text-dark-900 dark:text-base-white placeholder-dark-400
                                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    className={`p-3 rounded-xl transition-all duration-200 ${
                                        loading || !newMessage.trim() 
                                            ? 'bg-primary-400 cursor-not-allowed' 
                                            : 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700'
                                    } text-white`}
                                    disabled={loading || !newMessage.trim()}
                                >
                                    <Send size={20} />
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
