'use client';

import { VideoSession, SEGMENT_KEYS, SEGMENT_META } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface VideoResultsProps {
  session: VideoSession;
  onNewVideo: () => void;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums w-7 text-right" style={{ color }}>{score}/10</span>
    </div>
  );
}

function intensityColor(n: number): string {
  if (n >= 8) return '#10B981';
  if (n >= 6) return '#F59E0B';
  if (n >= 4) return '#0EA5E9';
  return '#9CA3AF';
}

function sentimentColor(s: string): { bg: string; text: string } {
  if (s === 'Positive') return { bg: '#D1FAE5', text: '#065F46' };
  if (s === 'Negative') return { bg: '#FEE2E2', text: '#991B1B' };
  return { bg: '#FEF3C7', text: '#92400E' };
}

export default function VideoResults({ session, onNewVideo }: VideoResultsProps) {
  const { lang } = useLanguage();
  const { result } = session;

  const t = lang === 'en' ? {
    backBtn: 'New Video',
    poweredBy: 'Powered by Google Gemini 1.5 · Full video analysis',
    executiveSummary: 'Executive Summary',
    keyInsight: 'Key Insight',
    recommendation: 'Strategic Recommendation',
    bestSegment: 'Best Segment',
    worstSegment: 'Hardest Segment',
    emotionalArc: 'Emotional Arc',
    arcSub: 'How the audience reacted moment by moment',
    creativeScores: 'Creative Scores',
    visual: 'Visual',
    audio: 'Audio',
    messageClarity: 'Message Clarity',
    cta: 'CTA Effectiveness',
    overall: 'Overall',
    strengths: 'What worked',
    improvements: 'What to improve',
    segmentReactions: 'Segment Reactions',
    score: 'Score',
    peakMoment: 'Peak moment',
    dropOffRisk: 'Drop-off risk',
    keyReactions: 'Key reactions',
  } : {
    backBtn: 'Nuevo Video',
    poweredBy: 'Powered by Google Gemini 1.5 · Análisis de video completo',
    executiveSummary: 'Resumen Ejecutivo',
    keyInsight: 'Insight Clave',
    recommendation: 'Recomendación Estratégica',
    bestSegment: 'Mejor Segmento',
    worstSegment: 'Segmento más difícil',
    emotionalArc: 'Arco Emocional',
    arcSub: 'Cómo reaccionó la audiencia momento a momento',
    creativeScores: 'Puntajes Creativos',
    visual: 'Visual',
    audio: 'Audio',
    messageClarity: 'Claridad del Mensaje',
    cta: 'Efectividad del CTA',
    overall: 'General',
    strengths: 'Lo que funcionó',
    improvements: 'Qué mejorar',
    segmentReactions: 'Reacciones por Segmento',
    score: 'Puntaje',
    peakMoment: 'Momento pico',
    dropOffRisk: 'Riesgo de abandono',
    keyReactions: 'Reacciones clave',
  };

  const sentBadge = sentimentColor(result.overall_sentiment);
  const ca = result.creative_assessment;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F6FA]">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-white/70 text-xs">{session.videoName}</span>
              </div>
              <h1 className="text-2xl font-bold">{session.name}</h1>
              <p className="text-white/70 text-xs mt-1">{t.poweredBy}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: sentBadge.bg, color: sentBadge.text }}>
                {result.overall_sentiment}
              </span>
              <button
                onClick={onNewVideo}
                className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                + {t.backBtn}
              </button>
            </div>
          </div>
          <p className="text-white/90 text-base leading-relaxed">"{result.overall_verdict}"</p>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t.keyInsight}</h2>
            <p className="text-gray-800 text-sm leading-relaxed">{result.executive_summary.key_insight}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t.recommendation}</h2>
            <p className="text-gray-800 text-sm leading-relaxed">{result.executive_summary.recommendation}</p>
          </div>
        </div>

        {/* Best/Worst segment */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: t.bestSegment, key: result.executive_summary.best_segment, positive: true },
            { label: t.worstSegment, key: result.executive_summary.worst_segment, positive: false },
          ].map(({ label, key, positive }) => {
            const meta = SEGMENT_META[key as keyof typeof SEGMENT_META];
            return (
              <div
                key={label}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center gap-3"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{ backgroundColor: meta?.bgLight ?? '#F5F5F5' }}
                >
                  {meta?.icon ?? '?'}
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold" style={{ color: meta?.color ?? '#374151' }}>{meta?.label ?? key}</p>
                </div>
                <span className={`ml-auto text-lg ${positive ? '🏆' : ''}`}>{positive ? '🏆' : '⚠️'}</span>
              </div>
            );
          })}
        </div>

        {/* Creative Scores */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{t.creativeScores}</h2>
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-1.5">
              <span className="text-xs text-gray-500">{t.overall}</span>
              <span className="text-sm font-bold text-gray-900">{ca.overall_score}/10</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            {[
              { label: t.visual, score: ca.visual_score, color: '#EC4899' },
              { label: t.audio, score: ca.audio_score, color: '#8B5CF6' },
              { label: t.messageClarity, score: ca.message_clarity, color: '#0EA5E9' },
              { label: t.cta, score: ca.cta_effectiveness, color: '#F59E0B' },
            ].map(({ label, score, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
                <ScoreBar score={score} color={color} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-600 mb-2">✓ {t.strengths}</p>
              <ul className="space-y-1">
                {ca.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-emerald-400 shrink-0">◆</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-600 mb-2">↑ {t.improvements}</p>
              <ul className="space-y-1">
                {ca.improvements.map((s, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-amber-400 shrink-0">◆</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Emotional Arc */}
        {result.emotional_arc && result.emotional_arc.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">{t.emotionalArc}</h2>
            <p className="text-xs text-gray-400 mb-4">{t.arcSub}</p>
            <div className="space-y-3">
              {result.emotional_arc.map((point, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="shrink-0 w-16 text-right">
                    <span className="text-[10px] font-mono font-semibold text-gray-400">{point.timestamp}</span>
                  </div>
                  <div className="w-1.5 shrink-0 flex flex-col items-center pt-1.5">
                    <div
                      className="w-3 h-3 rounded-full border-2 border-white shadow-sm shrink-0"
                      style={{ backgroundColor: intensityColor(point.intensity) }}
                    />
                    {i < result.emotional_arc.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-100 mt-1" style={{ minHeight: '20px' }} />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-xs font-semibold text-gray-700 leading-snug">{point.event}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{point.reaction}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className="h-1 rounded-full" style={{ width: `${point.intensity * 10}%`, backgroundColor: intensityColor(point.intensity), minWidth: '8px', maxWidth: '80px' }} />
                      <span className="text-[10px] text-gray-400">{point.intensity}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Segment Reactions */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">{t.segmentReactions}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SEGMENT_KEYS.map((key) => {
              const meta = SEGMENT_META[key];
              const seg = result.segments?.[key];
              if (!seg) return null;
              return (
                <div key={key} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Segment header */}
                  <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: meta.bgLight }}>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: meta.color + '20' }}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
                      <p className="text-[10px] text-gray-400 truncate">{meta.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-bold" style={{ color: meta.color }}>{seg.likelihood_score}</p>
                      <p className="text-[10px] text-gray-400">/10</p>
                    </div>
                  </div>

                  <div className="px-4 py-4 space-y-3">
                    {/* Score bar */}
                    <ScoreBar score={seg.likelihood_score} color={meta.color} />

                    {/* Emotional journey */}
                    <p className="text-xs text-gray-600 leading-relaxed">{seg.emotional_journey}</p>

                    {/* Peak / Drop-off */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-50 rounded-xl p-2.5">
                        <p className="text-[10px] font-semibold text-emerald-700 mb-0.5">⚡ {t.peakMoment}</p>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">{seg.peak_moment}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-2.5">
                        <p className="text-[10px] font-semibold text-amber-700 mb-0.5">⚠ {t.dropOffRisk}</p>
                        <p className="text-[11px] text-amber-800 leading-relaxed">{seg.drop_off_risk}</p>
                      </div>
                    </div>

                    {/* Key reactions */}
                    {seg.key_reactions && seg.key_reactions.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{t.keyReactions}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {seg.key_reactions.map((r, i) => (
                            <span key={i} className="text-[10px] px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: meta.bgLight, color: meta.color }}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quote */}
                    <blockquote className="border-l-2 pl-3 text-xs text-gray-500 italic leading-relaxed" style={{ borderColor: meta.color }}>
                      "{seg.quote}"
                    </blockquote>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
