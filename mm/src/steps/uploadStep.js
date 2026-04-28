// mm/src/steps/uploadStep.js
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWorkflow } from '../store/workflowContext';
import { saveWorkflowFile, removeWorkflowFile, loadWorkflowFiles } from '../utils/fileStore';

const TAG_OPTIONS = [
  'Main Manuscript',
  'Book Cover',
  'Chapter',
  'Appendix',
  'Bibliography',
  'Index',
  'Preface',
  'Introduction',
  'Acknowledgments',
  'Other',
];

const CATEGORY_OPTIONS = [
  'Fiction',
  'Non-Fiction',
  'Business',
  'Self-Help',
  'Romance',
  'Fantasy',
  'Science Fiction',
  'Mystery/Thriller',
  'Biography',
  'History',
  'Other',
];

const SUBCATEGORY_BY_CATEGORY = {
  Fiction: ['Science Fiction', 'Fantasy', 'Romance', 'Mystery/Thriller', 'Literary', 'Historical', 'Other'],
  'Non-Fiction': ['Business', 'Self-Help', 'Biography', 'History', 'Health', 'Other'],
  Business: ['Entrepreneurship', 'Leadership', 'Marketing', 'Finance', 'Other'],
  'Self-Help': ['Mindset', 'Productivity', 'Relationships', 'Other'],
  Romance: ['Contemporary', 'Historical', 'Romantic Suspense', 'Other'],
  Fantasy: ['Epic', 'Urban', 'YA', 'Other'],
  'Science Fiction': ['Space Opera', 'Dystopian', 'Cyberpunk', 'YA', 'Other'],
  'Mystery/Thriller': ['Crime', 'Suspense', 'Detective', 'Other'],
  Biography: ['Memoir', 'Autobiography', 'Other'],
  History: ['Military', 'Ancient', 'Modern', 'Other'],
  Other: ['Other'],
};

const LS_FILES_KEY = 'mm_workflow_files_meta_v1';
const LS_BOOK_KEY = 'mm_workflow_book_details_v1';
const LS_UPLOAD_PHASE_KEY = 'mm_workflow_upload_phase_v1';

