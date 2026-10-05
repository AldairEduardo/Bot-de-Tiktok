// Salida hacia el overlay (OBS / navegador): sirve el HTML y envía mensajes por WebSocket.
// Interfaz que usa el núcleo: { emitir(msg), esperarFin(texto) }
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer } from 'ws';

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.js': 'text/javascript',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.wav': 'audio/wav',
};
const AUDIO = ['.mp3', '.ogg', '.m4a', '.wav'];
// Solo se atiende a esta misma PC (OBS y TikTok LIVE Studio corren aquí): nadie de la red puede conectarse
const esLocal = (ip) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip);

// Cambia en cada arranque del servidor: si el overlay ve otra versión al reconectar, se recarga solo (toma los cambios)
const VERSION = String(Date.now());

// Manda un archivo; si el navegador pide un pedazo (Range, típico de los videos), manda solo ese pedazo
function enviarArchivo(req, res, destino, tipo) {
  const tam = fs.statSync(destino).size;
  const rango = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  if (rango) {
    const ini = rango[1] ? Number(rango[1]) : Math.max(0, tam - Number(rango[2]));
    const fin = rango[1] && rango[2] ? Math.min(Number(rango[2]), tam - 1) : tam - 1;
    if (ini > fin || ini >= tam) return res.writeHead(416, { 'Content-Range': `bytes */${tam}` }).end();
    res.writeHead(206, { 'Content-Type': tipo, 'Content-Length': fin - ini + 1, 'Content-Range': `bytes ${ini}-${fin}/${tam}`, 'Accept-Ranges': 'bytes' });
    return fs.createReadStream(destino, { start: ini, end: fin }).on('error', () => res.destroy()).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': tam, 'Accept-Ranges': 'bytes' });
  fs.createReadStream(destino).on('error', () => res.destroy()).pipe(res);
}

export function crearOverlay({ puerto, puertoSeguro = 3443, certificado, archivo, carpetaCliente, musica = {}, escena = {} }) {
  const carpeta = path.dirname(archivo); // public/: de aquí salen las capas PNG y la música

  // Canciones de public/musica y volúmenes del .env, para que el overlay arme su lista
  function listaMusica() {
    let canciones = [];
    try {
      canciones = fs.readdirSync(path.join(carpeta, 'musica'))
        .filter((f) => AUDIO.includes(path.extname(f).toLowerCase()))
        .map((f) => `musica/${encodeURIComponent(f)}`);
    } catch {} // sin carpeta: sin música
    return { canciones, volumen: musica.volumen, volumenHablando: musica.volumenHablando };
  }

  const atender = (req, res) => {
    if (!esLocal(req.socket.remoteAddress)) return res.writeHead(403).end();
    let ruta;
    try {
      ruta = decodeURIComponent(req.url.split('?')[0]);
    } catch {
      return res.writeHead(400).end(); // URL mal formada
    }
    if (ruta === '/musica.json') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify(listaMusica()));
    }
    // Videos e imágenes del cliente (clientes/<id>/publico), sin poder salir de esa carpeta
    if (carpetaCliente && ruta.startsWith('/cliente/')) {
      const base = path.resolve(carpetaCliente);
      const destino = path.resolve(base, '.' + path.normalize(ruta.slice('/cliente'.length)));
      const tipo = TIPOS[path.extname(destino).toLowerCase()];
      if (!destino.startsWith(base + path.sep) || !tipo || !fs.existsSync(destino)) return res.writeHead(404).end();
      return enviarArchivo(req, res, destino, tipo);
    }
    // Resolver dentro de public/ y rechazar cualquier intento de salir de ella
    // /en-vivo: el mismo overlay, con el sonido activado de entrada (para apps que no aceptan '?' en la dirección)
    const destino = ruta === '/' || ruta === '/en-vivo' ? archivo : path.join(carpeta, path.normalize(ruta));
    const tipo = TIPOS[path.extname(destino).toLowerCase()];
    if (!destino.startsWith(carpeta + path.sep) || !tipo || !fs.existsSync(destino)) {
      return res.writeHead(404).end();
    }
    res.writeHead(200, { 'Content-Type': tipo });
    fs.createReadStream(destino)
      .on('error', () => res.destroy()) // archivo bloqueado o ilegible: no tumbar el servidor
      .pipe(res);
  };
  const server = http.createServer(atender);
  // Además, por https (TikTok LIVE Studio solo acepta enlaces https): si hay certificado en datos/certificado
  let seguro = null;
  try {
    if (certificado && fs.existsSync(certificado.cert) && fs.existsSync(certificado.key)) {
      seguro = https.createServer({ cert: fs.readFileSync(certificado.cert), key: fs.readFileSync(certificado.key) }, atender);
    }
  } catch (e) { console.warn('[overlay] No se pudo leer el certificado https:', e.message); }

  const opcionesWs = {
    maxPayload: 64 * 1024, // los mensajes del overlay son chiquitos
    // Solo páginas servidas por este mismo programa (u OBS sin origen): ninguna web externa se puede conectar
    verifyClient: ({ origin, req }) => esLocal(req.socket.remoteAddress) && (!origin || /^https?:\/\/(localhost|127\.0\.0\.1|127\.0\.0\.1\.nip\.io|\[::1\])(:\d+)?$/.test(origin)),
  };
  const wss = new WebSocketServer({ server, ...opcionesWs });
  const wssSeguro = seguro ? new WebSocketServer({ server: seguro, ...opcionesWs }) : null;
  wssSeguro?.on('error', () => {});
  wss.on('error', () => {}); // los errores del servidor HTTP ya los maneja iniciar()
  let resolverFin = null, idEsperado = null;
  let ultimoContador = null, ultimoRanking = null, ultimasComandas = null, ultimaMeta = null, ultimaEncuesta = null;
  let ultimoDibujo = null; // La tía dibuja en curso // se reenvían a cada overlay que se conecta (recargas, OBS)

  const alConectar = (ws) => {
    console.log('[overlay] conectado');
    ws.send(JSON.stringify({ tipo: 'escena', version: VERSION, ...escena })); // p. ej. si los personajes bailan siempre
    if (ultimoContador) ws.send(JSON.stringify({ ...ultimoContador, inicial: true }));
    if (ultimoRanking) ws.send(JSON.stringify(ultimoRanking));
    if (ultimasComandas) ws.send(JSON.stringify({ ...ultimasComandas, ahora: Date.now() }));
    if (ultimaMeta) ws.send(JSON.stringify(ultimaMeta));
    if (ultimaEncuesta?.activa) ws.send(JSON.stringify({ ...ultimaEncuesta, ahora: Date.now() }));
    if (ultimoDibujo?.activo) ws.send(JSON.stringify({ ...ultimoDibujo, ahora: Date.now() }));
    ws.on('error', (e) => console.warn('[overlay] Conexión con error:', e.message)); // sin esto, un mensaje mal formado tumbaba todo
    ws.on('message', (m) => {
      try {
        const d = JSON.parse(m);
        if (d.tipo === 'fin' && (!d.id || d.id === idEsperado)) resolverFin?.(); // solo el fin de la frase actual
      } catch {}
    });
  };
  wss.on('connection', alConectar);
  wssSeguro?.on('connection', alConectar);

  function emitir(msg) {
    if (msg.tipo === 'contador') ultimoContador = msg;
    if (msg.tipo === 'ranking') ultimoRanking = msg;
    if (msg.tipo === 'comandas') ultimasComandas = msg;
    if (msg.tipo === 'meta') ultimaMeta = msg;
    if (msg.tipo === 'encuesta') ultimaEncuesta = msg;
    if (msg.tipo === 'dibujo') ultimoDibujo = msg;
    const data = JSON.stringify(msg);
    for (const c of [...wss.clients, ...(wssSeguro?.clients ?? [])]) if (c.readyState === 1) c.send(data);
  }

  // Espera la señal "fin" del overlay o un tiempo máximo estimado por largo del texto
  function esperarFin(texto, id = null) {
    idEsperado = id;
    const maximo = Math.min(20000, 2500 + texto.length * 90);
    return new Promise((ok) => {
      const t = setTimeout(() => { resolverFin = null; ok(); }, maximo);
      resolverFin = () => { clearTimeout(t); resolverFin = null; ok(); };
    });
  }

  function iniciar() {
    return new Promise((ok, falla) => {
      server.once('error', (e) => falla(e.code === 'EADDRINUSE'
        ? new Error(`El puerto ${puerto} ya está en uso: probablemente ya tienes el overlay abierto en otra terminal. Ciérralo con Ctrl+C o cambia PORT en .env`)
        : e));
      server.listen(puerto, () => { // escucha en IPv4 e IPv6 ("localhost" puede ser cualquiera), pero solo atiende a esta PC
        console.log(`[overlay] Abre http://localhost:${puerto} (o agrégalo como Fuente de navegador en OBS)`);
        if (!seguro) return ok();
        // El https es un extra: si su puerto está ocupado, se avisa y se sigue con el http
        seguro.once('error', (e) => { console.warn(`[overlay] No se pudo abrir https en el puerto ${puertoSeguro}: ${e.message}`); ok(); });
        seguro.listen(puertoSeguro, () => {
          console.log(`[overlay] Para TikTok LIVE Studio (Añadir enlace): https://127.0.0.1.nip.io:${puertoSeguro}/en-vivo`);
          ok();
        });
      });
    });
  }

  return { iniciar, emitir, esperarFin };
}
