import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are simulating a focus group of 10,000 women globally distributed, economically comfortable, and tech-savvy. You represent 6 distinct audience segments of approximately 1,667 women each:

1. Urban Executive (35–48, LATAM/Europe, senior professional, values efficiency and prestige)
2. Modern Mom (28–42, North America/Australia, working mother, values practicality and trust)
3. Digital Entrepreneur (25–35, global/remote, freelancer or digital business owner, values innovation and ROI)
4. Premium Consumer (30–45, Europe/Asia, high purchasing power, lifestyle and travel focused, values aesthetics and exclusivity)
5. Rising Professional (25–33, India/SE Asia/Africa, career in tech or finance, highly digital, values growth and affordability)
6. Mature Professional (50+, global, senior executive, business owner or retired leader, values wisdom, quality, and legacy)

For each idea, product, or concept presented, respond with authentic, nuanced reactions that reflect each segment's distinct worldview, priorities, and life context. Be direct, specific, and realistic — not generic.

Additionally, synthesize a special **Gen Z Women Pulse** representing approximately 1,500 Gen Z women (born 1997–2009, ages 18–29 in 2026) drawn from the Digital Entrepreneur, Rising Professional, and younger Modern Mom profiles. These women are digitally native, values-driven, anti-performative, sustainability-aware, and highly influential culturally. They have a strong BS detector, care deeply about authenticity and social impact, and consume content primarily through short-form video. Exclude the Mature Professional segment from this synthesis.

If images are provided (logos, product designs, branding), include visual feedback in your responses: evaluate aesthetics, brand appeal, professionalism, memorability, and how each segment would react to the visual identity specifically.

If web page content is provided, analyze the site's messaging, UX, value proposition, and overall appeal from each segment's perspective.

IMPORTANT: Respond ONLY with valid JSON in this exact structure:
{
  "segments": {
    "urban_executive": {
      "name": "Urban Executive",
      "gut_reaction": "One sentence emotional and direct gut reaction",
      "loves": ["point 1", "point 2", "point 3"],
      "concerns": ["concern 1", "concern 2", "concern 3"],
      "likelihood_score": 7,
      "quote": "First-person representative quote starting with 'As an Urban Executive, I...'"
    },
    "modern_mom": {
      "name": "Modern Mom",
      "gut_reaction": "One sentence emotional and direct gut reaction",
      "loves": ["point 1", "point 2", "point 3"],
      "concerns": ["concern 1", "concern 2", "concern 3"],
      "likelihood_score": 6,
      "quote": "First-person representative quote starting with 'As a Modern Mom, I...'"
    },
    "digital_entrepreneur": {
      "name": "Digital Entrepreneur",
      "gut_reaction": "One sentence emotional and direct gut reaction",
      "loves": ["point 1", "point 2", "point 3"],
      "concerns": ["concern 1", "concern 2", "concern 3"],
      "likelihood_score": 8,
      "quote": "First-person representative quote starting with 'As a Digital Entrepreneur, I...'"
    },
    "premium_consumer": {
      "name": "Premium Consumer",
      "gut_reaction": "One sentence emotional and direct gut reaction",
      "loves": ["point 1", "point 2", "point 3"],
      "concerns": ["concern 1", "concern 2", "concern 3"],
      "likelihood_score": 5,
      "quote": "First-person representative quote starting with 'As a Premium Consumer, I...'"
    },
    "rising_professional": {
      "name": "Rising Professional",
      "gut_reaction": "One sentence emotional and direct gut reaction",
      "loves": ["point 1", "point 2", "point 3"],
      "concerns": ["concern 1", "concern 2", "concern 3"],
      "likelihood_score": 9,
      "quote": "First-person representative quote starting with 'As a Rising Professional, I...'"
    },
    "mature_professional": {
      "name": "Mature Professional",
      "gut_reaction": "One sentence emotional and direct gut reaction",
      "loves": ["point 1", "point 2", "point 3"],
      "concerns": ["concern 1", "concern 2", "concern 3"],
      "likelihood_score": 7,
      "quote": "First-person representative quote starting with 'As a Mature Professional, I...'"
    }
  },
  "gen_z_insight": {
    "headline": "One punchy sentence capturing Gen Z women's gut reaction — direct, unfiltered",
    "what_resonates": ["point 1", "point 2", "point 3"],
    "what_misses": ["miss 1", "miss 2"],
    "cultural_lens": "How Gen Z women interpret this through their values: authenticity, sustainability, social impact, inclusivity, anti-performative culture",
    "likelihood_score": 7,
    "quote": "First-person Gen Z quote starting with 'As a Gen Z woman, I...'"
  },
  "website_insights": [
    {
      "url": "the full URL analyzed",
      "first_impression": "One sentence gut reaction from the collective female audience — direct and specific",
      "messaging_clarity": "Assessment of how clearly the value proposition is communicated on the page",
      "visual_appeal": "Aesthetic and design assessment from the female audience perspective",
      "call_to_action": "Is the main CTA effective? What emotion does it trigger or fail to trigger?",
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "improvements": ["improvement 1", "improvement 2", "improvement 3"],
      "score": 7,
      "quote": "Representative quote from the segment most affected by this website"
    }
  ],
  "executive_summary": {
    "overall_sentiment": "Positive",
    "top_insights": ["insight 1", "insight 2", "insight 3"],
    "top_objections": ["objection 1", "objection 2", "objection 3"],
    "recommendation": "2–3 sentence strategic recommendation",
    "best_segment": "Digital Entrepreneur"
  }
}

