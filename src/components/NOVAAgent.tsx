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
    return `- ${meta.label} (${meta.description}): ${seg.likelihood_score}/10 | "${seg.gut_reaction}" | Loves: ${seg.loves.slice(0, 2).join(', ')} | Concern: ${seg.concerns[0] ?? '-'}`;
  }).join('\n');

  const insights = result.executive_summary.top_insights.map((i) => `• ${i}`).join('\n');
  const objections = result.executive_summary.top_objections.map((o) => `• ${o}`).join('\n');

  return `PROYECTO: ${idea}
CATEGORÍA: ${category}
SENTIMIENTO GENERAL: ${result.executive_summary.overall_sentiment}
MEJOR SEGMENTO: ${result.executive_summary.best_segment}
RECOMENDACIÓN EJECUTIVA: ${result.executive_summary.recommendation}

SCORES POR SEGMENTO:
${segments}

INSIGHTS CLAVE:
${insights}

PRINCIPALES OBJECIONES:
${objections}

${result.gen_z_insight ? `GEN Z PULSE: ${result.gen_z_insight.headline} (Score: ${result.gen_z_insight.likelihood_score}/10)` : ''}`.trim();
}

// Markdown renderer — warm dark palette
function MD({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="text-[#E8C4A0] font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-[#F0D5B8] font-bold text-base mt-4 mb-1">{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-[#F5E6D0] font-bold text-lg mt-2 mb-2">{line.slice(2)}</h1>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="text-[#D4B896] text-sm ml-4 list-disc leading-relaxed">{renderInline(line.slice(2))}</li>;
        if (line.match(/^\d+\./)) return <li key={i} className="text-[#D4B896] text-sm ml-4 list-decimal leading-relaxed">{renderInline(line.replace(/^\d+\.\s*/, ''))}</li>;
        if (line === '') return <div key={i} className="h-1.5" />;
        if (line.startsWith('---')) return <hr key={i} className="border-[#5C3D2E]/40 my-2" />;
        return <p key={i} className="text-[#C8A882] text-sm leading-relaxed">{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="text-[#F0D5B8] font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="bg-[#3D2418] text-[#E8C4A0] px-1 rounded text-xs">{p.slice(1, -1)}</code>;
    return p;
  });
}

function ScoreBar({ label, score, selected, onClick }: { label: string; score: number; selected: boolean; onClick: () => void }) {
  const pct = score * 10;
  const color = pct >= 70 ? '#7CAE8A' : pct >= 50 ? '#E8C060' : '#C97B6B';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2.5 rounded-xl mb-1.5 transition-all border ${selected ? 'border-[#E8C4A0]/50 bg-[#3D2418]' : 'border-transparent bg-[#2A1810] hover:bg-[#2F1D12]'}`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-[#D4B896] text-xs font-medium truncate pr-2">{label}</span>
        <span className="text-xs font-bold shrink-0" style={{ color }}>{score}/10</span>
      </div>
      <div className="h-1.5 bg-[#1A0E08] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </button>
  );
}

export default function NOVAAgent({ session, password }: NOVAAgentProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(() => {
    const hasStudy = !!session;
    return [{
      role: 'assistant',
      content: hasStudy
        ? `# Hola, soy NOVA ✦\n\nTu consultora estratégica creativa. Tengo cargado el estudio **"${session!.name}"** y estoy lista para trabajar contigo.\n\nEl sentimiento general es **${session!.result.executive_summary.overall_sentiment}** y el mejor segmento es **${session!.result.executive_summary.best_segment}**.\n\n¿Qué querés resolver primero?`
        : `# Hola, soy NOVA ✦\n\nTu consultora estratégica creativa de FemInsight.\n\nNo hay un estudio cargado. Seleccioná un estudio del historial para que pueda analizar los datos y darte estrategias específicas. O si querés, podés contarme tu idea y trabajamos con hipótesis.\n\n¿Con qué empezamos?`,
    }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedSegment, setFocusedSegment] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function getContext(): string {
    const ctx = buildStudyContext(session);
    if (!ctx) return '';
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
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          studyContext: getContext(),
        }),
      });
      const data = await res.json();
      const reply = data.text || data.error || 'Error al contactar a NOVA.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '❌ Error de conexión. Intentá de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  }

  const segments = session ? SEGMENT_KEYS.map((k) => ({
    key: k,
    label: SEGMENT_META[k].label,
    score: session.result.segments[k].likelihood_score,
  })) : [];

  const insights = session?.result.executive_summary.top_insights ?? [];

  return (
    <div className="flex-1 flex overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D0603 0%, #1A0E08 50%, #0D0603 100%)' }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden md:flex w-64 shrink-0 flex-col p-4 border-r border-[#3D2418] overflow-y-auto" style={{ background: '#120A05' }}>
        {/* Brand */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
              style={{ background: 'linear-gradient(135deg, #C97B6B, #E8C4A0)' }}>✦</div>
            <span className="text-[#F0D5B8] text-sm font-bold tracking-wide">NOVA</span>
          </div>
          <p className="text-[#7A5C45] text-xs ml-8">FemInsight · Strategic Advisor</p>
        </div>

        {/* Active study */}
        {session ? (
          <div className="rounded-xl p-3 mb-4 border border-[#3D2418]" style={{ background: 'linear-gradient(135deg, #1F100A, #2A1810)' }}>
            <p className="text-[#7A5C45] text-[10px] uppercase tracking-widest mb-1">Estudio activo</p>
            <p className="text-[#E8C4A0] text-xs font-semibold leading-snug mb-2">{session.name}</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#7CAE8A] rounded-full shrink-0" />
              <span className="text-[#7A5C45] text-xs">{session.category}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-3 mb-4 border border-[#3D2418]/50" style={{ background: '#1F100A' }}>
            <p className="text-[#4A3025] text-xs leading-snug">Seleccioná un estudio del historial para activar el análisis contextual.</p>
          </div>
        )}

        {/* Segment scores */}
        {segments.length > 0 && (
          <div className="mb-4">
            <p className="text-[#7A5C45] text-[10px] uppercase tracking-widest mb-2">Scores por segmento</p>
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
              <p className="text-[#7A5C45] text-[10px] text-center mt-1">
                Foco: <span className="text-[#E8C4A0]">{focusedSegment}</span>
              </p>
            )}
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div>
            <p className="text-[#7A5C45] text-[10px] uppercase tracking-widest mb-2">Insights clave</p>
            {insights.slice(0, 3).map((ins, i) => (
              <div key={i} className="bg-[#1F100A] rounded-lg p-2.5 mb-1.5 border border-[#3D2418]/50">
                <p className="text-[#C8A882] text-xs leading-snug">{ins}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-[#3D2418]">
          <p className="text-[#4A3025] text-[10px] text-center">Powered by Claude Sonnet</p>
        </div>
      </div>

      {/* ── CHAT PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-[#3D2418] px-5 py-3.5 flex items-center justify-between shrink-0" style={{ background: '#120A05' }}>
          <div>
            <h1 className="text-[#F0D5B8] text-sm font-bold tracking-wide">NOVA — Consultora Estratégica</h1>
            <p className="text-[#7A5C45] text-xs">Estrategia · Creatividad · Marketing femenino</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#7CAE8A] rounded-full animate-pulse" />
            <span className="text-[#7A5C45] text-xs">Activa</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #C97B6B, #E8C4A0)' }}>✦</div>
              )}
              <div
                className={`max-w-xl rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'text-[#1A0E08] text-sm' : 'border border-[#3D2418]'}`}
                style={msg.role === 'user'
                  ? { background: 'linear-gradient(135deg, #E8C4A0, #D4A882)' }
                  : { background: 'linear-gradient(135deg, #1F100A, #2A1810)' }}
              >
                {msg.role === 'assistant' ? <MD text={msg.content} /> : <p>{msg.content}</p>}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ background: 'linear-gradient(135deg, #C97B6B, #E8C4A0)' }}>✦</div>
              <div className="border border-[#3D2418] rounded-2xl px-4 py-3" style={{ background: '#1F100A' }}>
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: '#E8C4A0', animationDelay: `${i * 0.15}s` }} />
                  ))}
                  <span className="text-[#7A5C45] text-xs ml-2">NOVA está pensando…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="px-5 py-2.5 border-t border-[#3D2418] shrink-0" style={{ background: '#120A05' }}>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => sendMessage(qp.label)}
                disabled={loading}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs border border-[#3D2418] text-[#C8A882] hover:border-[#E8C4A0]/50 hover:text-[#F0D5B8] transition-all disabled:opacity-40"
                style={{ background: '#1F100A' }}
              >
                {qp.icon} {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-[#3D2418] shrink-0" style={{ background: '#120A05' }}>
          <div className="flex gap-3 items-end">
            <div className="flex-1 rounded-xl border border-[#3D2418] overflow-hidden focus-within:border-[#E8C4A0]/40 transition-colors"
              style={{ background: '#1F100A' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Preguntá a NOVA sobre los resultados del estudio…"
                rows={2}
                className="w-full bg-transparent text-[#D4B896] text-sm px-4 py-3 resize-none outline-none placeholder-[#4A3025]"
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-40 shrink-0"
              style={{ background: 'linear-gradient(135deg, #C97B6B, #E8C4A0)', color: '#1A0E08' }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
