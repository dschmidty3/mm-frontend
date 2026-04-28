// mm/src/steps/completeOrderStep.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkflow } from '../store/workflowContext';

import PackageSelector from '../components/packageSelector';
import OrderSummary from '../components/orderSummary';
import PaymentDelivery from '../components/paymentDelivery';

import { isSignedIn, getUserEmail } from '../utils/auth';
import { getPendingCheckout, clearPendingCheckout } from '../utils/pendingCheckout';
import { loadWorkflowFiles, clearWorkflowFiles } from '../utils/fileStore';
import { uploadDocuments } from '../api/uploadDocuments';
import { createCheckoutSession } from '../api/checkout';

const PACKAGE_PRICES = {
  basic: 49,
  standard: 99,
  premium: 199,
};

function getOriginSafe() {
  if (typeof window === 'undefined') return '';
  return window.location.origin || '';
}

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

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

export default function CompleteOrderStep() {
  const { bookDetails, details, design, order, setOrder } = useWorkflow();

  const signedIn = isSignedIn();
  const bookTitle = bookDetails?.title || '';
  const pkgId = (order?.packageId || 'standard').trim() || 'standard';
  const total = safeNumber(PACKAGE_PRICES[pkgId], 0);

  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState('');
  const [error, setError] = useState('');
  const [storedFiles, setStoredFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);

  // Prevent duplicate resume runs (React strict mode + rerenders)
  const resumeRanRef = useRef(false);

  // Load stored files for preview + gating Pay
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setFilesLoading(true);
        const files = await loadWorkflowFiles();
        if (mounted) setStoredFiles(files || []);
      } catch (e) {
        if (mounted) setStoredFiles([]);
      } finally {
        if (mounted) setFilesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Autofill email if signed in and empty
  useEffect(() => {
    if (!signedIn) return;
    if ((order?.deliveryEmail || '').trim()) return;

    const em = (typeof getUserEmail === 'function' ? getUserEmail() : '') || '';
    if (em) setOrder((p) => ({ ...p, deliveryEmail: em }));
  }, [signedIn, order?.deliveryEmail, setOrder]);

  const checkoutPayload = useMemo(() => {
    return () => ({
      bookTitle: bookDetails?.title || '',
      authorName: bookDetails?.author || '',
      author: {
        prefix: details?.prefix || '',
        firstName: details?.firstName || '',
        middleName: details?.middleName || '',
        lastName: details?.lastName || '',
        suffix: details?.suffix || '',
      },
      targetAudience: {
        ageRanges: details?.ageRanges || [],
        demographics: details?.demographics || [],
      },
      publishing: {
        distributionChannels: details?.distributionChannels || [],
        publishingTimeline: details?.publishingTimeline || '',
        authorExperienceLevel: details?.authorExperienceLevel || '',
      },
      additional: {
        marketPositioning: details?.marketPositioning || '',
        seriesInformation: details?.seriesInformation || '',
        brandingPreferences: details?.brandingPreferences || '',
        marketingObjectives: details?.marketingObjectives || '',
      },
      design: {
        typography: design?.typography || '',
        layout: design?.layout || '',
        trim: design?.trim || '',
      },
    });
  }, [bookDetails, details, design]);

  async function refreshStoredFiles() {
    const files = await loadWorkflowFiles();
    setStoredFiles(files || []);
  }

async function uploadWorkflowFilesToBackend() {
  const files = await loadWorkflowFiles(); // [{ id, file, name, tag, ... }]

  if (!files || files.length === 0) {
    console.warn('No files found in IndexedDB at checkout.');
    throw new Error('No stored files found. Please go back to Upload and add your manuscript files.');
  }

  console.log('Starting backend upload...');
  console.log(`Found ${files.length} file(s) to upload.`);

  for (let i = 0; i < files.length; i++) {
    const item = files[i];

    if (!item?.file) {
      console.error('Missing File blob for:', item?.name);
      throw new Error(`A stored file is missing its File blob (${item?.name || item?.id}). Please re-upload.`);
    }

    console.log(`⬆️ Uploading file ${i + 1}/${files.length}:`, {
      name: item.name,
      size: item.size,
      tag: item.tag,
    });

    const response = await uploadDocuments(item.file);

    console.log('Upload successful:', {
      file: item.name,
      backendResponse: response?.data,
    });
  }

  debugger

  console.log('ALL FILES SUCCESSFULLY UPLOADED TO BACKEND.');
}


  async function startCheckout({ packageId, amount, deliveryEmail, payload }) {
    setError('');
    setBusy(true);

    try {
      setBusyMsg('Uploading your documents…');
      await uploadWorkflowFilesToBackend();

      setBusyMsg('Preparing secure checkout…');
      const origin = getOriginSafe();
      if (!origin) throw new Error('Unable to determine site origin. Please refresh and try again.');

      const resp = await createCheckoutSession({
        ...(payload || {}),
        packageId,
        amount,
        deliveryEmail,
        successUrl: `${origin}/workflow/payment/success`,
        cancelUrl: `${origin}/workflow/order`,
      });

      const checkoutUrl = resp?.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error('Checkout failed: backend did not return checkoutUrl.');

      clearPendingCheckout();
      await clearWorkflowFiles(); // optional
      setStoredFiles([]);

      window.location.assign(checkoutUrl);
    } finally {
      setBusy(false);
      setBusyMsg('');
    }
  }

  // Resume after login/register
  useEffect(() => {
    const run = async () => {
      if (!signedIn) return;
      if (resumeRanRef.current) return;

      const pending = getPendingCheckout();
      if (!pending) return;

      resumeRanRef.current = true;

      if (pending.deliveryEmail && pending.deliveryEmail !== order?.deliveryEmail) {
        setOrder((p) => ({ ...p, deliveryEmail: pending.deliveryEmail }));
      }

      try {
        // ensure preview is accurate
        await refreshStoredFiles();

        await startCheckout({
          packageId: pending.packageId,
          amount: pending.amount,
          deliveryEmail: pending.deliveryEmail,
          payload: pending.payload || {},
        });
      } catch (e) {
        console.error(e);
        setError(e?.message || 'Could not resume checkout.');
        resumeRanRef.current = false;
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const isPaid = order?.paymentStatus === 'paid';
  const payDisabled = busy || filesLoading || (storedFiles?.length || 0) === 0;

  // ---------- PAID VIEW ----------
  if (isPaid) {
    return (
      <div className="text-center bg-white border border-slate-200 rounded-xl p-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Order Complete ✅</h2>
        <p className="text-slate-600">Thanks! Your payment was received. Download your formatted files below.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="border rounded-lg p-5">
            <div className="font-semibold text-slate-900">Print-ready PDF</div>
            <div className="text-sm text-slate-600 mt-1">Trim size + margins + typography applied</div>
            <button type="button" className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              Download PDF
            </button>
          </div>

          <div className="border rounded-lg p-5">
            <div className="font-semibold text-slate-900">eBook Package</div>
            <div className="text-sm text-slate-600 mt-1">EPUB + cover assets</div>
            <button type="button" className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              Download EPUB
            </button>
          </div>
        </div>

        <div className="mt-8 text-xs text-slate-500">
          Package: <span className="font-semibold">{pkgId}</span> • Total Paid:{' '}
          <span className="font-semibold">${total}</span>
        </div>
      </div>
    );
  }

  // ---------- NOT PAID VIEW ----------
  return (
    <div className="space-y-6">
      {busy ? (
        <div className="border rounded-xl p-6 bg-white">
          <div className="text-slate-900 font-semibold">{busyMsg || 'Processing…'}</div>
          <div className="text-slate-600 text-sm mt-1">Please don’t refresh while we prepare your order.</div>
          <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-2 w-1/2 bg-blue-600 animate-pulse" />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {/* Files preview (what will be uploaded at checkout) */}
      <div className="border rounded-xl p-6 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Files to Upload</h3>
            <p className="text-sm text-slate-500">These will be uploaded before you’re sent to Stripe.</p>
          </div>

          <button
            type="button"
            onClick={refreshStoredFiles}
            className="px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            disabled={busy}
          >
            Refresh
          </button>
        </div>

        <div className="mt-4">
          {filesLoading ? (
            <div className="text-slate-500">Loading files…</div>
          ) : storedFiles.length === 0 ? (
            <div className="text-slate-600">
              No files found. Go back to the Upload step and add your manuscript files before paying.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {storedFiles.map((f) => (
                <div key={f.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{f.name}</div>
                    <div className="text-xs text-slate-500">
                      <span className="mr-3">Tag: {f.tag || '—'}</span>
                      <span className="mr-3">Size: {formatBytes(f.size)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">Ready</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-xl p-6 bg-white">
        <PackageSelector value={pkgId} onChange={(nextId) => setOrder((prev) => ({ ...prev, packageId: nextId }))} />
      </div>

      <OrderSummary
        bookTitle={bookTitle}
        details={details}
        design={design}
        packageId={pkgId}
        packagePrices={PACKAGE_PRICES}
      />

      <PaymentDelivery
        packageId={pkgId}
        packagePrices={PACKAGE_PRICES}
        email={order?.deliveryEmail || ''}
        onEmailChange={(val) => setOrder((prev) => ({ ...prev, deliveryEmail: val }))}
        checkoutPayload={checkoutPayload}
        onPay={startCheckout}
        disabled={payDisabled}
      />

      <div className="text-xs text-slate-500 text-center">
        Total shown: <span className="font-semibold">${total}</span>
      </div>
    </div>
  );
}
