'use client';

import { useState } from 'react';
import { Session, SEGMENT_KEYS, SEGMENT_META, Sentiment, GenZInsight, WebsiteInsight, AEOAnalysis } from '@/types';

interface ResultsProps {
  session: Session;
  onExportPDF: () => void;
  onNewAnalysis: () => void;
  onShare: () => void;
  onAEOResult?: (aeo: AEOAnalysis) => void;
  password?: string | null;
  shareMode?: boolean;
}

const sentimentConfig: Record<Sentiment, { color: string; bg: string; icon: string; label: string }> = {
  Positive: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: '↑', label: 'Positive' },
  Mixed: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: '~', label: 'Mixed' },
  Negative: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: '↓', label: 'Negative' },
};

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-gray-800 font-bold text-sm w-6 text-right">{score}</span>
      <span className="text-gray-400 text-xs">/10</span>
    </div>
  );
}

function SegmentCard({ segKey, session }: { segKey: (typeof SEGMENT_KEYS)[number]; session: Session }) {
  const meta = SEGMENT_META[segKey];
  const data = session.result.segments[segKey];

  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-sm print-card"
      style={{ borderTop: `3px solid ${meta.color}` }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: meta.bgLight }}
        >
          {meta.icon}
        </div>
        <div>
          <h3 className="text-gray-900 font-bold text-base">{meta.label}</h3>
          <p className="text-gray-400 text-xs mt-0.5">{meta.description}</p>
        </div>
      </div>

      {/* Gut reaction */}
      <div className="mb-5 px-4 py-3 rounded-xl bg-gray-50 border-l-3 border-l-2" style={{ borderLeftColor: meta.color }}>
        <p className="text-gray-700 text-sm italic leading-relaxed">&ldquo;{data.gut_reaction}&rdquo;</p>
      </div>

      {/* Loves */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What They Love</span>
        </div>
        <ul className="space-y-1.5">
          {data.loves.map((l, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
              {l}
            </li>
          ))}
        </ul>
      </div>

      {/* Concerns */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Concerns & Objections</span>
        </div>
        <ul className="space-y-1.5">
          {data.concerns.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-amber-400 mt-0.5 shrink-0">•</span>
              {c}
            </li>
          ))}
        </ul>
      </div>

      {/* Likelihood */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Purchase Likelihood</span>
        </div>
        <ScoreBar score={data.likelihood_score} color={meta.color} />
      </div>

      {/* Quote */}
      <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: meta.bgLight }}>
        <p className="text-gray-600 text-xs italic leading-relaxed">{data.quote}</p>
      </div>
    </div>
  );
}

