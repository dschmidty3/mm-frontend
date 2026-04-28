import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

/**
 * Upload a file.
 * - If REACT_APP_API_BASE_URL is set, POST to `${API_BASE}/upload`
 * - Otherwise, mock the request locally so the UI can be developed without a backend
 */
export const uploadFile = (file, onProgress) => {
  // DEV MOCK: no backend configured
  if (!API_BASE) {
    return new Promise((resolve) => {
      const total = file.size || 1024 * 300; // pretend 300KB if unknown
      let loaded = 0;
      const interval = setInterval(() => {
        loaded += total / 12; 
        const pct = Math.min(100, Math.round((loaded / total) * 100));
        onProgress && onProgress(pct);
        if (pct >= 100) {
          clearInterval(interval);
          resolve({
            data: {
              id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
              filename: file.name,
              size: file.size,
              mime: file.type,
              mock: true,
              url: `/mock/${encodeURIComponent(file.name)}`,
            },
          });
        }
      }, 120);
    });
  }

  // REAL request
  const url = `${API_BASE}/upload`;
  const form = new FormData();
  form.append('file', file);

  return axios.post(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        const pct = Math.round((evt.loaded * 100) / evt.total);
        onProgress(pct);
      }
    },
  });
};
