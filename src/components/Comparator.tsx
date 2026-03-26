'use client';

import { Session, SEGMENT_KEYS, SEGMENT_META } from '@/types';

interface ComparatorProps {
  sessionA: Session;
  sessionB: Session;
  onClose: () => void;
}

function ScoreBar({ score, color, size = 'sm' }: { score: number; color: string; size?: 'sm' | 'lg' }) {
  return (
    <div className={`flex items-center gap-2 ${size === 'lg' ? '' : ''}`}>
      <div className={`flex-1 ${size === 'lg' ? 'h-2.5' : 'h-1.5'} bg-white/10 rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className={`font-bold text-white ${size === 'lg' ? 'text-base w-5' : 'text-xs w-4'} text-right`}>
        {score}
      </span>
    </div>
  );
}

export default function Comparator({ sessionA, sessionB, onClose }: ComparatorProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0a1020]">
      {/* Header */}
      <div className="bg-[#0F1B2D] border-b border-white/[0.07] px-8 py-5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-white font-bold text-xl">Session Comparator</h1>
            <p className="text-white/40 text-sm mt-0.5">Side-by-side analysis across all 6 segments</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.12] rounded-lg text-white/70 hover:text-white text-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-8 space-y-4 md:space-y-6">
        {/* Session Headers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {[sessionA, sessionB].map((session, i) => (
            <div
              key={session.id}
              className={`rounded-2xl p-6 border ${i === 0 ? 'bg-[#0EA5E9]/[0.08] border-[#0EA5E9]/25' : 'bg-[#7C3AED]/[0.08] border-[#7C3AED]/25'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center ${i === 0 ? 'bg-[#0EA5E9]' : 'bg-[#7C3AED]'}`}
                >
                  {i === 0 ? 'A' : 'B'}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wide ${i === 0 ? 'text-[#38bdf8]' : 'text-[#a78bfa]'}`}>
                  Session {i === 0 ? 'A' : 'B'}
                </span>
              </div>
              <h2 className="text-white font-bold text-lg leading-tight">{session.name}</h2>
              <div className="text-white/40 text-xs mt-1">{session.category}</div>
              <p className="text-white/50 text-sm mt-3 leading-relaxed line-clamp-2">{session.idea}</p>
            </div>
          ))}
        </div>

        {/* Overall Scores */}
        <div className="bg-white/[0.04] rounded-2xl p-6 border border-white/[0.07]">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-5">Overall Likelihood Scores</h3>
          <div className="space-y-4">
            {SEGMENT_KEYS.map((key) => {
              const meta = SEGMENT_META[key];
              const scoreA = sessionA.result.segments[key].likelihood_score;
              const scoreB = sessionB.result.segments[key].likelihood_score;
              const winner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : null;

              return (
                <div key={key}>
                  {/* Segment label */}
                  <div className="text-white/50 text-xs font-medium mb-2 flex items-center gap-1.5">
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    {meta.label}
                    {winner === null && <span className="text-white/25 text-[9px] ml-1">(Tied)</span>}
                  </div>
                  {/* Scores row */}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    {/* Session A */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <ScoreBar score={scoreA} color={winner === 'A' ? meta.color : '#4B5563'} />
                      </div>
                      {winner === 'A' && (
                        <div className="bg-[#0EA5E9]/20 text-[#38bdf8] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#0EA5E9]/30 shrink-0">WIN</div>
                      )}
                    </div>
                    <div className="text-white/20 text-xs text-center shrink-0">vs</div>
                    {/* Session B */}
                    <div className="flex items-center gap-2">
                      {winner === 'B' && (
                        <div className="bg-[#7C3AED]/20 text-[#a78bfa] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#7C3AED]/30 shrink-0">WIN</div>
                      )}
                      <div className="flex-1">
                        <ScoreBar score={scoreB} color={winner === 'B' ? meta.color : '#4B5563'} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Segment-by-segment comparison */}
        {SEGMENT_KEYS.map((key) => {
          const meta = SEGMENT_META[key];
          const dataA = sessionA.result.segments[key];
          const dataB = sessionB.result.segments[key];
          const winner =
            dataA.likelihood_score > dataB.likelihood_score
              ? 'A'
              : dataB.likelihood_score > dataA.likelihood_score
              ? 'B'
              : null;

          return (
            <div key={key} className="bg-white/[0.03] rounded-2xl border border-white/[0.07] overflow-hidden">
              {/* Segment header */}
              <div
                className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between"
                style={{ borderTop: `2px solid ${meta.color}` }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ color: meta.color }} className="text-xl">
                    {meta.icon}
                  </span>
                  <div>
                    <div className="text-white font-semibold">{meta.label}</div>
                    <div className="text-white/35 text-xs">{meta.description}</div>
                  </div>
                </div>
                {winner && (
                  <div
                    className="text-xs font-bold px-3 py-1 rounded-full border"
                    style={{
                      color: meta.color,
                      backgroundColor: `${meta.color}20`,
                      borderColor: `${meta.color}40`,
                    }}
                  >
                    Session {winner} wins this segment
                  </div>
                )}
                {!winner && (
                  <div className="text-white/30 text-xs px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">
                    Tied
                  </div>
                )}
              </div>

              {/* Comparison columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
                {[
                  { session: sessionA, data: dataA, label: 'A', isWinner: winner === 'A' },
                  { session: sessionB, data: dataB, label: 'B', isWinner: winner === 'B' },
                ].map(({ session, data, label, isWinner }) => (
                  <div key={label} className={`p-6 ${isWinner ? 'bg-white/[0.03]' : ''}`}>
                    {/* Score */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/40 text-xs font-medium">Session {label}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-2xl font-black"
                          style={{ color: isWinner ? meta.color : '#6B7280' }}
                        >
                          {data.likelihood_score}
                        </span>
                        <span className="text-white/25 text-xs">/10</span>
                      </div>
                    </div>

                    {/* Gut reaction */}
                    <p className="text-white/60 text-xs italic mb-4 leading-relaxed border-l-2 pl-3"
                      style={{ borderColor: isWinner ? meta.color : '#374151' }}>
                      &ldquo;{data.gut_reaction}&rdquo;
                    </p>

                    {/* Loves */}
                    <div className="mb-3">
                      <div className="text-[10px] text-white/35 uppercase tracking-wide font-semibold mb-1.5">Loves</div>
                      <ul className="space-y-1">
                        {data.loves.map((l, i) => (
                          <li key={i} className="text-white/60 text-xs flex items-start gap-1.5">
                            <span className="text-emerald-500 shrink-0 mt-0.5">+</span>
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Concerns */}
                    <div>
                      <div className="text-[10px] text-white/35 uppercase tracking-wide font-semibold mb-1.5">Concerns</div>
                      <ul className="space-y-1">
                        {data.concerns.map((c, i) => (
                          <li key={i} className="text-white/60 text-xs flex items-start gap-1.5">
                            <span className="text-amber-500 shrink-0 mt-0.5">−</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Executive Summary Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {[
            { session: sessionA, label: 'A', color: '#0EA5E9' },
            { session: sessionB, label: 'B', color: '#7C3AED' },
          ].map(({ session, label, color }) => {
            const { executive_summary } = session.result;
            const sentColors = {
              Positive: '#10B981',
              Mixed: '#F59E0B',
              Negative: '#EF4444',
            };
            const sentColor = sentColors[executive_summary.overall_sentiment];

            return (
              <div key={label} className="bg-white/[0.04] rounded-2xl p-6 border border-white/[0.07]">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {label}
                  </div>
                  <span className="text-white font-semibold text-sm">Session {label} Summary</span>
                  <span
                    className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: sentColor, backgroundColor: `${sentColor}20` }}
                  >
                    {executive_summary.overall_sentiment}
                  </span>
                </div>
                <p className="text-white/65 text-sm leading-relaxed">{executive_summary.recommendation}</p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <span className="text-white/30 text-xs">Best segment: </span>
                  <span className="text-white/60 text-xs font-medium">{executive_summary.best_segment}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
