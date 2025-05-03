import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "./languagecontext";

function Dropmenu() {
    const { selectedLanguage, setSelectedLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const languages = ["JavaScript", "Python", "Java", "Golang"];

    const handleSelect = (language) => {
        setSelectedLanguage(language);
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative text-left z-10" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center px-3 md:px-4 py-2 md:py-3 bg-wsecond-500 text-black font-bold rounded-lg shadow-md focus:outline-none hover:bg-wsecond-400 transition"
                aria-label="Select programming language"
            >
                <span className="hidden sm:inline">{selectedLanguage}</span>
                <span className="sm:hidden">Lang</span>
                <ChevronDown className="ml-1 md:ml-2 w-4 h-4" />
            </button>
            
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-auto min-w-[120px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                >
                    <ul className="py-1">
                        {languages.map((lang) => (
                            <li
                                key={lang}
                                className={`px-4 py-2 hover:bg-primary-400 cursor-pointer transition ${
                                    selectedLanguage === lang ? "bg-primary-400 bg-opacity-30" : ""
                                }`}
                                onClick={() => handleSelect(lang)}
                            >
                                {lang}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </div>
    );
}

export default Dropmenu;
