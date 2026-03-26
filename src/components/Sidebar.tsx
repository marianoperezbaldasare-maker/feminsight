'use client';

import { Session, Sentiment } from '@/types';

interface SidebarProps {
  sessions: Session[];
  selectedId: string | null;
  compareMode: boolean;
  compareIds: [string | null, string | null];
  onSelectSession: (id: string) => void;
  onNewAnalysis: () => void;
  onDeleteSession: (id: string) => void;
  onToggleCompare: () => void;
  onSelectForCompare: (id: string) => void;
}

const sentimentBadge: Record<Sentiment, { label: string; classes: string }> = {
  Positive: { label: 'Positive', classes: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  Mixed: { label: 'Mixed', classes: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
  Negative: { label: 'Negative', classes: 'bg-red-500/20 text-red-300 border border-red-500/30' },
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
  onSelectSession,
  onNewAnalysis,
  onDeleteSession,
  onToggleCompare,
  onSelectForCompare,
}: SidebarProps) {
  return (
    <aside className="w-72 shrink-0 flex flex-col h-full bg-[#0a1628] border-r border-white/[0.07]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="text-white font-semibold text-sm tracking-wide">FemInsight</div>
            <div className="text-white/40 text-[10px] leading-tight">Synthetic Focus Group</div>
          </div>
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

        {sessions.length >= 2 && (
          <button
            onClick={onToggleCompare}
            className={`w-full flex items-center justify-center gap-2 text-sm font-medium rounded-lg px-4 py-2 transition-colors ${
              compareMode
                ? 'bg-[#7C3AED]/20 text-[#a78bfa] border border-[#7C3AED]/40'
                : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
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
        <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-[#a78bfa] text-xs">
          {compareIds[0] === null && compareIds[1] === null
            ? 'Select 2 sessions to compare'
            : compareIds[1] === null
            ? 'Select one more session'
            : 'Ready — click Compare'}
        </div>
      )}

      {/* History */}
      <div className="px-4 py-2">
        <div className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2">
          History ({sessions.length})
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {sessions.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="text-white/20 text-3xl mb-2">◎</div>
            <p className="text-white/30 text-xs leading-relaxed">
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
                      ? 'bg-[#7C3AED]/20 border border-[#7C3AED]/40'
                      : isInCompare
                      ? 'bg-[#7C3AED]/15 border border-[#7C3AED]/30'
                      : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
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
                      <div className="text-white/90 text-xs font-medium truncate">{session.name}</div>
                      <div className="text-white/40 text-[10px] mt-0.5 truncate">{session.category}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all p-0.5 rounded shrink-0"
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
                    <span className="text-white/25 text-[9px]">{formatDate(session.date)}</span>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </aside>
  );
}
