'use client';

import { Session, Sentiment } from '@/types';

interface SidebarProps {
  sessions: Session[];
  selectedId: string | null;
  compareMode: boolean;
  compareIds: [string | null, string | null];
  sidebarOpen: boolean;
  username: string | null;
  activeView?: string;
  onSelectSession: (id: string) => void;
  onNewAnalysis: () => void;
  onDeleteSession: (id: string) => void;
  onToggleCompare: () => void;
  onSelectForCompare: (id: string) => void;
  onClose: () => void;
  onOpenAEO: () => void;
  onOpenNOVA: () => void;
}

const sentimentBadge: Record<Sentiment, { label: string; classes: string }> = {
  Positive: { label: 'Positive', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  Mixed: { label: 'Mixed', classes: 'bg-amber-50 text-amber-700 border border-amber-200' },
  Negative: { label: 'Negative', classes: 'bg-red-50 text-red-700 border border-red-200' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Sidebar({
  sessions,
  selectedId,
  compareMode,
  compareIds,
  sidebarOpen,
  username,
  activeView,
  onSelectSession,
  onNewAnalysis,
  onDeleteSession,
  onToggleCompare,
  onSelectForCompare,
  onClose,
  onOpenAEO,
  onOpenNOVA,
}: SidebarProps) {
  return (
    <aside className={`
      fixed md:relative top-0 left-0 bottom-0 z-50 md:z-auto
      w-72 shrink-0 flex flex-col h-full bg-white border-r border-gray-200
      transform transition-transform duration-300 ease-in-out
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-semibold text-sm tracking-wide">FemInsight</div>
              <div className="text-gray-400 text-[10px] leading-tight">Synthetic Focus Group</div>
              {username && (
                <div className="text-[#7C3AED] text-[10px] leading-tight mt-0.5 font-medium">
                  Hola, {username}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Close menu">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <button
          onClick={onNewAnalysis}
          className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Analysis
        </button>

        <button
          onClick={onOpenAEO}
          className={`w-full flex items-center justify-center gap-2 text-sm font-medium rounded-lg px-4 py-2 transition-colors ${
            activeView === 'aeo'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AEO Agent
        </button>

        <button
          onClick={onOpenNOVA}
          className={`w-full flex items-center justify-center gap-2 text-sm font-medium rounded-lg px-4 py-2 transition-colors ${
            activeView === 'nova'
              ? 'bg-[#3D2418] text-[#E8C4A0] border border-[#C97B6B]/40'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
          }`}
        >
          <span className="text-base leading-none">✦</span>
          NOVA Advisor
        </button>

        {sessions.length >= 2 && (
          <button
            onClick={onToggleCompare}
            className={`w-full flex items-center justify-center gap-2 text-sm font-medium rounded-lg px-4 py-2 transition-colors ${
              compareMode
                ? 'bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/30'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
            </svg>
            {compareMode ? 'Cancel Compare' : 'Compare Sessions'}
          </button>
        )}
      </div>

      {compareMode && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#7C3AED] text-xs">
          {compareIds[0] === null && compareIds[1] === null
            ? 'Select 2 sessions to compare'
            : compareIds[1] === null
            ? 'Select one more session'
            : 'Ready — click Compare'}
        </div>
      )}

      {/* History */}
      <div className="px-4 py-2">
        <div className="text-gray-400 text-[10px] uppercase tracking-widest font-semibold mb-2">
          History ({sessions.length})
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {sessions.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="text-gray-300 text-3xl mb-2">◎</div>
            <p className="text-gray-400 text-xs leading-relaxed">
              No sessions yet. Run your first analysis to get started.
            </p>
          </div>
        ) : (
          sessions
            .slice()
            .reverse()
            .map((session) => {
              const badge = sentimentBadge[session.sentiment];
              const isSelected = session.id === selectedId;
              const isInCompare = compareIds.includes(session.id);

              return (
                <div
                  key={session.id}
                  className={`group relative rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected && !compareMode
                      ? 'bg-[#7C3AED]/10 border border-[#7C3AED]/30'
                      : isInCompare
                      ? 'bg-[#7C3AED]/8 border border-[#7C3AED]/25'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    if (compareMode) {
                      onSelectForCompare(session.id);
                    } else {
                      onSelectSession(session.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 text-xs font-medium truncate">{session.name}</div>
                      <div className="text-gray-400 text-[10px] mt-0.5 truncate">{session.category}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-0.5 rounded shrink-0"
                      aria-label="Delete session"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${badge.classes}`}>
                      {badge.label}
                    </span>
                    <span className="text-gray-400 text-[9px]">{formatDate(session.date)}</span>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </aside>
  );
}
