'use client';

import { useState, useRef, useEffect } from 'react';
import { Session, SEGMENT_KEYS, SEGMENT_META } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Player {
  name: string;
  positioning: string;
  threat: 'high' | 'medium' | 'low';
}

interface PlayersData {
  players: Player[];
  overallThreat?: string;
  whiteSpaces?: number;
}

interface BenchmarkAgentProps {
  session?: Session | null;
  sessions?: Session[];
  password?: string | null;
}

function buildStudyContext(session: Session | null | undefined): string {
  if (!session) return '';
  const { idea, category, result } = session;
  const avgScore = (
    SEGMENT_KEYS.reduce((sum, k) => sum + result.segments[k].likelihood_score, 0) / SEGMENT_KEYS.length
  ).toFixed(1);
  return `IDEA: ${idea}
CATEGORY: ${category}
AVERAGE SCORE: ${avgScore}/10
BEST SEGMENT: ${result.executive_summary.best_segment}
OVERALL SENTIMENT: ${result.executive_summary.overall_sentiment}`.trim();
}

function threatColor(threat: string): { bg: string; text: string; label: string } {
  const t = threat.toLowerCase();
  if (t === 'high') return { bg: '#FEE2E2', text: '#991B1B', label: 'High' };
  if (t === 'medium') return { bg: '#FEF3C7', text: '#92400E', label: 'Med' };
  return { bg: '#D1FAE5', text: '#065F46', label: 'Low' };
}

