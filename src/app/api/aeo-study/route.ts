import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert in AI Engine Optimization (AEO) — the discipline of optimizing content to be cited, recommended, or referenced by large language models like ChatGPT, Perplexity, Google AI Overviews, and Claude.

Analyze the provided content using the CITE Score framework and respond ONLY with valid JSON in this exact structure:
{
  "clarity": 7,
  "information_density": 5,
  "trust_signals": 4,
  "extractability": 6,
  "total": 5.5,
  "gap_diagnosis": [
    "Critical problem 1 that makes LLMs likely to ignore this content",
    "Critical problem 2",
    "Critical problem 3"
  ],
  "quick_wins": [
    "Quick win 1 — implementable in under 10 minutes for maximum impact",
    "Quick win 2",
    "Quick win 3"
  ],
  "optimized_content": "Full rewritten version of the content applying all AEO fixes. Use descriptive H2/H3 headings, bullet point lists for processes or benefits, at least one Q&A section, specific data points marked with ~ if estimated, and a definition sentence at the start for AI featured snippets."
}

CITE Score dimensions (each scored 1–10):
- clarity: Can an LLM extract the core idea in <2 sentences? No ambiguity or unnecessary jargon?
- information_density: Are there data, statistics, dates, proper names, and verifiable facts an LLM can anchor to?
- trust_signals: Does the content project authority? Does it mention sources, studies, methodologies, or credentials?
- extractability: Is the content structured in lists, headings, Q&A, or definitions that an LLM can cite directly?
- total: weighted average of the four scores (float, 1 decimal)

Rules:
- All scores must be integers 1–10, except total which is a float
- gap_diagnosis must have 2–5 items
- quick_wins must have exactly 3 items
- optimized_content must be a complete rewritten version, minimum 150 words
- Respond ONLY with JSON — no markdown, no code fences, no preamble`;

export async function POST(request: NextRequest) {
  try {
    const accessPassword = process.env.ACCESS_PASSWORD;
    if (accessPassword) {
      const provided = request.headers.get('x-access-password');
      if (provided !== accessPassword) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    }

    const { idea, category, urls = [] } = await request.json() as {
      idea: string;
      category: string;
      urls?: string[];
    };

    const urlNote = urls.length > 0
      ? `\n\nWeb pages also submitted for analysis: ${urls.join(', ')}`
      : '';

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Category: ${category}\n\nContent to analyze for AEO:\n${idea}${urlNote}`,
      }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    let raw = content.text.trim();
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AEO analysis failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
