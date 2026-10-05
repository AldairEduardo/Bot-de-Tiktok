// Caché de audio: la misma frase con la misma voz no se vuelve a pagar.
//  - En memoria: las últimas frases que se repiten durante el LIVE.
//  - En disco (datos/voz-cache): las frases fijas, que sirven para todos los LIVEs.
// Misma interfaz que cualquier voz: { sintetizar(texto, { guardar }) -> base64 | null }
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MAX_EN_MEMORIA = 100;

export function crearVozConCache(voz, { carpeta, firma = '' }) {
  const memoria = new Map(); // clave -> base64 (el orden de inserción sirve para borrar el más viejo)
  try { fs.mkdirSync(carpeta, { recursive: true }); } catch {}
  const claveDe = (texto) => crypto.createHash('sha1').update(`${firma}|${texto.trim()}`).digest('hex');

  function recordar(clave, audio) {
    memoria.delete(clave);
    memoria.set(clave, audio);
    if (memoria.size > MAX_EN_MEMORIA) memoria.delete(memoria.keys().next().value);
  }

  async function sintetizar(texto, { guardar = false } = {}) {
    const clave = claveDe(texto);
    const archivo = path.join(carpeta, `${clave}.b64`);
    if (memoria.has(clave)) { recordar(clave, memoria.get(clave)); return memoria.get(clave); }
    try {
      const audio = fs.readFileSync(archivo, 'utf8');
      if (audio) { recordar(clave, audio); return audio; }
    } catch {} // no estaba en disco

    const audio = await voz.sintetizar(texto);
    if (!audio) return null; // falló: no se guarda, así se reintenta la próxima vez
    recordar(clave, audio);
    if (guardar) {
      try { fs.writeFileSync(archivo, audio); } catch (e) { console.warn('[voz] No se pudo guardar en caché:', e.message); }
    }
    return audio;
  }

  return { sintetizar };
}
