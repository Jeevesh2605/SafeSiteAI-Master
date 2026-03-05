import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";
import api from "../api";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const toggleMode = () => setIsLogin(!isLogin);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (isLogin) {
        // 🟢 LOGIN
        const response = await api.post(
          "/auth/login",
          new URLSearchParams({
            username: formData.email,
            password: formData.password,
          }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        localStorage.setItem("token", response.data.access_token);
        setMessage("✅ Login successful!");

        setTimeout(() => {
          navigate("/dashboard");
        }, 100);
      } else {
        // 🟣 REGISTER
        await api.post("/auth/register", {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });

        setMessage("✅ Registration successful! Please login now.");
        setIsLogin(true);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ " + (error.response?.data?.detail || "Something went wrong."));
    }
  };

  return (
    <section className="relative flex items-center justify-center min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Animated glowing background (same as landing page) */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "700ms" }}
        ></div>
      </div>

      <AnimatedBackground />

      {/* Auth Card */}
      <div
        className={`relative z-10 w-96 p-8 rounded-3xl backdrop-blur-md border border-orange-500/20 shadow-[0_0_50px_rgba(255,122,0,0.25)] transition-all duration-700 ${
          isLogin ? "bg-gray-900/70" : "bg-gray-900/60"
        }`}
      >
        <h2 className="text-2xl font-extrabold text-center mb-6 leading-tight bg-linear-to-r from-orange-400 to-fuchsia-500 bg-clip-text text-transparent">
          {isLogin ? "Welcome Back 👋" : "Join SafeSite AI"}
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              name="username"
              placeholder="Full Name"
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-orange-500/20"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-orange-500/20"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-orange-500/20"
          />

          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-3 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-orange-500/20"
            />
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-linear-to-r from-orange-500 to-fuchsia-600 text-white font-semibold shadow-[0_0_25px_rgba(255,122,0,0.4)] hover:shadow-[0_0_40px_rgba(255,122,0,0.6)] hover:scale-105 transition-all duration-300"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        {message && (
          <p
            className={`text-center mt-4 text-sm ${
              message.startsWith("✅") ? "text-green-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-center text-gray-300 text-sm mt-4">
          {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
          <button
            onClick={toggleMode}
            className="text-orange-300 hover:text-fuchsia-400 hover:underline focus:outline-none transition-colors"
          >
            {isLogin ? "Sign up" : "Login"}
          </button>
        </p>
      </div>
    </section>
  );
};

export default AuthPage;
