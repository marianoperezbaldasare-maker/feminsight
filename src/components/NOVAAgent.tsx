'use client';

import { useState, useRef, useEffect } from 'react';
import { Session, SEGMENT_KEYS, SEGMENT_META } from '@/types';

interface NOVAAgentProps {
  session?: Session | null;
  password?: string | null;
}

const QUICK_PROMPTS = [
  { label: '¿Por qué score bajo en algún segmento?', icon: '📉' },
  { label: 'Ideas de campaña creativa', icon: '✨' },
  { label: 'Mensaje clave por segmento', icon: '🎯' },
  { label: '¿Cómo mejorar la confianza?', icon: '🛡️' },
  { label: 'Estrategia de lanzamiento', icon: '🚀' },
  { label: 'Ideas de contenido orgánico', icon: '🎬' },
];

function buildStudyContext(session: Session | null | undefined): string {
  if (!session) return '';
  const { result, idea, category } = session;
  const segments = SEGMENT_KEYS.map((k) => {
    const meta = SEGMENT_META[k];
    const seg = result.segments[k];
    return `- ${meta.label}: ${seg.likelihood_score}/10 | "${seg.gut_reaction}" | Loves: ${seg.loves.slice(0, 2).join(', ')} | Concern: ${seg.concerns[0] ?? '-'}`;
  }).join('\n');
  const insights = result.executive_summary.top_insights.map((i) => `• ${i}`).join('\n');
  const objections = result.executive_summary.top_objections.map((o) => `• ${o}`).join('\n');
  return `PROYECTO: ${idea}
CATEGORÍA: ${category}
SENTIMIENTO GENERAL: ${result.executive_summary.overall_sentiment}
MEJOR SEGMENTO: ${result.executive_summary.best_segment}
RECOMENDACIÓN: ${result.executive_summary.recommendation}

SCORES POR SEGMENTO:
${segments}

INSIGHTS CLAVE:
${insights}

PRINCIPALES OBJECIONES:
${objections}
${result.gen_z_insight ? `\nGEN Z PULSE: ${result.gen_z_insight.headline} (Score: ${result.gen_z_insight.likelihood_score}/10)` : ''}`.trim();
}

