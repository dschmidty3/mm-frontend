// mm/src/steps/downloadStep.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../store/workflowContext';

export default function DownloadStep() {
  const nav = useNavigate();
  const { order } = useWorkflow();

  const isPaid = order?.paymentStatus === 'paid';

  useEffect(() => {
    // Gate downloads
    if (!isPaid) {
      nav('/workflow/order', { replace: true });
    }
  }, [isPaid, nav]);

  if (!isPaid) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Payment Required</h2>
        <p className="mt-2 text-slate-600">You must complete payment before downloading your formatted files.</p>

        <button
          type="button"
          onClick={() => nav('/workflow/order')}
          className="mt-6 px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Go to Order
        </button>
      </div>
    );
  }

  return (
    <div className="text-center bg-white border border-slate-200 rounded-xl p-8">
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">Download Your Files</h2>
      <p className="text-slate-600">
        Your formatted manuscript and print-ready files will be available here after processing.
      </p>

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
    </div>
  );
}
