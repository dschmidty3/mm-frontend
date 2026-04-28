// mm/src/steps/previewStage.js
import React, { useEffect, useMemo, useState } from 'react';
import mammoth from 'mammoth';
import { useWorkflow } from '../store/workflowContext';
import { loadWorkflowFiles } from '../utils/fileStore';

const SAMPLE_TEXT = `In the quiet town of Millbrook, where autumn leaves danced through cobblestone streets and the scent of fresh bread wafted from corner bakeries, something remarkable was about to unfold.

Margaret closed her weathered journal, its pages filled with decades of dreams and observations. Today marked the beginning of a new chapter—not just in her writing, but in her life.

"Every story begins with a single word," she whispered to herself, pen hovering over a fresh page. "And every word carries the weight of possibility."`;

const PAGE_CHAR_LIMIT = 1200; // rough chunk size per page

async function extractTextFromFile(file) {
  if (!file) return null;

  const name = file.name || '';
  const ext = name.split('.').pop().toLowerCase();

  try {
    if (ext === 'txt' || ext === 'md') {
      return await file.text();
    }

    if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    // Unsupported types (pdf, etc.)
    return null;
  } catch (err) {
    console.error('Error extracting text from file for preview:', err);
    return null;
  }
}

function buildPagesFromText(text, bookTitle, authorName) {
  const cleanText = (text || '').trim() || SAMPLE_TEXT;

  const chunks = [];
  for (let i = 0; i < cleanText.length; i += PAGE_CHAR_LIMIT) {
    chunks.push(cleanText.slice(i, i + PAGE_CHAR_LIMIT));
  }

  const title = bookTitle || 'Your Book Title';
  const author = authorName || 'Author Name';

  const pages = [];
  // two title pages like you had
  pages.push({ type: 'title', title, author });
  pages.push({ type: 'title', title, author });

  chunks.forEach((chunk) => pages.push({ type: 'body', text: chunk }));

  return pages;
}

export default function PreviewStep() {
  const { manuscriptFiles, bookDetails, design } = useWorkflow();

  const [storedFiles, setStoredFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [error, setError] = useState('');

  // Load real blobs from IndexedDB
  useEffect(() => {
    let mounted = true;

    (async () => {
      setError('');
      setFilesLoading(true);
      try {
        const files = await loadWorkflowFiles(); // [{id,name,tag,file,size,...}]
        if (!mounted) return;
        setStoredFiles(files || []);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setStoredFiles([]);
        setError('Could not load stored files for preview.');
      } finally {
        if (mounted) setFilesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Build preview pages from the *first stored file* blob
  useEffect(() => {
    let mounted = true;

    (async () => {
      const title = bookDetails?.title || '';
      const author = bookDetails?.author || '';

      // If nothing stored yet, show sample pages
      if (!storedFiles || storedFiles.length === 0) {
        const built = buildPagesFromText(null, title, author);
        if (mounted) {
          setPages(built);
          setSpreadIndex(0);
        }
        return;
      }

      // Prefer using the first file from the workflow order (manuscriptFiles meta),
      // but fall back to storedFiles[0]
      const preferredId = manuscriptFiles?.[0]?.id;
      const preferred = preferredId ? storedFiles.find((f) => f.id === preferredId) : null;
      const pick = preferred || storedFiles[0];

      const extracted = await extractTextFromFile(pick?.file);
      const built = buildPagesFromText(extracted, title, author);

      if (mounted) {
        setPages(built);
        setSpreadIndex(0);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [storedFiles, manuscriptFiles, bookDetails]);

  const totalSpreads = Math.max(1, Math.ceil(pages.length / 2));
  const safeSpreadIndex = Math.min(spreadIndex, totalSpreads - 1);
  const leftPage = pages[safeSpreadIndex * 2] || null;
  const rightPage = pages[safeSpreadIndex * 2 + 1] || null;

  const goPrevious = () => setSpreadIndex((idx) => Math.max(0, idx - 1));
  const goNext = () => setSpreadIndex((idx) => Math.min(totalSpreads - 1, idx + 1));

  const currentFormatLabel =
    design?.trim === '5x8'
      ? '5"×8" Format'
      : design?.trim === '55x85'
      ? '5.5"×8.5" Format'
      : design?.trim === '6x9'
      ? '6"×9" Format'
      : '6"×9" Format';

  const typographyLabel = design?.typography || 'Hybrid';
  const layoutLabel = design?.layout || 'Standard';
  const trimLabel =
    design?.trim === '5x8'
      ? '5"×8"'
      : design?.trim === '55x85'
      ? '5.5"×8.5"'
      : design?.trim === '6x9'
      ? '6"×9"'
      : '6"×9"';

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left: interactive book preview */}
      <div className="flex-1">
        <div className="mb-4 text-slate-500 text-sm">
          Live Preview — {currentFormatLabel}
          {filesLoading ? <span className="ml-2 text-slate-400">Loading files…</span> : null}
        </div>

        {error ? (
          <div className="mb-4 border border-red-200 bg-red-50 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center">
          {/* Small helper: show what file is being previewed */}
          <div className="w-full max-w-3xl mb-3 text-xs text-slate-500 flex items-center justify-between">
            <div>
              Preview source:{' '}
              <span className="font-medium text-slate-700">
                {storedFiles?.[0]?.name || 'Sample text'}
              </span>
            </div>
            <div>
              Stored files: <span className="font-medium text-slate-700">{storedFiles?.length || 0}</span>
            </div>
          </div>

          <div className="flex w-full max-w-3xl bg-white shadow-md rounded-xl overflow-hidden">
            {/* Left page */}
            <div className="flex-1 border-r border-slate-200 px-6 py-8">
              {leftPage ? (
                leftPage.type === 'title' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-semibold mb-2">
                      {bookDetails?.title || 'Your Book Title'}
                    </h2>
                    <p className="text-slate-500">by {bookDetails?.author || 'Author Name'}</p>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {leftPage.text}
                  </div>
                )
              ) : null}
            </div>

            {/* Right page */}
            <div className="flex-1 px-6 py-8">
              {rightPage ? (
                rightPage.type === 'title' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-semibold mb-2">
                      {bookDetails?.title || 'Your Book Title'}
                    </h2>
                    <p className="text-slate-500">by {bookDetails?.author || 'Author Name'}</p>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {rightPage.text}
                  </div>
                )
              ) : null}
            </div>
          </div>

          {/* Spread controls */}
          <div className="mt-4 flex items-center justify-between w-full max-w-3xl">
            <button
              onClick={goPrevious}
              disabled={safeSpreadIndex === 0}
              className={`text-sm px-3 py-1 rounded ${
                safeSpreadIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              ‹ Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalSpreads }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === safeSpreadIndex ? 'bg-blue-600' : 'bg-slate-300'}`}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              disabled={safeSpreadIndex === totalSpreads - 1}
              className={`text-sm px-3 py-1 rounded ${
                safeSpreadIndex === totalSpreads - 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              Next ›
            </button>
          </div>
        </div>
      </div>

      {/* Right: design summary */}
      <div className="w-full lg:w-80">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Your Design</h3>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Typography</dt>
              <dd className="font-medium text-slate-900">{typographyLabel}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Layout</dt>
              <dd className="font-medium text-slate-900">{layoutLabel}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Trim</dt>
              <dd className="font-medium text-slate-900">{trimLabel}</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-slate-500">
            Tip: you can go back to the Design step to tweak any option before generating final files.
          </p>
        </div>
      </div>
    </div>
  );
}


