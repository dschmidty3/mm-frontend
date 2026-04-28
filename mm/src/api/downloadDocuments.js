// mm/src/api/downloadDocuments.js
import { getAccessToken } from '../utils/auth';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || 'https://manuscriptmagic.ai/services';

/**
 * Downloads a document from the backend and saves it locally.
 */
export async function downloadAndSaveDocuments(
  documentId,
  fallbackFilename = 'downloaded_file'
) {
  if (!documentId) {
    throw new Error('documentId is required');
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Missing access token');
  }

  // FIXED PARAM NAME
  const url = `${API_BASE}/downloadDocument.php?documentId=${documentId}`;

  console.log('download request:', {
    url,
    documentId,
  });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Download failed (HTTP ${response.status})`);
    }

    const disposition = response.headers.get('Content-Disposition');
    let filename = fallbackFilename;

    if (disposition && disposition.includes('filename=')) {
      filename = disposition.split('filename=')[1].replace(/"/g, '');
    }

    const blob = await response.blob();

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true };
  } catch (err) {
    console.error(' download failed:', err);
    throw new Error(err.message || 'Network or server error');
  }
}