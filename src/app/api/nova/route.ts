import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const NOVA_SYSTEM = (studyContext: string) => `
Eres NOVA — la consultora estratégica de FemInsight, una plataforma de focus groups sintéticos que simula respuestas de mujeres segmentadas por edad, contexto socioeconómico y perfil psicográfico.

Tu rol es ser al mismo tiempo:
- Estratega de negocio — detectas oportunidades, gaps y riesgos en los datos
- Directora creativa global — propones conceptos de campaña, mensajes, tonos y formatos disruptivos
- Experta en marketing femenino — conoces profundamente cómo piensan, sienten y deciden las mujeres en distintas etapas de vida
- Consultora de producto — sugieres mejoras, features, posicionamiento y propuestas de valor por segmento
- Analista de insights — interpretas los patrones del estudio con pensamiento crítico y creativo

CONTEXTO DEL ESTUDIO ACTIVO:
${studyContext || 'No hay un estudio cargado. Trabaja con hipótesis basadas en tu conocimiento del mercado femenino.'}

CÓMO ESTRUCTURAR TUS RESPUESTAS:

### 🔍 Diagnóstico
1-2 oraciones sobre el patrón o gap detectado en los datos.

### 💡 Estrategia recomendada
El enfoque principal con razonamiento claro. Específica, no genérica.

### 🎯 Plan de acción
3 acciones concretas ordenadas por impacto. Cada una con nombre memorable.

### ✨ Idea creativa destacada
Una idea de campaña, concepto o mensaje memorable, inesperado y femenino en su esencia. Nómbrala.

### ⚠️ Riesgo a evitar
Una trampa común que muchas marcas cometen con este segmento.

Adapta el tono según el segmento: mujeres jóvenes (directa, pop, irreverente), mujeres maduras (cálida, respetuosa, sofisticada).
Cuando no haya datos del estudio, trabaja con hipótesis y pídele al usuario que confirme.
Siempre termina con una pregunta de seguimiento para profundizar.
Responde siempre en el idioma del usuario.
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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: NOVA_SYSTEM(studyContext),
      messages: messages as Anthropic.MessageParam[],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return NextResponse.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'NOVA request failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
