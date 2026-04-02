'use client';

import { useState, useRef, useEffect } from 'react';
import { Session, SEGMENT_KEYS, SEGMENT_META } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MarketMetrics {
  marketSize?: string;
  cagr?: string;
  competition?: string;
  timing?: number;
  femaleRelevance?: number;
  competitiveGap?: number;
}

interface IntelAgentProps {
  session?: Session | null;
  password?: string | null;
}

function buildStudyContext(session: Session | null | undefined): string {
  if (!session) return '';
  const { idea, category, result } = session;
  const avgScore = (
    SEGMENT_KEYS.reduce((sum, k) => sum + result.segments[k].likelihood_score, 0) / SEGMENT_KEYS.length
  ).toFixed(1);
  const best = result.executive_summary.best_segment;
  const sentiment = result.executive_summary.overall_sentiment;
  return `IDEA: ${idea}
CATEGORY: ${category}
OVERALL SENTIMENT: ${sentiment}
AVERAGE SCORE: ${avgScore}/10
BEST SEGMENT: ${best}
RECOMMENDATION: ${result.executive_summary.recommendation}`.trim();
}

function competitionColor(level: string): string {
  const l = level.toLowerCase();
  if (l.includes('very high')) return '#EF4444';
  if (l.includes('high')) return '#F59E0B';
  if (l.includes('medium')) return '#0EA5E9';
  return '#10B981';
}

