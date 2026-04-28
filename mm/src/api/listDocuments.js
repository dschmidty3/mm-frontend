// mm/src/api/listDocuments.js
import axios from 'axios';
import { withAuthRetry } from './refresh';
import { getAccessToken } from '../utils/auth';

const DEFAULT_API_BASE = 'https://manuscriptmagic.ai/services';
const API_BASE = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE;

/**
 * Backend example:
 * [
 *   {
 *     DocumentId: "abc",
 *     OrigionalFileName: "MyBook.docx",
 *     FileSize: 12345,
 *     CreatedAt: "2026-02-27 ..."
 *   }
 * ]
 */
function normalizeDocument(raw = {}) {
  const documentId = raw.DocumentId || raw.documentId || raw.id || null;

  const filename =
    raw.OrigionalFileName || // (backend currently uses this misspelling)
    raw.OriginalFileName ||  // just in case backend spelling changes later
    raw.filename ||
    raw.name ||
    null;

  const size = raw.FileSize ?? raw.size ?? null;

  const uploadedAt =
    raw.CreatedAt ||
    raw.createdAt ||
    raw.uploadedAt ||
    null;

  const filePath = raw.FilePath || raw.filePath || null;

  return {
    documentId,
    filename,
    size,
    uploadedAt,
    filePath,
    raw, // keep raw for debugging (optional)
  };
}

export async function listDocuments() {
  const url = `${API_BASE}/listDocuments.php`;

  const token = await getAccessToken();
  const tokenPrefix = token ? `${token.slice(0, 10)}...` : '';
  console.log('listDocuments request:', { url, tokenPrefix });

  if (!token) {
    return {
      success: false,
      error: 'Missing access token',
      status: null,
    };
  }

  try {
    const response = await withAuthRetry(() =>
      axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        // keep this if your PHP expects it (you said it does)
        params: { accessToken: token },
      })
    );

    const rawData = response.data;
    const rawDocs = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.documents)
      ? rawData.documents
      : [];

    const documents = rawDocs.map(normalizeDocument);

    console.log('listDocuments success:', {
      status: response.status,
      rawType: typeof rawData,
      rawData,
      count: documents.length,
      documents,
    });

    return {
      success: true,
      data: { documents },
      status: response.status,
    };
  } catch (err) {
    const status = err?.response?.status ?? null;
    const backendError = err?.response?.data ?? null;
    const error = backendError || err?.message || 'Failed to list documents';

    console.error('listDocuments failed:', { status, error });

    return {
      success: false,
      error,
      status,
    };
  }
}