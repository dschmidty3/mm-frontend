// mm/src/pages/documents.js
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { listDocuments } from '../api/listDocuments';
import { uploadDocument } from '../api/uploadDocuments';
import { withAuthRetry } from '../api/refresh';

const ACCESS_KEY = 'mm_accessToken';
const REFRESH_KEY = 'mm_refreshToken';
const USERID_KEY = 'mm_userId';

export default function DocumentsPage() {
  const nav = useNavigate();
  const fileRef = useRef(null);

  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [error, setError] = useState('');

  const signOut = () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USERID_KEY);
    nav('/login');
  };

  const loadDocs = async () => {
    setError('');
    setLoadingDocs(true);
    try {
      const resp = await withAuthRetry(() => listDocuments());
      setDocs(resp?.data?.documents || resp?.data?.Documents || []);
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      if (status === 401) {
        setError('Session expired. Please sign in again.');
        signOut();
        return;
      }
      setError('Failed to load documents.');
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    const hasAccess = !!localStorage.getItem(ACCESS_KEY);
    if (!hasAccess) {
      nav('/login');
      return;
    }
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickFile = () => fileRef.current?.click();

  const onUpload = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    setProgress(0);

    try {
      await withAuthRetry(() => uploadDocument(file, setProgress));
      await loadDocs();
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      if (status === 401) {
        setError('Session expired. Please sign in again.');
        signOut();
        return;
      }
      setError('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">My Documents</h1>
            <p className="mt-1 text-slate-500">
              Upload and manage your manuscripts. These are tied to your account.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => nav('/workflow/start')}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Start Formatting
            </button>
            <button
              type="button"
              onClick={signOut}
              className="px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-8 border border-slate-200 bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900">Upload a document</div>
              <div className="text-sm text-slate-500">
                PDF, DOCX, TXT, MD — use this to store documents under your account.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = ''; // allow re-selecting same file
                  onUpload(f);
                }}
              />

              <button
                type="button"
                onClick={onPickFile}
                disabled={uploading}
                className={[
                  'px-4 py-2 rounded-md text-white',
                  uploading ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700',
                ].join(' ')}
              >
                {uploading ? 'Uploading…' : 'Upload Document'}
              </button>
            </div>
          </div>

          {uploading ? (
            <div className="mt-4">
              <div className="w-full bg-slate-100 rounded overflow-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-2 bg-blue-600 transition-all"
                />
              </div>
              <div className="text-xs text-slate-500 mt-2">Progress: {progress}%</div>
            </div>
          ) : null}

          {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
        </div>

        <div className="mt-6 border border-slate-200 bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Your documents</h2>
            <button
              type="button"
              onClick={loadDocs}
              disabled={loadingDocs}
              className="px-3 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm"
            >
              {loadingDocs ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="mt-4">
            {loadingDocs ? (
              <div className="text-sm text-slate-500">Loading…</div>
            ) : docs.length === 0 ? (
              <div className="text-sm text-slate-500">No documents yet.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {docs.map((d, idx) => (
                  <li key={d.documentId || d.id || idx} className="py-3">
                    <div className="font-medium text-slate-900">
                      {d.filename || d.name || 'Untitled'}
                    </div>
                    <div className="text-xs text-slate-500">
                      ID: {d.documentId || d.id || '—'} • Path: {d.filePath || d.path || '—'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