function overallThreatColor(threat: string | undefined): string {
  if (!threat) return '#9CA3AF';
  const t = threat.toLowerCase();
  if (t.includes('very high')) return '#EF4444';
  if (t.includes('high')) return '#F59E0B';
  if (t.includes('medium')) return '#0EA5E9';
  return '#10B981';
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
    else parts.push(<code key={match.index} className="bg-gray-100 text-[#65a30d] text-xs px-1.5 py-0.5 rounded font-mono">{match[3]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

const WELCOME_CONTENT: Record<'en' | 'es', string> = {
  en: `## Hi, I'm SAGE Radar 🌿

I map the competitive landscape for your focus group's niche — identifying who the real players are, where they're strong, where they miss, and where your idea can win.

### What I do

- **Competitive scan**: 5–8 real brands competing in your space targeting women
- **White space detection**: gaps no current player fills well
- **Threat assessment**: who's a real threat vs. who's beatable
- **Differentiation angle**: where your idea can own a position no one else has

### How to start

Select a study from the history and I'll automatically map the competitive landscape for that category. Or describe your idea and I'll start the analysis.`,
  es: `## Hola, soy SAGE Radar 🌿

Mapeo el panorama competitivo del nicho de tu focus group — identificando quiénes son los players reales, dónde son fuertes, dónde fallan y dónde tu idea puede ganar.

### Qué hago

- **Escaneo competitivo**: 5–8 marcas reales que compiten en tu espacio dirigiéndose a mujeres
- **Detección de white spaces**: gaps que ningún player actual llena bien
- **Evaluación de amenazas**: quién es amenaza real vs. quién es superable
- **Ángulo de diferenciación**: dónde tu idea puede ocupar una posición que nadie tiene

### Cómo empezar

Seleccioná un estudio del historial y mapeo el panorama competitivo automáticamente. O describí tu idea y empiezo el análisis.`,
};

export default function BenchmarkAgent({ session, password }: BenchmarkAgentProps) {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [playersData, setPlayersData] = useState<PlayersData | null>(null);
  const [scannedSessionId, setScannedSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const welcomeMessage: Message = { role: 'assistant', content: WELCOME_CONTENT[lang] };
  const t = lang === 'en' ? {
    headerSub: 'Competitive Intelligence · Market Players · Strategic Gaps',
    noStudy: 'No study',
    players: 'Key Players',
    overallThreat: 'Overall Threat',
    whiteSpaces: 'White Spaces',
    scanHint: 'Select a study to map the competitive landscape automatically.',
    scanning: 'Mapping competitive landscape…',
    placeholder: 'Ask about competitors, white spaces, positioning…',
    hint: 'Enter to send · Shift+Enter for new line',
    unknown: 'Unknown error',
    identified: 'identified',
  } : {
    headerSub: 'Inteligencia Competitiva · Players del Mercado · Gaps Estratégicos',
    noStudy: 'Sin estudio',
    players: 'Players Clave',
    overallThreat: 'Amenaza General',
    whiteSpaces: 'White Spaces',
    scanHint: 'Seleccioná un estudio para mapear el panorama competitivo automáticamente.',
    scanning: 'Mapeando panorama competitivo…',
    placeholder: 'Preguntá sobre competidores, white spaces, posicionamiento…',
    hint: 'Enter para enviar · Shift+Enter para nueva línea',
    unknown: 'Error desconocido',
    identified: 'identificados',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!session || session.id === scannedSessionId) return;
    const scanPrompt = lang === 'en'
      ? `Map the competitive landscape for this idea: "${session.idea}" in the category "${session.category}". Who are the real players targeting women in this space?`
      : `Mapeá el panorama competitivo para esta idea: "${session.idea}" en la categoría "${session.category}". ¿Quiénes son los players reales que se dirigen a mujeres en este espacio?`;
    setScannedSessionId(session.id);
    void runScan(scanPrompt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  async function runScan(prompt: string) {
    setScanning(true);
    setMessages([]);
    const userMsg: Message = { role: 'user', content: prompt };

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['x-access-password'] = password;

      const res = await fetch('/api/benchmark', {
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

      const data = await res.json() as { text: string; playersData?: PlayersData };
      setMessages([userMsg, { role: 'assistant', content: data.text }]);
      if (data.playersData) setPlayersData(data.playersData);
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

      const res = await fetch('/api/benchmark', {
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

      const data = await res.json() as { text: string; playersData?: PlayersData };
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
      if (data.playersData) setPlayersData(data.playersData);
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
      <div className="bg-gradient-to-r from-[#3f6212] via-[#4d7c0f] to-[#65a30d] px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
            🌿
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">SAGE Radar</h1>
            <p className="text-white/70 text-xs">{t.headerSub}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 gap-4 p-4">

        {/* Left panel */}
        <div className="hidden md:flex flex-col gap-4 w-[280px] shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{t.players}</h2>
              {!session && <span className="text-xs text-gray-400">{t.noStudy}</span>}
            </div>

            {playersData ? (
              <div className="space-y-3">
                {/* Players list */}
                {playersData.players.slice(0, 7).map((player, idx) => {
                  const tc = threatColor(player.threat);
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                        style={{ backgroundColor: tc.bg, color: tc.text }}
                      >
                        {tc.label}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate">{player.name}</div>
                        <div className="text-[10px] text-gray-400 leading-tight truncate">{player.positioning}</div>
                      </div>
                    </div>
                  );
                })}

                {/* Overall threat */}
                {playersData.overallThreat && (
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{t.overallThreat}</span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: overallThreatColor(playersData.overallThreat) }}
                    >
                      {playersData.overallThreat}
                    </span>
                  </div>
                )}

                {/* White spaces */}
                {playersData.whiteSpaces !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{t.whiteSpaces}</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {playersData.whiteSpaces} {t.identified}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-xs text-center leading-relaxed">
                {scanning ? t.scanning : t.scanHint}
              </p>
            )}
          </div>
        </div>

        {/* Right panel: Chat */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {[welcomeMessage, ...messages].map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3f6212] to-[#65a30d] flex items-center justify-center shrink-0 mt-0.5 mr-2 text-sm">
                    🌿
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[#4d7c0f] text-white rounded-tr-sm'
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
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3f6212] to-[#65a30d] flex items-center justify-center shrink-0 mt-0.5 mr-2 text-sm">
                  🌿
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  {scanning && <p className="text-xs text-[#4d7c0f] mb-1 font-medium">{t.scanning}</p>}
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-2 h-2 bg-[#65a30d] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#65a30d] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#65a30d] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-3">
            <div className="flex items-end gap-2 bg-white border border-gray-200 focus-within:border-[#4d7c0f] rounded-xl px-3 py-2 transition-colors">
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
                className="bg-[#4d7c0f] hover:bg-[#3f6212] text-white rounded-lg p-2 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
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
