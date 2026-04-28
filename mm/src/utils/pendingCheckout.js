// mm/src/utils/pendingCheckout.js
const KEY = 'mm_pendingCheckout_v1';

export function setPendingCheckout(payload) {
  localStorage.setItem(KEY, JSON.stringify(payload || {}));
}

export function getPendingCheckout() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return null;
    return obj;
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  localStorage.removeItem(KEY);
}