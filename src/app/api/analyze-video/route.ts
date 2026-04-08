import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SegmentKey, SEGMENT_KEYS } from '@/types';

export const maxDuration = 60;

const SEGMENT_DESCRIPTIONS: Record<SegmentKey, string> = {
  urban_executive: 'Urban Executive, 35–48, LATAM/Europe, senior professional, values efficiency, quality, and status',
  modern_mom: 'Modern Mom, 28–42, North America/Australia, working mother, values practicality, family, and authentic connection',
  digital_entrepreneur: 'Digital Entrepreneur, 25–35, Global/Remote, freelancer or digital business owner, values authenticity, innovation, and hustle culture',
  premium_consumer: 'Premium Consumer, 30–45, Europe/Asia, lifestyle and travel focused, values aesthetics, exclusivity, and experiences',
  rising_professional: 'Rising Professional, 25–33, India/SE Asia/Africa, tech or finance career, values ambition, community, and aspiration',
  mature_professional: 'Mature Professional, 50+, Global, senior leader or entrepreneur, values substance, trust, and proven results',
};

function buildPrompt(studyName: string): string {
  const segmentList = SEGMENT_KEYS.map(k => `- ${k}: ${SEGMENT_DESCRIPTIONS[k]}`).join('\n');

  return `You are running a synthetic focus group of 10,000 women across 6 demographic segments for FemInsight, a market research platform. They are watching the video you just received.

Watch the entire video carefully — pay attention to visuals, audio, music, narration, text on screen, pacing, emotional tone, humor, storytelling arc, and call to action.

${studyName ? `This video is titled: "${studyName}"\n` : ''}

THE 6 SEGMENTS:
${segmentList}

Analyze the video from the perspective of each segment. Imagine 1,000–2,000 women from each segment watching it and report their collective reactions.

Return ONLY a valid JSON object. No markdown, no code fences, just raw JSON:

{
  "overall_verdict": "one sentence that captures the video's impact on this audience",
  "overall_sentiment": "Positive" | "Mixed" | "Negative",
  "segments": {
    "urban_executive": {
      "likelihood_score": 8,
      "emotional_journey": "Detailed 2-3 sentence narrative of how they experience the video from start to finish",
      "peak_moment": "The specific visual or audio moment that hits hardest for this segment",
      "drop_off_risk": "The moment or element most likely to lose their attention or create friction",
      "key_reactions": ["Specific reaction 1", "Specific reaction 2", "Specific reaction 3"],
      "quote": "A representative quote as if spoken by someone from this segment after watching"
    },
    "modern_mom": { ... },
    "digital_entrepreneur": { ... },
    "premium_consumer": { ... },
    "rising_professional": { ... },
    "mature_professional": { ... }
  },
  "emotional_arc": [
    {
      "timestamp": "0:00-0:05",
      "event": "What happens visually/audio in this moment",
      "reaction": "Overall audience emotional reaction",
      "intensity": 7
    }
  ],
  "creative_assessment": {
    "visual_score": 8,
    "audio_score": 7,
    "message_clarity": 6,
    "cta_effectiveness": 5,
    "overall_score": 7,
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"]
  },
  "executive_summary": {
    "best_segment": "segment_key",
    "worst_segment": "segment_key",
    "recommendation": "3-4 sentence strategic recommendation for this creative",
    "key_insight": "The single most important insight from this focus group test"
  }
}

The emotional_arc should have one entry per meaningful segment of the video (every 5–10 seconds for short videos, every 10–20 seconds for longer ones). intensity is 1–10. All scores are 1–10.`;
}

export async function POST(request: NextRequest) {
  try {
    const accessPassword = process.env.ACCESS_PASSWORD;
    if (accessPassword) {
      const provided = request.headers.get('x-access-password');
      if (provided !== accessPassword) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI not configured. Add GOOGLE_AI_API_KEY to environment variables.' }, { status: 500 });
    }

    const { videoBase64, mimeType, studyName } = await request.json() as {
      videoBase64: string;
      mimeType: string;
      studyName?: string;
    };

    if (!videoBase64 || !mimeType) {
      return NextResponse.json({ error: 'Video data required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType as 'video/mp4' | 'video/quicktime' | 'video/webm' | 'video/x-msvideo',
          data: videoBase64,
        },
      },
      { text: buildPrompt(studyName ?? '') },
    ]);

    let text = result.response.text().trim();

    // Strip markdown code fences if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    const parsed = JSON.parse(text);
    return NextResponse.json({ result: parsed });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Video analysis failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