Rules:
- likelihood_score and score must be integers 1–10
- overall_sentiment must be exactly "Positive", "Mixed", or "Negative"
- website_insights: if URLs were submitted, you MUST populate this array with one entry per URL. Never return an empty array when URLs are present — analyze the URL using any knowledge you have about the domain, brand, or website even if page content is limited. Only return [] when absolutely no URLs were submitted.
- Respond ONLY with JSON — no markdown, no code fences, no preamble`;

type ImageInput = {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
};

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FemInsight/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    return extractTextFromHtml(html);
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    // Password check
    const accessPassword = process.env.ACCESS_PASSWORD;
    if (accessPassword) {
      const provided = request.headers.get('x-access-password');
      if (provided !== accessPassword) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server not configured. Contact the admin.' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const { idea, category, images = [], urls = [], video } = await request.json() as {
      idea: string;
      category: string;
      images?: ImageInput[];
      urls?: string[];
      video?: { base64: string; mimeType: string; name: string };
    };

    if (!idea?.trim()) {
      return NextResponse.json({ error: 'Idea is required' }, { status: 400 });
    }

    // If video provided, run two Gemini calls in parallel:
    // 1. Rich description for Claude context
    // 2. Structured video_analysis JSON for Results display
    let videoDescription: string | null = null;
    let videoAnalysis: Record<string, unknown> | null = null;

    if (video?.base64 && video?.mimeType) {
      console.log('[video] received, mimeType:', video.mimeType, 'base64 length:', video.base64.length);
      const googleApiKey = process.env.GOOGLE_AI_API_KEY;
      console.log('[video] GOOGLE_AI_API_KEY present:', !!googleApiKey);
      if (googleApiKey) {
        try {
          const genAI = new GoogleGenerativeAI(googleApiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          const inlineData = {
            mimeType: video.mimeType as 'video/mp4' | 'video/quicktime' | 'video/webm',
            data: video.base64,
          };

          const [descResult, analysisResult] = await Promise.all([
            model.generateContent([
              { inlineData },
              { text: 'Describe this video in detail for a market research focus group analysis. Cover: overall message and narrative arc, visual style and aesthetic quality, audio elements (music mood, voiceover tone, sound design), any text on screen, emotional tone throughout, call to action, apparent target audience, and creative execution quality. Be specific and descriptive.' },
            ]),
            model.generateContent([
              { inlineData },
              { text: `Analyze this video/commercial as a creative director doing market research for women audiences. Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "overall_impact": "One sentence verdict on the video's effectiveness",
  "most_engaging_moments": ["Specific moment 1 that grabs attention and why", "Moment 2", "Moment 3"],
  "what_works": ["Creative element that works well and why", "Element 2", "Element 3"],
  "what_doesnt_work": ["Element that falls flat or could backfire and why", "Element 2"],
  "recommended_changes": ["Specific actionable change 1", "Change 2", "Change 3"],
  "emotional_arc": "2-3 sentences describing how the emotional journey flows from opening to closing",
  "cta_effectiveness": "2 sentences assessing whether the call to action is clear, compelling, and lands well",
  "shareability_score": 7
}` },
            ]),
          ]);

          videoDescription = descResult.response.text().trim();

          let analysisText = analysisResult.response.text().trim();
          if (analysisText.startsWith('```')) {
            analysisText = analysisText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
          }
          videoAnalysis = JSON.parse(analysisText) as Record<string, unknown>;
          console.log('[video] analysis OK, keys:', Object.keys(videoAnalysis));
        } catch (err) {
          console.error('[video] Gemini error:', err);
        }
      }
    }

    // Fetch URL contents server-side (in parallel)
    const urlContents: { url: string; content: string }[] = [];
    if (urls.length > 0) {
      const fetched = await Promise.all(
        urls.map(async (url) => ({ url, content: await fetchUrlContent(url) }))
      );
      urlContents.push(...fetched.filter((u) => u.content.length > 0));
    }

    // Normalize and strictly validate media types accepted by Anthropic
    const VALID_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
    type ValidMediaType = typeof VALID_MEDIA_TYPES[number];
    const MEDIA_TYPE_MAP: Record<string, ValidMediaType> = {
      'image/jpeg': 'image/jpeg',
      'image/jpg':  'image/jpeg',
      'image/JPG':  'image/jpeg',
      'image/JPEG': 'image/jpeg',
      'image/png':  'image/png',
      'image/PNG':  'image/png',
      'image/gif':  'image/gif',
      'image/GIF':  'image/gif',
      'image/webp': 'image/webp',
      'image/WEBP': 'image/webp',
    };

    // Build content blocks: images first, then text
    const contentBlocks: Anthropic.MessageParam['content'] = [];

    const validImages = images.filter((img) => {
      const mt = MEDIA_TYPE_MAP[img.mediaType?.trim() ?? ''];
      const data = img.base64?.replace(/\s/g, '');
      return mt && data && data.length > 0;
    });

    if (validImages.length > 0) {
      contentBlocks.push({
        type: 'text',
        text: `The following ${validImages.length} image${validImages.length > 1 ? 's' : ''} show the visual assets (logo, design, branding) for this concept. Please evaluate them as part of your focus group analysis.`,
      });
      for (const img of validImages) {
        contentBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: MEDIA_TYPE_MAP[img.mediaType.trim()],
            data: img.base64.replace(/\s/g, ''),
          },
        });
      }
    }

    if (urls.length > 0) {
      // Build URL analysis block — use fetched content where available, URL-only otherwise
      const urlSection = urls.map((url, i) => {
        const fetched = urlContents.find((u) => u.url === url);
        if (fetched && fetched.content.length > 0) {
          return `--- Web Page ${i + 1}: ${url} ---\n${fetched.content}`;
        }
        return `--- Web Page ${i + 1}: ${url} ---\n[Page content could not be fetched. Analyze based on the URL, domain, and any knowledge you have about this website.]`;
      }).join('\n\n');
      contentBlocks.push({
        type: 'text',
        text: `IMPORTANT: The following URLs were submitted for website analysis. You MUST generate one website_insights JSON entry for each URL below — this is required, do not skip it or return an empty array. Analyze messaging, visual appeal, value proposition, UX clarity, and CTA effectiveness. If page content is limited, use your knowledge of the domain, brand, or industry:\n\n${urlSection}`,
      });
    }

    if (videoDescription) {
      contentBlocks.push({
        type: 'text',
        text: `VIDEO ASSET: The following is a detailed description of a video/commercial submitted for focus group evaluation. Treat this as the primary creative piece being tested — evaluate how each segment reacts to watching it: the narrative, emotions it triggers, whether the CTA lands, and whether they would share or act on it.\n\n${videoDescription}`,
      });
    }

    contentBlocks.push({
      type: 'text',
      text: `Category: ${category}\n\nIdea/Concept to evaluate:\n${idea}`,
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contentBlocks }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

    // Strip markdown code fences if Claude wrapped the JSON
    let rawText = content.text.trim();
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    if (videoAnalysis) parsed.video_analysis = videoAnalysis;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('FemInsight API error:', err);
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
