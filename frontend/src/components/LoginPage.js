import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import TMA from "../assets/TMA.png"; // logo

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
      {/* Left Panel: Your SVG */}
      <div className="hidden md:flex md:w-1/2 bg-gray-50 items-center justify-center p-0 overflow-hidden">
        <img
          src="/assets/loginpage_right.svg"
          alt="Login Illustration"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Panel (Login Form) */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-50 p-8 relative overflow-hidden">
        {/* Soft floating gradient behind form */}
        <div className="absolute -inset-10 bg-gradient-to-tr from-blue-100 via-blue-50 to-white opacity-40 rounded-3xl blur-3xl pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-md bg-white shadow-xl rounded-lg border border-gray-200 p-8"
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
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none transition-all
                    ${email === ""
                      ? "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      : isEmailValid
                      ? "border-green-500 focus:ring-2 focus:ring-green-200"
                      : "border-red-500 focus:ring-2 focus:ring-red-200"
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
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none transition-all
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
