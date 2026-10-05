// Mejores momentos del LIVE: revisa el registro de batidas y arma un .md con los clips que vale la pena cortar
// (hora, minuto del LIVE, duración y lo que se dijo). Se genera solo al cerrar con Ctrl+C, o con: npm run momentos
import fs from 'node:fs';
import path from 'node:path';

const NUEVO_LIVE_MS = 2 * 3600000; // más de 2 h sin batidas = empezó otro LIVE
const JUNTAR_MS = 150000; // comentarios de la misma persona con menos de 2,5 min entre sí: un solo clip (ida y vuelta)
const MAX_CLIPS = 8;

// CSV con comillas, comas y saltos de línea dentro de los campos
function leerCsv(texto) {
  const filas = [];
  let fila = [], celda = '', comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++; } else if (c === '"') comillas = false; else celda += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') { fila.push(celda); celda = ''; } else if (c === '\n') { fila.push(celda); filas.push(fila); fila = []; celda = ''; } else if (c !== '\r' && c !== '﻿') celda += c;
  }
  if (celda || fila.length) { fila.push(celda); filas.push(fila); }
  return filas.slice(1).filter((f) => f.length >= 6); // sin la cabecera
}

// Batidas de los últimos dos días (un LIVE puede pasar la medianoche), con su fecha y hora reales
function leerBatidas(carpeta) {
  if (!fs.existsSync(carpeta)) return [];
  const archivos = fs.readdirSync(carpeta).filter((a) => /^batidas-\d{4}-\d{2}-\d{2}\.csv$/.test(a)).sort().slice(-2);
  return archivos.flatMap((a) => {
    const fecha = a.slice(8, 18);
    return leerCsv(fs.readFileSync(path.join(carpeta, a), 'utf8')).map(([hora, , tipo, usuario, comentario, respuesta]) =>
      ({ t: new Date(`${fecha}T${hora}`).getTime(), hora, tipo, usuario, comentario, respuesta }));
  }).filter((b) => Number.isFinite(b.t)).sort((a, b) => a.t - b.t);
}

const dos = (n) => String(n).padStart(2, '0');
const horaDe = (t) => { const d = new Date(t); return `${dos(d.getHours())}:${dos(d.getMinutes())}`; };
const minuto = (t, inicio) => Math.max(0, Math.round((t - inicio) / 60000));
const duracion = (seg) => (seg < 90 ? `${seg} s` : `${Math.floor(seg / 60)} min ${seg % 60 ? `${seg % 60} s` : ''}`.trim());
const cita = (s, max = 140) => { const x = String(s ?? '').replace(/\s+/g, ' ').trim(); return x.length > max ? x.slice(0, max - 1) + '…' : x; };

// Arma los clips candidatos con un puntaje: idas y vueltas con la misma persona, metas (la tía baila), juegos y regalos
function armarClips(batidas) {
  const clips = [];
  const porPersona = new Map();
  for (const b of batidas.filter((x) => x.tipo === 'chat' && x.usuario && x.usuario !== 'anónimo')) {
    const lista = porPersona.get(b.usuario) ?? [];
    const ultimo = lista.at(-1);
    if (ultimo && b.t - ultimo.at(-1).t <= JUNTAR_MS) ultimo.push(b); else lista.push([b]);
    porPersona.set(b.usuario, lista);
  }
  for (const [usuario, escenas] of porPersona) {
    for (const e of escenas) {
      const puntos = e.length * 3 + (e.length >= 3 ? 4 : 0) + (e.some((x) => x.respuesta.length > 70) ? 1 : 0);
      clips.push({ tipo: 'charla', usuario, inicio: e[0].t, fin: e.at(-1).t, puntos, lineas: e.map((x) => `"${cita(x.comentario, 70)}" → *"${cita(x.respuesta)}"*`),
        titulo: `"${cita(e[0].comentario, 40)}" y la tía lo batió 😂` });
    }
  }
  // Juegos: el clip empieza cuando lo anuncia (se ve la pizarra o la pregunta) y termina con el resultado
  for (const [fin, inicioTipo, nombre] of [['dibujo_fin', 'dibujo_inicio', 'dibujo'], ['encuesta_fin', 'encuesta_inicio', 'juego']]) {
    for (const b of batidas.filter((x) => x.tipo === fin)) {
      const anuncio = [...batidas].reverse().find((x) => x.tipo === inicioTipo && x.t <= b.t && b.t - x.t < 180000);
      const nadie = /nadie/i.test(b.respuesta);
      clips.push({ tipo: nombre, usuario: b.usuario, inicio: anuncio?.t ?? b.t - 45000, fin: b.t, puntos: 4 + (nadie ? 1 : 0),
        lineas: [anuncio && `Anuncio: *"${cita(anuncio.respuesta)}"*`, `Resultado: *"${cita(b.respuesta)}"*`].filter(Boolean),
        titulo: nombre === 'dibujo' ? (nadie ? 'Nadie adivinó mi dibujo 😤 ¿tú sí?' : '¿Adivinas qué dibujó la tía? 🎨') : '¿Tú sabías la respuesta? 🧠' });
    }
  }
  for (const b of batidas.filter((x) => x.tipo === 'meta')) {
    clips.push({ tipo: 'meta', usuario: '', inicio: b.t, fin: b.t, puntos: 7, lineas: [`*"${cita(b.respuesta)}"*`, 'Se ve a la tía bailando con luces y confeti.'],
      titulo: 'Llegamos a la meta y la tía se puso a bailar 💃' });
  }
  for (const b of batidas.filter((x) => x.tipo === 'regalo' || x.tipo === 'agradecimientos')) {
    clips.push({ tipo: 'regalo', usuario: b.usuario, inicio: b.t, fin: b.t, puntos: 5, lineas: [`${b.usuario}${b.comentario ? ` (${b.comentario})` : ''} → *"${cita(b.respuesta)}"*`],
      titulo: `${cita(b.usuario, 30)} le ${/,| y /.test(b.usuario) ? 'mandaron regalos' : 'mandó un regalo'} a la tía 🎁` });
  }
  return clips;
}

