import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Settings,
  LogOut,
  BrainIcon,
  Menu,
  LayoutDashboard,
  X,
  Sun,
  Moon,
  MessagesSquare,
  Users,
  BookOpen,
  GraduationCap,
  CalendarDays,
  BookOpen as Course,
  BarChart4,
  FileText,
  Award,
  Clock,
  Globe,
  PanelLeft
} from "lucide-react";
import photo from "../static/media/profile2.jpg";
import { SiFrontendmentor } from "react-icons/si";
import "../index.css";
import SettingsPopup from "./SettingsPopup";
import { useTheme } from "./themeContext";
import { useAuth } from "./authContext";

const Sidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { currentUser, logout, API_URL } = useAuth();
  const isMentor = currentUser?.role === 'mentor' || currentUser?.isMentor;

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Student menu items
  const studentMenuItems = [
    { name: "Home", icon: <Home size={20} />, path: "/home" },
    { name: "Skills", icon: <BrainIcon size={20} />, path: "/skills" },
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Mentors", icon: <SiFrontendmentor size={20} />, path: "/mentors" },
    { name: "Chat", icon: <MessagesSquare size={20} />, path: "/chat" },
  ];

  // Mentor menu items
  const mentorMenuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/mentor-dashboard" },
    { name: "Students", icon: <Users size={20} />, path: "/mentor-students", 
      subItems: [
        { name: "Student List", icon: <Users size={16} />, path: "/mentor-students" },
        { name: "Performance", icon: <BarChart4 size={16} />, path: "/mentor-students/performance" },
      ]
    },
    { name: "Schedule", icon: <CalendarDays size={20} />, path: "/mentor-schedule" },
    { name: "Messages", icon: <MessagesSquare size={20} />, path: "/mentor-messages" },
    { name: "Content", icon: <BookOpen size={20} />, path: "/mentor-content", 
      subItems: [
        { name: "My Courses", icon: <Course size={16} />, path: "/mentor-content/courses" },
        { name: "Roadmaps", icon: <FileText size={16} />, path: "/mentor-content/roadmaps" },
        { name: "Resources", icon: <Globe size={16} />, path: "/mentor-content/resources" },
      ] 
    },
    { name: "Analytics", icon: <BarChart4 size={20} />, path: "/mentor-analytics" },
  ];

  // For mentors who want to switch to student view
  const switchViewButton = { name: "Student Portal", icon: <PanelLeft size={20} />, path: "/home" };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        navigate("/login");
      } else {
        console.error("Logout failed:", result.error);
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

  // Determine which menu items to show based on user role
  const displayMenuItems = isMentor ? mentorMenuItems : studentMenuItems;
  
  // State for expanded submenu items
  const [expandedItems, setExpandedItems] = useState({});
  
  // Toggle submenu expansion
  const toggleSubMenu = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  return (
    <div className={`flex min-h-screen ${isDark ? 'dark' : ''} bg-white dark:bg-dark-950`}>
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20" onClick={() => setIsOpen(false)}></div>
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-full md:h-screen ${isMentor ? 'bg-gradient-to-b from-primary-700 to-primary-900' : 'bg-gra'} dark:bg-dark-900 text-white flex flex-col justify-between p-3 transition-all duration-300 z-30
            ${isOpen ? "w-64" : "w-0 md:w-16"} 
            ${isMobile && !isOpen ? "-translate-x-full md:translate-x-0" : "translate-x-0"}`}
      >
        <div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-white rounded-md mb-4 flex justify-center"
            aria-label="Toggle menu"
          >
            <span className="flex-shrink-0">
              {isOpen && isMobile ? <X size={24} /> : <Menu size={24} />}
            </span>
          </button>

          {isOpen && currentUser && (
            <div className={`mb-6 flex items-center gap-2 p-3 rounded-lg ${isMentor ? 'bg-primary-800/50 ring-1 ring-white/10' : 'bg-primary-500'}`}>
              <img 
                src={
                  currentUser.avatarUrl 
                    ? currentUser.avatarUrl.startsWith('http')
                      ? currentUser.avatarUrl
                      : `${API_URL}${currentUser.avatarUrl}`
                    : photo
                } 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-500" 
                alt="profile" 
              />
              <div>
                <p className="text-sm font-semibold text-white">{currentUser.displayName || currentUser.username || "User"}</p>
                <p className="text-xs text-gray-300">{isMentor ? "Mentor" : "Student"}</p>
              </div>
            </div>
          )}
          
          {!isOpen && !isMobile && currentUser && (
            <div className="mb-6 flex justify-center">
              <img 
                src={
                  currentUser.avatarUrl 
                    ? currentUser.avatarUrl.startsWith('http')
                      ? currentUser.avatarUrl
                      : `${API_URL}${currentUser.avatarUrl}`
                    : photo
                } 
                className={`w-10 h-10 rounded-full object-cover ring-2 ${isMentor ? 'ring-white/30' : 'ring-primary-500'}`} 
                alt="profile" 
                title={currentUser.displayName || currentUser.username || "User"}
              />
            </div>
          )}
        </div>

        {!(isMobile && !isOpen) && (
          <nav className="space-y-2 flex-grow overflow-y-auto scrollbar-thin">
            {displayMenuItems.map((item) => (
              <div key={item.path}>
                {item.subItems ? (
                  <div className="mb-1">
                    <button
                      onClick={() => toggleSubMenu(item.name)}
                      className={`flex items-center justify-between gap-3 px-4 py-2.5 w-full rounded-lg text-left transition duration-200 font-medium
                      ${expandedItems[item.name] 
                        ? `${isMentor ? "bg-white/10 text-white" : "bg-primary-500 text-white"}`
                        : `text-white hover:${isMentor ? "bg-white/10" : "bg-primary-400"} hover:text-white`
                      }
                      ${!isOpen && !isMobile ? "justify-center" : ""}`}
                      title={item.name}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0">{item.icon}</span>
                        {(isOpen || !isMobile) && <span className="truncate">{item.name}</span>}
                      </div>
                      {(isOpen || !isMobile) && (
                        <span className={`transform transition-transform ${expandedItems[item.name] ? "rotate-180" : ""}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      )}
                    </button>
                    
                    {expandedItems[item.name] && isOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.subItems.map(subItem => (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-2 w-full rounded-lg text-left transition duration-200 font-medium text-sm
                              ${isActive
                                ? `${isMentor ? "bg-white/20 text-white" : "bg-primary-400 text-white"}`
                                : `text-white/80 hover:${isMentor ? "bg-white/10" : "bg-primary-300"} hover:text-white`
                              }`
                            }
                            onClick={() => isMobile && setIsOpen(false)}
                            title={subItem.name}
                          >
                            <span className="flex-shrink-0">{subItem.icon}</span>
                            <span className="truncate">{subItem.name}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-left transition duration-200 font-medium
                      ${isActive
                        ? `${isMentor ? "bg-white/20 text-white" : "bg-primary-500 text-white"}`
                        : `text-white hover:${isMentor ? "bg-white/10" : "bg-primary-400"} hover:text-white`
                      }
                      ${!isOpen && !isMobile ? "justify-center" : ""}`
                    }
                    onClick={() => isMobile && setIsOpen(false)}
                    title={item.name}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {(isOpen || !isMobile) && <span className="truncate">{item.name}</span>}
                  </NavLink>
                )}
              </div>
            ))}
            
            {/* Switch View Button for Mentors */}
            {isMentor && (
              <NavLink
                to={switchViewButton.path}
                className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-left transition duration-200 font-medium mt-4
                text-white/80 border border-white/20 hover:bg-white/10 hover:text-white
                ${!isOpen && !isMobile ? "justify-center" : ""}`}
                onClick={() => isMobile && setIsOpen(false)}
                title={switchViewButton.name}
              >
                <span className="flex-shrink-0">{switchViewButton.icon}</span>
                {(isOpen || !isMobile) && <span className="truncate">{switchViewButton.name}</span>}
              </NavLink>
            )}
          </nav>
        )}

        <div className="space-y-2 border-t border-gray-700 pt-4">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-left transition duration-200 text-white/80 hover:bg-white/10 hover:text-white
              ${!isOpen && !isMobile ? "justify-center" : ""}`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <span className="flex-shrink-0">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </span>
            {isOpen && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button
            onClick={() => !isMobile && setShowSettings(true)}
            className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-left transition duration-200 text-white/80 hover:bg-white/10 hover:text-white
              ${!isOpen && !isMobile ? "justify-center" : ""}`}
            title="Settings"
          >
            <span className="flex-shrink-0">
              <Settings size={20} />
            </span>
            {isOpen && <span>Settings</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-left transition duration-200 text-red-300 hover:bg-red-500/10 hover:text-red-200
              ${!isOpen && !isMobile ? "justify-center" : ""}`}
            title="Log out"
          >
            <span className="flex-shrink-0">
              <LogOut size={20} />
            </span>
            {isOpen && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {isMobile && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed top-4 left-4 z-20 p-2 ${isMentor ? 'bg-primary-700' : 'bg-black'} text-white rounded-lg shadow-lg hover:${isMentor ? 'bg-primary-800' : 'bg-gray-800'}`}
          aria-label="Open menu"
        >
          <span className="flex-shrink-0">
            <Menu size={24} />
          </span>
        </button>
      )}

      <main className={`flex-1 transition-all duration-300`}>
        {children}
      </main>

      {!isMobile && (
        <SettingsPopup isOpen={showSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default Sidebar;
