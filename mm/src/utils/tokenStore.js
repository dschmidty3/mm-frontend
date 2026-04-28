// mm/src/utils/tokenStore.js
import { refreshTokens } from '../api/refresh';

const ACCESS_KEY = 'mm_accessToken';
const ACCESS_CREATED_KEY = 'mm_accessTokenCreatedAt';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export async function getFreshAccessToken() {
  const token = localStorage.getItem(ACCESS_KEY) || '';
  if (!token) return '';

  const createdAtRaw = localStorage.getItem(ACCESS_CREATED_KEY);
  const createdAt = createdAtRaw ? Number(createdAtRaw) : 0;

  const isStale = !createdAtRaw || (Date.now() - createdAt) > FIFTEEN_MINUTES;
  if (!isStale) return token;

  const refreshed = await refreshTokens();
  return refreshed.accessToken || '';
}
