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

  async function handleRunAnalysis(name: string, category: Category, idea: string, images: UploadedImage[]) {
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
    <div className="flex h-full bg-[#0F1B2D]">
      <Sidebar
        sessions={sessions}
        selectedId={selectedId}
        compareMode={compareMode}
        compareIds={compareIds}
        onSelectSession={handleSelectSession}
        onNewAnalysis={() => { setView('new'); setCompareMode(false); }}
        onDeleteSession={handleDeleteSession}
        onToggleCompare={handleToggleCompare}
        onSelectForCompare={handleSelectForCompare}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {view === 'new' || loading ? (
          <NewAnalysis onSubmit={handleRunAnalysis} loading={loading} loadingStage={loadingStage} />
        ) : view === 'results' && selectedSession ? (
          <Results session={selectedSession} onExportPDF={() => window.print()} onNewAnalysis={() => setView('new')} />
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

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50 pointer-events-none no-print">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-[#0F1B2D] border-emerald-500/30 text-emerald-300'
                : 'bg-[#0F1B2D] border-red-500/30 text-red-300'
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
