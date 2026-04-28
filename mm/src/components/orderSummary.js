import React, { useMemo } from 'react';

export default function OrderSummary({
  bookTitle = '',
  details,
  design,
  packageId = 'standard',
  packagePrices = {},
}) {
  const total = useMemo(() => {
    const n = packagePrices?.[packageId];
    return Number.isFinite(n) ? n : 0;
  }, [packageId, packagePrices]);

  const authorName = useMemo(() => {
    const first = (details?.firstName || '').trim();
    const last = (details?.lastName || '').trim();
    const prefix = (details?.prefix || '').trim();
    const suffix = (details?.suffix || '').trim();

    const core = [first, last].filter(Boolean).join(' ');
    const withPrefix = prefix ? `${prefix} ${core}`.trim() : core;
    const withSuffix = suffix ? `${withPrefix} ${suffix}`.trim() : withPrefix;

    return withSuffix || '—';
  }, [details]);

  const formatLine = useMemo(() => {
    const trim = design?.trim ? String(design.trim) : '—';
    const typo = design?.typography ? String(design.typography) : '—';
    const layout = design?.layout ? String(design.layout) : '—';
    return `${trim} • ${typo} • ${layout}`;
  }, [design]);

  return (
    <div className="border rounded-xl p-6 bg-white">
      <h2 className="text-2xl font-semibold text-slate-900">Order Summary</h2>

      <div className="mt-6 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="text-slate-600">Book Title:</div>
          <div className="text-slate-900 font-medium">{bookTitle || '—'}</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-slate-600">Author:</div>
          <div className="text-slate-900 font-medium">{authorName}</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-slate-600">Format:</div>
          <div className="text-slate-900 font-medium">{formatLine}</div>
        </div>
      </div>

      <div className="mt-6 border-t pt-4 flex items-center justify-between">
        <div className="text-slate-900 font-semibold">Total:</div>
        <div className="text-slate-900 font-extrabold text-lg">${total}</div>
      </div>
    </div>
  );
}

