// Personaje del avatar: se arma con la carpeta del cliente (clientes/<id>/personaje.md, preguntas.md y cliente.json).
// Para un cliente nuevo no hay que tocar este archivo: se copia la carpeta clientes/_plantilla y se edita.
import fs from 'node:fs';
import path from 'node:path';
import { TIPO } from '../nucleo/eventos.js';
import { config } from '../config.js';

const cliente = config.cliente.datos;
const leer = (archivo) => {
  try { return fs.readFileSync(path.join(config.cliente.carpeta, archivo), 'utf8'); } catch { return ''; }
};
// {nombreAvatar}, {marca}, {rol}... se reemplazan con los datos de cliente.json
const rellenar = (texto) => texto.replace(/\{(\w+)\}/g, (m, k) => (typeof cliente[k] === 'string' ? cliente[k] : m));

export const SENAL_OMITIR = 'PASAR';

export const SISTEMA = `${rellenar(leer('personaje.md'))}

${rellenar(leer('preguntas.md'))}

Reglas finales:
- Máximo ${config.ahorro.maxPalabras} palabras por respuesta, una o dos frases. Se va a leer en voz alta.
- Contesta exactamente ${SENAL_OMITIR} (y nada más) SOLO si el comentario trae insultos, contenido sexual, odio, spam o datos personales. Todo lo demás, respóndelo con amabilidad.`;

const alAzar = (lista) => lista[Math.floor(Math.random() * lista.length)];
const bolsas = new Map();
function sinRepetir(lista) {
  if (!lista?.length) return '';
  if (!bolsas.get(lista)?.length) bolsas.set(lista, [...lista].sort(() => Math.random() - 0.5));
  return bolsas.get(lista).pop();
}
const contacto = cliente.contacto || 'escríbenos por mensaje directo de esta cuenta';
const nombre = (ev) => (/^an[oó]nimo$/i.test(ev.usuario) ? 'alguien del chat (no digas su nombre ni le digas anónimo)' : ev.usuario);

function textoMemoria(ev) {
  const m = ev.memoria;
  if (!m || /^an[oó]nimo$/i.test(ev.usuario)) return '';
  const partes = [];
  if (m.visita > 1) partes.push(`${ev.usuario} ya vino antes (visita ${m.visita}).`);
  if (m.ultimos?.length) partes.push('Lo último que hablaron: ' + m.ultimos.map((x) => `preguntó "${x.comentario}" y respondiste "${x.respuesta}"`).join(' | ') + '.');
  return partes.length ? `\nLo que recuerdas (úsalo solo si encaja, sin recitarlo ni inventar): ${partes.join(' ')}` : '';
}

function textoRanking(ev) {
  const r = ev.ranking;
  if (!r) return '';
  if (!r.top.length) return '\nPregunta por el ranking de participación, pero todavía nadie tiene puntos: anímalo a comentar para aparecer.';
  const suyo = r.mio ? ` Él o ella va en el puesto ${r.mio.puesto} con ${r.mio.puntos} puntos.` : ' Todavía no tiene puntos.';
  return `\nPregunta por el ranking de participación. Va primero ${r.top[0].usuario} con ${r.top[0].puntos} puntos.${suyo} La tabla ya está en pantalla. Usa los números tal cual.`;
}

export function describirEvento(ev) {
  switch (ev.tipo) {
    case TIPO.CHAT:
      if (ev.entreUsuarios) return `${ev.usuario} está conversando con otra persona del chat ("${ev.texto}"). Súmate con simpatía e invita a todos a dejar sus dudas sobre su página.`;
      return `Comentario de ${nombre(ev)}: ${ev.texto}${textoRanking(ev)}${textoMemoria(ev)}`;
    case TIPO.UNIRSE:
      if (ev.personal) return `${ev.usuario} acaba de entrar al LIVE y hay poca gente: salúdalo por su nombre en UNA frase corta y cálida (máximo 14 palabras) y termina con esta pregunta para que comente: ${sinRepetir(cliente.preguntasAlPublico) || '¿ya tienes una página de Facebook?'}`;
      return `Acaban de entrar al LIVE: ${ev.usuario}. Salúdalos en UNA frase corta y cálida, y cuéntales en pocas palabras de qué trata el LIVE.`;
    case TIPO.REGALO:
      return `${ev.usuario} te envió ${ev.cantidad > 1 ? `${ev.cantidad} regalos` : 'un regalo'} de TikTok del tipo "${ev.regalo}" (es el nombre del regalo, no de una persona). Agradécele por su nombre con entusiasmo, sin ofrecer nada a cambio.`;
    case TIPO.AGRADECIMIENTOS:
      return `Agradece en UNA sola frase, con entusiasmo y por sus nombres, a: ${ev.usuario}${ev.hay?.regalo ? ' (mandaron regalos)' : ''}${ev.hay?.seguir ? ' (empezaron a seguir la cuenta)' : ''}${ev.hay?.compartio ? ' (compartieron el LIVE)' : ''}. No ofrezcas nada a cambio.`;
    case TIPO.SEGUIR:
      return `${ev.usuario} empezó a seguir la cuenta: dale las gracias por su nombre en una frase corta.`;
    case TIPO.COMPARTIO:
      return `${ev.usuario} compartió el LIVE: agradécele por su nombre en una frase corta.`;
    case TIPO.COMPARTIR:
      return 'Pide con simpatía que compartan el LIVE con amigos que quieran crecer su página de Facebook. Una frase corta, sin ofrecer nada a cambio ni pedir regalos.';
    case TIPO.TAPS:
      return 'Pide con simpatía que toquen la pantalla (tap tap) para que el LIVE llegue a más gente. Una frase corta, sin ofrecer nada a cambio.';
    case TIPO.LIKES:
      return `El público mandó muchos likes (${ev.cantidad}). Agradécelo en una frase corta.`;
    case TIPO.META:
      return `¡El público llegó a la meta de ${ev.meta} tap tap! Celébralo con entusiasmo y anuncia la siguiente meta: ${ev.siguiente}. Máximo dos frases.`;
    case TIPO.RANKING: {
      const lista = ev.top.map((r, i) => `${i + 1}. ${r.usuario} (${r.puntos})`).join(', ');
      return `Anuncia el ranking de participación del LIVE: ${lista}. Felicita al primero y anima a todos a comentar sus dudas para sumar puntos. Sin premios. Máximo dos frases.`;
    }
    case TIPO.SILENCIO:
      if (ev.modo === 'consejo') return `El chat está tranquilo. Comparte este consejo útil con tus palabras, en una o dos frases: ${ev.idea}. Termina invitando a dejar sus dudas en el chat.`;
      return `El chat está tranquilo. Hazle al público esta pregunta, con tus palabras y con simpatía: ${ev.idea} Pide que respondan en el chat.`;
    case TIPO.PEDIDO_LISTO:
      return '';
    default:
      return `${ev.usuario}: ${ev.texto ?? ''}`;
  }
}

// Para el saludo y los avisos en pantalla del overlay (datos públicos del cliente, sin claves)
export const datosPublicos = () => ({
  nombreAvatar: cliente.nombreAvatar, rol: cliente.rol, marca: cliente.marca, eslogan: cliente.eslogan, contacto,
  colores: cliente.colores, llamadosAccion: cliente.llamadosAccion, videos: cliente.videos,
});
export { alAzar };