function GenZInsightCard({ insight }: { insight: GenZInsight }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#7C3AED]/20 shadow-sm print-card">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              Z
            </div>
            <div>
              <div className="text-white font-bold text-base">Gen Z Women Pulse</div>
              <div className="text-white/70 text-xs">Born 1997–2009 · Ages 18–29 · ~1,500 respondents</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5">
            <div className="h-2 flex-1 min-w-[80px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${insight.likelihood_score * 10}%` }}
              />
            </div>
            <span className="text-white font-bold text-sm">{insight.likelihood_score}</span>
            <span className="text-white/60 text-xs">/10</span>
          </div>
        </div>
        <p className="text-white/90 text-sm mt-4 italic leading-relaxed">&ldquo;{insight.headline}&rdquo;</p>
      </div>

      {/* Body */}
      <div className="bg-white px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* What resonates */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <svg className="w-3.5 h-3.5 text-[#7C3AED]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What Resonates</span>
          </div>
          <ul className="space-y-2">
            {insight.what_resonates.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#7C3AED] mt-0.5 shrink-0 font-bold">+</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* What misses */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <svg className="w-3.5 h-3.5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What Misses the Mark</span>
          </div>
          <ul className="space-y-2">
            {insight.what_misses.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-rose-400 mt-0.5 shrink-0 font-bold">−</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Cultural lens */}
        <div className="md:col-span-2 bg-[#7C3AED]/5 border border-[#7C3AED]/15 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-xs font-semibold text-[#7C3AED] uppercase tracking-wide">Cultural Lens</span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{insight.cultural_lens}</p>
        </div>

        {/* Quote */}
        <div className="md:col-span-2 border-l-2 border-[#7C3AED] pl-4">
          <p className="text-gray-600 text-xs italic leading-relaxed">{insight.quote}</p>
        </div>
      </div>
    </div>
  );
}

function WebsiteInsightCard({ insight }: { insight: WebsiteInsight }) {
  let hostname = insight.url;
  try { hostname = new URL(insight.url).hostname; } catch { /* keep url */ }

  return (
    <div className="rounded-2xl overflow-hidden border border-sky-200 shadow-sm print-card">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-teal-500 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-base">Website Analysis</div>
              <a href={insight.url} target="_blank" rel="noopener noreferrer"
                className="text-white/70 text-xs hover:text-white/90 transition-colors">
                {hostname}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5">
            <div className="h-2 w-20 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${insight.score * 10}%` }}
              />
            </div>
            <span className="text-white font-bold text-sm">{insight.score}</span>
            <span className="text-white/60 text-xs">/10</span>
          </div>
        </div>
        <p className="text-white/90 text-sm mt-4 italic leading-relaxed">&ldquo;{insight.first_impression}&rdquo;</p>
      </div>

      {/* Body */}
      <div className="bg-white px-6 py-5 space-y-5">
        {/* Messaging + Visual + CTA row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
            <div className="text-[10px] font-semibold text-sky-600 uppercase tracking-wide mb-1.5">Messaging Clarity</div>
            <p className="text-gray-700 text-xs leading-relaxed">{insight.messaging_clarity}</p>
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
            <div className="text-[10px] font-semibold text-teal-600 uppercase tracking-wide mb-1.5">Visual Appeal</div>
            <p className="text-gray-700 text-xs leading-relaxed">{insight.visual_appeal}</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide mb-1.5">Call to Action</div>
            <p className="text-gray-700 text-xs leading-relaxed">{insight.call_to_action}</p>
          </div>
        </div>

        {/* Strengths + Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What Works</span>
            </div>
            <ul className="space-y-1.5">
              {insight.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-emerald-400 mt-0.5 shrink-0">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Improvements</span>
            </div>
            <ul className="space-y-1.5">
              {insight.improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-amber-400 mt-0.5 shrink-0">•</span>{imp}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quote */}
        <div className="border-l-2 border-sky-400 pl-4">
          <p className="text-gray-600 text-xs italic leading-relaxed">{insight.quote}</p>
        </div>
      </div>
    </div>
  );
}

function AEOResultCard({ aeo }: { aeo: AEOAnalysis }) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor = (s: number) =>
    s >= 8 ? '#10B981' : s >= 5 ? '#F59E0B' : '#EF4444';

  const totalColor = scoreColor(aeo.total);

  const bars = [
    { label: 'C — Clarity', value: aeo.clarity, color: '#0EA5E9' },
    { label: 'I — Information Density', value: aeo.information_density, color: '#8B5CF6' },
    { label: 'T — Trust Signals', value: aeo.trust_signals, color: '#F59E0B' },
    { label: 'E — Extractability', value: aeo.extractability, color: '#10B981' },
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-emerald-200 shadow-sm print-card">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-base">AEO Analysis</div>
              <div className="text-white/70 text-xs">AI Engine Optimization · CITE Score Framework</div>
            </div>
          </div>
          {/* Total score badge */}
          <div className="flex items-center gap-2 bg-white/15 rounded-full px-4 py-2">
            <span className="text-white font-black text-2xl">{aeo.total}</span>
            <span className="text-white/60 text-sm">/10</span>
          </div>
        </div>
      </div>

      <div className="bg-white px-6 py-5 space-y-6">
        {/* CITE bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bars.map((bar) => (
            <div key={bar.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 font-medium">{bar.label}</span>
                <span className="font-bold" style={{ color: scoreColor(bar.value) }}>{bar.value}/10</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${bar.value * 10}%`, backgroundColor: bar.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Gap diagnosis */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Why LLMs may ignore this content</span>
          </div>
          <ul className="space-y-2">
            {aeo.gap_diagnosis.map((gap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-amber-400 mt-0.5 shrink-0 font-bold">!</span>{gap}
              </li>
            ))}
          </ul>
        </div>

        {/* Quick wins */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Wins — implementable in &lt;10 min</span>
          </div>
          <div className="space-y-2">
            {aeo.quick_wins.map((win, i) => (
              <div key={i} className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                <span className="text-emerald-600 font-bold text-sm shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-sm text-gray-700">{win}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Optimized content — collapsible */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-semibold text-gray-700">Versión Optimizada para LLMs</span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expanded && (
            <div className="px-4 py-4 bg-white">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">{aeo.optimized_content}</pre>
            </div>
          )}
        </div>

        {/* Score context */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: totalColor }} />
          <span>
            CITE Score {aeo.total}/10 —{' '}
            {aeo.total >= 8 ? 'Excelente — muy probable que los LLMs citen este contenido'
              : aeo.total >= 6 ? 'Bueno — con mejoras puede dominar su nicho en IA'
              : aeo.total >= 4 ? 'Regular — los LLMs probablemente no lo citen sin cambios'
              : 'Bajo — requiere reescritura para ser visible en IA'}
          </span>
        </div>
      </div>
    </div>
  );
}

function ExecutiveSummaryCard({ session }: { session: Session }) {
  const { executive_summary } = session.result;
  const sentiment = sentimentConfig[executive_summary.overall_sentiment];
  const bestSegmentKey = SEGMENT_KEYS.find(
    (k) => SEGMENT_META[k].label === executive_summary.best_segment
  );
  const bestMeta = bestSegmentKey ? SEGMENT_META[bestSegmentKey] : null;

  return (
    <div className="bg-[#0F1B2D] rounded-2xl p-4 md:p-8 border border-white/10 print-card print-break-before">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-white font-bold text-xl mb-1">Executive Summary</h3>
          <p className="text-white/40 text-sm">Synthesis across all 10,000 respondents</p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full border"
          style={{
            backgroundColor: sentiment.bg,
            borderColor: `${sentiment.color}40`,
          }}
        >
          <span className="text-lg font-bold" style={{ color: sentiment.color }}>
            {sentiment.icon}
          </span>
          <span className="font-semibold text-sm" style={{ color: sentiment.color }}>
            {sentiment.label} Sentiment
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Top Insights */}
        <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.07]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">Top Insights</span>
          </div>
          <ol className="space-y-2">
            {executive_summary.top_insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold text-xs mt-0.5 w-4 shrink-0">{i + 1}.</span>
                <span className="text-white/75 text-sm leading-relaxed">{insight}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Top Objections */}
        <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.07]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Address These First</span>
          </div>
          <ol className="space-y-2">
            {executive_summary.top_objections.map((obj, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-amber-500 font-bold text-xs mt-0.5 w-4 shrink-0">{i + 1}.</span>
                <span className="text-white/75 text-sm leading-relaxed">{obj}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Recommendation */}
        <div className="bg-[#7C3AED]/10 rounded-xl p-5 border border-[#7C3AED]/25 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-[#7C3AED]/30 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#a78bfa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-[#a78bfa] text-xs font-semibold uppercase tracking-wide">Strategic Recommendation</span>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">{executive_summary.recommendation}</p>

          {bestMeta && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
              <span className="text-white/40 text-xs">Best segment match:</span>
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                style={{
                  backgroundColor: `${bestMeta.color}20`,
                  borderColor: `${bestMeta.color}40`,
                  color: bestMeta.color,
                }}
              >
                <span>{bestMeta.icon}</span>
                {bestMeta.label}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Results({ session, onExportPDF, onNewAnalysis, onShare, onAEOResult, password, shareMode }: ResultsProps) {
  const [aeoLoading, setAeoLoading] = useState(false);
  const [aeoError, setAeoError] = useState<string | null>(null);

  async function handleRunAEO() {
    setAeoLoading(true);
    setAeoError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['x-access-password'] = password;
      const res = await fetch('/api/aeo-study', {
        method: 'POST',
        headers,
        body: JSON.stringify({ idea: session.idea, category: session.category }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'AEO analysis failed');
      onAEOResult?.(data);
    } catch (err) {
      setAeoError(err instanceof Error ? err.message : 'AEO analysis failed');
    } finally {
      setAeoLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F6FA]" id="results-print-area">
      {/* Header — hidden in share mode (ShareView has its own header) */}
      {!shareMode && (<div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-5 no-print">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-gray-500 text-xs px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
                  {session.category}
                </span>
                <span className="text-gray-400 text-xs hidden sm:inline">
                  {new Date(session.date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>
              <h1 className="text-gray-900 text-lg md:text-xl font-bold truncate">{session.name}</h1>
              <p className="text-gray-500 text-xs md:text-sm mt-1 line-clamp-2">{session.idea}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onShare}
                className="p-2 md:flex md:items-center md:gap-2 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 transition-all"
                title="Share"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden md:inline text-sm">Share</span>
              </button>
              <button
                onClick={onExportPDF}
                className="p-2 md:flex md:items-center md:gap-2 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 transition-all"
                title="Export PDF"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden md:inline text-sm">Export PDF</span>
              </button>
              <button
                onClick={onNewAnalysis}
                className="p-2 md:flex md:items-center md:gap-2 md:px-4 md:py-2 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg text-white transition-all"
                title="New Analysis"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden md:inline text-sm font-medium">New Analysis</span>
              </button>
            </div>
          </div>
        </div>
      </div>)}

      {/* Print header */}
      <div className="print-only px-8 py-6">
        <div className="text-2xl font-bold text-gray-900">FemInsight — Focus Group Report</div>
        <div className="text-gray-500 text-sm mt-1">{session.name} · {session.category} · {new Date(session.date).toLocaleDateString()}</div>
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border text-gray-700 text-sm">{session.idea}</div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 md:py-8 space-y-4 md:space-y-6">
        {/* Segment score overview */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 print-card">
          <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">Likelihood Scores by Segment</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {SEGMENT_KEYS.map((key) => {
              const meta = SEGMENT_META[key];
              const score = session.result.segments[key].likelihood_score;
              return (
                <div key={key} className="text-center">
                  <div
                    className="text-2xl font-black mb-1"
                    style={{ color: meta.color }}
                  >
                    {score}
                  </div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
                    {meta.label.split(' ')[0]}
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${score * 10}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Analyzed Materials */}
        {((session.images && session.images.length > 0) || (session.urls && session.urls.length > 0)) && (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 print-card">
            <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">
              Analyzed Materials
            </h2>
            <div className="flex flex-wrap gap-3">
              {session.images && session.images.map((img) => (
                <div key={img.id} className="flex flex-col items-center gap-1.5">
                  <img
                    src={img.previewUrl || `data:${img.mediaType};base64,${img.base64}`}
                    alt={img.name}
                    className="h-28 w-auto rounded-xl border border-gray-200 object-cover shadow-sm"
                  />
                  <span className="text-[10px] text-gray-400 max-w-[100px] truncate">{img.name}</span>
                </div>
              ))}
              {session.urls && session.urls.map((url) => {
                let hostname = url;
                try { hostname = new URL(url).hostname; } catch { /* keep url as fallback */ }
                const screenshotUrl = `https://image.thum.io/get/width/600/crop/400/noanimate/${url}`;
                return (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 group">
                    <div className="h-28 w-44 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 shadow-sm relative">
                      <img
                        src={screenshotUrl}
                        alt={`Screenshot of ${hostname}`}
                        className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const el = e.currentTarget as HTMLImageElement;
                          el.style.display = 'none';
                          const parent = el.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="h-full w-full flex flex-col items-center justify-center gap-2 p-3"><svg class="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.1-1.1m-.758-4.9a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg><span class="text-[10px] text-gray-400 text-center break-all">${hostname}</span></div>`;
                          }
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[#7C3AED] max-w-[176px] truncate">{hostname}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Segment cards grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {SEGMENT_KEYS.map((key) => (
            <SegmentCard key={key} segKey={key} session={session} />
          ))}
        </div>

        {/* Gen Z Pulse */}
        {session.result.gen_z_insight && (
          <GenZInsightCard insight={session.result.gen_z_insight} />
        )}

        {/* Website Analysis */}
        {session.result.website_insights && session.result.website_insights.length > 0 && (
          <div className="space-y-4">
            {session.result.website_insights.map((wi, i) => (
              <WebsiteInsightCard key={i} insight={wi} />
            ))}
          </div>
        )}

        {/* Executive Summary */}
        <ExecutiveSummaryCard session={session} />

        {/* AEO Analysis */}
        {session.result.aeo_analysis ? (
          <AEOResultCard aeo={session.result.aeo_analysis} />
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-gray-900 font-semibold text-sm">AEO Analysis — CITE Score</div>
                <div className="text-gray-400 text-xs mt-0.5">Optimize this content to be cited by AI engines</div>
                {aeoError && <div className="text-red-500 text-xs mt-1">{aeoError}</div>}
              </div>
            </div>
            <button
              onClick={handleRunAEO}
              disabled={aeoLoading}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
            >
              {aeoLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Run AEO Analysis
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
