// mm/src/pages/home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Badge = ({ text }) => (
  <div className="flex items-center gap-2 text-slate-200/90 text-sm">
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/50">
      <span className="text-xs">✔</span>
    </span>
    <span>{text}</span>
  </div>
);

const Home = () => {
  const nav = useNavigate();

  return (
    <section
      className="relative min-h-[78vh] flex items-center"
      style={{
        backgroundImage: "url('/hero-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* dark overlay to match screenshot contrast */}
      <div className="absolute inset-0 bg-slate-900/60" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-20">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white text-center max-w-5xl mx-auto">
          From Manuscript to Published{' '}
          <span className="block">
            in <span className="text-blue-300">10 Minutes</span>
          </span>
          <span className="block">- Guaranteed!</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-100/90 text-center max-w-3xl mx-auto">
          AI-powered formatting that guarantees acceptance across Amazon KDP, IngramSpark, and Apple Books.
          From upload to published — in just 10 minutes.
        </p>

        {/* badges row */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
          <Badge text="99.5% Platform Acceptance" />
          <Badge text="AI-Powered Formatting" />
          <Badge text="Professional Quality" />
          <Badge text="All Major Platforms" />
        </div>

        {/* CTAs */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={() => nav('/workflow/start')}
            className="rounded-md px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            Start Formatting Now
          </button>
          <button
            onClick={() => nav('/workflow/start')}
            className="rounded-md px-6 py-3 border border-white/40 text-white/90 hover:bg-white/10"
          >
            See How It Works
          </button>
        </div>

        {/* social proof */}
        <div className="mt-8 text-sm text-slate-200/80 text-center">
          Trusted by 10,000+ authors worldwide • ★ 4.9/5 average rating
        </div>
      </div>
    </section>
  );
};

export default Home;

