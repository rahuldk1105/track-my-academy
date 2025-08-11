import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import AcademyDashboard from "./components/AcademyDashboard";
import SubscriptionPayment from "./components/SubscriptionPayment";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/academy" 
              element={
                <ProtectedRoute>
                  <AcademyDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/billing" 
              element={
                <ProtectedRoute>
                  <SubscriptionPayment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/billing/success" 
              element={
                <ProtectedRoute>
                  <SubscriptionPayment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/billing/cancel" 
              element={
                <ProtectedRoute>
                  <SubscriptionPayment />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;