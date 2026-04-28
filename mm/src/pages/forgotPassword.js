// mm/src/pages/forgotPassword.js
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || 'https://manuscriptmagic.fowkes.xyz/services';

// per your note: endpoint is "forgotpassword" (no .php)
const FORGOT_PASSWORD_ENDPOINT = `${API_BASE}/forgotpassword`;

function isValidEmail(email) {
  const v = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function getOriginSafe() {
  if (typeof window === 'undefined') return '';
  return window.location.origin || '';
}

export default function ForgotPasswordPage() {
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && !submitting;
  }, [email, submitting]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = String(email || '').trim();
    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email.');
      return;
    }

    const origin = getOriginSafe();
    if (!origin) {
      setError('Unable to determine site origin. Please refresh and try again.');
      return;
    }

    // This is the link your backend should email the user
    // It should include token + email in query params when generated server-side
    const resetUrlBase = `${origin}/reset-password`;

    setSubmitting(true);
    try {
      const resp = await fetch(FORGOT_PASSWORD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // send email + where the backend should link back to
        body: JSON.stringify({
          email: cleanEmail,
          resetUrl: resetUrlBase,
        }),
      });

      let data = null;
      try {
        data = await resp.json();
      } catch {
        data = null;
      }

      if (!resp.ok) {
        const msg =
          data?.message ||
          data?.error ||
          `Forgot password failed (${resp.status}). Please try again.`;
        setError(msg);
        return;
      }

      const success = data?.success ?? true;
      if (!success) {
        setError(data?.message || data?.error || 'Forgot password request failed.');
        return;
      }

      setSuccessMsg(data?.message || 'Forgot password request has been sent.');
    } catch (err) {
      console.error(err);
      setError(
        'Network/CORS error. Your backend must allow requests from http://localhost:3000 (Access-Control-Allow-Origin).'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (successMsg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Request sent</h1>
          <p className="mt-3 text-slate-600">{successMsg}</p>

          <button
            type="button"
            onClick={() => nav('/login')}
            className="mt-8 w-full py-3 rounded-md text-white font-semibold bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </button>

          <div className="mt-4 text-xs text-slate-500">
            Or go back to{' '}
            <Link to="/login" className="text-blue-700 hover:underline">
              sign in
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Forgot password</h1>
        <p className="mt-2 text-slate-500">Enter your email and we’ll send a reset link.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="mt-2 w-full border border-slate-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
              autoComplete="email"
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              'w-full py-3 rounded-md text-white font-semibold',
              canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed',
            ].join(' ')}
          >
            {submitting ? 'Sending…' : 'Forgot password'}
          </button>

          <div className="text-sm text-slate-600 text-center">
            Remembered it?{' '}
            <Link to="/login" className="text-blue-700 hover:underline">
              Sign in
            </Link>
          </div>

          <div className="text-xs text-slate-500 text-center">
            Endpoint:{' '}
            <code className="px-1 py-0.5 bg-slate-100 rounded">{FORGOT_PASSWORD_ENDPOINT}</code>
          </div>
        </form>
      </div>
    </div>
  );
}

