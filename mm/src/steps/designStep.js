// mm/src/steps/designStep.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../store/workflowContext';

// Live Preview (right panel) text — three short paragraphs
const LIVE_PARAS = [
  'In the quiet town of Millbrook, where autumn leaves danced through cobblestone streets and the scent of fresh bread wafted from corner bakeries, something remarkable was about to unfold.',
  'Margaret closed her weathered journal, its pages filled with decades of dreams and observations. Today marked the beginning of a new chapter—not just in her writing, but in her life.',
  '"Every story begins with a single word," she whispered to herself, pen hovering over a fresh page. "And every word carries the weight of possibility."',
];

// One-line sample shown ONLY in the Typography cards on the left
const SAMPLE_SENTENCE = 'The quick brown fox jumps over the lazy dog.';

const TYPE_OPTIONS = [
  { key: 'hybrid', title: 'Hybrid Approach', desc: 'Strategic combination using serif for body and sans-serif for headings', badge: 'AI Pick' },
  { key: 'serif',  title: 'Serif Fonts',     desc: 'Classic elegance for literary/traditional genres' },
  { key: 'sans',   title: 'Sans-Serif Fonts',desc: 'Modern appeal for contemporary/technical content' },
];

const LAYOUT_OPTIONS = [
  { key: 'standard', title: 'Standard', desc: 'Balanced composition for broad appeal and professional appearance', badge: 'AI Pick' },
  { key: 'spacious', title: 'Spacious', desc: 'More white space and enhanced readability' },
  { key: 'compact',  title: 'Compact',  desc: 'Efficient space utilization while maintaining readability' },
];

const TRIM_OPTIONS = [
  { key: '5.5x8.5', title: '5.5" × 8.5"', desc: 'Versatile format that works well for mid-length books', badge: 'AI Pick' },
  { key: '5x8',     title: '5" × 8"',     desc: 'Compact format ideal for shorter works like romance, YA, and poetry' },
  { key: '6x9',     title: '6" × 9"',     desc: 'Standard trade paperback format perfect for novels and longer works' },
];

