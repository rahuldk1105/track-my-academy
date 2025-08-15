import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import TMA from "../assets/TMA.png"; // Adjust path if needed

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setIsEmailValid(value === "" ? true : validateEmail(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Logging in:", { email, password });
    // TODO: Hook this to backend API
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel (CSS-only animated shapes) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-50 via-blue-100 to-gray-50 relative items-center justify-center p-10 overflow-hidden">
        {/* Floating circles */}
        <div className="absolute w-72 h-72 bg-blue-200 opacity-30 rounded-full top-10 left-10 animate-bounce-slow"></div>
        <div className="absolute w-48 h-48 bg-blue-300 opacity-20 rounded-full bottom-20 right-20 animate-bounce-slower"></div>
        <div className="absolute w-32 h-32 bg-blue-100 opacity-25 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce-slowest"></div>

        {/* Branding & Illustration placeholder */}
        <div className="relative z-10 text-center">
          <img src={TMA} alt="TMA Logo" className="mx-auto h-24 mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Track My Academy</h1>
          <p className="text-gray-600">Manage your sports events and academy seamlessly.</p>

          <div className="mt-6 w-72 h-72 bg-blue-200 rounded-lg shadow-lg mx-auto flex items-center justify-center text-gray-500">
            Illustration
          </div>
        </div>
      </div>

      {/* Right Panel (Login Form) */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-50 p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-white shadow-xl rounded-lg border border-gray-200 p-8"
        >
          {/* Header */}
          <motion.div
            className="flex flex-col items-center mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <img src={TMA} alt="TMA Logo" className="h-12 mb-2" />
            <h2 className="text-xl font-semibold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none transition-all ${
                    email === ""
                      ? "border-gray-300 focus:border-blue-500"
                      : isEmailValid
                      ? "border-green-500"
                      : "border-red-500"
                  }`}
                  placeholder="you@example.com"
                />
                <Mail className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              </div>
              {!isEmailValid && (
                <p className="text-red-500 text-xs mt-1">Enter a valid email address</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-gray-600">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>Remember me</span>
              </label>
              <a href="/forgot-password" className="text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg flex items-center justify-center space-x-2 shadow-md hover:bg-blue-700 transition-colors"
            >
              <span>Sign In</span>
              <ShieldCheck className="w-5 h-5" />
            </motion.button>
          </form>

          {/* Back link */}
          <div className="text-center mt-4">
            <a href="/" className="text-sm text-gray-500 hover:underline">
              ← Back to Home
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
