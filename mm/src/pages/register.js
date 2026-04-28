// mm/src/pages/register.js
import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveAuth } from '../utils/auth';
import { getPendingCheckout } from '../utils/pendingCheckout';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || 'https://manuscriptmagic.fowkes.xyz/services';

function isValidEmail(email) {
  const v = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function RegisterPage() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverMessage, setServerMessage] = useState('');

  const canSubmit = useMemo(() => {
    const okEmail = isValidEmail(form.email);
    const okPw = String(form.password || '').length >= 8;
    const okNames =
      String(form.firstName || '').trim().length > 0 &&
      String(form.lastName || '').trim().length > 0;
    return okEmail && okPw && okNames && !loading;
  }, [form, loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setServerMessage('');

    const firstName = String(form.firstName || '').trim();
    const lastName = String(form.lastName || '').trim();
    const email = String(form.email || '').trim();
    const password = String(form.password || '');

    if (!firstName || !lastName) return setError('Please enter your first and last name.');
    if (!isValidEmail(email)) return setError('Please enter a valid email.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    setLoading(true);

    try {
      // 1) REGISTER
      const registerResp = await fetch(`${API_BASE}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      let registerData = null;
      try {
        registerData = await registerResp.json();
      } catch {
        registerData = null;
      }

      if (!registerResp.ok) {
        setError(registerData?.message || registerData?.error || `Registration failed (${registerResp.status}).`);
        return;
      }

      const registerSuccess = registerData?.success ?? true;
      if (!registerSuccess) {
        setError(registerData?.message || registerData?.error || 'Registration failed.');
        return;
      }

      setServerMessage(registerData?.message || 'Account created. Signing you in…');

      // 2) If backend returns tokens on register, support it
      const regUserId = registerData?.userId || registerData?.UserId || '';
      const regAccessToken = registerData?.accessToken || registerData?.AccessToken || '';
      const regRefreshToken = registerData?.refreshToken || registerData?.RenewalToken || '';

      if (regAccessToken && regRefreshToken) {
        saveAuth({ userId: regUserId, accessToken: regAccessToken, refreshToken: regRefreshToken, email });

        // if user came from checkout flow, go back to order to resume
        const pending = getPendingCheckout();
        if (pending) {
          nav('/workflow/order', { replace: true });
          return;
        }

        nav('/account', { replace: true });
        return;
      }

      // 3) AUTO LOGIN fallback
      const loginResp = await fetch(`${API_BASE}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let loginData = null;
      try {
        loginData = await loginResp.json();
      } catch {
        loginData = null;
      }

      if (!loginResp.ok) {
        setError(loginData?.message || loginData?.error || `Account created, but auto sign-in failed (${loginResp.status}). Please sign in.`);
        return;
      }

      const loginSuccess = loginData?.success ?? true;
      if (!loginSuccess) {
        setError(loginData?.message || loginData?.error || 'Account created, but auto sign-in failed.');
        return;
      }

      const userId = loginData?.userId || loginData?.UserId || '';
      const accessToken = loginData?.accessToken || loginData?.AccessToken || '';
      const refreshToken = loginData?.refreshToken || loginData?.RenewalToken || '';

      if (!accessToken || !refreshToken) {
        setError('Account created, but login response did not include tokens. Please sign in.');
        return;
      }

      saveAuth({ userId, accessToken, refreshToken, email });

      // resume checkout if pending
      const pending = getPendingCheckout();
      if (pending) {
        nav('/workflow/order', { replace: true });
        return;
      }

      nav('/account', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Network/CORS error. Your backend must allow requests from your app domain (Access-Control-Allow-Origin).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create your account</h1>
        <p className="mt-2 text-slate-500">Enter your details to register.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">First Name <span className="text-red-500">*</span></label>
              <input name="firstName" value={form.firstName} onChange={handleChange} className="mt-2 w-full border border-slate-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Last Name <span className="text-red-500">*</span></label>
              <input name="lastName" value={form.lastName} onChange={handleChange} className="mt-2 w-full border border-slate-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="mt-2 w-full border border-slate-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="mt-2 w-full border border-slate-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200" />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          {serverMessage ? <div className="text-sm text-emerald-700">{serverMessage}</div> : null}

          <button type="submit" disabled={!canSubmit} className={['w-full py-3 rounded-md text-white font-semibold', canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'].join(' ')}>
            {loading ? 'Creating account…' : 'Register'}
          </button>

          <div className="text-sm text-slate-600 text-center">
            Already have an account? <Link to="/login" className="text-blue-700 hover:underline">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