export default function DesignStep() {
  const { design, setDesign } = useWorkflow();
  const nav = useNavigate();

  // analyzing → recommendations
  const [phase, setPhase] = useState(design.analyzed ? 'recommend' : 'analyzing');

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const t = setTimeout(() => {
      setDesign((d) => ({ ...d, analyzed: true, typography: d.typography ?? 'hybrid' }));
      setPhase('recommend');
    }, 1200);
    return () => clearTimeout(t);
  }, [phase, setDesign]);

  // save → progress → preview
  useEffect(() => {
    if (!design.saving) return;
    if (design.saveProgress >= 100) return;
    const id = setInterval(() => {
      setDesign((d) => ({
        ...d,
        saveProgress: Math.min(100, d.saveProgress + Math.floor(12 + Math.random() * 18)),
      }));
    }, 220);
    return () => clearInterval(id);
  }, [design.saving, design.saveProgress, setDesign]);

  useEffect(() => {
    if (design.saving && design.saveProgress >= 100) {
      setDesign((d) => ({ ...d, saving: false, saved: true }));
      nav('/workflow/preview');
    }
  }, [design.saving, design.saveProgress, setDesign, nav]);

  // selections
  const selectTypography = (key) =>
    setDesign((d) => ({ ...d, typography: key, layout: null, trim: null, stage: 'typography', saved: false }));
  const selectLayout = (key) =>
    setDesign((d) => ({ ...d, layout: key, saved: false }));
  const selectTrim = (key) =>
    setDesign((d) => ({ ...d, trim: key, saved: false }));

  // live preview classes & trim sizing
  const ty = design.typography || 'hybrid';
  const layout = design.layout || 'standard';
  const trimKey = design.trim || '5.5x8.5';
  const trimText = trimKey.replace('x', '×');

  const headingClass = ty === 'serif' ? 'font-serif' : 'font-sans';
  const bodyClass    = ty === 'serif' ? 'font-serif' : ty === 'sans' ? 'font-sans' : 'font-serif';
  const subheadClass = ty === 'hybrid' ? 'font-sans text-slate-500' : `${headingClass} text-slate-500`;

  // Slight layout differences, but all readable and similar height
  const layoutBodyClass =
    layout === 'spacious' ? 'text-[16px] leading-8'
    : layout === 'compact' ? 'text-[15px] leading-6'
    : 'text-[15px] leading-7';

  // Trim size affects PREVIEW WIDTH only; height is natural so text always fits
  const previewWidthStyles = {
    '5.5x8.5': { width: '21rem' },   // base size
    '5x8':     { width: '19.5rem' }, // a bit narrower
    '6x9':     { width: '22.5rem' }, // a bit wider
  };
  const previewStyle = previewWidthStyles[trimKey] || previewWidthStyles['5.5x8.5'];

  // Lookups for Design Summary
  const typographyOption =
    TYPE_OPTIONS.find(o => o.key === design.typography) || TYPE_OPTIONS[0];
  const layoutOption =
    LAYOUT_OPTIONS.find(o => o.key === design.layout) || LAYOUT_OPTIONS[0];
  const trimOption =
    TRIM_OPTIONS.find(o => o.key === trimKey) || TRIM_OPTIONS[0];

  if (phase === 'analyzing') {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 flex flex-col items-center">
        <div className="text-2xl font-semibold text-slate-900 mb-2">Analyzing your book, one moment…</div>
        <div className="text-slate-500 mb-6">We’re reviewing content to recommend typography, layout, and trim.</div>
        <div className="w-full max-w-xl h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-2 bg-blue-500 animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: option cards */}
      <div className="space-y-6">
        {/* TYPOGRAPHY — keep the one-line sample */}
        {design.stage === 'typography' && (
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">Typography</h3>
            <div className="border rounded-xl p-4 bg-blue-50 border-blue-200">
              <div className="text-sm font-semibold text-blue-700 mb-1">✨ AI Recommendation</div>
              <div className="text-slate-600 text-sm">
                <span className="font-medium">Why hybrid:</span> Serif body + sans headings offers flexible, readable composition.
              </div>
            </div>
            {TYPE_OPTIONS.map((opt) => {
              const active = design.typography === opt.key;
              const b = opt.key === 'serif' ? 'font-serif' : opt.key === 'sans' ? 'font-sans' : 'font-serif';
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => selectTypography(opt.key)}
                  className={`w-full text-left border rounded-xl p-4 bg-white hover:bg-slate-50 transition ${
                    active ? 'ring-2 ring-blue-500 border-blue-300' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full border ${
                          active ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                          {active && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </span>
                        <div className="font-semibold">{opt.title}</div>
                        {opt.badge && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">{opt.desc}</div>
                    </div>
                  </div>
                  <div className={`mt-3 text-slate-800 ${b}`}>
                    {SAMPLE_SENTENCE}
                  </div>
                </button>
              );
            })}
          </section>
        )}

        {/* LAYOUT — title + description only */}
        {design.stage === 'layout' && (
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">Layout Density</h3>
            <div className="border rounded-xl p-4 bg-blue-50 border-blue-200">
              <div className="text-sm font-semibold text-blue-700 mb-1">✨ AI Recommendation</div>
              <div className="text-slate-600 text-sm">
                <span className="font-medium">Why standard:</span> Balanced composition with strong readability.
              </div>
            </div>
            {LAYOUT_OPTIONS.map((opt) => {
              const active = design.layout === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => selectLayout(opt.key)}
                  className={`w-full text-left border rounded-xl p-4 bg-white hover:bg-slate-50 transition ${
                    active ? 'ring-2 ring-blue-500 border-blue-300' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full border ${
                          active ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                          {active && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </span>
                        <div className="font-semibold">{opt.title}</div>
                        {opt.badge && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">{opt.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </section>
        )}

        {/* TRIM SIZE — title + description only */}
        {design.stage === 'trim' && (
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">Trim Size</h3>
            <div className="border rounded-xl p-4 bg-blue-50 border-blue-200">
              <div className="text-sm font-semibold text-blue-700 mb-1">✨ AI Recommendation</div>
              <div className="text-slate-600 text-sm">
                <span className="font-medium">Why 5.5×8.5:</span> Versatile format that works well for mid-length books.
              </div>
            </div>
            {TRIM_OPTIONS.map((opt) => {
              const active = design.trim === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => selectTrim(opt.key)}
                  className={`w-full text-left border rounded-xl p-4 bg-white hover:bg-slate-50 transition ${
                    active ? 'ring-2 ring-blue-500 border-blue-300' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full border ${
                          active ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                          {active && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </span>
                        <div className="font-semibold">{opt.title}</div>
                        {opt.badge && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">{opt.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </section>
        )}

        {/* SUMMARY — styled like your screenshot */}
        {design.stage === 'summary' && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-semibold">Design Summary</h3>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs">
                ✓
              </span>
            </div>

            <div className="border rounded-2xl p-6 bg-white space-y-4">
              {/* Typography block */}
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Typography</div>
                <div className="font-semibold text-slate-900">{typographyOption.title.replace(' Approach', '')}</div>
                <div className="text-sm text-slate-600 mt-1">{typographyOption.desc}</div>
              </div>

              {/* Layout block */}
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Layout Density</div>
                <div className="font-semibold text-slate-900">{layoutOption.title}</div>
                <div className="text-sm text-slate-600 mt-1">{layoutOption.desc}</div>
              </div>

              {/* Trim block */}
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Book Size</div>
                <div className="font-semibold text-slate-900">{trimOption.title}</div>
                <div className="text-sm text-slate-600 mt-1">{trimOption.desc}</div>
              </div>

              {/* Optional save progress bar if currently saving */}
              {design.saving && (
                <div className="pt-2">
                  <div className="text-sm text-slate-600 mb-1">
                    Saving your design… {design.saveProgress}%
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-blue-600 transition-all"
                      style={{ width: `${design.saveProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* RIGHT: Live Preview with three distinct paragraphs, width changes by trim */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="text-sm text-slate-500 mb-2">
          Live Preview – {trimText}" Format
        </div>
        <div
          className="border rounded-xl p-6 shadow-sm mx-auto"
          style={previewStyle}
        >
          <h2 className={`text-3xl font-bold mb-2 ${headingClass}`}>Chapter One</h2>
          <h3 className={`text-xl mb-4 ${subheadClass}`}>The Beginning</h3>
          {LIVE_PARAS.map((p, i) => (
            <p key={i} className={`mb-3 ${bodyClass} ${layoutBodyClass}`}>{p}</p>
          ))}
          <div className="mt-6 text-xs text-slate-500 grid grid-cols-3 gap-2">
            <div>Typography <span className="font-medium capitalize">{ty}</span></div>
            <div>Layout <span className="font-medium capitalize">{layout}</span></div>
            <div>Size <span className="font-medium">{trimText}"</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

