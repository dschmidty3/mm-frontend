// mm/src/pages/account.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { clearAuth, getUserId, isSignedIn } from '../utils/auth';
import { listDocuments } from '../api/listDocuments';
import { uploadDocuments } from '../api/uploadDocuments';
import { downloadAndSaveDocuments } from '../api/downloadDocuments';

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (!n) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export default function AccountPage() {
  const nav = useNavigate();
  const fileRef = useRef(null);

  const userId = useMemo(() => getUserId(), []);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const [downloadingId, setDownloadingId] = useState('');
  const [error, setError] = useState('');

  const refreshDocs = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const resp = await listDocuments();

      // listDocuments() returns:
      // { success: true, data: { documents: [] }, status }
      if (!resp?.success) {
        throw new Error(resp?.error || 'Failed to load documents.');
      }

      setDocs(resp?.data?.documents || []);
    } catch (e) {
      console.error('Account refreshDocs failed:', e);
      setError(e?.message || 'Failed to load documents. Please try again.');
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn()) {
      nav('/login', { replace: true });
      return;
    }
    refreshDocs();
  }, [nav, refreshDocs]);

  const onLogout = () => {
    clearAuth();
    nav('/', { replace: true });
  };

  const onChooseFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);
    setUploadPct(0);

    try {
      const resp = await uploadDocuments(file, (pct) => setUploadPct(pct));

      // uploadDocuments in refactor returns { success, data, status }
      if (resp?.success === false) {
        throw new Error(resp?.error || 'Upload failed.');
      }

      await refreshDocs();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadPct(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDownload = async (doc) => {
    const id = doc?.documentId;
    if (!id) return;

    setError('');
    setDownloadingId(id);

    try {
      // IMPORTANT: use backend original filename
      await downloadAndSaveDocuments(id, doc?.filename);
    } catch (e) {
      console.error('Download failed:', e);

      // Axios sometimes hides useful text in response
      const status = e?.response?.status;
      const backendMsg = e?.response?.data;
      const msg =
        status
          ? `Download failed (HTTP ${status}).`
          : e?.message || 'Download failed.';

      setError(msg);

      if (backendMsg) {
        console.log('Download backend response data:', backendMsg);
      }
    } finally {
      setDownloadingId('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Account
            </h1>
            <p className="mt-2 text-slate-500">
              Manage your documents and downloads.
              {userId ? (
                <span className="ml-2 text-slate-400">User ID: {userId}</span>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => nav('/workflow/start')}
              className="px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              New Project
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Global error */}
        {error ? (
          <div className="mt-6 border border-red-200 bg-red-50 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Upload card */}
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Upload a Document
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload manuscripts, covers, or supporting files.
              </p>
            </div>

            <div className="shrink-0">
              <input
                ref={fileRef}
                type="file"
                onChange={onChooseFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={[
                  'px-5 py-2 rounded-md text-white font-medium',
                  uploading
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700',
                ].join(' ')}
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>

          {uploading ? (
            <div className="mt-5">
              <div className="w-full bg-slate-100 rounded overflow-hidden">
                <div
                  style={{ width: `${uploadPct}%` }}
                  className="h-2 bg-blue-600 transition-all"
                />
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Uploading: {uploadPct}%
              </div>
            </div>
          ) : null}
        </div>

        {/* Documents */}
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Your Documents
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View all documents associated with your account.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshDocs}
              disabled={loading}
              className={[
                'px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                loading ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="text-slate-500">Loading…</div>
            ) : docs.length === 0 ? (
              <div className="text-slate-500">No documents yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {docs.map((d) => (
                  <div
                    key={d.documentId || d.filename}
                    className="py-4 flex items-center justify-between gap-6"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {d.filename || `Document ${d.documentId}`}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        <span className="mr-3">ID: {d.documentId || '—'}</span>
                        <span className="mr-3">Size: {formatBytes(d.size)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onDownload(d)}
                        disabled={downloadingId === d.documentId}
                        className={[
                          'px-4 py-2 rounded-md text-white',
                          downloadingId === d.documentId
                            ? 'bg-slate-300 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700',
                        ].join(' ')}
                      >
                        {downloadingId === d.documentId ? 'Downloading…' : 'Download'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer helper */}
        <div className="mt-8 text-center text-xs text-slate-500">
          If you get redirected to login unexpectedly, your access token likely expired and refresh failed.
        </div>
      </div>
    </div>
  );
}