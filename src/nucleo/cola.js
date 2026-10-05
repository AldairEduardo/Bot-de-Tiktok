// Cola secuencial: atiende un evento a la vez, con prioridad y anti-spam.
// No sabe nada de TikTok, Claude ni OBS: solo recibe una función procesar(ev).
//
// Pensada para LIVEs con mucho movimiento:
//  - Urgentes primero: encuestas/trivias y la meta de likes (tienen tiempo).
//  - Turnos justos: después de un agradecimiento, si hay comentarios esperando, el turno es de un comentario.
//  - Ronda de agradecimientos: regalos, seguidores y los que compartieron se agradecen juntos en una sola frase.
//  - Con la fila cargada, seguidores, entradas y compartidos se reconocen solo en pantalla (sin voz), para dejar
//    la voz a los regalos y al chat.
//  - Los comentarios caducan y, si hay varios, se elige el más interesante (preguntas, los que le hablan a ella...).
//  - Tope de respuestas por minuto y tiempo máximo por respuesta, para que nada congele el LIVE.
import { TIPO, esPrioritario, claveDe } from './eventos.js';

const AGRUPAR_MAX = 8; // máximo de regalos/seguidores en un solo agradecimiento (se nombran 3 y "N más")
const URGENTES = [TIPO.ENCUESTA_INICIO, TIPO.ENCUESTA_FIN, TIPO.DIBUJO_INICIO, TIPO.DIBUJO_FIN, TIPO.META]; // tienen tiempo: van antes que todo
const RONDA = [TIPO.REGALO, TIPO.SEGUIR, TIPO.COMPARTIO]; // se agradecen juntos en una ronda
const AGRADECER = [...RONDA, TIPO.PEDIDO_LISTO]; // se alternan con el chat
const DE_RELLENO = [TIPO.LIKES, TIPO.TAPS, TIPO.COMPARTIR, TIPO.RANKING, TIPO.SILENCIO];
const SOLO_PANTALLA = [TIPO.SEGUIR, TIPO.COMPARTIO, TIPO.UNIRSE]; // con la fila cargada, sin voz
const ESPERA_AGRUPAR_MS = 1500; // los regalos llegan en ráfaga: se espera un poco para juntar varios
const CADUCIDAD_AVISOS_MS = 60000; // likes, tap tap y saludos viejos ya no tienen sentido
const ESPERA_SALUDO_MS = 3000; // al entrar alguien, esperar un poco para juntar a los que vienen detrás
const MAX_PERSONAS_SALUDO = 20; // en un LIVE lleno, un saludo no junta a cientos
const FILA_CARGADA = 2; // con tantos comentarios esperando, los reconocimientos van solo en pantalla
const TIEMPO_MAXIMO_MS = 45000; // si una respuesta tarda más (IA o voz colgadas), se suelta para seguir

// Qué tan interesante es un comentario para responderlo (más alto = mejor)
const PREGUNTA = /\?|\b(cuanto|cuánto|como|cómo|donde|dónde|que|qué|cual|cuál|quien|quién|tienes|tienen|hay|precio|cuesta|vale|a como|a cómo)\b/i;
const LE_HABLA = /\b(tia|tía|chabela|doña|dona|señora|senora|caserita|seño)\b/i;
const RELLENO = /^(\s*(j+[aeiou]+)+|\s*(x+d+)|\s*(hola+|holi+|wow+|ok+|si+|no+|aja+|uff+|uy+|ga+)|\s*[^\p{L}\p{N}]+)+\s*$/iu;

function puntaje(ev, respondidos) {
  let p = 0;
  if (PREGUNTA.test(ev.texto)) p += 3;
  if (LE_HABLA.test(ev.texto)) p += 3;
  if (!respondidos.has(claveDe(ev))) p += 2; // gente que todavía no recibió respuesta
  if (RELLENO.test(ev.texto)) p -= 4; // "jajaja", "hola", emojis sueltos
  if (ev.entreUsuarios) p -= 2; // conversación entre otros: después de los clientes
  return p;
}

// Une nombres: "Ana", "Ana y Luis", "Ana, Luis y Pepe", "Ana, Luis, Pepe y 2 más"
export function unirNombres(nombres) {
  if (nombres.length === 1) return nombres[0];
  const extra = nombres.length - 3;
  if (extra > 0) return `${nombres.slice(0, 3).join(', ')} y ${extra} más`;
  return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
}
const unicos = (lista) => [...new Set(lista)];

