export type Sentiment = 'Positive' | 'Mixed' | 'Negative';

export type Category =
  | 'Business Idea'
  | 'Physical Product'
  | 'Digital Product'
  | 'Content & Branding';

export type SegmentKey =
  | 'urban_executive'
  | 'modern_mom'
  | 'digital_entrepreneur'
  | 'premium_consumer'
  | 'rising_professional';

export interface SegmentResult {
  name: string;
  gut_reaction: string;
  loves: string[];
  concerns: string[];
  likelihood_score: number;
  quote: string;
}

export interface ExecutiveSummary {
  overall_sentiment: Sentiment;
  top_insights: string[];
  top_objections: string[];
  recommendation: string;
  best_segment: string;
}

export interface AnalysisResult {
  segments: Record<SegmentKey, SegmentResult>;
  executive_summary: ExecutiveSummary;
}

export interface UploadedImage {
  id: string;
  name: string;
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  previewUrl: string;
}

export interface Session {
  id: string;
  name: string;
  category: Category;
  idea: string;
  date: string;
  result: AnalysisResult;
  sentiment: Sentiment;
  images?: UploadedImage[];
}

export const SEGMENT_KEYS: SegmentKey[] = [
  'urban_executive',
  'modern_mom',
  'digital_entrepreneur',
  'premium_consumer',
  'rising_professional',
];

export const SEGMENT_META: Record<
  SegmentKey,
  { label: string; description: string; color: string; bgLight: string; icon: string }
> = {
  urban_executive: {
    label: 'Urban Executive',
    description: '35–48 · LATAM/Europe · Senior professional',
    color: '#0EA5E9',
    bgLight: '#F0F9FF',
    icon: '💼',
  },
  modern_mom: {
    label: 'Modern Mom',
    description: '28–42 · North America/Australia · Working mother',
    color: '#10B981',
    bgLight: '#F0FDF4',
    icon: '🌿',
  },
  digital_entrepreneur: {
    label: 'Digital Entrepreneur',
    description: '25–35 · Global/Remote · Freelancer/Digital biz',
    color: '#F59E0B',
    bgLight: '#FFFBEB',
    icon: '🚀',
  },
  premium_consumer: {
    label: 'Premium Consumer',
    description: '30–45 · Europe/Asia · Lifestyle & travel focused',
    color: '#EC4899',
    bgLight: '#FDF2F8',
    icon: '✦',
  },
  rising_professional: {
    label: 'Rising Professional',
    description: '25–33 · India/SE Asia/Africa · Tech/finance career',
    color: '#8B5CF6',
    bgLight: '#F5F3FF',
    icon: '⬆',
  },
};

export const CATEGORIES: Category[] = [
  'Business Idea',
  'Physical Product',
  'Digital Product',
  'Content & Branding',
];
