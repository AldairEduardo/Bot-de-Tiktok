// Registro de batidas: guarda cada respuesta en un CSV por día (registros/batidas-AAAA-MM-DD.csv)
// para encontrar rápido los mejores momentos y cortarlos como videos cortos. Se abre con Excel.
// "minuto_del_live" cuenta desde que arrancó el programa: si grabas en OBS desde el inicio, coincide con el video.
import fs from 'node:fs';
import path from 'node:path';

const celda = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export function crearRegistro({ carpeta }) {
  const inicio = Date.now();

  function anotar(ev, respuesta) {
    try {
      fs.mkdirSync(carpeta, { recursive: true });
      const ahora = new Date();
      const archivo = path.join(carpeta, `batidas-${ahora.toLocaleDateString('sv-SE')}.csv`); // AAAA-MM-DD
      if (!fs.existsSync(archivo)) {
        // ﻿ para que Excel muestre bien las tildes y la ñ
        fs.writeFileSync(archivo, '﻿hora,minuto_del_live,tipo,usuario,comentario,respuesta\n');
      }
      const s = Math.floor((Date.now() - inicio) / 1000);
      const fila = [
        ahora.toLocaleTimeString('es-PE', { hour12: false }),
        `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
        ev.tipo,
        ev.usuario,
        ev.texto ?? ev.regalo ?? '',
        respuesta,
      ].map(celda).join(',');
      fs.appendFileSync(archivo, fila + '\n');
    } catch (e) {
      console.error('[registro] No se pudo guardar:', e.message); // nunca debe tumbar el LIVE
    }
  }

  return { anotar };
}
