import React, { useState } from "react";
import Dropmenu from "./dropmenu";
import CodeEditor from "./codeeditor";

function CodeEditorSection({ task, runCode }) {
    const [output, setOutput] = useState("");

    const handleRun = async (code, language) => {
        try {
            const result = await runCode(code, language);
            setOutput(result);
        } catch (error) {
            setOutput("Ошибка выполнения кода");
        }
    };

    return React.createElement(
        "div",
        { className: "lg:col-span-3 order-2 lg:order-1" },
        React.createElement(
            "div",
            {
                className:
                    "flex flex-col md:flex-row md:items-center justify-between mb-3 md:mb-5 gap-3",
            },
            React.createElement("h1", { className: "font-semibold text-lg md:text-xl" }, task),
            React.createElement(Dropmenu, null)
        ),
        React.createElement(
            "div",
            {
                className:
                    "bg-white rounded-2xl py-3 md:py-5 mt-3 md:mt-5 shadow-md",
            },
            React.createElement(CodeEditor, { onRun: handleRun, task }),
            output &&
            React.createElement(
                "pre",
                {
                    className:
                        "mx-4 mt-4 p-3 bg-gray-100 rounded-lg overflow-x-auto",
                },
                output
            )
        )
    );
}

export default CodeEditorSection;
