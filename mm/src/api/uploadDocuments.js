// mm/src/api/uploadDocuments.js
import axios from 'axios';
import { withAuthRetry } from './refresh';
import { getAccessToken } from '../utils/auth';

const DEFAULT_API_BASE = 'https://manuscriptmagic.ai/services';
const API_BASE = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE;

/**
 * Upload a single document file to the backend.
 *
 * Endpoint: uploadDocument.php
 * Expects multipart/form-data:
 *   - document: File (binary)
 *
 * Uses:
 *   - Authorization: Bearer <accessToken>
 */
export async function uploadDocuments(file, onProgress) {
  const url = `${API_BASE}/uploadDocument.php`;

  const form = new FormData();
  form.append('document', file); // actual file binary under field name "document"

  try {
    const response = await withAuthRetry(async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Missing access token');

      return axios.post(url, form, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // do NOT set Content-Type for FormData; axios/browser will set boundary
        },
        onUploadProgress: (evt) => {
          if (!onProgress) return;

          const total = evt.total || file?.size || 0;
          if (!total) return;

          const pct = Math.min(100, Math.round((evt.loaded * 100) / total));
          onProgress(pct);
        },
      });
    });

    if (onProgress) onProgress(100);

    console.log('uploadDocuments success:', {
      status: response.status,
      filename: file?.name,
      size: file?.size,
      data: response.data,
    });

    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (err) {
    const status = err?.response?.status ?? null;
    const backendError = err?.response?.data;
    const message = err?.message || 'Upload failed';
    const error = backendError ?? message;

    console.error('uploadDocuments failure:', {
      status,
      error,
      filename: file?.name,
      size: file?.size,
    });

    return {
      success: false,
      error,
      status,
    };
  }
}
