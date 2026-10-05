// Cerebro de prueba sin IA: frases fijas para probar el overlay, la voz y la cola sin gastar.
// Misma interfaz que los cerebros reales: { responder(ev) -> string | null }
import { TIPO } from '../nucleo/eventos.js';

const RESPUESTAS = [
  '{u}, buena pregunta: lo primero es elegir un tema claro para tu página y publicar con constancia.',
  '{u}, para crecer de verdad publica Reels cortos y responde los comentarios; eso ayuda muchísimo.',
  '{u}, los detalles de la asesoría te los pasamos por mensaje directo de esta cuenta.',
];

export function crearCerebroFalso() {
  let i = 0;
  async function responder(ev) {
    switch (ev.tipo) {
      case TIPO.UNIRSE: return `¡Hola, ${ev.usuario}! Qué bueno tenerte por aquí, ¿ya tienes tu página de Facebook?`;
      case TIPO.REGALO: return `¡Muchas gracias, ${ev.usuario}, por ese regalo! Me alegras el LIVE.`;
      case TIPO.AGRADECIMIENTOS: return `¡Gracias, ${ev.usuario}, por estar aquí!`;
      case TIPO.SEGUIR: return `¡Gracias por seguirnos, ${ev.usuario}!`;
      case TIPO.COMPARTIO: return `¡Gracias por compartir el LIVE, ${ev.usuario}!`;
      case TIPO.COMPARTIR: return 'Comparte este LIVE con ese amigo que quiere crecer su página.';
      case TIPO.TAPS: return 'Toca la pantalla para que este LIVE llegue a más gente.';
      case TIPO.LIKES: return '¡Gracias por tantos likes!';
      case TIPO.META: return `¡Llegamos a ${ev.meta} likes! Vamos por ${ev.siguiente}.`;
      case TIPO.RANKING: return `${ev.top[0].usuario} va primero en participación, ¡sigan comentando sus dudas!`;
      case TIPO.SILENCIO: return ev.modo === 'consejo' ? `Un consejo: ${ev.idea}. Déjame tus dudas en el chat.` : `Cuéntenme en el chat: ${ev.idea}`;
      default: return RESPUESTAS[i++ % RESPUESTAS.length].replace('{u}', ev.usuario);
    }
  }
  return { responder };
}