function safeJsonParse(v, fallback) {
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

const UploadStep = () => {
  const fileRef = useRef(null);

  const {
    manuscriptFiles = [],
    setManuscriptFiles,
    addFile,
    removeFile,
    setUploadPhase,
    uploadPhase = 'select',
    bookDetails,
    setBookDetails,
  } = useWorkflow();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const hasFiles = manuscriptFiles.length > 0;

  const category = bookDetails?.category || '';
  const subOptions = useMemo(() => {
    const key = category && SUBCATEGORY_BY_CATEGORY[category] ? category : 'Other';
    return SUBCATEGORY_BY_CATEGORY[key] || ['Other'];
  }, [category]);

  // ---- On mount: hydrate workflow from localStorage + IndexedDB (fileStore) ----
  useEffect(() => {
    // hydrate bookDetails
    const savedBook = safeJsonParse(localStorage.getItem(LS_BOOK_KEY), null);
    if (savedBook && typeof savedBook === 'object') {
      setBookDetails((prev) => ({ ...(prev || {}), ...savedBook }));
    }

    // hydrate phase
    const savedPhase = localStorage.getItem(LS_UPLOAD_PHASE_KEY);
    if (savedPhase && ['select', 'ready', 'metadata'].includes(savedPhase)) {
      setUploadPhase(savedPhase);
    }

    // hydrate file meta from LS first (fast)
    const savedMeta = safeJsonParse(localStorage.getItem(LS_FILES_KEY), []);
    if (Array.isArray(savedMeta) && savedMeta.length > 0) {
      setManuscriptFiles(savedMeta);
    }

    // hydrate from IndexedDB (real source of truth)
    (async () => {
      try {
        const idbFiles = await loadWorkflowFiles();
        if (Array.isArray(idbFiles) && idbFiles.length > 0) {
          const hydrated = idbFiles.map((f) => ({
            id: f.id,
            name: f.name,
            size: f.size,
            status: 'ready',
            progress: 100,
            tag: f.tag || 'Main Manuscript',
            file: null, // never keep File in memory/LS
          }));

          setManuscriptFiles(hydrated);
          localStorage.setItem(LS_FILES_KEY, JSON.stringify(hydrated));

          // if user has files stored, ensure they aren't stuck on select
          setUploadPhase((p) => (p === 'select' ? 'ready' : p));
        }
      } catch (e) {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist phase
  useEffect(() => {
    localStorage.setItem(LS_UPLOAD_PHASE_KEY, uploadPhase);
  }, [uploadPhase]);

  // persist book details
  useEffect(() => {
    localStorage.setItem(LS_BOOK_KEY, JSON.stringify(bookDetails || {}));
  }, [bookDetails]);

  // persist file metadata (no File object)
  useEffect(() => {
    const metaOnly = (manuscriptFiles || []).map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      status: f.status || 'ready',
      progress: Number.isFinite(f.progress) ? f.progress : 100,
      tag: f.tag || 'Main Manuscript',
      file: null,
    }));
    localStorage.setItem(LS_FILES_KEY, JSON.stringify(metaOnly));
  }, [manuscriptFiles]);

  const upsertFile = (fileObj) => addFile(fileObj);

  // MULTI-FILE SAVE:
  // - user can select multiple at once
  // - we save each File into IndexedDB via fileStore.saveWorkflowFile()
  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setError('');
    setIsSaving(true);

    try {
      for (const file of files) {
        const id = uuidv4();
        const baseMeta = {
          id,
          name: file.name,
          size: file.size,
          status: 'saving',
          progress: 0,
          file: null,
          tag: 'Main Manuscript',
        };

        // show immediately
        upsertFile(baseMeta);

        // store real File blob to IndexedDB
        await saveWorkflowFile({
          id,
          file,
          name: file.name,
          tag: baseMeta.tag,
        });

        // mark ready
        upsertFile({
          id,
          status: 'ready',
          progress: 100,
        });
      }

      // move to ready after at least one save
      setUploadPhase('ready');
    } catch (e) {
      console.error(e);
      setError('Failed to store file(s) locally. Please try again.');
    } finally {
      setIsSaving(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onChoose = (e) => {
    handleFiles(e.target.files);
  };

  const onStartAnalysis = () => {
    setUploadPhase('metadata');
  };

  // If tag changes, persist tag to IDB as well (so Pay step can use it later)
  const onTagChange = async (id, newTag) => {
    upsertFile({ id, tag: newTag });

    // update in IDB too (load existing file to preserve blob)
    try {
      const all = await loadWorkflowFiles();
      const found = all.find((x) => x.id === id);
      if (found?.file) {
        await saveWorkflowFile({
          id,
          file: found.file,
          name: found.name,
          tag: newTag,
        });
      }
    } catch (e) {
      // non-fatal
    }
  };

  const onDelete = async (id) => {
    try {
      await removeWorkflowFile(id);
    } catch (e) {
      // ignore
    }
    removeFile(id);

    const next = (manuscriptFiles || []).filter((f) => f.id !== id);
    if (next.length === 0) setUploadPhase('select');
  };

  const renderFileRow = (f, showTagDropdown) => (
    <li
      key={f.id}
      className="flex items-center justify-between border border-slate-200 bg-white rounded-lg px-4 py-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">📄</div>
        <div className="min-w-0">
          <div className="font-medium text-slate-900 truncate">{f.name}</div>
          <div className="text-xs text-slate-500">
            {(f.size ? (f.size / (1024 * 1024)).toFixed(2) : '0.00')} MB • {f.status || 'ready'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showTagDropdown && (
          <select
            value={f.tag || 'Main Manuscript'}
            onChange={(e) => onTagChange(f.id, e.target.value)}
            className="border border-slate-200 rounded-md px-3 py-2 text-sm bg-white"
            disabled={isSaving}
          >
            {TAG_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => onDelete(f.id)}
          className="text-slate-400 hover:text-red-500 transition"
          aria-label="Remove file"
          title="Remove"
          disabled={isSaving}
        >
          🗑️
        </button>
      </div>
    </li>
  );

  // PHASE 1: SELECT
  if (uploadPhase === 'select') {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center bg-white">
        <div className="mb-4 text-slate-700 text-center">
          <h3 className="text-2xl font-semibold">Upload Your Book Files</h3>
          <p className="text-sm text-slate-500">PDF, DOCX, TXT, MD — up to 50MB</p>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="w-full py-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-50 to-white border border-slate-100"
        >
          <div className="text-center">
            <input
              ref={fileRef}
              type="file"
              onChange={onChoose}
              className="hidden"
              multiple // multi-select
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-6 py-3 bg-blue-600 text-white rounded-md shadow"
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Upload file(s)'}
            </button>
            <div className="mt-4 text-sm text-slate-500">or drag and drop here</div>
          </div>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

        <div className="mt-6 w-full">
          {hasFiles && (
            <div className="mt-4 w-full">
              <h4 className="text-sm font-medium text-slate-700">Files</h4>
              <ul className="mt-2 space-y-2">{manuscriptFiles.map((f) => renderFileRow(f, false))}</ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PHASE 2: READY
  if (uploadPhase === 'ready') {
    return (
      <div className="border border-slate-200 rounded-xl p-8 bg-white">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold text-slate-900">Upload Your Manuscript</h3>
          <p className="text-sm text-slate-500 mt-1">Upload your book files for AI analysis and professional formatting.</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white">
            <ul className="space-y-3">{manuscriptFiles.map((f) => renderFileRow(f, false))}</ul>

            {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                disabled={isSaving}
              >
                Add File(s)
              </button>

              <button
                type="button"
                onClick={onStartAnalysis}
                className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
                disabled={!hasFiles || isSaving}
              >
                Start AI Analysis →
              </button>

              <input
                ref={fileRef}
                type="file"
                onChange={onChoose}
                className="hidden"
                multiple // multi-select
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 3: METADATA
  return (
    <div className="space-y-8">
      <div className="border border-slate-200 rounded-xl p-8 bg-white">
        <h3 className="text-2xl font-semibold text-slate-900">Basic Information</h3>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Book Title *</label>
            <input
              value={bookDetails?.title || ''}
              onChange={(e) => setBookDetails?.({ ...(bookDetails || {}), title: e.target.value })}
              placeholder="Enter your book title"
              className="w-full border border-slate-200 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Book Author *</label>
            <input
              value={bookDetails?.author || ''}
              onChange={(e) => setBookDetails?.({ ...(bookDetails || {}), author: e.target.value })}
              placeholder="Enter the author name"
              className="w-full border border-slate-200 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
              <select
                value={bookDetails?.category || ''}
                onChange={(e) =>
                  setBookDetails?.({
                    ...(bookDetails || {}),
                    category: e.target.value,
                    subcategory: '',
                  })
                }
                className="w-full border border-slate-200 rounded-md px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-200"
                disabled={isSaving}
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subcategory *</label>
              <select
                value={bookDetails?.subcategory || ''}
                onChange={(e) => setBookDetails?.({ ...(bookDetails || {}), subcategory: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-200"
                disabled={isSaving}
              >
                <option value="">Select subcategory</option>
                {subOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl p-8 bg-white">
        <h3 className="text-2xl font-semibold text-slate-900">Organize Your Files</h3>
        <p className="text-sm text-slate-500 mt-2">
          Tag your files to help organize them properly. Files tagged as "Book Cover" will remain separate.
        </p>

        <div className="mt-6 border border-slate-200 rounded-xl p-4 bg-white">
          <ul className="space-y-3">{manuscriptFiles.map((f) => renderFileRow(f, true))}</ul>

          <div className="mt-5">
            <input
              ref={fileRef}
              type="file"
              onChange={onChoose}
              className="hidden"
              multiple // multi-select
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              disabled={isSaving}
            >
              + Add File(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadStep;
