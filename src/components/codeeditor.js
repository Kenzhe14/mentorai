import React, { useState, useEffect, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import axios from "axios";
import { useLanguage } from "./languagecontext";

const CodeEditor = ({ onRun, task }) => {
    const { selectedLanguage } = useLanguage();
    const [code, setCode] = useState(localStorage.getItem("savedCode"));
    const [analysis, setAnalysis] = useState("");
    const [isValid, setIsValid] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analyzeLoading, setAnalyzeLoading] = useState(false);

    // Load code from localStorage on mount
    useEffect(() => {
        const savedCode = localStorage.getItem("savedCode");
        if (savedCode) {
            setCode(savedCode);
        }
    }, []);

    // Save code to localStorage when it changes
    useEffect(() => {
        localStorage.setItem("savedCode", code);
    }, [code]);

    // Handle running code
    const handleRunCode = () => {
        setLoading(true);
        onRun(code, selectedLanguage)
            .finally(() => setLoading(false));
    };

    // Handle analyzing code
    const analyzeCode = useCallback(async () => {
        setAnalyzeLoading(true);
        try {
            const response = await axios.post(`http://localhost:5000/analyze`, {
                code,
                language: selectedLanguage,
                task,
            });
            setAnalysis(response.data.feedback || "");
            setIsValid(response.data.isValid);
        } catch (error) {
            console.error(`Error analyzing code:`, error);
            setAnalysis(`Error analyzing code. Please check if the server is running.`);
            setIsValid(false);
        } finally {
            setAnalyzeLoading(false);
        }
    }, [code, selectedLanguage, task]);

    return (
        <div className="p-2 md:p-4 rounded-xl">
            <CodeMirror
                value={String(code)}
                width="100%"
                placeholder="// Code here"
                height="300px"
                onChange={setCode}
                className="border border-gray-300 rounded-lg overflow-hidden"
            />
            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    className="p-2 bg-green-500 text-white rounded-md font-semibold hover:bg-green-600 transition flex items-center gap-1"
                    onClick={handleRunCode}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Running...
                        </>
                    ) : (
                        "Run Code"
                    )}
                </button>
                <button
                    className="p-2 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 transition flex items-center gap-1"
                    onClick={analyzeCode}
                    disabled={analyzeLoading}
                >
                    {analyzeLoading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Analyzing...
                        </>
                    ) : (
                        "Analyze Code"
                    )}
                </button>
            </div>

            {analysis && !isValid && (
                <div className={`mt-4 p-3 border rounded-lg ${isValid ? "bg-green-100 border-green-300" : "bg-yellow-100 border-yellow-300"}`}>
                    <strong>Code Analysis:</strong>
                    <p className="mt-1">{analysis}</p>
                </div>
            )}

            {isValid !== null && (
                <div className={`mt-4 p-3 border rounded-lg ${isValid ? "bg-green-500" : "bg-red-500"} text-white`}>
                    <span className="font-medium">
                        {isValid ? "✅ Good job, you young Elon Musk!" : "❌ Try again"}
                    </span>
                </div>
            )}
        </div>
    );
};

export default CodeEditor;
