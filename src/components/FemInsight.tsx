'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, Category, AnalysisResult, UploadedImage, SEGMENT_KEYS } from '@/types';
import Sidebar from './Sidebar';
import NewAnalysis from './NewAnalysis';
import Results from './Results';
import Comparator from './Comparator';
import PasswordGate from './ApiKeyModal';

const STORAGE_KEY = 'feminsight_sessions';
const PASSWORD_KEY = 'feminsight_access';

type View = 'new' | 'results' | 'compare';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

function MobileHeader({
  onMenuOpen,
  onNewAnalysis,
}: {
  onMenuOpen: () => void;
  onNewAnalysis: () => void;
}) {
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
      <button onClick={onMenuOpen} className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors" aria-label="Open menu">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-[#7C3AED] flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="text-gray-900 font-semibold text-sm">FemInsight</span>
      </div>
      <button onClick={onNewAnalysis} className="p-2 rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors" aria-label="New analysis">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

function loadSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export default function FemInsight() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [view, setView] = useState<View>('new');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);
  const [password, setPassword] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSessions(loadSessions());
    const saved = sessionStorage.getItem(PASSWORD_KEY);
    if (saved) setPassword(saved);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  function startLoadingAnimation() {
    setLoadingStage(0);
    let stage = 0;
    loadingIntervalRef.current = setInterval(() => {
      stage += 1;
      setLoadingStage(stage);
      if (stage >= SEGMENT_KEYS.length && loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    }, 900);
  }

  function stopLoadingAnimation() {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
    setLoadingStage(SEGMENT_KEYS.length);
  }

  async function handleRunAnalysis(name: string, category: Category, idea: string, images: UploadedImage[], urls: string[]) {
    setLoading(true);
    startLoadingAnimation();

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (password) headers['x-access-password'] = password;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          idea,
          category,
          images: images.map(({ base64, mediaType }) => ({ base64, mediaType })),
          urls,
        }),
      });

      if (response.status === 401) {
        setPassword(null);
        sessionStorage.removeItem(PASSWORD_KEY);
        setPasswordError(true);
        throw new Error('Contraseña incorrecta');
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const result: AnalysisResult = await response.json();

      const session: Session = {
        id: crypto.randomUUID(),
        name,
        category,
        idea,
        date: new Date().toISOString(),
        result,
        sentiment: result.executive_summary.overall_sentiment,
        images,
        urls,
      };

      const updated = [...sessions, session];
      setSessions(updated);
      saveSessions(updated);
      setSelectedId(session.id);
      setView('results');
      showToast(`Session "${name}" saved successfully`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      showToast(msg, 'error');
    } finally {
      stopLoadingAnimation();
      setLoading(false);
    }
  }

  function handleUnlock(pwd: string) {
    setPassword(pwd);
    setPasswordError(false);
    sessionStorage.setItem(PASSWORD_KEY, pwd);
  }

  function handleSelectSession(id: string) {
    setSelectedId(id);
    setView('results');
    setCompareMode(false);
    setSidebarOpen(false);
  }

  function handleDeleteSession(id: string) {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    saveSessions(updated);
    if (selectedId === id) { setSelectedId(null); setView('new'); }
    if (compareIds[0] === id || compareIds[1] === id) {
      setCompareIds([null, null]);
      if (view === 'compare') setView('new');
    }
    showToast('Session deleted');
  }

  function handleToggleCompare() {
    if (compareMode) {
      setCompareMode(false);
      setCompareIds([null, null]);
      if (view === 'compare') setView(selectedId ? 'results' : 'new');
    } else {
      setCompareMode(true);
      setCompareIds([null, null]);
    }
  }

  function handleSelectForCompare(id: string) {
    setCompareIds((prev) => {
      if (prev[0] === id) return [null, prev[1]];
      if (prev[1] === id) return [prev[0], null];
      if (prev[0] === null) return [id, prev[1]];
      if (prev[1] === null) {
        setTimeout(() => { setView('compare'); setCompareMode(false); }, 100);
        return [prev[0]!, id];
      }
      return [id, null];
    });
  }

  // Show password gate if no password saved
  if (password === null) {
    return <PasswordGate onUnlock={handleUnlock} error={passwordError} />;
  }

  const selectedSession = sessions.find((s) => s.id === selectedId) ?? null;
  const compareSessionA = sessions.find((s) => s.id === compareIds[0]) ?? null;
  const compareSessionB = sessions.find((s) => s.id === compareIds[1]) ?? null;

  return (
    <div className="flex flex-col h-full bg-[#F5F6FA]">
      <MobileHeader
        onMenuOpen={() => setSidebarOpen(true)}
        onNewAnalysis={() => { setView('new'); setCompareMode(false); setSidebarOpen(false); }}
      />

      <div className="flex flex-1 min-h-0">
        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          sessions={sessions}
          selectedId={selectedId}
          compareMode={compareMode}
          compareIds={compareIds}
          sidebarOpen={sidebarOpen}
          onSelectSession={handleSelectSession}
          onNewAnalysis={() => { setView('new'); setCompareMode(false); setSidebarOpen(false); }}
          onDeleteSession={handleDeleteSession}
          onToggleCompare={handleToggleCompare}
          onSelectForCompare={handleSelectForCompare}
          onClose={() => setSidebarOpen(false)}
        />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {view === 'new' || loading ? (
          <NewAnalysis onSubmit={handleRunAnalysis} loading={loading} loadingStage={loadingStage} />
        ) : view === 'results' && selectedSession ? (
          <Results session={selectedSession} onExportPDF={() => window.print()} onNewAnalysis={() => setView('new')} onShareToast={(msg) => showToast(msg)} />
        ) : view === 'compare' && compareSessionA && compareSessionB ? (
          <Comparator
            sessionA={compareSessionA}
            sessionB={compareSessionB}
            onClose={() => { setView(selectedId ? 'results' : 'new'); setCompareIds([null, null]); }}
          />
        ) : (
          <NewAnalysis onSubmit={handleRunAnalysis} loading={false} loadingStage={0} />
        )}
      </main>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50 pointer-events-none no-print">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-white border-emerald-200 text-emerald-700'
                : 'bg-white border-red-200 text-red-600'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
