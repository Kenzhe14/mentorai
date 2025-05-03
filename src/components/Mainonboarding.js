import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import photo2 from "../image/2.jpg";
import { motion } from "framer-motion";
import React from "react";

const Main = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl flex flex-col md:flex-row items-center mt-12 gap-8"
    >
      {/* Text content */}
      <div className="text-center md:text-left md:w-1/2 order-2 md:order-1">
        <h2 className="text-4xl font-bold mb-6 text-neon-blue leading-tight drop-shadow-lg text-white select-none">
          Learn, Teach, and Grow with <br /> Mentoring Skills
        </h2>
        <p className="text-gray-300 mb-6 text-lg select-none">
          Join a high-tech community of mentors and learners. Develop
          cutting-edge skills, share knowledge, and evolve together.
        </p>
        <Link
          to="/onboarding/steps"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-700 text-white text-lg font-semibold rounded-full shadow-lg hover:scale-105 transition-transform border-2 border-cyan-400"
        >
          Get Started <ArrowRight size={24} />
        </Link>
      </div>

      {/* Image */}
      <div className="md:w-1/2 flex justify-center order-1 md:order-2">
        <img
          src={photo2}
          alt="Mentoring"
          className="w-72 sm:w-80 md:w-96 rounded-2xl shadow-lg border-4 border-primary-500"
        />
      </div>
    </motion.div>
  );
};

export default Main;
