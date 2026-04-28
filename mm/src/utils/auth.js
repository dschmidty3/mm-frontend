// mm/src/utils/auth.js
import { refreshTokens } from '../api/refresh';

const ACCESS_KEY = 'mm_accessToken';
const REFRESH_KEY = 'mm_refreshToken';
const USER_ID_KEY = 'mm_userId';
const EMAIL_KEY = 'mm_email';

// New (optional) name storage
const NAME_KEY = 'mm_name';

const ACCESS_CREATED_KEY = 'mm_accessTokenCreatedAt';
const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Returns a valid access token.
 * - If older than 15 minutes, refreshes using refresh token.
 * - If refresh fails, clears auth.
 */
export async function getAccessToken() {
  const accessToken = localStorage.getItem(ACCESS_KEY) || '';
  if (!accessToken) return '';

  const createdAtRaw = localStorage.getItem(ACCESS_CREATED_KEY);
  const createdAt = createdAtRaw ? Number(createdAtRaw) : 0;

  const isStale = !createdAtRaw || Date.now() - createdAt > FIFTEEN_MINUTES;
  if (!isStale) return accessToken;

  try {
    console.log('🔄 Access token older than 15 minutes — refreshing...');
    const data = await refreshTokens(); // refreshTokens reads refresh token from LS
    const newAccess = data?.accessToken || data?.AccessToken || '';
    const newRefresh = data?.refreshToken || data?.RenewalToken || '';

    if (newAccess) {
      localStorage.setItem(ACCESS_KEY, String(newAccess));
      localStorage.setItem(ACCESS_CREATED_KEY, Date.now().toString());
    }
    if (newRefresh) {
      localStorage.setItem(REFRESH_KEY, String(newRefresh));
    }

    console.log('Token refreshed');
    return newAccess || '';
  } catch (e) {
    console.error('Token refresh failed. Clearing auth.', e);
    clearAuth();
    return '';
  }
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || '';
}

export function getUserId() {
  return localStorage.getItem(USER_ID_KEY) || '';
}

export function getUserEmail() {
  return localStorage.getItem(EMAIL_KEY) || '';
}

export function getUserName() {
  return localStorage.getItem(NAME_KEY) || '';
}

/**
 * Best display label for UI:
 * - name if available
 * - else email
 * - else shortened userId
 */
export function getDisplayName() {
  const name = (getUserName() || '').trim();
  if (name) return name;

  const email = (getUserEmail() || '').trim();
  if (email) return email;

  const uid = (getUserId() || '').trim();
  if (!uid) return 'Account';
  return uid.length > 10 ? `${uid.slice(0, 6)}…${uid.slice(-4)}` : uid;
}

export function isSignedIn() {
  return !!(localStorage.getItem(ACCESS_KEY) || '');
}

/**
 * Save auth tokens + user info.
 * Note: name is optional; if you don’t have it yet, pass nothing.
 */
export function saveAuth({ userId, accessToken, refreshToken, email, name }) {
  if (userId != null) localStorage.setItem(USER_ID_KEY, String(userId));

  if (accessToken) {
    localStorage.setItem(ACCESS_KEY, String(accessToken));
    localStorage.setItem(ACCESS_CREATED_KEY, Date.now().toString());
  }

  if (refreshToken) localStorage.setItem(REFRESH_KEY, String(refreshToken));
  if (email) localStorage.setItem(EMAIL_KEY, String(email));

  // Optional (won’t break anything if not provided)
  if (name) localStorage.setItem(NAME_KEY, String(name));

  window.dispatchEvent(new Event('mm_auth_changed'));
}

export function clearAuth() {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(ACCESS_CREATED_KEY);

  window.dispatchEvent(new Event('mm_auth_changed'));
}
