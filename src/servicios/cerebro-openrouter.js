// Proveedor de respuestas con OpenRouter (API compatible con OpenAI). Sirve para cualquier
// modelo del catálogo de openrouter.ai/models cambiando OPENROUTER_MODELO en el .env.
// Misma interfaz que cerebro-claude: { responder(ev) -> string | null }
import { SISTEMA, SENAL_OMITIR, describirEvento } from './personaje.js';

export function crearCerebroOpenRouter({ apiKey, modelo, maxHistorial = 8 }) {
  const historial = []; // últimas frases dichas, para no repetir chistes

  async function responder(ev) {
    const contexto = historial.length
      ? `Lo último que dijiste (no repitas chistes):\n${historial.join('\n')}\n\n`
      : '';

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(20000), // si OpenRouter se cuelga, no congelar el LIVE
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Title': 'Brosteria Dona Chabela', // nombre que aparece en el panel de OpenRouter
      },
      body: JSON.stringify({
        model: modelo,
        messages: [
          { role: 'system', content: SISTEMA },
          { role: 'user', content: `${contexto}Nuevo evento del LIVE:\n${describirEvento(ev)}` },
        ],
        // Los modelos que razonan gastan tokens pensando antes de responder:
        // esfuerzo bajo para que sea rápido, y margen de tokens para que no corte la respuesta.
        reasoning: { effort: 'low', exclude: true },
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      throw new Error(`OpenRouter respondió ${res.status}: ${detalle.slice(0, 300)}`);
    }

    const datos = await res.json();
    const texto = String(datos.choices?.[0]?.message?.content ?? '')
      .replace(/["“”*]/g, '')
      .trim();

    if (!texto || texto.toUpperCase().startsWith(SENAL_OMITIR)) return null;

    historial.push(`- ${texto}`);
    if (historial.length > maxHistorial) historial.shift();
    return texto;
  }

  return { responder };
}
