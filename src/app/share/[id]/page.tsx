import { supabase } from '@/lib/supabase';
import { Session } from '@/types';
import ShareView from './ShareView';

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-3">&#9678;</div>
          <h1 className="text-gray-900 font-bold text-xl mb-2">Analysis not found</h1>
          <p className="text-gray-500 text-sm">This link may have expired or is not public.</p>
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
