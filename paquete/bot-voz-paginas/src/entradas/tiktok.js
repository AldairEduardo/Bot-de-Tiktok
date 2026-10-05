// Entrada desde TikTok LIVE. Traduce los eventos de la librería al formato común
// (nucleo/eventos.js) y se los pasa a alEvento(). No sabe nada de la cola ni de Claude.
import * as ev from '../nucleo/eventos.js';
import { nombreLegible } from '../nucleo/nombres.js';

// El @ de la cuenta (v1: uniqueId, v2: displayId) identifica a la persona; el nombre visible se usa para hablarle,
// convertido a letras normales para que la voz pueda leer nombres decorados (𝓜𝓪𝓻𝓲𝓪 → Maria)
const cuentaDe = (d) => String(d.user?.uniqueId || d.user?.displayId || d.uniqueId || '').toLowerCase();
const nombre = (d) => nombreLegible(d.user?.nickname || d.nickname, cuentaDe(d));
const conCuenta = (e, d) => { const c = cuentaDe(d); if (c) e.cuenta = c; return e; };

// TikTok manda los nombres de los regalos en inglés: los más comunes se traducen para que Doña Chabela los diga bien
const REGALOS_ES = {
  'rose': 'Rosa', 'lion': 'León', 'universe': 'Universo', 'tiktok universe': 'Universo', 'galaxy': 'Galaxia',
  'whale diving': 'Ballena', 'doughnut': 'Dona', 'donut': 'Dona', 'heart me': 'Corazón', 'finger heart': 'Corazón con dedos',
  'ice cream cone': 'Helado', 'sports car': 'Carro deportivo', 'private jet': 'Avión privado', 'jet': 'Avión',
  'dragon flame': 'Dragón', 'castle fantasy': 'Castillo', 'interstellar': 'Interestelar', 'perfume': 'Perfume',
  'hand hearts': 'Corazón con manos', 'gg': 'GG', 'tiktok': 'TikTok', 'cap': 'Gorra', 'hat and mustache': 'Sombrero y bigote',
  'confetti': 'Confeti', 'love you': 'Te quiero', 'thumbs up': 'Like', 'heart': 'Corazón', 'money gun': 'Pistola de billetes',
  'rosa': 'Rosa', 'galaxy globe': 'Galaxia', 'fireworks': 'Fuegos artificiales', 'gold mine': 'Mina de oro',
};
const traducirRegalo = (n) => (n ? REGALOS_ES[String(n).trim().toLowerCase()] ?? n : n);

// Regalo de TikTok -> evento del núcleo (o null si es una racha que todavía no termina).
// v2 del conector trae los datos en d.gift (name, diamondCount, type); v1 en giftName/giftDetails.
// Los regalos de racha (type 1, como la Rosa) llegan muchas veces mientras la persona sigue tocando:
// se espera al último (repeatEnd), que trae el total en repeatCount, para contarlo UNA sola vez.
export function regaloDeTikTok(d) {
  const tipoRegalo = d.gift?.type ?? d.giftType ?? d.giftDetails?.giftType;
  if (tipoRegalo === 1 && !d.repeatEnd) return null; // racha en curso: esperar al final
  const diamantes = Number(d.gift?.diamondCount ?? d.diamondCount ?? d.giftDetails?.diamondCount ?? d.extendedGiftInfo?.diamond_count ?? 0) || 0;
  const nombreRegalo = traducirRegalo(d.gift?.name || d.giftName || d.giftDetails?.giftName || d.extendedGiftInfo?.name);
  return conCuenta(ev.regalo(nombre(d), nombreRegalo, d.repeatCount, diamantes), d);
}

async function cargarConector() {
  const mod = await import('tiktok-live-connector');
  const lib = mod.WebcastPushConnection || mod.TikTokLiveConnection ? mod : mod.default;
  return lib.WebcastPushConnection || lib.TikTokLiveConnection; // soporta v1 y v2
}

