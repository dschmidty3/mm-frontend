// mm/src/api/checkout.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

export const createCheckoutSession = (payload) => {
  // DEV MOCK: no backend configured
  if (!API_BASE) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const origin =
          typeof window !== 'undefined' && window.location && window.location.origin
            ? window.location.origin
            : '';

        resolve({
          data: {
            mock: true,
            sessionId: `mock_${Date.now()}`,
            // Simulate a backend that returns checkoutUrl
            checkoutUrl: payload?.successUrl
              ? `${origin}${payload.successUrl.replace(origin, '')}?mockSession=1`
              : `${origin}/workflow/payment/success?mockSession=1`,
            received: payload,
          },
        });
      }, 450);
    });
  }

  // REAL request
  const url = `${API_BASE}/checkout`;
  return axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
};

