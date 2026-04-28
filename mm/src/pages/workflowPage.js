// mm/src/pages/workflowPage.js
import React, { useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import WorkflowContainer from '../components/WorkflowContainer';
import UploadStep from '../steps/uploadStep';
import DesignStep from '../steps/designStep';
import PreviewStep from '../steps/previewStage';
import DetailsStep from '../steps/detailsStep';
import CompleteOrderStep from '../steps/completeOrderStep';
import { useWorkflow } from '../store/workflowContext';

const WorkflowPage = () => {
  const nav = useNavigate();

  const {
    manuscriptFiles,
    uploadPhase,
    setUploadPhase,
    bookDetails,
    design,
    setDesign,
    details,
    order,
  } = useWorkflow();

  // ---- STEP 1: Upload gating ----
  const hasFiles = !!(manuscriptFiles && manuscriptFiles.length > 0);

  const isSelect = uploadPhase === 'select';
  const isReady = uploadPhase === 'ready';
  const isMeta = uploadPhase === 'metadata';

  // require title + author + category + subcategory
  const metaComplete = useMemo(() => {
    if (!isMeta) return false;

    const t = (bookDetails?.title || '').trim();
    const a = (bookDetails?.author || '').trim();
    const c = (bookDetails?.category || '').trim();
    const s = (bookDetails?.subcategory || '').trim();

    return t.length > 0 && a.length > 0 && c.length > 0 && s.length > 0;
  }, [isMeta, bookDetails]);

  const hideNextUpload = isReady;
  const canProceedUpload = isMeta ? metaComplete : hasFiles;

  const handleUploadNext = () => {
    if (isSelect) {
      if (hasFiles) setUploadPhase('ready');
      return;
    }

    if (isReady) {
      setUploadPhase('metadata');
      return;
    }

    if (isMeta) {
      setDesign({
        ...(design || {}),
        analyzed: true,
        stage: 'typography',
      });
      nav('/workflow/design');
    }
  };

  const handleUploadPrevious = () => {
    if (isMeta) return setUploadPhase('ready');
    if (isReady) return setUploadPhase('select');
    nav('/');
  };

  // ---- STEP 2: Design mini-wizard ----
  const handleDesignNext = () => {
    if (!design) return;

    if (design.stage === 'typography') return setDesign({ ...design, stage: 'layout' });
    if (design.stage === 'layout') return setDesign({ ...design, stage: 'trim' });
    if (design.stage === 'trim') return setDesign({ ...design, stage: 'summary' });

    if (design.stage === 'summary') nav('/workflow/preview');
  };

  const handleDesignPrevious = () => {
    if (!design) return nav('/workflow/start');

    if (design.stage === 'summary') return setDesign({ ...design, stage: 'trim' });
    if (design.stage === 'trim') return setDesign({ ...design, stage: 'layout' });
    if (design.stage === 'layout') return setDesign({ ...design, stage: 'typography' });

    if (design.stage === 'typography') nav('/workflow/start');
  };

  const canProceedDesign = true;

  // ---- STEP 4: Details gating (required fields) ----
  const canProceedDetails = useMemo(() => {
    const fn = (details?.firstName || '').trim();
    const ln = (details?.lastName || '').trim();
    const ages = Array.isArray(details?.ageRanges) ? details.ageRanges : [];
    const demos = Array.isArray(details?.demographics) ? details.demographics : [];
    const chans = Array.isArray(details?.distributionChannels) ? details.distributionChannels : [];

    return fn.length > 0 && ln.length > 0 && ages.length > 0 && demos.length > 0 && chans.length > 0;
  }, [details]);

  // ---- STEP 5: Order gating ----
  const canProceedOrder = useMemo(() => {
    const pkg = (order?.packageId || '').trim();
    const email = (order?.deliveryEmail || '').trim();
    return pkg.length > 0 && email.length > 0;
  }, [order]);

  return (
    <Routes>
      {/* Upload & Organize */}
      <Route
        path="start"
        element={
          <WorkflowContainer
            title="Upload & Organize"
            description="Upload your manuscript files and organize them for formatting"
            step={1}
            hideNext={hideNextUpload}
            canProceed={canProceedUpload}
            onNext={handleUploadNext}
            disableSavePrompt={true}
            onPrevious={handleUploadPrevious}
          >
            <UploadStep />
          </WorkflowContainer>
        }
      />

      {/* Design */}
      <Route
        path="design"
        element={
          <WorkflowContainer
            title="Design Your Book"
            description="Customize typography, layout, and format with AI-powered recommendations"
            step={2}
            canProceed={canProceedDesign}
            onNext={handleDesignNext}
            onPrevious={handleDesignPrevious}
          >
            <DesignStep />
          </WorkflowContainer>
        }
      />

      {/* Preview */}
      <Route
        path="preview"
        element={
          <WorkflowContainer
            title="Preview"
            description="Check how pages will look with your chosen design"
            step={3}
            canProceed={true}
            onPrevious={() => nav('/workflow/design')}
            onNext={() => nav('/workflow/details')}
          >
            <PreviewStep />
          </WorkflowContainer>
        }
      />

      {/* Details */}
      <Route
        path="details"
        element={
          <WorkflowContainer
            title="Book Details"
            description="Complete your book information for publishing requirements"
            step={4}
            canProceed={canProceedDetails}
            onPrevious={() => nav('/workflow/preview')}
            onNext={() => nav('/workflow/order')}
          >
            <DetailsStep />
          </WorkflowContainer>
        }
      />

      {/* FINAL STEP: Order + Download */}
      <Route
        path="order"
        element={
          <WorkflowContainer
            title="Order & Download"
            description="Choose your package, pay securely, then download your files"
            step={5}
            canProceed={canProceedOrder}
            onPrevious={() => nav('/workflow/details')}
            hideNext={true}   // final screen: no “Continue”
          >
            <CompleteOrderStep />
          </WorkflowContainer>
        }
      />

      <Route index element={<Navigate to="start" replace />} />
    </Routes>
  );
};

export default WorkflowPage;