function scoreColor(n: number): string {
  if (n >= 8) return '#10B981';
  if (n >= 6) return '#0EA5E9';
  if (n >= 4) return '#F59E0B';
  return '#EF4444';
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
    else parts.push(<code key={match.index} className="bg-gray-100 text-[#0369A1] text-xs px-1.5 py-0.5 rounded font-mono">{match[3]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

const WELCOME_CONTENT: Record<'en' | 'es', string> = {
  en: `## Welcome to VERA Intel ◎

I'm the market intelligence engine of FemInsight. I ground your synthetic focus group results in **real market data** — global market size, growth trends, competitive landscape, and female consumer behavior research.

### What I can do for you

- **Market scan**: TAM, CAGR, maturity stage for your category
- **Trend signals**: what's growing, what's declining in your space right now
- **Female consumer data**: research-backed insights on how women in each segment behave
- **Competitive gap analysis**: where the market is underserved
- **Opportunity scoring**: timing, relevance, and competition rated 1–10

### How to start

Select a study from the history — I'll automatically run a market scan for your category. Or ask me anything about your market.

*Data based on industry reports through early 2025.*`,
  es: `## Bienvenido a VERA Intel ◎

Soy el motor de inteligencia de mercado de FemInsight. Anclo los resultados de tu focus group sintético en **datos reales de mercado** — tamaño global, tendencias de crecimiento, panorama competitivo e investigación de comportamiento del consumidor femenino.

### Qué puedo hacer por ti

- **Escaneo de mercado**: TAM, CAGR, etapa de madurez para tu categoría
- **Señales de tendencia**: qué crece y qué declina en tu espacio ahora mismo
- **Datos del consumidor femenino**: insights basados en investigación real
- **Análisis de gaps competitivos**: dónde el mercado está desatendido
- **Scoring de oportunidad**: timing, relevancia y competencia del 1 al 10

### Cómo empezar

Seleccioná un estudio del historial — haré un escaneo de mercado automáticamente. O preguntame cualquier cosa sobre tu mercado.

*Datos basados en reportes de la industria hasta inicios de 2025.*`,
};

export default function IntelAgent({ session, password }: IntelAgentProps) {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [scannedSessionId, setScannedSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const welcomeMessage: Message = { role: 'assistant', content: WELCOME_CONTENT[lang] };
  const t = lang === 'en' ? {
    headerSub: 'Market Intelligence · Real Data · Global Trends',
    noStudy: 'No study',
    marketSize: 'Market Size',
    cagr: 'CAGR',
    competition: 'Competition',
    timing: 'Timing',
    femaleRel: 'Female Rel.',
    gap: 'Comp. Gap',
    scanHint: 'Select a study to run an automatic market scan.',
    scanning: 'Scanning market data…',
    placeholder: 'Ask about market size, trends, competitors…',
    hint: 'Enter to send · Shift+Enter for new line',
    unknown: 'Unknown error',
    dataNote: 'Data through early 2025',
  } : {
    headerSub: 'Inteligencia de Mercado · Datos Reales · Tendencias Globales',
    noStudy: 'Sin estudio',
    marketSize: 'Tamaño de Mercado',
    cagr: 'CAGR',
    competition: 'Competencia',
    timing: 'Timing',
    femaleRel: 'Rel. Femenina',
    gap: 'Gap Competitivo',
    scanHint: 'Seleccioná un estudio para correr un escaneo de mercado automático.',
    scanning: 'Escaneando datos de mercado…',
    placeholder: 'Preguntá sobre tamaño de mercado, tendencias, competidores…',
    hint: 'Enter para enviar · Shift+Enter para nueva línea',
    unknown: 'Error desconocido',
    dataNote: 'Datos hasta inicios de 2025',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset scan state when session changes
  useEffect(() => {
    if (session?.id !== scannedSessionId) {
      setScannedSessionId(null);
      setMessages([]);
      setMetrics(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  function handleRunScan() {
    if (!session || scanning) return;
    const scanPrompt = lang === 'en'
      ? `Run a complete market intelligence scan for this idea: "${session.idea}" in the category "${session.category}".`
      : `Ejecutá un escaneo completo de inteligencia de mercado para esta idea: "${session.idea}" en la categoría "${session.category}".`;
    setScannedSessionId(session.id);
    void runScan(scanPrompt);
  }

  async function runScan(prompt: string) {
    setScanning(true);
    setMessages([]);
    const userMsg: Message = { role: 'user', content: prompt };

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['x-access-password'] = password;

      const res = await fetch('/api/intel', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          studyContext: buildStudyContext(session),
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? 'Request failed');
      }

      const data = await res.json() as { text: string; marketMetrics?: MarketMetrics };
      setMessages([userMsg, { role: 'assistant', content: data.text }]);
      if (data.marketMetrics) setMetrics(data.marketMetrics);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.unknown;
      setMessages([userMsg, { role: 'assistant', content: `**Error:** ${msg}` }]);
    } finally {
      setScanning(false);
    }
  }

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading || scanning) return;

    const userMsg: Message = { role: 'user', content };
    const apiMessages = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['x-access-password'] = password;

      const res = await fetch('/api/intel', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: apiMessages,
          studyContext: buildStudyContext(session),
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? 'Request failed');
      }

      const data = await res.json() as { text: string; marketMetrics?: MarketMetrics };
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
      if (data.marketMetrics) setMetrics(data.marketMetrics);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.unknown;
      setMessages((prev) => [...prev, { role: 'assistant', content: `**Error:** ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  }

  const isLoading = loading || scanning;

  return (
    <div className="flex flex-col h-full bg-[#F5F6FA] overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0369A1] via-[#0284C7] to-[#0EA5E9] px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">VERA Intel</h1>
            <p className="text-white/70 text-xs">{t.headerSub}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 gap-4 p-4">

        {/* Left panel: Market metrics */}
        <div className="hidden md:flex flex-col gap-4 w-[280px] shrink-0">

          {/* Study context */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Market Metrics</h2>
              {!session && <span className="text-xs text-gray-400">{t.noStudy}</span>}
            </div>

            {metrics ? (
              <div className="space-y-3">
                {/* Market size + CAGR */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0369A1]/5 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-gray-500 font-medium mb-1">{t.marketSize}</div>
                    <div className="text-sm font-bold text-[#0369A1]">{metrics.marketSize ?? '—'}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-gray-500 font-medium mb-1">{t.cagr}</div>
                    <div className="text-sm font-bold text-emerald-600">{metrics.cagr ?? '—'}</div>
                  </div>
                </div>

                {/* Competition */}
                {metrics.competition && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">{t.competition}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: competitionColor(metrics.competition) }}
                    >
                      {metrics.competition}
                    </span>
                  </div>
                )}

                {/* Opportunity scores */}
                {(metrics.timing !== undefined || metrics.femaleRelevance !== undefined || metrics.competitiveGap !== undefined) && (
                  <div className="space-y-2">
                    {[
                      { label: t.timing, val: metrics.timing },
                      { label: t.femaleRel, val: metrics.femaleRelevance },
                      { label: t.gap, val: metrics.competitiveGap },
                    ].map(({ label, val }) =>
                      val !== undefined ? (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">{label}</span>
                            <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(val) }}>
                              {val}/10
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${val * 10}%`, backgroundColor: scoreColor(val) }}
                            />
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                )}

                <p className="text-gray-400 text-[10px] text-center pt-1">{t.dataNote}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-2">
                <p className="text-gray-400 text-xs text-center leading-relaxed">
                  {scanning ? t.scanning : t.scanHint}
                </p>
                {session && !scanning && (
                  <button
                    onClick={handleRunScan}
                    className="w-full bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-semibold rounded-xl px-4 py-2.5 transition-colors"
                  >
                    {lang === 'en' ? '◎ Run Market Scan' : '◎ Ejecutar Escaneo'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Study quick stats */}
          {session && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Study Scores</h2>
              <div className="space-y-2">
                {SEGMENT_KEYS.map((k) => {
                  const meta = SEGMENT_META[k];
                  const score = session.result.segments[k].likelihood_score;
                  return (
                    <div key={k}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-gray-500 truncate">{meta.label}</span>
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: meta.color }}>{score}/10</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${score * 10}%`, backgroundColor: meta.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right panel: Chat */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {[welcomeMessage, ...messages].map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0369A1] to-[#0EA5E9] flex items-center justify-center shrink-0 mt-0.5 mr-2">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[#0369A1] text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200 rounded-tl-sm'
                }`}>
                  {msg.role === 'user'
                    ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    : <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                  }
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0369A1] to-[#0EA5E9] flex items-center justify-center shrink-0 mt-0.5 mr-2">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  {scanning && <p className="text-xs text-[#0369A1] mb-1 font-medium">{t.scanning}</p>}
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-2 h-2 bg-[#0EA5E9] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#0EA5E9] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#0EA5E9] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex items-end gap-2 bg-white border border-gray-200 focus-within:border-[#0369A1] rounded-xl px-3 py-2 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                rows={1}
                disabled={isLoading}
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
                disabled={isLoading || !input.trim()}
                className="bg-[#0369A1] hover:bg-[#0284C7] text-white rounded-lg p-2 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-gray-400 text-[10px] mt-1.5 text-center">{t.hint}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
