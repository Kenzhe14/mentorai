import React, { createContext, useContext, useState } from "react";

// Создаём контекст
const LanguageContext = createContext();

// Провайдер состояния
export const LanguageProvider = ({ children }) => {
    const [selectedLanguage, setSelectedLanguage] = useState("Python");

    return (
        <LanguageContext.Provider value={{ selectedLanguage, setSelectedLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

// Хук для удобного использования в компонентах
export const useLanguage = () => useContext(LanguageContext);
