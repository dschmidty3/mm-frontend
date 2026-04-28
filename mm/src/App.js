// mm/src/App.js
import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom';

import Home from './pages/home';
import WorkflowPage from './pages/workflowPage';
import { WorkflowProvider } from './store/workflowContext';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import AccountPage from './pages/account';
import { clearAuth, isSignedIn } from './utils/auth';
import DocumentsDashboard from './pages/documentsDashboard';
import ForgotPasswordPage from './pages/forgotPassword';
import ResetPasswordPage from './pages/resetPassword';


function AppShell() {
  const nav = useNavigate();
  const [signedIn, setSignedIn] = useState(isSignedIn());

  useEffect(() => {
    const sync = () => setSignedIn(isSignedIn());
    window.addEventListener('storage', sync);
    window.addEventListener('mm_auth_changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('mm_auth_changed', sync);
    };
  }, []);

  const onLogout = () => {
    clearAuth();
    setSignedIn(false);
    nav('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top Nav */}
      <header className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-slate-900"></div>
            <span className="font-bold tracking-tight">
              ManuscriptMagic<span className="text-blue-600">.ai</span>
            </span>
          </Link>

          {/* Primary nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#how" className="hover:text-slate-900">How It Works</a>
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#support" className="hover:text-slate-900">Support</a>
          </nav>

          {/* Auth / CTA */}
          <div className="flex items-center gap-3">
            {!signedIn ? (
              <>
                <NavLink to="/login" className="text-sm text-slate-600 hover:text-slate-900">
                  Sign In
                </NavLink>
                <NavLink
                  to="/register"
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Register
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/account" className="text-sm text-slate-600 hover:text-slate-900">
                  Account
                </NavLink>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Logout
                </button>
              </>
            )}

            <Link
              to="/workflow/start"
              className="text-sm rounded-md px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Routed pages */}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workflow/*" element={<WorkflowPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/documents" element={<DocumentsDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <WorkflowProvider>
      <AppShell />
    </WorkflowProvider>
  );
}

export default App;
