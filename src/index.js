import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route} from "react-router-dom";
import Skills from "./pages/skills";
import Dashboard from "./pages/dashboard";
import Mentors from "./pages/mentors";
import Chat from "./pages/chat";
import Home from "./pages/homepage";
import Onboarding from "./onboarding/Onboarding";
import Login from "./pages/login";
import MentorRegister from "./pages/MentorRegister";
import MentorDashboard from "./pages/MentorDashboard";
import MentorStudents from "./pages/MentorStudents";
import StudentRoadmaps from "./pages/StudentRoadmaps";
import NotFound from "./pages/NotFound";
import VerifyHuman from "./pages/VerifyHuman";
import LecturePage from "./pages/LecturePage";
import PracticePage from "./pages/PracticePage";
import { ThemeProvider } from "./components/themeContext";
import { AuthProvider } from "./components/authContext";
import PrivateRoute from "./components/PrivateRoute";
import MentorRoute from "./components/MentorRoute";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route index element={<Onboarding />} />
          <Route path="onboarding/steps" element={<Onboarding />} />
          <Route path="login" element={<Login />} />
          <Route path="mentor-register" element={<MentorRegister />} />
          <Route path="/verify-human" element={<VerifyHuman />} />

          {/* Protected routes */}
          <Route path="home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="skills" element={<PrivateRoute><Skills /></PrivateRoute>} />
          <Route path="skills/lecture/:topic" element={<PrivateRoute><LecturePage /></PrivateRoute>} />
          <Route path="skills/practice/:topic" element={<PrivateRoute><PracticePage /></PrivateRoute>} />
          <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="mentors" element={<PrivateRoute><Mentors /></PrivateRoute>} />
          <Route path="chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          
          {/* Mentor-specific routes */}
          <Route path="mentor-dashboard" element={<MentorRoute><MentorDashboard /></MentorRoute>} />
          <Route path="mentor-students" element={<MentorRoute><MentorStudents /></MentorRoute>} />
          <Route path="mentor-students/:studentId/roadmaps" element={<MentorRoute><StudentRoadmaps /></MentorRoute>} />
          <Route path="mentor-content" element={<MentorRoute><MentorDashboard /></MentorRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);
