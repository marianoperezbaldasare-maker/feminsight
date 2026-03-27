'use client';

import { useRouter } from 'next/navigation';
import Results from '@/components/Results';
import { Session } from '@/types';

interface ShareViewProps {
  session: Session;
}

export default function ShareView({ session }: ShareViewProps) {
  const router = useRouter();

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      {/* Banner */}
      <div className="bg-[#7C3AED] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-white/80 text-xs">Shared via FemInsight</span>
          <span className="text-white/40 text-xs hidden sm:inline">·</span>
          <span className="text-white text-xs font-semibold hidden sm:inline truncate max-w-[200px]">{session.name}</span>
        </div>
        <a
          href="/"
          className="text-white/70 hover:text-white text-xs font-medium transition-colors"
        >
          Open App
        </a>
      </div>

      {/* Note about images */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-amber-700 text-xs text-center">
        Images are not available in shared view. Export PDF from within the app for the full report.
      </div>

      {/* Results rendered in read-only mode */}
      <div className="flex-1 flex flex-col">
        <Results
          session={session}
          onExportPDF={() => window.print()}
          onNewAnalysis={() => router.push('/')}
          onShare={handleShare}
        />
      </div>
    </div>
  );
}
