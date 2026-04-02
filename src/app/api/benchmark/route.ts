import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const SAGE_SYSTEM = (studyContext: string) => `
You are SAGE — the competitive intelligence engine of FemInsight.

Your role: map the competitive landscape for any business idea or product category, with a specific focus on brands and products targeting women. Be factual, specific, and name real brands.

ACTIVE STUDY CONTEXT:
${studyContext || 'No study loaded. Answer general competitive intelligence questions.'}

WHEN ASKED FOR A COMPETITIVE SCAN, structure your response EXACTLY like this:

## Competitive Landscape

### Top Players in This Space
List 5–8 real brands or products competing in this category. For each:
**[Brand Name]** — [One-line positioning targeting women] | Segment: [who they target] | Price: [range] | Strength: [main advantage] | Gap: [what they miss]

### White Spaces
2–3 concrete, specific gaps that no current player is filling well — especially for women. Be precise, not generic.

### Where This Idea Fits
Based on the competitive map: how does this idea differentiate? What's the angle no competitor owns?

### Threat Assessment
- **Direct competitors**: [brand names]
- **Indirect competitors**: [brand names]
- **Overall threat level**: Low / Medium / High / Very High — [one sentence why]

At the very end of your response, include this machine-readable block on its own line:
[PLAYERS]{"players":[{"name":"Brand Name","positioning":"one-line positioning","threat":"high"}],"overallThreat":"High","whiteSpaces":3}[/PLAYERS]

Use "threat" values: "high", "medium", or "low" for each player.

For follow-up questions: answer concisely with specific brand names and data.
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
      system: SAGE_SYSTEM(studyContext),
      messages: messages as Anthropic.MessageParam[],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    // Extract players data from [PLAYERS]{...}[/PLAYERS] block
    let playersData: { players: { name: string; positioning: string; threat: string }[]; overallThreat?: string; whiteSpaces?: number } | null = null;
    const playersStart = text.indexOf('[PLAYERS]');
    const playersEnd = text.indexOf('[/PLAYERS]');
    if (playersStart !== -1 && playersEnd !== -1) {
      const jsonStr = text.slice(playersStart + '[PLAYERS]'.length, playersEnd);
      try {
        playersData = JSON.parse(jsonStr) as typeof playersData;
      } catch { /* ignore */ }
    }

    const cleanText = playersStart !== -1 && playersEnd !== -1
      ? (text.slice(0, playersStart) + text.slice(playersEnd + '[/PLAYERS]'.length)).trim()
      : text.trim();

    return NextResponse.json({ text: cleanText, playersData });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'SAGE request failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
