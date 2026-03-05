import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AnimatedBackground from "./components/AnimatedBackground";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import "./index.css";

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen overflow-hidden">
        {/* Background particles or gradient animation */}
        <AnimatedBackground />

        <div className="relative z-10">
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Page (Login/Signup toggle) */}
            <Route path="/auth" element={<AuthPage />} />

            <Route path="/dashboard" element={<Dashboard />} /> {/* ✅ */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}
