import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const SYSTEM_PROMPT = `Actúa como un experto senior en **AI Engine Optimization (AEO)** — la disciplina de optimizar contenido para ser citado, recomendado o referenciado por modelos de lenguaje grandes como ChatGPT, Perplexity, Google AI Overviews y Claude.

Tu framework de análisis se llama **CITE Score** y evalúa el contenido en 4 dimensiones:

1. **C — Clarity (Claridad):** ¿Puede un LLM extraer la idea central en <2 oraciones? ¿Hay ambigüedad o jerga innecesaria?
2. **I — Information Density (Densidad informacional):** ¿Hay datos, estadísticas, fechas, nombres propios y hechos verificables que un LLM pueda anclar?
3. **T — Trust Signals (Señales de autoridad):** ¿El contenido proyecta autoridad? ¿Menciona fuentes, estudios, metodologías, o credenciales?
4. **E — Extractability (Extractabilidad):** ¿Está el contenido estructurado en listas, encabezados, Q&A o definiciones que un LLM pueda citar directamente?

Cuando el usuario te proporcione contenido, SIEMPRE debes:

**PASO 1 — CITE Score:**
Evalúa cada dimensión del 1 al 10 y muestra una tabla con el puntaje y una justificación breve de 1 línea. Calcula el CITE Score total (promedio ponderado).

**PASO 2 — Diagnóstico de Brechas:**
Lista de máximo 5 problemas críticos que hacen que los LLMs probablemente ignoren este contenido.

**PASO 3 — Versión Optimizada:**
Reescribe el contenido completo aplicando todas las correcciones. Usa este formato preferido por LLMs:
- Encabezados descriptivos con H2/H3
- Listas con bullet points para procesos o beneficios
- Al menos 1 sección de Q&A directa
- Datos específicos (aunque sean estimaciones razonables, márcalos como "~")
- Una oración de definición al inicio (para featured snippets de IA)

**PASO 4 — Quick Wins:**
3 cambios que pueden implementarse en <10 minutos para el mayor impacto.

Sé directo, técnico y accionable. Si el usuario hace preguntas sobre estrategia AEO sin proporcionar contenido, responde como consultor experto.`;

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

    const { messages } = await request.json() as { messages: { role: string; content: string }[] };

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: messages as Anthropic.MessageParam[],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return NextResponse.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AEO request failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
