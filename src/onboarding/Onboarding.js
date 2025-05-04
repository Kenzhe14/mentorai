import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, ArrowUp } from "lucide-react";
import { useLocation,Link } from "react-router-dom";
import FAQ from "../components/FAQ";
import Main from "../components/Mainonboarding";
import OnboardingSteps from "./OnboardingSteps";

const Onboarding = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const location = useLocation();
  const isOnboardingSteps = location.pathname === "/onboarding/steps";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // If we're on the onboarding steps page, show only the steps component
  if (isOnboardingSteps) {
    return <OnboardingSteps />;
  }

  // Otherwise show the landing page
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-black via-gray-900 to-black p-6 sm:p-10 md:p-16 text-center text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="w-full max-w-6xl flex justify-between items-center p-4 relative z-20">
        <h1 className="relative text-3xl font-extrabold text-transparent bg-gradient-to-r from-primary-500 via-white to-orange-500 bg-clip-text drop-shadow-lg select-none">
          Mentor&AI
        </h1>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Desktop navigation */}
        <div className="space-x-6 hidden md:flex text-neon-blue">
          <a href="#features" className="hover:text-cyan-400 transition">
            Features
          </a>
          <a href="#about" className="hover:text-cyan-400 transition">
            About Us
          </a>
          <a href="#faq" className="hover:text-cyan-400 transition">
            FAQ
          </a>
          <a href="/login" className="hover:text-cyan-400 transition">
            Log In
          </a>
          {/* <Link
            to="/mentor-register"
            className="hover:text-cyan-400 transition"
          >
            For Mentors
          </Link> */}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full bg-gray-800 bg-opacity-90 backdrop-blur-lg rounded-lg p-4 mb-6 md:hidden"
        >
          <div className="flex flex-col space-y-4">
            <a
              href="#features"
              className="text-neon-blue hover:text-cyan-400 transition py-2"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-neon-blue hover:text-cyan-400 transition py-2"
            >
              About Us
            </a>
            <a
              href="#faq"
              className="text-neon-blue hover:text-cyan-400 transition py-2"
            >
              FAQ
            </a>
            <a
              href="/login"
              className="text-neon-blue hover:text-cyan-400 transition py-2"
            >
              Log In
            </a>
            <Link
              to="/mentor-register"
              className="text-neon-blue hover:text-cyan-400 transition py-2"
            >
              For Mentors
            </Link>
          </div>
        </motion.div>
      )}

      <Main />

      {/* Features Section */}
      <section id="features" className="w-full max-w-5xl mt-20 text-center">
        <h2 className="text-3xl font-bold text-neon-blue mb-6 drop-shadow-lg">
          Key Features
        </h2>
        <p className="text-gray-300 mb-10 text-lg">
          Explore the futuristic features that make learning engaging and
          effective.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-gray-800 rounded-lg shadow-lg border border-cyan-500">
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">
              AI-Powered Mentoring
            </h3>
            <p className="text-gray-400">
              Get guidance from AI mentors that adapt to your learning style.
            </p>
          </div>
          <div className="p-6 bg-gray-800 rounded-lg shadow-lg border border-cyan-500">
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">
              Live Sessions
            </h3>
            <p className="text-gray-400">
              Engage in real-time mentor-mentee interactions with immersive
              tools.
            </p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section
        id="about"
        className="w-full max-w-5xl mt-20 text-center py-12 rounded-lg px-6 sm:px-10"
      >
        <h2 className="text-4xl font-bold text-neon-blue mb-6 drop-shadow-lg">
          About Us
        </h2>
        <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-6">
          We are a cutting-edge platform blending human expertise with AI-driven
          mentoring. Our mission is to make high-quality learning accessible,
          engaging, and futuristic. Join us and be a part of the revolution in
          education.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <div className="p-6 bg-gray-800 rounded-lg shadow-lg border border-cyan-500">
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">
              Innovative Learning
            </h3>
            <p className="text-gray-400">
              We leverage AI to enhance mentoring experiences for learners
              worldwide.
            </p>
          </div>
          <div className="p-6 bg-gray-800 rounded-lg shadow-lg border border-cyan-500">
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">
              Global Community
            </h3>
            <p className="text-gray-400">
              Connect with mentors and learners from different parts of the
              world.
            </p>
          </div>
        </div>
      </section>
      <FAQ id="faq" />
      {/* Scroll to Top Button */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 bg-cyan-600 text-second-500 p-3 rounded-full shadow-lg hover:bg-cyan-800 transition relative z-20"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

export default Onboarding;
