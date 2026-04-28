// mm/src/pages/login.js
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { saveAuth } from '../utils/auth';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || 'https://manuscriptmagic.fowkes.xyz/services';

function isValidEmail(email) {
  const v = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function LoginPage() {
  const nav = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverMessage, setServerMessage] = useState('');

  const canSubmit = useMemo(() => {
    return isValidEmail(form.email) && String(form.password || '').length > 0 && !loading;
  }, [form, loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setServerMessage('');

    const email = String(form.email || '').trim();
    const password = String(form.password || '');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data = null;
      try {
        data = await resp.json();
      } catch {
        data = null;
      }

      if (!resp.ok) {
        const msg = data?.message || data?.error || `Login failed (${resp.status}). Please try again.`;
        setError(msg);
        return;
      }

      const success = data?.success ?? true;
      if (!success) {
        setError(data?.message || data?.error || 'Login failed.');
        return;
      }

      const userId = data?.userId || data?.UserId || '';
      const accessToken = data?.accessToken || data?.AccessToken || '';
      const refreshToken = data?.refreshToken || data?.RenewalToken || '';

      if (!accessToken || !refreshToken) {
        setError('Login response did not include tokens.');
        return;
      }

      // Save auth for the rest of the app
      saveAuth({ userId, accessToken, refreshToken, email });

      setServerMessage(data?.message || 'Login successful.');
      nav('/documents');
    } catch (err) {
      console.error(err);
      setError(
        'Network/CORS error. Your backend must allow requests from http://localhost:3000 (Access-Control-Allow-Origin).'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sign in</h1>
        <p className="mt-2 text-slate-500">Use your email and password to access your account.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@email.com"
              className="mt-2 w-full border border-slate-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>

              {/* Forgot password link */}
              <Link to="/forgot-password" className="text-sm text-blue-700 hover:underline">
                Forgot password?
              </Link>
            </div>

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              className="mt-2 w-full border border-slate-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
              autoComplete="current-password"
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          {serverMessage ? <div className="text-sm text-emerald-700">{serverMessage}</div> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              'w-full py-3 rounded-md text-white font-semibold',
              canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed',
            ].join(' ')}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="text-sm text-slate-600 text-center">
            Don’t have an account?{' '}
            <Link to="/register" className="text-blue-700 hover:underline">
              Create one
            </Link>
          </div>

          <div className="text-xs text-slate-500 text-center">
            API base: <code className="px-1 py-0.5 bg-slate-100 rounded">{API_BASE}</code>
          </div>
        </form>
      </div>
    </div>
  );
}