export async function conectarTikTok({ usuario, alEvento, likesParaReaccion = 300, signApiKey }) {
  const Conexion = await cargarConector();
  // La v2 exige un objeto de opciones. signApiKey (opcional) es la clave de eulerstream.com, el servicio
  // que firma la conexión con TikTok; sin clave funciona con límites de uso
  // processInitialData: false para no responder los comentarios viejos que TikTok reenvía al conectarse
  const conn = new Conexion(usuario, { processInitialData: false, ...(signApiKey ? { signApiKey } : {}) });
  let likesAcumulados = 0;

  // TikTok reenvía comentarios viejos al conectarse (y al reconectar): se ignoran los escritos antes de
  // conectarse y los que llegan repetidos (mismo id de mensaje)
  let conectadoEn = Date.now();
  const vistos = new Set();
  const esViejoORepetido = (d) => {
    const id = d.common?.msgId ?? d.msgId;
    if (id != null) {
      if (vistos.has(String(id))) return true;
      vistos.add(String(id));
      if (vistos.size > 2000) vistos.clear();
    }
    const creado = Number(d.common?.createTime ?? d.createTime ?? 0);
    return creado > 0 && creado < conectadoEn - 20000; // margen por si el reloj de la PC está desfasado
  };

  conn.on('chat', (d) => {
    if (esViejoORepetido(d)) return;
    alEvento(conCuenta(ev.chat(nombre(d), d.comment ?? d.content), d)); // v1: comment, v2: content
  });

  conn.on('gift', (d) => {
    const regalo = regaloDeTikTok(d);
    // Solo el regalo ya terminado pasa el filtro: si TikTok lo reenvía al reconectar, no se cuenta dos veces
    if (regalo && !esViejoORepetido(d)) alEvento(regalo);
  });

  conn.on('follow', (d) => alEvento(conCuenta(ev.seguir(nombre(d)), d)));
  conn.on('share', (d) => alEvento(conCuenta(ev.compartio(nombre(d)), d)));

  const entraron = new Map(); // nombre -> cuándo entró (para no saludar dos veces al que sale y vuelve)
  conn.on('member', (d) => {
    const quien = cuentaDe(d) || nombre(d);
    const ahora = Date.now();
    if (!quien || ahora - (entraron.get(quien) ?? 0) < 10 * 60000) return;
    entraron.set(quien, ahora);
    if (entraron.size > 5000) entraron.clear();
    alEvento(conCuenta(ev.unirse(nombre(d)), d));
  });

  conn.on('like', (d) => {
    const cantidad = Number(d.count ?? d.likeCount) || 1; // v2 manda los taps en "count" (v1 en likeCount)
    alEvento(conCuenta(ev.tap(nombre(d), cantidad), d)); // puntos para el ranking y la meta
    likesAcumulados += cantidad;
    if (likesAcumulados >= likesParaReaccion) {
      alEvento(ev.likes(likesAcumulados));
      likesAcumulados = 0;
    }
  });

  // Reconexión: cada 15 s si se cortó; si el LIVE terminó, con más calma (hasta 5 min) para no gastar el servicio de firma
  let espera = 15000;
  const reconectar = (motivo) => {
    if (terminoElLive) espera = Math.min(espera * 2, 300000);
    console.warn(`[tiktok] ${motivo}. Reintentando en ${Math.round(espera / 1000)} s...`);
    setTimeout(() => {
      conectadoEn = Date.now();
      conn.connect()
        .then(() => { espera = 15000; terminoElLive = false; console.log('[tiktok] Reconectado al LIVE'); })
        .catch((e) => reconectar(e.message));
    }, espera);
  };
  conn.on('disconnected', () => reconectar('Desconectado'));
  let terminoElLive = false;
  conn.on('streamEnd', () => { terminoElLive = true; console.log('[tiktok] El LIVE terminó.'); });
  conn.on('error', (e) => console.error('[tiktok] Error de la conexión:', e?.message ?? e)); // antes se perdían en silencio

  // Si todavía no estás en vivo, sigue intentando: así se puede arrancar antes de abrir el LIVE
  for (;;) {
    try {
      conectadoEn = Date.now();
      const estado = await conn.connect();
      console.log(`[tiktok] Conectado al LIVE de @${usuario} (room ${estado?.roomId ?? '?'})`);
      return conn;
    } catch (e) {
      console.warn(`[tiktok] Aún no conecta (${e.message}). ¿Ya empezó el LIVE? Reintento en 15 s...`);
      await new Promise((ok) => setTimeout(ok, 15000));
    }
  }
}
