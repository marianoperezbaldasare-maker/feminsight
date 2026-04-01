'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CiteScores {
  C: number | null;
  I: number | null;
  T: number | null;
  E: number | null;
}

interface AEOAgentProps {
  password: string | null;
}

const CITE_LABELS: { key: keyof CiteScores; label: string; full: string; color: string }[] = [
  { key: 'C', label: 'C', full: 'Clarity', color: '#0EA5E9' },
  { key: 'I', label: 'I', full: 'Info Density', color: '#8B5CF6' },
  { key: 'T', label: 'T', full: 'Trust Signals', color: '#F59E0B' },
  { key: 'E', label: 'E', full: 'Extractability', color: '#10B981' },
];

const EXAMPLES = [
  'Analiza este texto para AEO: "Somos una empresa líder en soluciones digitales con más de 10 años de experiencia."',
  '¿Cuáles son las mejores prácticas para que mi contenido sea citado por ChatGPT?',
  'Explícame el CITE Score y cómo mejora mi posicionamiento en respuestas de IA',
];

function scoreColor(score: number | null): string {
  if (score === null) return '#9CA3AF';
  if (score >= 8) return '#10b981';
  if (score >= 5) return '#f59e0b';
  return '#ef4444';
}

function extractCiteScores(text: string): CiteScores {
  const match = text.match(/C[:\s\u2014-]*(\d+)[\s\S]*?I[:\s\u2014-]*(\d+)[\s\S]*?T[:\s\u2014-]*(\d+)[\s\S]*?E[:\s\u2014-]*(\d+)/i);
  if (match) {
    return {
      C: parseInt(match[1], 10),
      I: parseInt(match[2], 10),
      T: parseInt(match[3], 10),
      E: parseInt(match[4], 10),
    };
  }
  return { C: null, I: null, T: null, E: null };
}

