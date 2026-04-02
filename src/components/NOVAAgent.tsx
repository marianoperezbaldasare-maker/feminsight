'use client';

import { useState, useRef, useEffect } from 'react';
import { Session, SEGMENT_KEYS, SEGMENT_META } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface NOVAAgentProps {
  session?: Session | null;
  password?: string | null;
}

const QUICK_PROMPTS = [
  '¿Por qué score bajo en algún segmento y cómo subirlo?',
  'Dame 3 ideas de campaña creativa para el segmento más difícil',
  'Estrategia de lanzamiento basada en estos resultados',
  '¿Qué mensaje clave usarías para cada segmento?',
  '¿Cómo mejorar la confianza en la marca?',
];

function buildStudyContext(session: Session | null | undefined, focusedSegment: string | null): string {
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
${result.gen_z_insight ? `\nGEN Z PULSE: ${result.gen_z_insight.headline} (Score: ${result.gen_z_insight.likelihood_score}/10)` : ''}
${focusedSegment ? `\nSEGMENTO EN FOCO: ${focusedSegment}` : ''}`.trim();
}

function scoreColor(score: number): string {
  if (score >= 7) return '#10b981';
  if (score >= 5) return '#f59e0b';
  return '#ef4444';
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^---+$/.test(line.trim())) { nodes.push(<hr key={i} className="border-gray-200 my-3" />); i++; continue; }
    if (line.startsWith('# ')) { nodes.push(<h1 key={i} className="text-lg font-bold text-gray-900 mt-4 mb-2">{inlineMarkdown(line.slice(2))}</h1>); i++; continue; }
    if (line.startsWith('## ')) { nodes.push(<h2 key={i} className="text-base font-bold text-gray-800 mt-4 mb-1.5">{inlineMarkdown(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith('### ')) { nodes.push(<h3 key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-1">{inlineMarkdown(line.slice(4))}</h3>); i++; continue; }
    if (/^[-*•]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(<li key={i} className="ml-4 text-sm text-gray-700 leading-relaxed list-disc">{inlineMarkdown(lines[i].slice(2))}</li>);
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="my-1.5 space-y-0.5">{items}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i} className="ml-4 text-sm text-gray-700 leading-relaxed list-decimal">{inlineMarkdown(lines[i].replace(/^\d+\.\s/, ''))}</li>);
        i++;
      }
      nodes.push(<ol key={`ol-${i}`} className="my-1.5 space-y-0.5">{items}</ol>);
      continue;
    }
    if (line.trim() === '') { nodes.push(<div key={i} className="h-2" />); i++; continue; }
    nodes.push(<p key={i} className="text-sm text-gray-700 leading-relaxed">{inlineMarkdown(line)}</p>);
    i++;
  }
  return nodes;
}

function inlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0; let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[0].startsWith('**')) parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[2]}</strong>);
    else parts.push(<code key={match.index} className="bg-gray-100 text-[#7C3AED] text-xs px-1.5 py-0.5 rounded font-mono">{match[3]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

const WELCOME: Message = {
  role: 'assistant',
  content: `## Hola, soy NOVA ✦

Soy tu consultora estratégica creativa. Analizo los resultados de tus focus groups y te ayudo a convertir insights en estrategias, campañas y acciones concretas.

### ¿Qué puedo hacer por ti?

- **Diagnosticar** por qué un segmento tiene score bajo y cómo subirlo
- **Proponer campañas creativas** adaptadas a cada perfil femenino
- **Definir mensajes clave** por segmento de edad y contexto
- **Diseñar estrategias de lanzamiento** basadas en los datos reales
- **Identificar oportunidades** que los datos no dicen explícitamente

### ¿Cómo empezar?

Seleccioná un estudio del historial (panel izquierdo) y haceme cualquier pregunta estratégica. O usá los ejemplos de abajo para arrancar.`,
};

export default function NOVAAgent({ session, password }: NOVAAgentProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedSegment, setFocusedSegment] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: 'user', content };
    const apiMessages = messages
      .filter((m) => m !== WELCOME)
      .concat(userMsg)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['x-access-password'] = password;

      const res = await fetch('/api/nova', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: apiMessages,
          studyContext: buildStudyContext(session, focusedSegment),
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? 'Request failed');
      }

      const data = await res.json() as { text: string };
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setMessages((prev) => [...prev, { role: 'assistant', content: `**Error:** ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  }

  const segments = session
    ? SEGMENT_KEYS.map((k) => ({ key: k, label: SEGMENT_META[k].label, score: session.result.segments[k].likelihood_score }))
    : [];

  return (
    <div className="flex flex-col h-full bg-[#F5F6FA] overflow-hidden">

      {/* Header — same structure as AEO, different gradient + icon */}
      <div className="bg-gradient-to-r from-[#7C3AED] via-[#a855f7] to-[#ec4899] px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            ✦
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">NOVA Advisor</h1>
            <p className="text-white/70 text-xs">Consultora Estratégica · Creatividad · Marketing femenino</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 gap-4 p-4">

        {/* Left panel — segment scores + quick prompts */}
        <div className="hidden md:flex flex-col gap-4 w-[280px] shrink-0">

          {/* Segment scores */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Scores por segmento</h2>
              {!session && <span className="text-xs text-gray-400">Sin estudio</span>}
            </div>

            {session ? (
              <div className="space-y-3">
                {segments.map(({ key, label, score }) => (
                  <div key={key}>
                    <button
                      onClick={() => setFocusedSegment(focusedSegment === label ? null : label)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium transition-colors ${focusedSegment === label ? 'text-[#7C3AED]' : 'text-gray-600'}`}>
                          {label}
                        </span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(score) }}>
                          {score}/10
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${score * 10}%`, backgroundColor: focusedSegment === label ? '#7C3AED' : scoreColor(score) }}
                        />
                      </div>
                    </button>
                  </div>
                ))}
                {focusedSegment && (
                  <p className="text-[#7C3AED] text-xs text-center pt-1">
                    Foco: <span className="font-semibold">{focusedSegment}</span> · <button onClick={() => setFocusedSegment(null)} className="underline">quitar</button>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-xs text-center leading-relaxed">
                Seleccioná un estudio del historial para ver los scores y activar el análisis contextual.
              </p>
            )}
          </div>

          {/* Quick prompts */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Preguntas sugeridas</h2>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => void handleSend(qp)}
                  disabled={loading}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs rounded-xl px-3 py-2 transition-colors leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {qp.length > 80 ? qp.slice(0, 80) + '…' : qp}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel: Chat — identical to AEO */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C3AED] via-[#a855f7] to-[#ec4899] flex items-center justify-center shrink-0 mt-0.5 mr-2 text-white text-xs font-bold">
                    ✦
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[#7C3AED] text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200 rounded-tl-sm'
                }`}>
                  {msg.role === 'user'
                    ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    : <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                  }
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C3AED] via-[#a855f7] to-[#ec4899] flex items-center justify-center shrink-0 mt-0.5 mr-2 text-white text-xs font-bold">
                  ✦
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-2 h-2 bg-[#a855f7] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#a855f7] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#a855f7] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex items-end gap-2 bg-white border border-gray-200 focus-within:border-[#7C3AED] rounded-xl px-3 py-2 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Preguntá a NOVA sobre los resultados del estudio…"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none leading-relaxed max-h-32 overflow-y-auto disabled:opacity-50"
                style={{ minHeight: '24px' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
                }}
              />
              <button
                onClick={() => void handleSend()}
                disabled={loading || !input.trim()}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg p-2 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Enviar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-gray-400 text-[10px] mt-1.5 text-center">Enter para enviar · Shift+Enter para nueva línea</p>
          </div>
        </div>
      </div>
    </div>
  );
}