export function crearCola({ procesar, reconocer, cooldownMs, maxCola, caducidadMs = 30000, maxPorMinuto = 8, saludoCadaMs = 45000, saludoRapidoMs = 10000, hayPocoMovimiento = () => false, pausaMs = 600 }) {
  const chats = []; // comentarios esperando
  const avisos = []; // regalos, seguidores, likes, tap tap... (van primero)
  const ultimoPorUsuario = new Map();
  const respondidos = new Set();
  const atendidos = []; // momentos de las últimas respuestas, para el tope por minuto
  let ocupado = false;
  let esperando = null;
  let esperaDeSaludo = false; // la espera actual es solo por un saludo: no debe frenar a otros eventos
  let ultimoSaludo = -Infinity; // cuándo saludó por última vez a los que entraron
  let ultimoFueAgradecimiento = false; // para alternar agradecimientos y comentarios

  function encolar(ev) {
    ev.llegada = Date.now();

    if (ev.tipo === TIPO.CHAT) {
      if (!ev.texto) return false;
      const ultimo = ultimoPorUsuario.get(claveDe(ev)) ?? 0;
      if (!ev.sinCooldown && ev.llegada - ultimo < cooldownMs) return false;
      ultimoPorUsuario.set(claveDe(ev), ev.llegada);
      if (ultimoPorUsuario.size > 5000) ultimoPorUsuario.clear(); // LIVE larguísimo: que no crezca sin fin
      chats.push(ev);
      if (chats.length > maxCola) descartarPeorChat();
    } else if (ev.tipo === TIPO.UNIRSE) {
      if (saludoCadaMs <= 0) return false; // saludos desactivados
      // Se juntan todos los que van entrando en un solo saludo pendiente (con un tope)
      const p = avisos.find((a) => a.tipo === TIPO.UNIRSE);
      const persona = { usuario: ev.usuario, cuenta: ev.cuenta };
      if (p) {
        if (p.personas.length < MAX_PERSONAS_SALUDO && !p.personas.some((x) => claveDe(x) === claveDe(persona))) p.personas.push(persona);
        else if (p.personas.length >= MAX_PERSONAS_SALUDO) p.extra = (p.extra ?? 0) + 1;
        p.llegada = ev.llegada;
      } else {
        avisos.push({ ...ev, personas: [persona], primera: ev.llegada });
      }
    } else if (esPrioritario(ev)) {
      // Likes, tap tap, compartir y ranking: basta con uno pendiente de cada tipo (el más reciente)
      if (DE_RELLENO.includes(ev.tipo)) {
        const i = avisos.findIndex((a) => a.tipo === ev.tipo);
        if (i >= 0) avisos.splice(i, 1);
      }
      avisos.push(ev);
    }
    // Si solo se estaba esperando para saludar, lo que acaba de llegar no tiene por qué esperar
    if (esperando && esperaDeSaludo && ev.tipo !== TIPO.UNIRSE) { clearTimeout(esperando); esperando = null; }
    siguiente();
    return true;
  }

  function descartarPeorChat() {
    let peor = 0;
    chats.forEach((c, i) => {
      const pc = puntaje(c, respondidos), pp = puntaje(chats[peor], respondidos);
      if (pc < pp || (pc === pp && c.llegada < chats[peor].llegada)) peor = i;
    });
    const [fuera] = chats.splice(peor, 1);
    console.log(`[cola] Fila llena: se descarta el comentario de ${fuera.usuario}`);
  }

  function quitarVencidos() {
    const ahora = Date.now();
    for (let i = chats.length - 1; i >= 0; i--) {
      if (ahora - chats[i].llegada > caducidadMs) {
        console.log(`[cola] Caducó el comentario de ${chats[i].usuario} (esperó más de ${caducidadMs / 1000} s)`);
        chats.splice(i, 1);
      }
    }
    for (let i = avisos.length - 1; i >= 0; i--) {
      const a = avisos[i];
      const caduca = DE_RELLENO.includes(a.tipo) || a.tipo === TIPO.UNIRSE;
      if (caduca && ahora - a.llegada > CADUCIDAD_AVISOS_MS) avisos.splice(i, 1);
    }
  }

  // Saca de los avisos todos los de ciertos tipos (hasta un máximo), en orden de llegada
  function sacar(tipos, max = AGRUPAR_MAX) {
    const fuera = [];
    for (let i = 0; i < avisos.length && fuera.length < max; ) {
      if (tipos.includes(avisos[i].tipo)) fuera.push(avisos.splice(i, 1)[0]);
      else i++;
    }
    return fuera;
  }

  // Un evento por cada tipo; si hay varios del mismo, se agrupan (como antes)
  function agruparMismoTipo(lista) {
    if (lista.length === 1) return lista[0];
    return {
      ...lista[0],
      usuario: unirNombres(unicos(lista.map((g) => g.usuario))),
      grupo: lista.map(({ usuario, cuenta, regalo, cantidad, plato }) => ({ usuario, cuenta, regalo, cantidad, plato })),
    };
  }

  // Ronda de agradecimientos: regalos + seguidores + compartidos en un solo evento si son de varios tipos
  function rondaDeAgradecimientos() {
    const juntos = sacar(RONDA, AGRUPAR_MAX * 2);
    const regalos = juntos.filter((e) => e.tipo === TIPO.REGALO);
    const seguidores = juntos.filter((e) => e.tipo === TIPO.SEGUIR);
    const compartieron = juntos.filter((e) => e.tipo === TIPO.COMPARTIO);
    const tipos = [regalos, seguidores, compartieron].filter((l) => l.length);
    if (tipos.length === 1) return agruparMismoTipo(tipos[0]); // un solo tipo: igual que siempre
    return {
      tipo: TIPO.AGRADECIMIENTOS,
      usuario: unirNombres(unicos(juntos.map((e) => e.usuario))),
      regalos: regalos.map(({ usuario, cuenta, regalo, cantidad }) => ({ usuario, cuenta, regalo, cantidad })),
      seguidores: unicos(seguidores.map((e) => e.usuario)),
      compartieron: unicos(compartieron.map((e) => e.usuario)),
      hay: { regalo: regalos.length > 0, seguir: seguidores.length > 0, compartio: compartieron.length > 0 },
      grupo: juntos.map(({ usuario, cuenta }) => ({ usuario, cuenta })),
    };
  }

  // Se puede saludar si pasó el tope desde el último saludo y el primero que entró ya esperó un poco
  // Con poco movimiento en el chat se saluda rápido (cada uno cuenta); con el chat movido, juntos cada saludoCadaMs
  const faltaParaSaludar = (a) => Math.max((hayPocoMovimiento() ? saludoRapidoMs : saludoCadaMs) - (Date.now() - ultimoSaludo), ESPERA_SALUDO_MS - (Date.now() - a.primera), 0);
  const filaCargada = () => chats.length >= FILA_CARGADA;

  // Orden: urgentes > agradecimientos y comentarios (alternados) > relleno y saludos (con el chat tranquilo)
  function elegir() {
    quitarVencidos();
    const u = avisos.findIndex((a) => URGENTES.includes(a.tipo));
    if (u >= 0) return avisos.splice(u, 1)[0];

    const hayAgradecer = avisos.some((a) => AGRADECER.includes(a.tipo));
    const turnoDelChat = chats.length && (ultimoFueAgradecimiento || !hayAgradecer);
    if (hayAgradecer && !turnoDelChat) {
      ultimoFueAgradecimiento = true;
      if (avisos.some((a) => RONDA.includes(a.tipo))) return rondaDeAgradecimientos();
      return agruparMismoTipo(sacar([TIPO.PEDIDO_LISTO]));
    }
    if (chats.length) {
      ultimoFueAgradecimiento = false;
      return chats.splice(mejorChat(), 1)[0];
    }

    const j = avisos.findIndex((a) => a.tipo !== TIPO.UNIRSE || faltaParaSaludar(a) === 0);
    if (j < 0) return null;
    const ev = avisos.splice(j, 1)[0];
    if (ev.tipo === TIPO.UNIRSE) {
      ultimoSaludo = Date.now();
      // Poca gente: a cada uno por su nombre y con una pregunta (lo que más ayuda a que escriba su primer comentario).
      // Si entran varios de golpe (4 o más), el LIVE ya está movido: se saludan juntos como siempre
      if (hayPocoMovimiento() && ev.personas.length <= 3) {
        const [primero, ...resto] = ev.personas;
        if (resto.length) avisos.push({ ...ev, personas: resto, primera: Date.now() - ESPERA_SALUDO_MS });
        return { ...ev, usuario: primero.usuario, cuenta: primero.cuenta, grupo: [primero], personal: true };
      }
      const nombres = ev.personas.map((x) => x.usuario);
      const usuario = ev.extra ? `${unirNombres(nombres.slice(0, 3))} y ${nombres.length - 3 + ev.extra} más` : unirNombres(nombres);
      return { ...ev, usuario, grupo: ev.personas };
    }
    return ev;
  }

  // Índice del mejor comentario; a igual puntaje, el que lleva más tiempo esperando
  function mejorChat() {
    let mejor = 0;
    chats.forEach((c, i) => {
      const pc = puntaje(c, respondidos), pm = puntaje(chats[mejor], respondidos);
      if (pc > pm || (pc === pm && c.llegada < chats[mejor].llegada)) mejor = i;
    });
    return mejor;
  }

  // Cuánto falta para poder responder otra vez sin pasar el tope por minuto (0 = ya se puede)
  function esperaPorTope() {
    const ahora = Date.now();
    while (atendidos.length && ahora - atendidos[0] > 60000) atendidos.shift();
    return atendidos.length < maxPorMinuto ? 0 : 60000 - (ahora - atendidos[0]) + 50;
  }

  // Programa un reintento de siguiente() dentro de ms milisegundos
  function reintentarEn(ms, deSaludo = false) {
    esperaDeSaludo = deSaludo;
    esperando = setTimeout(() => { esperando = null; siguiente(); }, ms);
  }

  // Con la fila cargada, seguidores/entradas/compartidos se reconocen solo en pantalla, sin gastar un turno de voz
  function reconocerEnPantalla() {
    if (!reconocer || !filaCargada()) return false;
    const silenciosos = avisos.filter((a) => SOLO_PANTALLA.includes(a.tipo) && (a.tipo !== TIPO.UNIRSE || Date.now() - a.primera >= ESPERA_SALUDO_MS));
    if (!silenciosos.length) return false;
    for (const tipo of SOLO_PANTALLA) {
      const lista = tipo === TIPO.UNIRSE ? sacar([tipo], 1) : sacar([tipo]);
      if (!lista.length) continue;
      const ev = tipo === TIPO.UNIRSE ? { ...lista[0], grupo: lista[0].personas } : agruparMismoTipo(lista);
      const nombres = ev.grupo ? unicos(ev.grupo.map((g) => g.usuario)) : [ev.usuario];
      try { reconocer({ tipo, usuario: unirNombres(nombres), cantidad: nombres.length }); } catch (e) { console.error('[cola] Error al reconocer en pantalla:', e.message); }
      console.log(`[cola] Fila cargada: ${tipo} de ${unirNombres(nombres)} solo en pantalla (sin voz)`);
    }
    return true;
  }

  async function siguiente() {
    if (ocupado || esperando) return;
    reconocerEnPantalla();
    // Si hay un regalo o seguidor recién llegado, esperar un poco por si vienen más
    const reciente = avisos.find((a) => RONDA.includes(a.tipo));
    const falta = reciente ? ESPERA_AGRUPAR_MS - (Date.now() - reciente.llegada) : 0;
    if (falta > 0) return reintentarEn(falta);
    // Si lo único que hay es relleno recién llegado ("jajaja"), esperar un poco por si llega algo mejor
    if (!reciente && chats.length) {
      const m = chats[mejorChat()];
      const faltaRelleno = puntaje(m, respondidos) < 0 ? ESPERA_AGRUPAR_MS - (Date.now() - m.llegada) : 0;
      if (faltaRelleno > 0) return reintentarEn(faltaRelleno);
    }
    const espera = maxPorMinuto > 0 ? esperaPorTope() : 0;
    if (espera > 0) return reintentarEn(espera);
    const ev = elegir();
    if (!ev) {
      // Solo queda un saludo esperando su turno: volver a intentar cuando se pueda
      const saludo = avisos.find((a) => a.tipo === TIPO.UNIRSE);
      if (saludo) reintentarEn(faltaParaSaludar(saludo) + 50, true);
      return;
    }

    ocupado = true;
    atendidos.push(Date.now());
    if (ev.tipo === TIPO.CHAT) respondidos.add(claveDe(ev));
    if (respondidos.size > 5000) respondidos.clear();
    let limite;
    try {
      // Tiempo máximo: si la IA o la voz se cuelgan, se suelta este evento y la fila sigue
      await Promise.race([
        procesar(ev),
        new Promise((_, falla) => { limite = setTimeout(() => falla(new Error(`tardó más de ${TIEMPO_MAXIMO_MS / 1000} s, se salta`)), TIEMPO_MAXIMO_MS); }),
      ]);
    } catch (e) {
      console.error('[cola] Error procesando evento:', e.message);
    } finally {
      clearTimeout(limite);
      ocupado = false;
      setTimeout(siguiente, pausaMs);
    }
  }

  return { encolar, tamano: () => chats.length + avisos.length };
}
