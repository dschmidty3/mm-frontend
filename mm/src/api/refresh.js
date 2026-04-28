// mm/src/api/refresh.js
import axios from 'axios';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || 'https://manuscriptmagic.ai/services';

const ACCESS_KEY = 'mm_accessToken';
const REFRESH_KEY = 'mm_refreshToken';
const ACCESS_CREATED_KEY = 'mm_accessTokenCreatedAt';

/**
 * Refresh access token when expired/stale or after a 401.
 * requires: refreshToken
 * returns: { accessToken, refreshToken, ... }
 */
export async function refreshTokens(refreshToken) {
  const rt = String(refreshToken || localStorage.getItem(REFRESH_KEY) || '').trim();
  if (!rt) throw new Error('No refresh token available.');

  const url = `${API_BASE}/refresh.php`;

  const resp = await axios.post(
    url,
    { refreshToken: rt },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const data = resp?.data || {};
  const nextAccess = data.accessToken || data.AccessToken || '';
  const nextRefresh = data.refreshToken || data.RenewalToken || '';

  if (!nextAccess || !nextRefresh) {
    throw new Error('Refresh failed: backend did not return new tokens.');
  }

  // Always update createdAt when we write a new access token
  localStorage.setItem(ACCESS_KEY, String(nextAccess));
  localStorage.setItem(REFRESH_KEY, String(nextRefresh));
  localStorage.setItem(ACCESS_CREATED_KEY, Date.now().toString());

  return data;
}

/**
 * Run an async request function; if it throws 401, refresh and retry once.
 *
 * IMPORTANT:
 * requestFn MUST fetch the token INSIDE the function (not outside),
 * so the retry uses the new token.
 */
export async function withAuthRetry(requestFn) {
  try {
    return await requestFn();
  } catch (err) {
    const status = err?.response?.status;
    if (status !== 401) throw err;

    await refreshTokens();
    return await requestFn();
  }
}
