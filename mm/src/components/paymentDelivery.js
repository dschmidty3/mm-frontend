// mm/src/components/paymentDelivery.js
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSignedIn } from '../utils/auth';
import { setPendingCheckout } from '../utils/pendingCheckout';

function isValidEmail(email) {
  const v = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function PaymentDelivery({
  packageId,
  packagePrices,
  email,
  onEmailChange,
  checkoutPayload,
  onPay,
  disabled,
}) {
  const nav = useNavigate();
  const signedIn = isSignedIn();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const amount = useMemo(() => {
    const n = packagePrices?.[packageId];
    return Number.isFinite(n) ? n : 0;
  }, [packageId, packagePrices]);

  const canContinue = useMemo(() => {
    return isValidEmail(email) && amount > 0 && !busy && !disabled;
  }, [email, amount, busy, disabled]);

  const onClick = async () => {
    setError('');

    const cleanEmail = String(email || '').trim();
    if (!isValidEmail(cleanEmail)) return setError('Please enter a valid email address for delivery.');
    if (!packageId) return setError('Please select a package to continue.');
    if (!(amount > 0)) return setError('Invalid package amount. Please re-select your package.');

    const payload = typeof checkoutPayload === 'function' ? checkoutPayload() : {};

    // --- LOGGED OUT FLOW ---
    if (!signedIn) {
      setPendingCheckout({
        packageId,
        amount,
        deliveryEmail: cleanEmail,
        payload,
        createdAt: Date.now(),
      });

      nav(`/register?returnTo=${encodeURIComponent('/workflow/order')}`);
      return;
    }

    // --- LOGGED IN FLOW ---
    if (typeof onPay !== 'function') {
      setError('Payment handler is not configured. Please contact support.');
      return;
    }

    setBusy(true);
    try {
      await onPay({
        packageId,
        amount,
        deliveryEmail: cleanEmail,
        payload,
      });
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Payment failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border rounded-xl p-6 bg-white">
      <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
        <span className="text-slate-600">💳</span> Payment &amp; Delivery
      </h2>

      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700">
          Email Address for File Delivery <span className="text-red-500">*</span>
        </label>

        <input
          value={email}
          onChange={(e) => onEmailChange && onEmailChange(e.target.value)}
          placeholder="your.email@example.com"
          className="mt-2 w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
          type="email"
          autoComplete="email"
          disabled={busy || disabled}
        />

        <div className="mt-2 text-xs text-slate-500">Your formatted files will be delivered to this email address.</div>

        <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
          <span className="font-semibold">Secure Payment:</span> All transactions are processed securely through Stripe.
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

        <button
          type="button"
          onClick={onClick}
          disabled={!canContinue}
          className={[
            'mt-6 w-full py-3 rounded-md text-white font-semibold flex items-center justify-center gap-2',
            canContinue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed',
          ].join(' ')}
        >
          {busy ? 'Processing…' : signedIn ? `Pay $${amount}` : 'Create account to continue'}
        </button>

        <div className="mt-3 text-xs text-slate-400">
          {signedIn
            ? 'We’ll upload your documents, then redirect you to Stripe Checkout.'
            : 'You’ll create an account first, then we’ll resume checkout automatically.'}
        </div>
      </div>
    </div>
  );
}


