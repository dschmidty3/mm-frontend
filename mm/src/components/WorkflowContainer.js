// mm/src/components/WorkflowContainer.js
import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useWorkflow } from '../store/workflowContext';
import SaveProgressPrompt from './SaveProgressPrompt';

const STEPS = [
  { num: 1, label: 'Upload', route: '/workflow/start' },
  { num: 2, label: 'Design', route: '/workflow/design' },
  { num: 3, label: 'Preview', route: '/workflow/preview' },
  { num: 4, label: 'Details', route: '/workflow/details' },
  { num: 5, label: 'Order & Download', route: '/workflow/order' },

];

const WorkflowContainer = ({
  children,
  title,
  description,
  step,
  canProceed = false,
  onNext,
  onPrevious,
  hideNext = false,
  hidePrevious = false,
  disableSavePrompt = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // hooks must be called at top level
  const { bookDetails, manuscriptFiles, design, details } = useWorkflow();

  const [showSavePrompt, setShowSavePrompt] = useState(false);

  const totalSteps = STEPS.length;

  const progressPercent = useMemo(() => {
    return Math.round((Math.min(Math.max(step, 1), totalSteps) / totalSteps) * 100);
  }, [step, totalSteps]);

  const hasProgress = useMemo(() => {
    const hasBook = Object.values(bookDetails || {}).some(
      (v) => String(v || '').trim().length > 0
    );

    const hasFiles = Array.isArray(manuscriptFiles) && manuscriptFiles.length > 0;

    const hasDesign =
      design && (design.typography || design.layout || design.trim);

    const hasDetails =
      details && ((details.firstName || '').trim() || (details.lastName || '').trim());

    return hasBook || hasFiles || hasDesign || hasDetails;
  }, [bookDetails, manuscriptFiles, design, details]);

  const goNextByStep = () => {
    const idx = STEPS.findIndex((s) => s.num === step);
    if (idx >= 0 && STEPS[idx + 1]) {
      navigate(STEPS[idx + 1].route);
    }
  };

  const goPrevByStep = () => {
    const idx = STEPS.findIndex((s) => s.num === step);
    if (idx > 0 && STEPS[idx - 1]) {
      navigate(STEPS[idx - 1].route);
    } else {
      navigate('/');
    }
  };

  const handleNext = () => {
    if (hideNext) return;

    const isAuthenticated = false; // placeholder

    if (!disableSavePrompt && !isAuthenticated && hasProgress && step === 1) {
      setShowSavePrompt(true);
      return;
    }

    if (typeof onNext === 'function') {
      onNext();
      return;
    }

    goNextByStep();
  };

  const handlePrevious = () => {
    if (hidePrevious) return;

    if (typeof onPrevious === 'function') {
      onPrevious();
      return;
    }

    goPrevByStep();
  };

  const handleSaveWithoutAccount = () => {
    setShowSavePrompt(false);
    if (typeof onNext === 'function') onNext();
    else goNextByStep();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
                {title}
              </h1>
              <p className="text-lg text-slate-500">{description}</p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm text-slate-500 mb-2">
                Step {step} of {totalSteps}
              </p>

              {/* Inline progress bar (no Progress component) */}
              <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-blue-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center space-x-4">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div
                  className={[
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
                    s.num <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500',
                  ].join(' ')}
                >
                  {s.num}
                </div>

                <span className="ml-3 text-sm font-medium hidden sm:block text-slate-600">
                  {s.label}
                </span>

                {i < STEPS.length - 1 && (
                  <div
                    className={[
                      'flex-1 h-0.5 mx-4',
                      s.num < step ? 'bg-blue-600' : 'bg-slate-200',
                    ].join(' ')}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-10">
            {children}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="flex justify-between items-center">
          {!hidePrevious ? (
            <button
              type="button"
              onClick={handlePrevious}
              className="inline-flex items-center px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Back to Home' : 'Previous'}
            </button>
          ) : (
            <div />
          )}

          {!hideNext && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className={[
                'inline-flex items-center px-6 py-2 rounded-md text-white font-semibold',
                canProceed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed',
              ].join(' ')}
            >
              {step === totalSteps ? 'Complete' : 'Continue'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>

      {/* Save progress prompt */}
      <SaveProgressPrompt
        isOpen={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        onSaveWithoutAccount={handleSaveWithoutAccount}
      />
    </div>
  );
};

export default WorkflowContainer;

