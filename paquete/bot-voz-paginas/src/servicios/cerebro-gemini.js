// Proveedor de respuestas con Google Gemini (API REST, sin SDK).
// Misma interfaz que cerebro-claude: { responder(ev) -> string | null }
import { SISTEMA, SENAL_OMITIR, describirEvento } from './personaje.js';

export function crearCerebroGemini({ apiKey, modelo, maxHistorial = 8 }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
  const historial = []; // últimas frases dichas, para no repetir chistes

  async function responder(ev) {
    const contexto = historial.length
      ? `Lo último que dijiste (no repitas chistes):\n${historial.join('\n')}\n\n`
      : '';

    const res = await fetch(url, {
      method: 'POST',
      signal: AbortSignal.timeout(20000),
      // La clave va en un header y no en la URL, para que no quede en logs
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SISTEMA }] },
        contents: [{ role: 'user', parts: [{ text: `${contexto}Nuevo evento del LIVE:\n${describirEvento(ev)}` }] }],
        generationConfig: {
          maxOutputTokens: 120,
          temperature: 1,
          thinkingConfig: { thinkingBudget: 0 }, // sin "pensar": respuestas más rápidas para el LIVE
        },
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      throw new Error(`Gemini respondió ${res.status}: ${detalle.slice(0, 300)}`);
    }

    const datos = await res.json();
    const texto = (datos.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join(' ')
      .replace(/["“”*]/g, '')
      .trim();

    // Sin texto suele ser un bloqueo por filtros de seguridad: lo tratamos como "pasar"
    if (!texto || texto.toUpperCase().startsWith(SENAL_OMITIR)) return null;

    historial.push(`- ${texto}`);
    if (historial.length > maxHistorial) historial.shift();
    return texto;
  }

  return { responder };
}
