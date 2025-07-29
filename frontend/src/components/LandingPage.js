import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Track My Academy</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGetStarted}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Manage Your</span>
                <span className="block text-primary-600">Sports Academy</span>
                <span className="block">Digitally</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                A comprehensive SaaS platform designed for sports academies to manage their entire training ecosystem. Connect academies, coaches, and students in one powerful platform.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <button
                  onClick={handleGetStarted}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </button>
                <p className="mt-3 text-sm text-gray-500">
                  Start managing your academy today. No credit card required.
                </p>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <img
                  className="w-full rounded-lg"
                  src="https://images.unsplash.com/photo-1664169507606-5e474cd27331?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBhY2FkZW15JTIwdHJhaW5pbmd8ZW58MHx8fHwxNzUzODA5NDMzfDA&ixlib=rb-4.1.0&q=85"
                  alt="Sports Academy Management"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage your academy
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              From student enrollment to performance tracking, our platform handles all aspects of academy management.
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 - Session Management */}
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Session Management</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Schedule and manage training sessions, assign coaches and students, track attendance with real-time analytics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2 - Analytics */}
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Performance Analytics</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Track student progress with detailed performance charts, attendance analytics, and trend analysis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3 - Role Management */}
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Multi-Role Access</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Separate dashboards for academy admins, coaches, and students with role-based permissions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 4 - Student Management */}
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Student Management</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Comprehensive student profiles, performance tracking, coach assignments, and parent communication tools.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 5 - Coach Tools */}
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Coach Tools</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Specialized tools for coaches to manage their assigned students, track progress, and plan training sessions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 6 - Attendance Tracking */}
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Attendance Tracking</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Easy attendance marking, automated tracking, and detailed attendance reports for better insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              What Academy Directors Say
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="bg-white rounded-lg shadow px-6 py-8">
                <div className="flex items-center mb-4">
                  <img 
                    className="h-12 w-12 rounded-full object-cover"
                    src="https://images.unsplash.com/photo-1709601414313-17217448a9fd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxhdGhsZXRpYyUyMGNvYWNoaW5nfGVufDB8fHx8MTc1MzgwOTQ0M3ww&ixlib=rb-4.1.0&q=85"
                    alt="Sarah Johnson"
                  />
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Sarah Johnson</h4>
                    <p className="text-gray-600">Director, Elite Basketball Academy</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "Track My Academy transformed how we manage our 200+ students. The analytics help us identify students who need extra attention, and coaches love the session management tools."
                </p>
              </div>

              <div className="bg-white rounded-lg shadow px-6 py-8">
                <div className="flex items-center mb-4">
                  <img 
                    className="h-12 w-12 rounded-full object-cover"
                    src="https://images.unsplash.com/photo-1689753859488-1146bfa927af?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwyfHxzcG9ydHMlMjBhY2FkZW15JTIwdHJhaW5pbmd8ZW58MHx8fHwxNzUzODA5NDMzfDA&ixlib=rb-4.1.0&q=85"
                    alt="Mike Rodriguez"
                  />
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Mike Rodriguez</h4>
                    <p className="text-gray-600">Head Coach, Premier Football Academy</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "The attendance tracking and performance analytics are game-changers. I can quickly see which students are struggling and provide targeted support."
                </p>
              </div>

              <div className="bg-white rounded-lg shadow px-6 py-8">
                <div className="flex items-center mb-4">
                  <img 
                    className="h-12 w-12 rounded-full object-cover"
                    src="https://images.unsplash.com/photo-1519432359516-73a2bb421826?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHw0fHxhdGhsZXRpYyUyMGNvYWNoaW5nfGVufDB8fHx8MTc1MzgwOTQ0M3ww&ixlib=rb-4.1.0&q=85"
                    alt="Jennifer Chen"
                  />
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Jennifer Chen</h4>
                    <p className="text-gray-600">Owner, Multi-Sport Academy</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "Easy to use, comprehensive features, and excellent support. Our admin tasks are now streamlined, and parents love the transparency."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to transform your academy?</span>
            <span className="block">Start your free trial today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-primary-100">
            Join hundreds of academies already using Track My Academy to streamline their operations and improve student outcomes.
          </p>
          <button
            onClick={handleGetStarted}
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 sm:w-auto"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <div className="mt-8 flex justify-center space-x-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-primary-600">Track My Academy</h3>
              <p className="mt-2 text-gray-500">Empowering sports academies with digital transformation</p>
            </div>
          </div>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; 2025 Track My Academy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;