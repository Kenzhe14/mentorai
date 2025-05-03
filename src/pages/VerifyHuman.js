import React from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

const SITE_KEY = "6LdzWh0rAAAAAFfL0ghAr7ZJ8Bjqcw_hWi2B0Dnf";

export default function VerifyHuman() {
    // const [verified, setVerified] = useState(false); , { useState }
    const navigate = useNavigate();

    const handleVerification = (token) => {
        if (token) {
            const userData = localStorage.getItem("tempUser");
            if (userData) {
                localStorage.setItem("user", userData);
                const parsed = JSON.parse(userData);
                if (parsed.token) {
                    localStorage.setItem("token", parsed.token);
                }
                navigate("/home");
            }
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-black text-white px-4">
            <div className="bg-second-500 p-8 rounded-xl text-center">
                <h1 className="text-xl font-bold mb-6">Пожалуйста, подтвердите, что вы человек</h1>
                <ReCAPTCHA
                    sitekey={SITE_KEY}
                    onChange={handleVerification}
                />
            </div>
        </div>
    );
}