// Los mejores, variados: como mucho 2 de cada tipo de juego/meta/regalo y 2 por persona
function elegir(clips) {
  const elegidos = [], porTipo = {}, porPersona = {};
  for (const c of [...clips].sort((a, b) => b.puntos - a.puntos || a.inicio - b.inicio)) {
    if (c.tipo !== 'charla' && (porTipo[c.tipo] ?? 0) >= 2) continue;
    if (c.usuario && c.tipo === 'charla' && (porPersona[c.usuario] ?? 0) >= 2) continue;
    if (elegidos.some((e) => c.inicio <= e.fin + 30000 && e.inicio <= c.fin + 30000)) continue; // no repetir el mismo tramo
    elegidos.push(c);
    porTipo[c.tipo] = (porTipo[c.tipo] ?? 0) + 1;
    if (c.usuario) porPersona[c.usuario] = (porPersona[c.usuario] ?? 0) + 1;
    if (elegidos.length >= MAX_CLIPS) break;
  }
  // Que haya al menos un juego (se ve la pizarra o la trivia): si no entró ninguno, reemplaza al de menos puntos
  const juego = [...clips].filter((c) => c.tipo === 'dibujo' || c.tipo === 'juego').sort((a, b) => b.puntos - a.puntos)[0];
  if (juego && !elegidos.some((c) => c.tipo === 'dibujo' || c.tipo === 'juego')) {
    if (elegidos.length >= MAX_CLIPS) elegidos.pop();
    elegidos.push(juego);
  }
  return elegidos;
}

// Genera el .md del último LIVE del registro. Devuelve la ruta, o null si no hay nada que guardar
export function generarMomentos({ carpeta }) {
  const batidas = leerBatidas(carpeta);
  if (!batidas.length) return null;
  // Solo el último LIVE: desde el último hueco de más de 2 horas
  let desde = 0;
  for (let i = 1; i < batidas.length; i++) if (batidas[i].t - batidas[i - 1].t > NUEVO_LIVE_MS) desde = i;
  const live = batidas.slice(desde);
  const inicio = live[0].t, fin = live.at(-1).t;
  const clips = elegir(armarClips(live));
  if (!clips.length) return null;

  const comentarios = live.filter((b) => b.tipo === 'chat');
  const personas = new Set(comentarios.map((b) => b.usuario)).size;
  const d = new Date(inicio);
  const fecha = `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
  const md = [
    `# Mejores momentos: LIVE del ${fecha}`,
    '',
    `LIVE de ${horaDe(inicio)} a ${horaDe(fin)} (unos ${minuto(fin, inicio)} minutos) · ${comentarios.length} comentarios respondidos de ${personas} personas.`,
    'La **hora** es la del reloj de la PC. El **minuto** se cuenta desde la primera batida del LIVE, para ubicarlo en la grabación.',
    'Generado solo a partir del registro de batidas: revisa el video antes de publicar.',
    '',
    '| # | Clip | Hora | Minuto del LIVE | Duración aprox. |',
    '|---|------|------|-----------------|-----------------|',
    ...clips.map((c, i) => `| ${i + 1} | ${c.titulo.replace(/\|/g, '/')} | ${horaDe(c.inicio)}${c.fin - c.inicio > 60000 ? ` → ${horaDe(c.fin + 30000)}` : ''} | ${minuto(c.inicio, inicio)} | ${duracion(Math.max(15, Math.round((c.fin - c.inicio) / 1000) + 20))} |`),
    '',
    '---',
    '',
    ...clips.flatMap((c, i) => [
      `## ${i + 1}. ${c.titulo}`,
      `**${horaDe(c.inicio)} · minuto ${minuto(c.inicio, inicio)}**${c.usuario && c.tipo === 'charla' ? ` · con ${c.usuario}` : ''}`,
      '',
      ...c.lineas.map((l) => `- ${l}`),
      '',
    ]),
    '---',
    '',
    '## Consejos para los clips',
    '- **Formato:** de 15 a 40 segundos, vertical, con subtítulo grande de lo que dice la tía (mucha gente ve sin sonido).',
    '- **Cierre de cada video:** *"Juega con la tía en vivo 👉 @tiadonachabela"*.',
    '',
  ].join('\n');
  const archivo = path.join(carpeta, `mejores-momentos-${fecha}_${dos(d.getHours())}${dos(d.getMinutes())}.md`);
  fs.writeFileSync(archivo, md);
  return archivo;
}
