// Proveedor de respuestas con Claude. Interfaz que espera el núcleo: { responder(ev) -> string | null }
import Anthropic from '@anthropic-ai/sdk';
import { SISTEMA, SENAL_OMITIR, describirEvento } from './personaje.js';

export function crearCerebroClaude({ apiKey, modelo, maxHistorial = 8 }) {
  const cliente = new Anthropic({ apiKey });
  const historial = []; // últimas frases dichas, para no repetir chistes

  async function responder(ev) {
    const contexto = historial.length
      ? `Lo último que dijiste (no repitas chistes):\n${historial.join('\n')}\n\n`
      : '';

    const r = await cliente.messages.create({
      model: modelo,
      max_tokens: 120,
      system: SISTEMA,
      messages: [{ role: 'user', content: `${contexto}Nuevo evento del LIVE:\n${describirEvento(ev)}` }],
    });

    const texto = r.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join(' ')
      .replace(/["“”]/g, '')
      .trim();

    if (!texto || texto.toUpperCase().startsWith(SENAL_OMITIR)) return null;

    historial.push(`- ${texto}`);
    if (historial.length > maxHistorial) historial.shift();
    return texto;
  }

  return { responder };
}
