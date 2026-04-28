import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listDocuments } from '../api/listDocuments';
import { clearAuth } from '../utils/auth';

export default function DocumentsDashboard() {
  const nav = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDocs() {
    setLoading(true);
    setError('');

    try {
      const resp = await listDocuments();

      // listDocuments returns { success, data: { documents }, status } 
      if (!resp?.success) {
        throw new Error(resp?.error || 'Failed to load documents');
      }

      const docs = resp?.data?.documents || [];
      setDocuments(docs);

      // clear any stale error on success
      setError('');

      console.log('DocumentsDashboard loaded docs:', { count: docs.length, docs });
    } catch (e) {
      console.error('DocumentsDashboard load failed:', e);
      setDocuments([]);
      setError(e?.message || 'Unable to load documents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    clearAuth();
    nav('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Account</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Documents</h2>
            <button
              type="button"
              onClick={loadDocs}
              disabled={loading}
              className="px-3 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Refresh
            </button>
          </div>

          {loading ? <p className="text-slate-500">Loading…</p> : null}
          {!loading && error ? <p className="text-red-600">{error}</p> : null}

          {!loading && !error && documents.length === 0 ? (
            <p className="text-slate-500">No documents uploaded yet.</p>
          ) : null}

          {!loading && !error && documents.length > 0 ? (
            <ul className="divide-y">
              {documents.map((doc) => (
                <li key={doc.documentId || doc.filename} className="py-3 flex justify-between">
                  <span className="truncate">{doc.filename || `Document ${doc.documentId}`}</span>

                  <span className="text-sm text-slate-500">
                    {doc?.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