function totalScore(scores: CiteScores): number | null {
  const vals = [scores.C, scores.I, scores.T, scores.E].filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={i} className="border-gray-200 my-3" />);
      i++;
      continue;
    }

    // H1
    if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={i} className="text-lg font-bold text-gray-900 mt-4 mb-2">
          {inlineMarkdown(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={i} className="text-base font-bold text-gray-800 mt-4 mb-1.5">
          {inlineMarkdown(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-1">
          {inlineMarkdown(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // Bullet list
    if (/^[-*]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(
          <li key={i} className="ml-4 text-sm text-gray-700 leading-relaxed list-disc">
            {inlineMarkdown(lines[i].slice(2))}
          </li>
        );
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="my-1.5 space-y-0.5">{items}</ul>);
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const content = lines[i].replace(/^\d+\.\s/, '');
        items.push(
          <li key={i} className="ml-4 text-sm text-gray-700 leading-relaxed list-decimal">
            {inlineMarkdown(content)}
          </li>
        );
        i++;
      }
      nodes.push(<ol key={`ol-${i}`} className="my-1.5 space-y-0.5">{items}</ol>);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      nodes.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Paragraph
    nodes.push(
      <p key={i} className="text-sm text-gray-700 leading-relaxed">
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

function inlineMarkdown(text: string): React.ReactNode {
  // Handle bold (**text**), inline code (`code`)
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[0].startsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[2]}</strong>);
    } else {
      parts.push(
        <code key={match.index} className="bg-gray-100 text-[#7C3AED] text-xs px-1.5 py-0.5 rounded font-mono">
          {match[3]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: `## Bienvenido al AEO Agent

**AI Engine Optimization (AEO)** es la disciplina de optimizar tu contenido para ser citado, recomendado y referenciado por modelos de IA como ChatGPT, Perplexity, Google AI Overviews y Claude.

### ¿Qué puedo hacer por ti?

- **Analizar tu contenido** con el framework **CITE Score** (Clarity, Information Density, Trust Signals, Extractability)
- **Identificar por qué los LLMs ignoran tu contenido** y cómo corregirlo
- **Reescribir tu contenido** en el formato preferido por modelos de IA
- **Responder preguntas** sobre estrategia AEO, SEO para IA y visibilidad en respuestas generativas

### ¿Cómo empezar?

Pega cualquier texto, párrafo, página web o descripción de producto y lo analizo con el CITE Score. O hazme cualquier pregunta sobre AEO.`,
};

export default function AEOAgent({ password }: AEOAgentProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [citeScores, setCiteScores] = useState<CiteScores>({ C: null, I: null, T: null, E: null });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: 'user', content };
    const newMessages = [...messages.filter((m) => m !== WELCOME_MESSAGE || messages.indexOf(m) !== 0), userMsg];
    // Keep welcome in history but only send actual conversation to API
    const apiMessages = messages
      .filter((m) => m !== WELCOME_MESSAGE)
      .concat(userMsg)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['x-access-password'] = password;

      const res = await fetch('/api/aeo', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? 'Request failed');
      }

      const data = await res.json() as { text: string };
      const assistantMsg: Message = { role: 'assistant', content: data.text };
      setMessages((prev) => [...prev, assistantMsg]);

      const extracted = extractCiteScores(data.text);
      const hasScores = Object.values(extracted).some((v) => v !== null);
      if (hasScores) {
        setCiteScores(extracted);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `**Error:** ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }

    void newMessages; // suppress unused warning
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const total = totalScore(citeScores);
  const hasAnyScore = Object.values(citeScores).some((v) => v !== null);

  return (
    <div className="flex flex-col h-full bg-[#F5F6FA] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">AEO Agent</h1>
            <p className="text-white/70 text-xs">AI Engine Optimization · CITE Score Framework</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 gap-4 p-4">
        {/* Left panel: CITE Score */}
        <div className="hidden md:flex flex-col gap-4 w-[280px] shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">CITE Score</h2>
              {hasAnyScore && total !== null && (
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: scoreColor(total) }}
                >
                  {total}/10
                </span>
              )}
              {!hasAnyScore && (
                <span className="text-xs text-gray-400">Sin datos aún</span>
              )}
            </div>

            <div className="space-y-3">
              {CITE_LABELS.map(({ key, label, full, color }) => {
                const val = citeScores[key];
                const pct = val !== null ? (val / 10) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {label}
                        </span>
                        <span className="text-xs text-gray-600 font-medium">{full}</span>
                      </div>
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: val !== null ? scoreColor(val) : '#9CA3AF' }}
                      >
                        {val !== null ? `${val}/10` : '—'}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: val !== null ? color : 'transparent',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {!hasAnyScore && (
              <p className="text-gray-400 text-xs text-center mt-4 leading-relaxed">
                Pega contenido para analizar y el CITE Score aparecerá aquí.
              </p>
            )}
          </div>

          {/* Examples */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Ejemplos</h2>
            <div className="space-y-2">
              {EXAMPLES.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => void handleSend(ex)}
                  disabled={loading}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs rounded-xl px-3 py-2 transition-colors leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ex.length > 80 ? ex.slice(0, 80) + '…' : ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel: Chat */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Mobile CITE badge */}
          {hasAnyScore && total !== null && (
            <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500 font-medium">CITE Score:</span>
              <span className="text-sm font-bold" style={{ color: scoreColor(total) }}>{total}/10</span>
              {CITE_LABELS.map(({ key, label, color }) => {
                const val = citeScores[key];
                return val !== null ? (
                  <span
                    key={key}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: color }}
                  >
                    {label}:{val}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#a855f7] flex items-center justify-center shrink-0 mt-0.5 mr-2">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-[#7C3AED] text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#a855f7] flex items-center justify-center shrink-0 mt-0.5 mr-2">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                placeholder="Pega tu contenido o haz una pregunta sobre AEO..."
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
                aria-label="Send"
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
