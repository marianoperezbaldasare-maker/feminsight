'use client';

import { Session, SEGMENT_KEYS, SEGMENT_META, Sentiment } from '@/types';

interface ResultsProps {
  session: Session;
  onExportPDF: () => void;
  onNewAnalysis: () => void;
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
      className="bg-white rounded-2xl p-6 shadow-sm"
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

function ExecutiveSummaryCard({ session }: { session: Session }) {
  const { executive_summary } = session.result;
  const sentiment = sentimentConfig[executive_summary.overall_sentiment];
  const bestSegmentKey = SEGMENT_KEYS.find(
    (k) => SEGMENT_META[k].label === executive_summary.best_segment
  );
  const bestMeta = bestSegmentKey ? SEGMENT_META[bestSegmentKey] : null;

  return (
    <div className="bg-[#0F1B2D] rounded-2xl p-4 md:p-8 border border-white/10 print-break-before">
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

export default function Results({ session, onExportPDF, onNewAnalysis }: ResultsProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F6FA]" id="results-print-area">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-5 no-print">
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
      </div>

      {/* Print header */}
      <div className="print-only px-8 py-6">
        <div className="text-2xl font-bold text-gray-900">FemInsight — Focus Group Report</div>
        <div className="text-gray-500 text-sm mt-1">{session.name} · {session.category} · {new Date(session.date).toLocaleDateString()}</div>
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border text-gray-700 text-sm">{session.idea}</div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 md:py-8 space-y-4 md:space-y-6">
        {/* Segment score overview */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 no-print">
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

        {/* Segment cards grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {SEGMENT_KEYS.map((key) => (
            <SegmentCard key={key} segKey={key} session={session} />
          ))}
        </div>

        {/* Executive Summary */}
        <ExecutiveSummaryCard session={session} />
      </div>
    </div>
  );
}
