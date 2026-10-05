// "La tía dibuja": un dibujo se traza solo en pantalla y el chat adivina escribiendo la palabra.
// Corre todo el tiempo (no gana solo el de mejor internet): los que adivinan quedan anotados en secreto y al final
// hay podio de 3 por orden de llegada. Cada cierto tiempo se destapa una letra de pista.
// Como la trivia: primero se anuncia (preparar) y aparece en pantalla cuando ella termina de hablar (abrir).
import { DIBUJOS } from './dibujos-banco.js';

const PALABRAS_MAX_INTENTO = 4; // un mensaje más largo es conversación, no un intento
const PISTAS_EN = [0.4, 0.6, 0.8]; // en qué parte del tiempo se destapa una letra

// Minúsculas, sin tildes (la ñ queda como n) ni signos
const normal = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
// Plural o singular da igual ("picarones" = "picaron")
const raiz = (p) => (p.length > 4 ? p.replace(/(es|s)$/, '') : p);

function distancia(a, b) {
  let fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const nueva = [i];
    for (let j = 1; j <= b.length; j++) nueva[j] = Math.min(fila[j] + 1, nueva[j - 1] + 1, fila[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    fila = nueva;
  }
  return fila[b.length];
}
// Una palabra se parece a otra: igual, o con una falta (dos si es larga). Las cortas tienen que ser exactas
function parecida(escrita, buena) {
  const a = raiz(escrita), b = raiz(buena);
  if (a === b) return true;
  const tolerancia = b.length >= 8 ? 2 : b.length >= 5 ? 1 : 0;
  return tolerancia > 0 && Math.abs(a.length - b.length) <= tolerancia && distancia(a, b) <= tolerancia;
}
// ¿El mensaje trae la respuesta? Busca la frase completa (con tolerancia) dentro de lo que escribieron
export function acierta(texto, respuestas) {
  const palabras = normal(texto).split(' ').filter(Boolean);
  const junto = palabras.join('');
  return respuestas.some((r) => {
    const buena = normal(r).split(' ');
    if (buena.join('').length >= 6 && junto.includes(buena.join(''))) return true; // "machupicchu", "salchipapaaa"
    for (let i = 0; i + buena.length <= palabras.length; i++) {
      if (buena.every((p, j) => parecida(palabras[i + j], p))) return true;
    }
    return false;
  });
}

export function crearDibujos({ duracionMs = 45000, puntosPorPuesto = () => 0, usadas = new Set(), alUsar = () => {}, alReiniciar = () => {}, alCambiar, alTerminar }) {
  let actual = null, pendiente = null, fin = null, pistas = [], avisoIntentos = null;

  // Sin repetir hasta que salgan todos (también entre LIVEs si hay memoria); alterna Perú y general
  let tocaPeru = true;
  function elegir() {
    let libres = DIBUJOS.filter((d) => !usadas.has(d.id));
    if (!libres.length) { usadas.clear(); alReiniciar(); libres = DIBUJOS; }
    const delTema = libres.filter((d) => d.peru === tocaPeru);
    tocaPeru = !tocaPeru;
    const lista = delTema.length ? delTema : libres;
    const d = lista[Math.floor(Math.random() * lista.length)];
    usadas.add(d.id);
    alUsar(d.id);
    return d;
  }

  const pista = () => [...actual.r.toUpperCase()].map((ch, i) => (ch === ' ' ? ' ' : actual.reveladas.has(i) ? ch : '_')).join('');
  // Lo que se manda al overlay (la respuesta no viaja hasta el final: solo la pista)
  const estado = () => ({
    activo: true, id: actual.id, trazos: actual.trazos, pista: pista(), letras: actual.letras,
    inicio: actual.inicio, dibujarMs: actual.dibujarMs, terminaEn: actual.terminaEn, intentos: actual.intentos,
    adivinaron: actual.acertaron.length, // solo cuántos: los nombres se revelan al final
  });

  function revelarLetra() {
    if (!actual) return;
    const ocultas = [...actual.r].map((ch, i) => i).filter((i) => actual.r[i] !== ' ' && !actual.reveladas.has(i));
    if (actual.reveladas.size >= Math.floor(actual.letras / 2) || ocultas.length <= 1) return; // nunca se regala entera
    actual.reveladas.add(ocultas[Math.floor(Math.random() * ocultas.length)]);
    alCambiar(estado());
  }

  // Paso 1: elegir el dibujo (todavía no sale en pantalla)
  function preparar(pidio = null) {
    if (actual || pendiente) return null;
    pendiente = { ...elegir(), pidio };
    pendiente.letras = pendiente.r.replace(/ /g, '').length;
    return { pidio, letras: pendiente.letras, palabras: pendiente.r.split(' ').length };
  }

  // Paso 2: aparece la pizarra y empieza a dibujar
  function abrir() {
    if (!pendiente || actual) return;
    const ahora = Date.now();
    actual = {
      ...pendiente, respuestas: [pendiente.r, ...pendiente.v], reveladas: new Set(), intentos: 0, acertaron: [],
      inicio: ahora, dibujarMs: Math.round(duracionMs * 0.6), terminaEn: ahora + duracionMs,
    };
    pendiente = null;
    pistas = PISTAS_EN.map((f) => setTimeout(revelarLetra, duracionMs * f));
    fin = setTimeout(terminar, duracionMs);
    alCambiar(estado());
  }

  function terminar() {
    if (!actual) return;
    clearTimeout(fin); clearTimeout(avisoIntentos); avisoIntentos = null; pistas.forEach(clearTimeout);
    const a = actual;
    actual = null;
    // En orden de llegada: los 3 primeros son el podio; cada uno con sus puntos
    const acertaron = a.acertaron.map((x, i) => ({ ...x, puesto: i + 1, puntos: puntosPorPuesto(i) }));
    const resultado = {
      activo: false, terminado: true, id: a.id, trazos: a.trazos, respuesta: a.r, peru: a.peru,
      acertaron, ganador: acertaron[0] ?? null, intentos: a.intentos,
    };
    alCambiar(resultado);
    alTerminar(resultado);
  }

  // Un mensaje del chat mientras dibuja: 'acerto', 'ya-acerto', 'intento' (falló) o false (no es un intento: sigue su camino)
  function adivinar(clave, texto, usuario) {
    if (!actual) return false;
    if (normal(texto).split(' ').length > PALABRAS_MAX_INTENTO) return false;
    if (actual.acertaron.some((x) => x.clave === clave)) return 'ya-acerto'; // ya está anotado: no se repite
    actual.intentos++;
    if (acierta(texto, actual.respuestas)) {
      actual.acertaron.push({ clave, usuario, segundos: Math.round((Date.now() - actual.inicio) / 1000) });
      avisoIntentos ??= setTimeout(() => { avisoIntentos = null; if (actual) alCambiar(estado()); }, 1000);
      return 'acerto';
    }
    // El contador de intentos en pantalla se actualiza como mucho una vez por segundo
    avisoIntentos ??= setTimeout(() => { avisoIntentos = null; if (actual) alCambiar(estado()); }, 1000);
    return 'intento';
  }

  return { preparar, abrir, adivinar, ocupado: () => !!(actual || pendiente), activo: () => !!actual, total: DIBUJOS.length };
}
