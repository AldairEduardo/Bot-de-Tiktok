// Memoria de Doña Chabela entre LIVEs: recuerda a cada caserito, sus conversaciones y sus pedidos (del juego).
// Usa SQLite integrado en Node (node:sqlite): un solo archivo (datos/chabela.db) en esta PC, sin instalar nada.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const SIN_NOMBRE = /^(an[oó]nimo|causita|alguien|el público)$/i; // no son personas identificables

export function crearMemoria({ archivo, ultimosMensajes = 3 }) {
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  const db = new DatabaseSync(archivo, { timeout: 3000 }); // espera si otro programa la tiene bloqueada
  try { db.exec('PRAGMA journal_mode = WAL'); } catch {}
  db.exec(`
    CREATE TABLE IF NOT EXISTS caseritos (
      usuario TEXT PRIMARY KEY, primera_vez INTEGER, ultima_vez INTEGER, ultimo_live INTEGER,
      visitas INTEGER DEFAULT 0, comentarios INTEGER DEFAULT 0, pedidos INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS mensajes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, usuario TEXT, live INTEGER, fecha INTEGER, comentario TEXT, respuesta TEXT
    );
    CREATE INDEX IF NOT EXISTS mensajes_por_usuario ON mensajes (usuario, fecha);
    CREATE TABLE IF NOT EXISTS trivia_usadas (id TEXT PRIMARY KEY, fecha INTEGER);
    CREATE TABLE IF NOT EXISTS puntos (
      usuario TEXT PRIMARY KEY, nombre TEXT, puntos INTEGER DEFAULT 0, taps INTEGER DEFAULT 0, actualizado INTEGER
    );
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT, usuario TEXT, plato TEXT, live INTEGER,
      pedido_en INTEGER, listo_en INTEGER, estado TEXT
    );
  `);
  // Bases creadas antes: agregar la columna del nombre visible
  if (!db.prepare('PRAGMA table_info(caseritos)').all().some((c) => c.name === 'nombre')) {
    db.exec('ALTER TABLE caseritos ADD COLUMN nombre TEXT');
  }
  const live = Date.now(); // identifica esta transmisión
  // Los pedidos que quedaron en la freidora de un LIVE anterior ya no se anuncian
  db.prepare("UPDATE pedidos SET estado = 'abandonado' WHERE estado = 'cocinando'").run();

  const sql = {
    caserito: db.prepare('SELECT * FROM caseritos WHERE usuario = ?'),
    nuevo: db.prepare('INSERT INTO caseritos (usuario, nombre, primera_vez, ultima_vez, ultimo_live, visitas, comentarios) VALUES (?, ?, ?, ?, ?, 1, ?)'),
    visita: db.prepare('UPDATE caseritos SET nombre = ?, ultima_vez = ?, ultimo_live = ?, visitas = visitas + ?, comentarios = comentarios + ? WHERE usuario = ?'),
    mensaje: db.prepare('INSERT INTO mensajes (usuario, live, fecha, comentario, respuesta) VALUES (?, ?, ?, ?, ?)'),
    ultimos: db.prepare('SELECT comentario, respuesta FROM mensajes WHERE usuario = ? ORDER BY fecha DESC LIMIT ?'),
    favorito: db.prepare('SELECT plato, COUNT(*) AS n FROM pedidos WHERE usuario = ? GROUP BY plato ORDER BY n DESC LIMIT 1'),
    pedir: db.prepare("INSERT INTO pedidos (usuario, plato, live, pedido_en, listo_en, estado) VALUES (?, ?, ?, ?, ?, 'cocinando')"),
    contarPedido: db.prepare('UPDATE caseritos SET pedidos = pedidos + 1 WHERE usuario = ?'),
    listo: db.prepare("UPDATE pedidos SET estado = 'listo' WHERE id = ?"),
    triviaUsadas: db.prepare('SELECT id FROM trivia_usadas'),
    marcarTrivia: db.prepare('INSERT OR REPLACE INTO trivia_usadas (id, fecha) VALUES (?, ?)'),
    reiniciarTrivia: db.prepare("DELETE FROM trivia_usadas WHERE id NOT LIKE 'dib-%'"),
    reiniciarDibujos: db.prepare("DELETE FROM trivia_usadas WHERE id LIKE 'dib-%'"),
    puntosTodos: db.prepare('SELECT usuario AS clave, nombre AS usuario, puntos, taps, actualizado FROM puntos'),
    reiniciarPuntos: db.prepare('DELETE FROM puntos'),
    guardarPuntos: db.prepare(`INSERT INTO puntos (usuario, nombre, puntos, taps, actualizado) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(usuario) DO UPDATE SET nombre = excluded.nombre, puntos = excluded.puntos, taps = excluded.taps, actualizado = excluded.actualizado`),
  };

  // Cómo estaba cada persona ANTES de este LIVE (para decir "volviste" o "vino ayer")
  const antes = new Map();

  // Registra que la persona apareció (comentó, entró, regaló...). usuario = su clave (@ de TikTok o nombre en el
  // simulador); nombre = cómo se muestra ahora; comento = si fue un comentario
  function verA(usuario, { nombre = usuario, comento = false } = {}) {
    if (!usuario || SIN_NOMBRE.test(usuario)) return;
    const ahora = Date.now();
    const fila = sql.caserito.get(usuario);
    if (!antes.has(usuario)) antes.set(usuario, fila ? { visitas: fila.visitas, ultimaVez: fila.ultima_vez, nombre: fila.nombre } : null);
    if (!fila) sql.nuevo.run(usuario, nombre, ahora, ahora, live, comento ? 1 : 0);
    else sql.visita.run(nombre, ahora, live, fila.ultimo_live === live ? 0 : 1, comento ? 1 : 0, usuario);
  }

  // Lo que Doña Chabela sabe de alguien, para dárselo a la IA
  function contexto(usuario) {
    if (!usuario || SIN_NOMBRE.test(usuario)) return null;
    const fila = sql.caserito.get(usuario);
    if (!fila) return null;
    const previo = antes.get(usuario);
    return {
      nombreAntes: previo?.nombre ?? null, // cómo se llamaba antes de este LIVE (por si cambió de nombre)
      visita: fila.visitas,
      ultimaVezAntes: previo?.ultimaVez ?? null, // última vez en un LIVE anterior
      comentarios: fila.comentarios,
      pedidos: fila.pedidos,
      platoFavorito: sql.favorito.get(usuario)?.plato ?? null,
      ultimos: sql.ultimos.all(usuario, ultimosMensajes).reverse(),
    };
  }

  function guardarMensaje(usuario, comentario, respuesta) {
    if (!usuario || SIN_NOMBRE.test(usuario)) return;
    sql.mensaje.run(usuario, live, Date.now(), comentario ?? '', respuesta ?? '');
  }

  function crearPedido(usuario, plato, listoEn) {
    const { lastInsertRowid } = sql.pedir.run(usuario, plato, live, Date.now(), listoEn);
    sql.contarPedido.run(usuario);
    return Number(lastInsertRowid);
  }

  // Ningún error de la base de datos debe tumbar el LIVE: se avisa en consola y se sigue sin memoria
  const seguro = (nombre, fn, porDefecto) => (...args) => {
    try { return fn(...args); } catch (e) { console.error(`[memoria] ${nombre} falló: ${e.message}`); return typeof porDefecto === 'function' ? porDefecto() : porDefecto; }
  };
  return {
    verA: seguro('verA', verA), contexto: seguro('contexto', contexto, null), guardarMensaje: seguro('guardarMensaje', guardarMensaje),
    crearPedido: seguro('crearPedido', crearPedido, () => Date.now()), marcarListo: seguro('marcarListo', (id) => sql.listo.run(id)),
    // Trivia: preguntas que ya salieron, para no repetirlas hasta que salgan todas
    triviaUsadas: seguro('triviaUsadas', () => new Set(sql.triviaUsadas.all().map((f) => f.id)), () => new Set()),
    marcarTrivia: seguro('marcarTrivia', (id) => sql.marcarTrivia.run(id, Date.now())),
    reiniciarTrivia: seguro('reiniciarTrivia', () => sql.reiniciarTrivia.run()),
    // La tía dibuja: se guardan en la misma tabla (id "dib-...") y se reinician aparte
    reiniciarDibujos: seguro('reiniciarDibujos', () => sql.reiniciarDibujos.run()),
    // Ranking de caseritos: los puntos se guardan para no perderlos al reiniciar ni entre LIVEs
    cargarPuntos: seguro('cargarPuntos', () => sql.puntosTodos.all(), () => []),
    reiniciarPuntos: seguro('reiniciarPuntos', () => sql.reiniciarPuntos.run()),
    // Cuándo fue lo último que pasó (alguien entró, comentó o sumó puntos): para saber si es un LIVE nuevo
    ultimaActividad: seguro('ultimaActividad', () => Math.max(
      Number(db.prepare('SELECT MAX(ultima_vez) AS t FROM caseritos').get().t) || 0,
      Number(db.prepare('SELECT MAX(actualizado) AS t FROM puntos').get().t) || 0,
    ), 0),
    // LIVE nuevo: se guarda una copia del anterior en datos/respaldos y se borra la gente, sus mensajes, pedidos y puntos.
    // Las trivias y dibujos ya usados se conservan, para que no se repitan.
    empezarDeCero: seguro('empezarDeCero', (carpetaRespaldos) => {
      fs.mkdirSync(carpetaRespaldos, { recursive: true });
      const d = new Date(), dos = (n) => String(n).padStart(2, '0'); // hora de esta PC (Perú)
      const fecha = `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}_${dos(d.getHours())}-${dos(d.getMinutes())}`;
      const respaldo = path.join(carpetaRespaldos, `live-anterior-${fecha}.db`).replace(/\\/g, '/');
      db.exec(`VACUUM INTO '${respaldo.replace(/'/g, "''")}'`);
      db.exec('BEGIN');
      try {
        for (const tabla of ['caseritos', 'mensajes', 'pedidos', 'puntos']) db.exec(`DELETE FROM ${tabla}`);
        db.exec('COMMIT');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
      return respaldo;
    }),
    guardarPuntos: seguro('guardarPuntos', (lista) => {
      const ahora = Date.now();
      db.exec('BEGIN');
      try {
        for (const p of lista) sql.guardarPuntos.run(p.clave, p.usuario, p.puntos, p.taps, ahora);
        db.exec('COMMIT');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    }),
  };
}
