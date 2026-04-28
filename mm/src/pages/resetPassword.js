// mm/src/pages/resetPassword.js
import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || 'https://manuscriptmagic.fowkes.xyz/services';

// per note: endpoint is "resetpassword" (no .php)
const RESET_PASSWORD_ENDPOINT = `${API_BASE}/resetpassword`;

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function isValidEmail(email) {
  const v = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const query = useQuery();

  const emailFromUrl = query.get('email') || '';
  const tokenFromUrl = query.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const passwordsMatch = password.length > 0 && password === confirm;

  const canSubmit = useMemo(() => {
    return (
      isValidEmail(emailFromUrl) &&
      String(tokenFromUrl || '').trim().length > 0 &&
      password.length >= 8 &&
      passwordsMatch &&
      !submitting
    );
  }, [emailFromUrl, tokenFromUrl, password, passwordsMatch, submitting]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const email = String(emailFromUrl || '').trim();
    const token = String(tokenFromUrl || '').trim();

    if (!isValidEmail(email)) {
      setError('Reset link is missing a valid email.');
      return;
    }
    if (!token) {
      setError('Reset link is missing a token.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch(RESET_PASSWORD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // send email + token + new password
        body: JSON.stringify({
          email,
          token,
          newPassword: password,
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
          `Reset password failed (${resp.status}). Please try again.`;
        setError(msg);
        return;
      }

      const success = data?.success ?? true;
      if (!success) {
        setError(data?.message || data?.error || 'Reset password failed.');
        return;
      }

      setSuccessMsg(data?.message || 'Password reset successful.');
    } catch (err) {
      console.error(err);
      setError(
        'Network/CORS error. Your backend must allow requests from your app domain (Access-Control-Allow-Origin).'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen: show Sign In button back to login
  if (successMsg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Password updated</h1>
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

  // If link is missing required info, show a helpful message
  const linkLooksBad = !isValidEmail(emailFromUrl) || !tokenFromUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reset password</h1>
        <p className="mt-2 text-slate-500">
          Choose a new password for{' '}
          <span className="font-medium text-slate-700">{emailFromUrl || 'your account'}</span>.
        </p>

        {linkLooksBad ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            This reset link is missing required information (email and/or token).
            Please request a new reset link from{' '}
            <Link to="/forgot-password" className="text-blue-700 hover:underline">
              Forgot password
            </Link>
            .
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-2 w-full border border-slate-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter new password"
              className="mt-2 w-full border border-slate-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
              autoComplete="new-password"
            />
          </div>

          {password && confirm && password !== confirm ? (
            <div className="text-sm text-red-600">Passwords must match.</div>
          ) : null}

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              'w-full py-3 rounded-md text-white font-semibold',
              canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed',
            ].join(' ')}
          >
            {submitting ? 'Resetting…' : 'Reset password'}
          </button>

          <div className="text-sm text-slate-600 text-center">
            Back to{' '}
            <Link to="/login" className="text-blue-700 hover:underline">
              sign in
            </Link>
          </div>

          <div className="text-xs text-slate-500 text-center">
            Endpoint:{' '}
            <code className="px-1 py-0.5 bg-slate-100 rounded">{RESET_PASSWORD_ENDPOINT}</code>
          </div>
        </form>
      </div>
    </div>
  );
}
