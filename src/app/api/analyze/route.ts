import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are simulating a focus group of 1,000 women aged 25–48, globally distributed, economically comfortable, and tech-savvy. You represent 5 distinct audience segments of 200 women each:

1. Urban Executive (35–48, LATAM/Europe, senior professional, values efficiency and prestige)
2. Modern Mom (28–42, North America/Australia, working mother, values practicality and trust)
3. Digital Entrepreneur (25–35, global/remote, freelancer or digital business owner, values innovation and ROI)
4. Premium Consumer (30–45, Europe/Asia, high purchasing power, lifestyle and travel focused, values aesthetics and exclusivity)
5. Rising Professional (25–33, India/SE Asia/Africa, career in tech or finance, highly digital, values growth and affordability)

For each idea, product, or concept presented, respond with authentic, nuanced reactions that reflect each segment's distinct worldview, priorities, and life context. Be direct, specific, and realistic — not generic.

If images are provided (logos, product designs, branding), include visual feedback in your responses: evaluate aesthetics, brand appeal, professionalism, memorability, and how each segment would react to the visual identity specifically.

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
    }
  },
  "executive_summary": {
    "overall_sentiment": "Positive",
    "top_insights": ["insight 1", "insight 2", "insight 3"],
    "top_objections": ["objection 1", "objection 2", "objection 3"],
    "recommendation": "2–3 sentence strategic recommendation",
    "best_segment": "Digital Entrepreneur"
  }
}

Rules:
- likelihood_score must be an integer 1–10
- overall_sentiment must be exactly "Positive", "Mixed", or "Negative"
- Respond ONLY with JSON — no markdown, no code fences, no preamble`;

type ImageInput = {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
};

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

    const { idea, category, images = [] } = await request.json() as {
      idea: string;
      category: string;
      images?: ImageInput[];
    };

    if (!idea?.trim()) {
      return NextResponse.json({ error: 'Idea is required' }, { status: 400 });
    }

    // Build content blocks: images first, then text
    const contentBlocks: Anthropic.MessageParam['content'] = [];

    if (images.length > 0) {
      contentBlocks.push({
        type: 'text',
        text: `The following ${images.length} image${images.length > 1 ? 's' : ''} show the visual assets (logo, design, branding) for this concept. Please evaluate them as part of your focus group analysis.`,
      });
      for (const img of images) {
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
        });
      }
    }

    contentBlocks.push({
      type: 'text',
      text: `Category: ${category}\n\nIdea/Concept to evaluate:\n${idea}`,
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contentBlocks }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

    const parsed = JSON.parse(content.text.trim());
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('FemInsight API error:', err);
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
