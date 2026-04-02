import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const INTEL_SYSTEM = (studyContext: string) => `
You are INTEL — the Market Intelligence engine of FemInsight, a synthetic focus group platform.

Your role: provide factual, data-grounded market intelligence to validate and contextualize focus group results. You are NOT creative — you are precise, rigorous, and cite sources.

ACTIVE STUDY CONTEXT:
${studyContext || 'No study loaded. Answer general market intelligence questions.'}

WHEN ASKED FOR AN INITIAL MARKET SCAN, structure your response EXACTLY like this:

## Market Overview
- **Global Market Size**: [USD value, year — cite source]
- **CAGR**: [%, timeframe — cite source]
- **Maturity Stage**: Emerging / Growing / Mature / Declining
- **Top Markets**: [3 key geographies]

## Trend Signals
3–5 macro trends affecting this category right now, with data points where possible. Focus on trends relevant to female consumers.

## Female Consumer Behavior
Specific research-backed insights on how women in the relevant age groups and segments interact with this category. Include behavioral data, purchase drivers, and decision patterns.

## Competitive Landscape
- **Competition Level**: Low / Medium / High / Very High
- **Key Players**: 3–5 leading brands or products in this space
- **White Spaces**: Real gaps where the market is underserved

## Opportunity Assessment
Rate each dimension 1–10 with one-line rationale:
- **Market Timing**: X/10 — [why]
- **Female Relevance**: X/10 — [why]
- **Competitive Gap**: X/10 — [why]

At the very end of your response, output a machine-readable metrics block on its own line — ALWAYS include it exactly like this:
[METRICS]{"marketSize":"$X.XB","cagr":"XX%","competition":"High","timing":X,"femaleRelevance":X,"competitiveGap":X}[/METRICS]

Sources: cite report names (e.g., "Statista 2024", "McKinsey & Company", "Grand View Research", "Euromonitor") when making specific claims. If uncertain, say "estimated" or "projected".

For follow-up questions after the initial scan: answer directly and concisely with data.

Respond in the user's language.
`.trim();

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
    if (!apiKey) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });

    const { messages, studyContext } = await request.json() as {
      messages: { role: string; content: string }[];
      studyContext: string;
    };

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 2000,
      system: INTEL_SYSTEM(studyContext),
      messages: messages as Anthropic.MessageParam[],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    // Extract metrics from [METRICS]{...}[/METRICS] block
    let marketMetrics: Record<string, string | number> | null = null;
    const metricsStart = text.indexOf('[METRICS]');
    const metricsEnd = text.indexOf('[/METRICS]');
    if (metricsStart !== -1 && metricsEnd !== -1) {
      const jsonStr = text.slice(metricsStart + '[METRICS]'.length, metricsEnd);
      try {
        marketMetrics = JSON.parse(jsonStr) as Record<string, string | number>;
      } catch { /* ignore parse errors */ }
    }

    // Remove the metrics block from display text
    const cleanText = metricsStart !== -1 && metricsEnd !== -1
      ? (text.slice(0, metricsStart) + text.slice(metricsEnd + '[/METRICS]'.length)).trim()
      : text.trim();

    return NextResponse.json({ text: cleanText, marketMetrics });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'INTEL request failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
