// mm/src/steps/paymentSuccessStep.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useWorkflow } from '../store/workflowContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

export default function PaymentSuccessStep() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { order, setOrder } = useWorkflow();

  const [status, setStatus] = useState('verifying'); // verifying | verified | failed
  const [message, setMessage] = useState('Verifying payment with the server…');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const sessionId =
          params.get('session_id') ||
          params.get('sessionId') ||
          params.get('checkout_session_id') ||
          params.get('cs') ||
          '';

        // Save session id if present
        if (sessionId) {
          setOrder((prev) => ({ ...prev, lastCheckoutSessionId: sessionId }));
        }

        // DEV MOCK (no backend configured)
        if (!API_BASE) {
          if (cancelled) return;
          setOrder((prev) => ({ ...prev, paymentStatus: 'paid' }));
          setStatus('verified');
          setMessage('Payment verified (mock). Redirecting to downloads…');
          setTimeout(() => {
            if (!cancelled) nav('/workflow/download', { replace: true });
          }, 600);
          return;
        }

        // REAL VERIFY (recommended)
        // backend should verify against Stripe (or DB) and return:
        // { paid: true } or { status: "paid" }
        const verifyUrl = `${API_BASE}/checkout/verify`;
        const resp = await axios.post(
          verifyUrl,
          { sessionId: sessionId || order?.lastCheckoutSessionId || '' },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const paid =
          resp?.data?.paid === true ||
          resp?.data?.status === 'paid' ||
          resp?.data?.paymentStatus === 'paid';

        if (!paid) {
          throw new Error('Payment not verified.');
        }

        if (cancelled) return;
        setOrder((prev) => ({ ...prev, paymentStatus: 'paid' }));
        setStatus('verified');
        setMessage('Payment verified. Redirecting to order page');

        setTimeout(() => {
          if (!cancelled) nav('/workflow/order', { replace: true });
        }, 700);
      } catch (e) {
        console.error(e);
        if (cancelled) return;
        setOrder((prev) => ({ ...prev, paymentStatus: 'failed' }));
        setStatus('failed');
        setMessage('We could not verify your payment. Please return to the order page.');
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [API_BASE, nav, order?.lastCheckoutSessionId, params, setOrder]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          {status === 'verified' ? '✅' : status === 'failed' ? '⚠️' : '⏳'}
        </div>
        <div className="min-w-0">
          <h3 className="text-2xl font-semibold text-slate-900">
            {status === 'verified'
              ? 'Payment Confirmed'
              : status === 'failed'
              ? 'Verification Failed'
              : 'Verifying Payment'}
          </h3>
          <p className="mt-2 text-slate-600">{message}</p>

          {status === 'failed' ? (
            <button
              type="button"
              onClick={() => nav('/workflow/order')}
              className="mt-6 px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Return to Order
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-2 w-1/2 bg-blue-600 animate-pulse" />
        </div>
        <div className="mt-2 text-xs text-slate-500">
          If this takes more than a few seconds, your network or backend verification may be slow.
        </div>
      </div>
    </div>
  );
}