function MD({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="text-[#7C3AED] font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-gray-800 font-bold text-base mt-4 mb-1">{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-gray-900 font-bold text-lg mt-2 mb-2">{line.slice(2)}</h1>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="text-gray-700 text-sm ml-4 list-disc leading-relaxed">{renderInline(line.slice(2))}</li>;
        if (line.match(/^\d+\./)) return <li key={i} className="text-gray-700 text-sm ml-4 list-decimal leading-relaxed">{renderInline(line.replace(/^\d+\.\s*/, ''))}</li>;
        if (line === '') return <div key={i} className="h-1.5" />;
        if (line.startsWith('---')) return <hr key={i} className="border-gray-200 my-2" />;
        return <p key={i} className="text-gray-700 text-sm leading-relaxed">{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="text-gray-900 font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="bg-[#7C3AED]/10 text-[#7C3AED] px-1.5 py-0.5 rounded text-xs">{p.slice(1, -1)}</code>;
    return p;
  });
}

function ScoreBar({ label, score, selected, onClick }: { label: string; score: number; selected: boolean; onClick: () => void }) {
  const pct = score * 10;
  const color = pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2.5 rounded-xl mb-1.5 transition-all border ${
        selected
          ? 'border-[#7C3AED]/40 bg-[#7C3AED]/5'
          : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200'
      }`}
    >
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-gray-700 text-xs font-medium truncate pr-2">{label}</span>
        <span className="text-xs font-bold shrink-0" style={{ color }}>{score}/10</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </button>
  );
}

export default function NOVAAgent({ session, password }: NOVAAgentProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(() => [{
    role: 'assistant',
    content: session
      ? `# Hola, soy NOVA ✦\n\nTu consultora estratégica creativa. Tengo cargado el estudio **"${session.name}"** con sentimiento general **${session.result.executive_summary.overall_sentiment}** y mejor segmento **${session.result.executive_summary.best_segment}**.\n\n¿Qué querés resolver primero?`
      : `# Hola, soy NOVA ✦\n\nTu consultora estratégica creativa de FemInsight.\n\nSeleccioná un estudio del historial para que pueda analizar los datos y darte estrategias específicas. O contame tu idea y trabajamos con hipótesis.\n\n¿Por dónde empezamos?`,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedSegment, setFocusedSegment] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function getContext() {
    const ctx = buildStudyContext(session);
    return ctx + (focusedSegment ? `\n\nSEGMENTO EN FOCO: ${focusedSegment}` : '');
  }

  async function sendMessage(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || loading) return;
    const next = [...messages, { role: 'user', content: msg }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['x-access-password'] = password;
      const res = await fetch('/api/nova', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: next, studyContext: getContext() }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text || data.error || 'Error.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '❌ Error de conexión. Intentá de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  }

  const segments = session
    ? SEGMENT_KEYS.map((k) => ({ key: k, label: SEGMENT_META[k].label, score: session.result.segments[k].likelihood_score }))
    : [];
  const insights = session?.result.executive_summary.top_insights ?? [];

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F5F6FA]">

      {/* ── LEFT PANEL ── */}
      <div className="hidden md:flex w-64 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
        {/* NOVA Header */}
        <div className="p-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #a855f7 50%, #ec4899 100%)' }}>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-base">✦</div>
            <div>
              <div className="text-white font-bold text-sm tracking-wide">NOVA</div>
              <div className="text-white/70 text-[10px]">Strategic Advisor</div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Active study */}
          {session ? (
            <div className="rounded-xl p-3 bg-[#7C3AED]/5 border border-[#7C3AED]/15">
              <p className="text-[#7C3AED] text-[10px] font-semibold uppercase tracking-widest mb-1">Estudio activo</p>
              <p className="text-gray-800 text-xs font-semibold leading-snug mb-2">{session.name}</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                <span className="text-gray-500 text-xs">{session.category}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-3 bg-amber-50 border border-amber-100">
              <p className="text-amber-700 text-xs leading-snug">Seleccioná un estudio del historial para activar el análisis contextual.</p>
            </div>
          )}

          {/* Segment scores */}
          {segments.length > 0 && (
            <div>
              <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-2">Scores por segmento</p>
              {segments.map((seg) => (
                <ScoreBar
                  key={seg.key}
                  label={seg.label}
                  score={seg.score}
                  selected={focusedSegment === seg.label}
                  onClick={() => setFocusedSegment(focusedSegment === seg.label ? null : seg.label)}
                />
              ))}
              {focusedSegment && (
                <p className="text-[#7C3AED] text-[10px] text-center mt-1">
                  Foco: <span className="font-semibold">{focusedSegment}</span>
                </p>
              )}
            </div>
          )}

          {/* Key insights */}
          {insights.length > 0 && (
            <div>
              <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-2">Insights clave</p>
              {insights.slice(0, 3).map((ins, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 mb-1.5">
                  <p className="text-gray-600 text-xs leading-snug">{ins}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <p className="text-gray-300 text-[10px] text-center">Powered by Claude Sonnet</p>
        </div>
      </div>

      {/* ── CHAT PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #ec4899)' }}>✦</div>
            <div>
              <div className="text-gray-900 font-bold text-sm">NOVA — Consultora Estratégica</div>
              <div className="text-gray-400 text-xs">Estrategia · Creatividad · Marketing femenino</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-gray-400 text-xs">Activa</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #ec4899)' }}>✦</div>
              )}
              <div className={`max-w-xl rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'text-white text-sm'
                  : 'bg-white border border-gray-100 shadow-sm'
              }`}
                style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #7C3AED, #a855f7)' } : {}}
              >
                {msg.role === 'assistant' ? <MD text={msg.content} /> : <p>{msg.content}</p>}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm shrink-0"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #ec4899)' }}>✦</div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]/40 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                  <span className="text-gray-400 text-xs ml-2">NOVA está pensando…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="bg-white border-t border-gray-100 px-5 py-2.5 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => sendMessage(qp.label)}
                disabled={loading}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs border border-gray-200 bg-gray-50 text-gray-600 hover:border-[#7C3AED]/40 hover:text-[#7C3AED] hover:bg-[#7C3AED]/5 transition-all disabled:opacity-40"
              >
                {qp.icon} {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-5 py-4 shrink-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1 rounded-xl border border-gray-200 overflow-hidden focus-within:border-[#7C3AED]/50 focus-within:ring-2 focus-within:ring-[#7C3AED]/10 transition-all bg-gray-50">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Preguntá a NOVA sobre los resultados del estudio…"
                rows={2}
                className="w-full bg-transparent text-gray-800 text-sm px-4 py-3 resize-none outline-none placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="rounded-xl px-4 py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40 shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #a855f7)' }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
