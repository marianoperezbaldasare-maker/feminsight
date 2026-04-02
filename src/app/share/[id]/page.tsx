import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Session } from '@/types';
import ShareView from './ShareView';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: session } = await supabase
    .from('sessions')
    .select('name, category, idea, sentiment')
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (!session) {
    return { title: 'FemInsight Report' };
  }

  const description = `${session.category} · ${session.sentiment} sentiment · AI focus group analysis of 10,000+ female consumer profiles.`;

  return {
    title: `${session.name} — FemInsight Report`,
    description,
    openGraph: {
      title: `${session.name} — FemInsight`,
      description,
      siteName: 'FemInsight',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${session.name} — FemInsight`,
      description,
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.1-1.1m-.758-4.9a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h1 className="text-gray-900 font-bold text-xl mb-2">Report not available</h1>
          <p className="text-gray-400 text-sm mb-6">This link may have expired or hasn&apos;t been made public yet.</p>
          <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold rounded-xl transition-colors">
            Create your own analysis
          </a>
        </div>
      </div>
    );
  }

  const sessionData: Session = {
    id: session.id as string,
    name: session.name as string,
    category: session.category as Session['category'],
    idea: session.idea as string,
    date: session.created_at as string,
    result: session.result as Session['result'],
    sentiment: session.sentiment as Session['sentiment'],
    urls: (session.urls as string[]) || [],
    is_public: true,
  };

  return <ShareView session={sessionData} />;
}
