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
  CalendarDays,
  BookOpen as Course,
  BarChart4,
  FileText,
  Globe,
  PanelLeft
} from "lucide-react";
import photo from "../static/media/profile2.jpg";
import "../index.css";
import SettingsPopup from "./SettingsPopup";
import { useTheme } from "./themeContext";
import { useAuth } from "./authContext";

/**
 * Компонент боковой панели навигации
 * @param {React.ReactNode} children - Дочерние компоненты для отображения в основной области
 */
const Sidebar = ({ children }) => {
  // Состояния компонента
  const [isOpen, setIsOpen] = useState(true);        // Открыта ли боковая панель
  const [isMobile, setIsMobile] = useState(false);   // Мобильное ли устройство
  const [showSettings, setShowSettings] = useState(false); // Показывать ли настройки
  const [expandedItems, setExpandedItems] = useState({}); // Развернутые подменю
  
  // Хуки
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { currentUser, logout, API_URL } = useAuth();
  
  // Определение роли пользователя
  const isMentor = currentUser?.role === 'mentor' || currentUser?.isMentor;

  // Проверка размера экрана для адаптивности
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };

    // Инициализация и подписка на изменение размера окна
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    // Очистка подписки при размонтировании
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  /**
   * Элементы меню для студентов
   */
  const studentMenuItems = [
    { name: "Home", icon: <Home size={20} />, path: "/home" },
    { name: "Skills", icon: <BrainIcon size={20} />, path: "/skills" },
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Chat", icon: <MessagesSquare size={20} />, path: "/chat" },
  ];

  /**
   * Элементы меню для менторов
   */
  const mentorMenuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/mentor-dashboard" },
    { 
      name: "Students", 
      icon: <Users size={20} />, 
      path: "/mentor-students", 
      subItems: [
        { name: "Student List", icon: <Users size={16} />, path: "/mentor-students" },
        { name: "Performance", icon: <BarChart4 size={16} />, path: "/mentor-students/performance" },
      ]
    },
    { name: "Schedule", icon: <CalendarDays size={20} />, path: "/mentor-schedule" },
    { name: "Messages", icon: <MessagesSquare size={20} />, path: "/mentor-messages" },
    { 
      name: "Content", 
      icon: <BookOpen size={20} />, 
      path: "/mentor-content", 
      subItems: [
        { name: "My Courses", icon: <Course size={16} />, path: "/mentor-content/courses" },
        { name: "Roadmaps", icon: <FileText size={16} />, path: "/mentor-content/roadmaps" },
        { name: "Resources", icon: <Globe size={16} />, path: "/mentor-content/resources" },
      ] 
    },
    { name: "Analytics", icon: <BarChart4 size={20} />, path: "/mentor-analytics" },
  ];

  // Кнопка переключения на портал студента для менторов
  const switchViewButton = { 
    name: "Student Portal", 
    icon: <PanelLeft size={20} />, 
    path: "/home" 
  };

  /**
   * Обработчик выхода из аккаунта
   */
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

  // Выбор набора пунктов меню в зависимости от роли пользователя
  const displayMenuItems = isMentor ? mentorMenuItems : studentMenuItems;
  
  /**
   * Переключение состояния подменю (свернуто/развернуто)
   * @param {string} itemName - Имя пункта меню
   */
  const toggleSubMenu = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Рендеринг профиля пользователя для открытой боковой панели
  const renderUserProfile = () => {
    if (!currentUser) return null;
    
    const userAvatar = currentUser.avatarUrl 
      ? (currentUser.avatarUrl.startsWith('http')
          ? currentUser.avatarUrl
          : `${API_URL}${currentUser.avatarUrl}`)
      : photo;
    
    const userName = currentUser.displayName || currentUser.username || "User";
    const userRole = isMentor ? "Mentor" : "Student";
    
    return (
      <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-primary-500">
        <img 
          src={userAvatar} 
          className="w-10 h-10 rounded-full object-cover ring-2" 
          alt="profile" 
        />
        <div>
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-50'}`}>
            {userName}
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-300'}`}>
            {userRole}
          </p>
        </div>
      </div>
    );
  };

  // Рендеринг мини-профиля для свернутой боковой панели
  const renderMiniProfile = () => {
    if (!currentUser || isMobile) return null;
    
    const userAvatar = currentUser.avatarUrl 
      ? (currentUser.avatarUrl.startsWith('http')
          ? currentUser.avatarUrl
          : `${API_URL}${currentUser.avatarUrl}`)
      : photo;
    
    const userName = currentUser.displayName || currentUser.username || "User";
    
    return (
      <div className="mb-6 flex justify-center">
        <img 
          src={userAvatar} 
          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-400" 
          alt="profile" 
          title={userName}
        />
      </div>
    );
  };

  // Рендеринг отдельного пункта меню с подменю
  const renderMenuItemWithSubmenu = (item) => {
    return (
      <div className="mb-1" key={item.path}>
        <button
          onClick={() => toggleSubMenu(item.name)}
          className={`flex items-center justify-between gap-3 px-4 py-2.5 w-full rounded-lg text-left transition duration-200 font-medium
          ${expandedItems[item.name] 
            ? `bg-primary-400 ${isDark ? 'text-white' : 'text-white'}`
            : `${isDark ? 'text-white' : 'text-black'} hover:bg-primary-400 hover:text-current`
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
        
        {/* Подменю */}
        {expandedItems[item.name] && isOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {item.subItems.map(subItem => (
              <NavLink
                key={subItem.path}
                to={subItem.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 w-full rounded-lg text-left transition duration-200 font-medium text-sm
                  ${isActive
                    ? `bg-primary-400 ${isDark ? 'text-white' : 'text-white'}`
                    : `${isDark ? 'text-white/80' : 'text-black/80'} hover:bg-primary-400 hover:text-white`
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
    );
  };

  // Рендеринг обычного пункта меню
  const renderMenuItem = (item) => {
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-left transition duration-200 font-medium
          ${isActive
            ? `bg-primary-400 ${isDark ? 'text-white' : 'text-white'}`
            : `${isDark ? 'text-white' : 'text-black'} hover:bg-primary-400 hover:text-white`
          }
          ${!isOpen && !isMobile ? "justify-center" : ""}`
        }
        onClick={() => isMobile && setIsOpen(false)}
        title={item.name}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {(isOpen || !isMobile) && <span className="truncate">{item.name}</span>}
      </NavLink>
    );
  };

  return (
    <div className={`flex min-h-screen ${isDark ? 'dark' : ''} bg-gray-100 dark:bg-dark-950`}>
      {/* Затемнение фона на мобильных устройствах при открытом меню */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-gray-50 backdrop-blur-sm z-20" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Боковая панель */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-full md:h-screen bg-gray-100 dark:bg-dark-900 
                   ${isDark ? 'text-white' : 'text-black'} 
                   flex flex-col justify-between p-3 transition-all duration-300 z-30
                   ${isOpen ? "w-64" : "w-0 md:w-16"} 
                   ${isMobile && !isOpen ? "-translate-x-full md:translate-x-0" : "translate-x-0"}`}
      >
        {/* Верхняя часть панели */}
        <div>
          {/* Кнопка переключения состояния панели */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-black rounded-md mb-4 flex justify-center dark:text-white"
            aria-label="Toggle menu"
          >
            <span className="flex-shrink-0">
              {isOpen && isMobile ? <X size={24} /> : <Menu size={24} />}
            </span>
          </button>

          {/* Информация о пользователе */}
          {isOpen ? renderUserProfile() : renderMiniProfile()}
        </div>

        {/* Навигационное меню */}
        {!(isMobile && !isOpen) && (
          <nav className="space-y-2 flex-grow overflow-y-auto scrollbar-thin">
            {/* Отрисовка пунктов меню */}
            {displayMenuItems.map((item) => (
              <div key={item.path}>
                {item.subItems 
                  ? renderMenuItemWithSubmenu(item) 
                  : renderMenuItem(item)
                }
              </div>
            ))}
            
            {/* Кнопка переключения на портал студента (для менторов) */}
            {isMentor && (
              <NavLink
                to={switchViewButton.path}
                className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-left transition duration-200 font-medium mt-4
                ${isDark ? 'text-white/80' : 'text-black/80'} border ${isDark ? 'border-white/20' : 'border-black/20'} 
                hover:bg-primary-400/20 hover:text-current
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

        {/* Нижняя часть панели с настройками и выходом */}
        {!(isMobile && !isOpen) && (
          <div className={`space-y-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'} pt-4`}>
            {/* Переключение темы */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-left transition duration-200 
                        ${isDark ? 'text-white/80' : 'text-black/80'} hover:bg-black/20
                        hover:text-current
                        ${!isOpen && !isMobile ? "justify-center" : ""}`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <span className="flex-shrink-0">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </span>
              {isOpen && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
            </button>
            
            {/* Кнопка настроек */}
            <button
              onClick={() => !isMobile && setShowSettings(true)}
              className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-left transition duration-200 
                        ${isDark ? 'text-white/80' : 'text-black/80'} hover:bg-blue-400/20
                        hover:text-current
                        ${!isOpen && !isMobile ? "justify-center" : ""}`}
              title="Settings"
            >
              <span className="flex-shrink-0">
                <Settings size={20} />
              </span>
              {isOpen && <span>Settings</span>}
            </button>
            
            {/* Кнопка выхода */}
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-left transition duration-200 
                        ${isDark ? 'text-red-300' : 'text-red-600'} hover:bg-red-400/10 
                        hover:${isDark ? 'text-red-200' : 'text-red-700'}
                        ${!isOpen && !isMobile ? "justify-center" : ""}`}
              title="Log out"
            >
              <span className="flex-shrink-0">
                <LogOut size={20} />
              </span>
              {isOpen && <span>Log out</span>}
            </button>
          </div>
        )}
      </aside>

      {/* Кнопка открытия меню на мобильных устройствах */}
      {isMobile && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-20 p-2 bg-primary-600 text-white rounded-lg shadow-lg hover:bg-primary-700"
          aria-label="Open menu"
        >
          <span className="flex-shrink-0">
            <Menu size={24} />
          </span>
        </button>
      )}

      {/* Основное содержимое */}
      <main className="flex-1 transition-all duration-300">
        {children}
      </main>

      {/* Всплывающее окно настроек */}
      {!isMobile && (
        <SettingsPopup isOpen={showSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default Sidebar;
