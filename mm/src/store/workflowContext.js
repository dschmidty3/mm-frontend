// mm/src/store/workflowContext.js
import React, { createContext, useContext, useMemo, useState } from 'react';

const WorkflowContext = createContext(null);

export function WorkflowProvider({ children }) {
  // --- Upload step state ---
  const [manuscriptFiles, setManuscriptFiles] = useState([]);
  const [uploadPhase, setUploadPhase] = useState('select'); // select | ready | metadata

  // --- Book meta (used in upload metadata + preview title page) ---
  const [bookDetails, setBookDetails] = useState({
    title: '',
    author: '', // this is what previewStage.js reads (bookDetails.author)
    category: '',
    subcategory: '',
  });

  // --- Design step state ---
  const [design, setDesign] = useState({
    analyzed: false,
    stage: 'typography',
    typography: '',
    layout: '',
    trim: '6x9',
  });

  // --- Details step state ---
  const [details, setDetails] = useState({
    // author info in details step (separate from bookDetails.author)
    prefix: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',

    contributors: [],

    ageRanges: [],
    demographics: [],
    distributionChannels: [],
    publishingTimeline: '',
    authorExperienceLevel: '',

    marketPositioning: '',
    seriesInformation: '',
    brandingPreferences: '',
    marketingObjectives: '',
  });

  // --- Order/payment state ---
  const [order, setOrder] = useState({
    packageId: 'standard',
    deliveryEmail: '',
    paymentStatus: 'idle', // idle | processing | paid | failed
    lastCheckoutSessionId: '',
  });

  // ---------- Helpers ----------
  const addFile = (fileObj) => {
    if (!fileObj || !fileObj.id) return;
    setManuscriptFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === fileObj.id);
      if (idx === -1) return [...prev, fileObj];
      const next = [...prev];
      next[idx] = { ...next[idx], ...fileObj };
      return next;
    });
  };

  const removeFile = (id) => {
    setManuscriptFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const value = useMemo(
    () => ({
      // upload
      manuscriptFiles,
      setManuscriptFiles,
      addFile,
      removeFile,
      uploadPhase,
      setUploadPhase,

      // book meta
      bookDetails,
      setBookDetails,

      // design
      design,
      setDesign,

      // details
      details,
      setDetails,

      // order/payment
      order,
      setOrder,
    }),
    [manuscriptFiles, uploadPhase, bookDetails, design, details, order]
  );

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) {
    throw new Error('useWorkflow must be used inside <WorkflowProvider>');
  }
  return ctx;
}
