import React from 'react';

const PACKAGES = [
  {
    id: 'basic',
    title: 'Basic Package',
    price: 49,
    subtitle: 'Essential files for self-publishing',
    bullets: [
      'Print PDF (PDF/X-1a compliant)',
      'EPUB3 for digital distribution',
      'Basic metadata JSON',
      'Email delivery',
    ],
    badge: null,
  },
  {
    id: 'standard',
    title: 'Standard Package',
    price: 99,
    subtitle: 'Complete publishing toolkit',
    bullets: [
      'Everything in Basic',
      'Multi-platform optimization',
      'Enhanced metadata with keywords',
      'Platform submission guidelines',
      'Priority email support',
    ],
    badge: 'Most Popular',
  },
  {
    id: 'premium',
    title: 'Premium Package',
    price: 199,
    subtitle: 'Professional publishing suite',
    bullets: [
      'Everything in Standard',
      'Professional cover suggestions',
      'Marketing copy templates',
      'ISBN registration assistance',
      'Distribution strategy guide',
      'White-glove setup support',
    ],
    badge: null,
  },
];

const Check = () => (
  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-sm">
    ✓
  </span>
);

export default function PackageSelector({ value = 'standard', onChange }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900">Choose Your Package</h2>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {PACKAGES.map((p) => {
          const selected = value === p.id;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange && onChange(p.id)}
              className={[
                'text-left border rounded-xl p-6 bg-white relative transition',
                selected ? 'border-blue-600 ring-1 ring-blue-200' : 'border-slate-200 hover:border-slate-300',
              ].join(' ')}
            >
              {p.badge ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white">
                    {p.badge}
                  </span>
                </div>
              ) : null}

              <div className="text-center">
                <div className="text-lg font-semibold text-slate-900">{p.title}</div>
                <div className="text-4xl font-extrabold text-blue-600 mt-2">${p.price}</div>
                <div className="text-sm text-slate-500 mt-2">{p.subtitle}</div>
              </div>

              <ul className="mt-6 space-y-3">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check />
                    <span className="leading-5">{b}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}

