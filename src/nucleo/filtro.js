// Filtro de moderación previo a la IA: descarta comentarios con datos personales, insultos
// (incluida jerga peruana) o spam, para que Doña Chabela los ignore sin leerlos ni mostrarlos.
// No depende de ningún servicio externo. Las listas se pueden ampliar libremente.

// Palabras que se bloquean como palabra completa (ya normalizadas: minúsculas, sin tildes)
const INSULTOS_EXACTOS = [
  'ctm', 'csm', 'ptm', 'cdtm', 'hdp', 'hdpm', 'mrd', 'mrda', 'mierda', 'carajo', 'cojudo', 'cojuda', 'cojudos', 'cojudez',
  'puta', 'puto', 'putas', 'putos', 'putita', 'pinga', 'pingas', 'pichula', 'chucha', 'cabro', 'cabron', 'cabrona',
  'cachero', 'cachera', 'rosquete', 'maricon', 'marica', 'maraco', 'pendejo', 'pendeja', 'imbecil', 'idiota', 'estupido', 'estupida',
  'tarado', 'tarada', 'mongol', 'mongolo', 'mongola', 'mongolito', 'malparido', 'malparida',
  'lameculo', 'lameculos', 'asqueroso', 'asquerosa', 'mamon', 'jodete',
];
// Palabras que se bloquean si una palabra EMPIEZA así (cubre variantes: huevonazo, conchasumare...)
const INSULTOS_PREFIJO = [
  'huevon', 'huevad', 'webon', 'wevon', 'weon', 'guevon', 'cojud', 'conchatu', 'conchasu', 'conchesu', 'conchetu',
  'chuchatu', 'chuchasu', 'putamadr', 'mierd', 'maric', 'rosquet', 'pendej', 'malparid', 'hijueput', 'hijodeput',
];
// Se buscan también con el texto pegado (h.u.e.v.o.n, "concha su madre"). Solo raíces que no aparecen dentro de palabras normales
const INSULTOS_JUNTOS = ['conchatum', 'conchasum', 'conchesum', 'conchetum', 'chuchatum', 'chuchasum', 'putamadre', 'hijueput', 'hijodeput', 'malparid'];

const SPAM = [
  /https?:\/\//, /\bwww\./, /\b[\w-]+\.(com|pe|net|org|ly|xyz|io|me|link|site|shop)\b/, /\b(t\.me|wa\.me|bit\.ly)\b/,
  /\b(sigueme|siganme|sigan a|follow|sub4sub|f4f|visita mi perfil|link en mi bio|revisa mi perfil|gana dinero|ganar dinero|inversion segura|criptomoneda)\b/,
  /(.)\1{6,}/, // aaaaaaa / !!!!!!!
];

const DATOS_PERSONALES = [
  /[\w.+-]+@[\w-]+\.[\w.]+/, // correos
  /(\d[\s.-]?){7,}/, // teléfonos, DNI, cuentas (7 o más dígitos seguidos)
  /\b(av|avenida|jr|jiron|calle|psje|pasaje|mz|manzana|lote|lt|urb)\.?\s+[a-z].*\d/, // direcciones
  /\b(mi (numero|celular|cel|whatsapp|wsp|wasap|direccion|dni|clave|contrasena)|dni|contrasena)\b/,
];

// Minúsculas, sin tildes, "leet" básico (h3v0n -> heuon) y letras repetidas reducidas (huevoooon -> huevon)
function normalizar(texto) {
  return String(texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[4@]/g, 'a').replace(/3/g, 'e').replace(/1/g, 'i').replace(/0/g, 'o').replace(/[5$]/g, 's')
    .replace(/([a-z])\1{2,}/g, '$1');
}

export function tieneInsulto(texto) {
  // Letras sueltas deletreadas ("h u e v o n", "c.t.m") se juntan en una sola palabra
  const t = normalizar(texto).replace(/\b([a-zñ])[\s.\-_*]+(?=[a-zñ]\b)/g, '$1');
  const palabras = t.split(/[^a-zñ]+/).filter(Boolean);
  if (palabras.some((p) => INSULTOS_EXACTOS.includes(p))) return true;
  if (palabras.some((p) => INSULTOS_PREFIJO.some((pre) => p.startsWith(pre)))) return true;
  const junto = t.replace(/[^a-zñ]/g, '');
  return INSULTOS_JUNTOS.some((raiz) => junto.includes(raiz));
}

export function tieneDatosPersonales(texto) {
  const original = String(texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return DATOS_PERSONALES.some((re) => re.test(original));
}

function esSpam(texto) {
  const original = String(texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (SPAM.some((re) => re.test(original))) return true;
  const letras = original.replace(/[^a-zñ]/g, '').length;
  return original.length > 12 && letras / original.length < 0.3; // casi puros emojis o símbolos
}

// ¿Es una conversación entre otras personas? ("@carla jaja sí"). Si menciona a alguien con @ y no le
// habla a Doña Chabela ni menciona la cuenta del LIVE, no es para ella.
const LE_HABLA = /(?<!\p{L})(tia|tía|chabela|doña|dona|señora|senora|caserita|seño)(?!\p{L})/iu;
const MENCION = /@[\p{L}\p{N}_.]+/gu;
function esParaOtro(texto, cuentaPropia) {
  const t = String(texto ?? '');
  const menciones = t.match(MENCION);
  if (!menciones) return false;
  if (LE_HABLA.test(t.replace(MENCION, ' '))) return false; // "@tia_rosa" no cuenta como hablarle a ella
  const propia = String(cuentaPropia ?? '').replace(/^@/, '').toLowerCase();
  return !menciones.some((m) => propia && m.slice(1).toLowerCase() === propia);
}

// Filtro con memoria corta para detectar el mismo mensaje copiado por varias cuentas (raids)
export function crearFiltro({ ventanaMs = 60000, cuentaPropia, chismeCadaMs = 120000 } = {}) {
  let ultimoChisme = -Infinity; // cuándo se metió por última vez en una conversación ajena
  const vistos = new Map(); // texto normalizado -> momento

  // Devuelve null si el evento pasa, o el motivo por el que se descarta.
  // Si el nombre de usuario es ofensivo o trae datos, lo reemplaza para no decirlo en voz alta.
  function revisar(ev) {
    if (tieneInsulto(ev.usuario) || tieneDatosPersonales(ev.usuario) || esSpam(ev.usuario)) {
      ev.usuario = 'causita';
    }
    if (ev.tipo !== 'chat') return null;

    if (tieneDatosPersonales(ev.texto)) return 'datos personales';
    if (tieneInsulto(ev.texto)) return 'insulto';
    if (esSpam(ev.texto)) return 'spam';
    // Conversación entre otros: Doña Chabela se mete con humor, pero como mucho una vez cada chismeCadaMs
    if (esParaOtro(ev.texto, cuentaPropia)) {
      if (Date.now() - ultimoChisme < chismeCadaMs) return 'le habla a otra persona';
      ultimoChisme = Date.now();
      ev.entreUsuarios = true;
    }

    const clave = normalizar(ev.texto).replace(/[^a-zñ0-9]/g, '');
    const ahora = Date.now();
    for (const [k, t] of vistos) if (ahora - t > ventanaMs) vistos.delete(k);
    if (clave.length > 15 && vistos.has(clave)) return 'spam (mensaje repetido)';
    vistos.set(clave, ahora);
    return null;
  }

  return { revisar };
}

// Última barrera: que la IA tampoco diga insultos ni datos personales
export const respuestaSegura = (texto) => !tieneInsulto(texto) && !tieneDatosPersonales(texto);
