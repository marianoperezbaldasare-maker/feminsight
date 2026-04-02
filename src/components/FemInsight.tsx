'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, Category, AnalysisResult, UploadedImage, SEGMENT_KEYS } from '@/types';
import { supabase } from '@/lib/supabase';
import Sidebar from './Sidebar';
import NewAnalysis from './NewAnalysis';
import Results from './Results';
import Comparator from './Comparator';
import PasswordGate from './ApiKeyModal';
import AEOAgent from './AEOAgent';

const PASSWORD_KEY = 'feminsight_access';
const USERNAME_KEY = 'feminsight_username';

type View = 'new' | 'results' | 'compare' | 'aeo';

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

function loadImagesFromStorage(sessionId: string): UploadedImage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`feminsight_images_${sessionId}`);
    return raw ? (JSON.parse(raw) as UploadedImage[]) : [];
  } catch {
    return [];
  }
}

function saveImagesToStorage(sessionId: string, images: UploadedImage[]) {
  localStorage.setItem(`feminsight_images_${sessionId}`, JSON.stringify(images));
}

function removeImagesFromStorage(sessionId: string) {
  localStorage.removeItem(`feminsight_images_${sessionId}`);
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
  const [username, setUsername] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load sessions from Supabase when username is set
  const loadSessionsFromSupabase = useCallback(async (uname: string) => {
    try {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('username', uname)
        .order('created_at', { ascending: false });

      if (data) {
        const sessionsWithImages: Session[] = data.map((row) => ({
          id: row.id as string,
          name: row.name as string,
          category: row.category as Session['category'],
          idea: row.idea as string,
          date: row.created_at as string,
          result: row.result as AnalysisResult,
          sentiment: row.sentiment as Session['sentiment'],
          urls: (row.urls as string[]) || [],
          is_public: (row.is_public as boolean) ?? false,
          username: row.username as string,
          images: loadImagesFromStorage(row.id as string),
        }));
        setSessions(sessionsWithImages);
      }
    } catch {
      // Supabase not configured yet — stay empty
    }
  }, []);

  useEffect(() => {
    const savedPwd = localStorage.getItem(PASSWORD_KEY);
    const savedUser = localStorage.getItem(USERNAME_KEY);
    if (savedPwd) setPassword(savedPwd);
    if (savedUser) setUsername(savedUser);
    if (savedUser) loadSessionsFromSupabase(savedUser);
  }, [loadSessionsFromSupabase]);

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
    }, 4000);
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
        localStorage.removeItem(PASSWORD_KEY);
        setPasswordError(true);
        throw new Error('Contraseña incorrecta');
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error((err as { error?: string }).error || 'Analysis failed');
      }

      const result: AnalysisResult = await response.json();

      // Run AEO in parallel after main analysis succeeds
      try {
        const aeoResponse = await fetch('/api/aeo-study', {
          method: 'POST',
          headers,
          body: JSON.stringify({ idea, category, urls }),
        });
        if (aeoResponse.ok) {
          const aeoData = await aeoResponse.json();
          if (!aeoData.error) {
            result.aeo_analysis = aeoData;
          }
        }
      } catch { /* AEO failure doesn't block the study */ }

      // Save to Supabase
      let sessionId = crypto.randomUUID();

      try {
        const { data: insertedRow } = await supabase
          .from('sessions')
          .insert({
            username: username ?? 'anonymous',
            name,
            category,
            idea,
            result,
            sentiment: result.executive_summary.overall_sentiment,
            urls: urls || [],
            is_public: false,
          })
          .select()
          .single();

        if (insertedRow) {
          sessionId = insertedRow.id as string;
        }
      } catch {
        // Supabase not configured — use local UUID
      }

      // Save images to localStorage keyed by session id
      if (images.length > 0) {
        saveImagesToStorage(sessionId, images);
      }

      const session: Session = {
        id: sessionId,
        name,
        category,
        idea,
        date: new Date().toISOString(),
        result,
        sentiment: result.executive_summary.overall_sentiment,
        images,
        urls,
        is_public: false,
        username: username ?? 'anonymous',
      };

      setSessions((prev) => [session, ...prev]);
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

  function handleUnlock(uname: string, pwd: string) {
    setPassword(pwd);
    setUsername(uname);
    setPasswordError(false);
    localStorage.setItem(PASSWORD_KEY, pwd);
    localStorage.setItem(USERNAME_KEY, uname);
    loadSessionsFromSupabase(uname);
  }

  function handleSelectSession(id: string) {
    setSelectedId(id);
    setView('results');
    setCompareMode(false);
    setSidebarOpen(false);
  }

  async function handleDeleteSession(id: string) {
    try {
      await supabase.from('sessions').delete().eq('id', id);
    } catch {
      // ignore if Supabase not configured
    }
    removeImagesFromStorage(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) { setSelectedId(null); setView('new'); }
    if (compareIds[0] === id || compareIds[1] === id) {
      setCompareIds([null, null]);
      if (view === 'compare') setView('new');
    }
    showToast('Session deleted');
  }

  async function handleShareSession(sessionId: string) {
    // Best-effort mark as public — share page works regardless
    supabase.from('sessions').update({ is_public: true }).eq('id', sessionId).then(() => {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, is_public: true } : s))
      );
    });
    const url = `${window.location.origin}/share/${sessionId}`;
    setShareUrl(url);
    // Try auto-copy
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch { /* show modal as fallback */ }
    }
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
          username={username}
          activeView={view}
          onSelectSession={handleSelectSession}
          onNewAnalysis={() => { setView('new'); setCompareMode(false); setSidebarOpen(false); }}
          onDeleteSession={handleDeleteSession}
          onToggleCompare={handleToggleCompare}
          onSelectForCompare={handleSelectForCompare}
          onClose={() => setSidebarOpen(false)}
          onOpenAEO={() => { setView('aeo'); setSidebarOpen(false); }}
        />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {view === 'aeo' && !loading ? (
          <AEOAgent password={password} />
        ) : view === 'new' || loading ? (
          <NewAnalysis onSubmit={handleRunAnalysis} loading={loading} loadingStage={loadingStage} />
        ) : view === 'results' && selectedSession ? (
          <Results
            session={selectedSession}
            onExportPDF={() => window.print()}
            onNewAnalysis={() => setView('new')}
            onShare={() => handleShareSession(selectedSession.id)}
          />
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

      {/* Share modal */}
      {shareUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShareUrl(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-gray-900 font-bold text-base">Compartir análisis</h3>
                <p className="text-gray-400 text-xs mt-0.5">Cualquier persona con este link puede ver el resultado</p>
              </div>
              <button onClick={() => setShareUrl(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none select-all"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[readonly]') as HTMLInputElement;
                  if (input) { input.select(); }
                  navigator.clipboard.writeText(shareUrl).catch(() => {
                    const ta = document.createElement('textarea');
                    ta.value = shareUrl;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.focus(); ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                  });
                  showToast('Link copiado!');
                  setShareUrl(null);
                }}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shrink-0"
              >
                Copiar
              </button>
            </div>
          </div>
        </div>
      )}

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
