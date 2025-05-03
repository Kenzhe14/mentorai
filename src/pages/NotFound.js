import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white text-center px-4">
            <div>
                <h1 className="text-6xl font-bold mb-4">404</h1>
                <p className="text-lg text-gray-400 mb-6">
                    Похоже, вы нашли портал в неизвестность! К сожалению, здесь только космическая пыль и 404 ошибки.
                </p>
                <Link to="/home" className="text-blue-400 underline">
                    Вернуться на главную
                </Link>
            </div>
        </div>
    );
}
