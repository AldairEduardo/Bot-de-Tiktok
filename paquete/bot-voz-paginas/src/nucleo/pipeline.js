// Flujo principal: evento -> respuesta (cerebro) -> audio (voz) -> salida.
// Recibe sus dependencias por parámetro, así puedes cambiar proveedores sin tocar esto.

import { detectarPedido } from './cocina.js';
import { claveDe } from './eventos.js';
import { fraseFija } from './frases-fijas.js';

// "ya pe" suena a "Yape" (la app de pagos) al leerse en voz alta: se cambia por "ya pues"
const sinYape = (texto) => texto.replace(/\bya,?\s+pe\b/gi, (m) => (m[0] === 'Y' ? 'Ya pues' : 'ya pues'));

export function crearPipeline({ cerebro, voz, salida, esSegura = () => true, registro, memoria, cocina, frasesFijas = false }) {
  return async function procesar(ev) {
    const t0 = Date.now();
    // Antes de pensar: lo que recuerda de esa persona y, si está pidiendo algo del menú, el pedido del juego
    if (memoria && ev.tipo === 'chat') ev.memoria = memoria.contexto(claveDe(ev));
    if (memoria && ev.tipo === 'unirse') {
      const personas = ev.grupo ?? [ev];
      ev.regulares = personas.filter((p) => (memoria.contexto(claveDe(p))?.visita ?? 0) > 1).map((p) => p.usuario);
    }
    if (cocina && ev.tipo === 'chat' && !ev.entreUsuarios) {
      const plato = detectarPedido(ev.texto);
      if (plato) ev.pedido = cocina.pedir(claveDe(ev), ev.usuario, plato);
    }
    // Relleno (tap tap, compartir, ranking, likes, saludos): frase fija ya grabada, sin gastar IA ni voz
    const fija = frasesFijas ? fraseFija(ev) : null;
    // Apenas empieza a pensar la respuesta de un comentario, en pantalla: "la tía está leyendo a @..."
    if (ev.tipo === 'chat') salida.emitir({ tipo: 'leyendo', usuario: ev.usuario });
    const original = fija ?? await cerebro.responder(ev);
    const tPensar = Date.now() - t0;
    const respuesta = original && sinYape(original);

    if (!respuesta) {
      if (ev.tipo === 'chat') salida.emitir({ tipo: 'leyendo-fin' });
      console.log(`[omitido] ${ev.usuario}: ${ev.texto ?? ''}`);
      return;
    }
    if (!esSegura(respuesta)) {
      if (ev.tipo === 'chat') salida.emitir({ tipo: 'leyendo-fin' });
      console.log(`[omitido: la respuesta traía insultos o datos personales] ${ev.usuario}`);
      return;
    }

    const t1 = Date.now();
    const audio = await voz.sintetizar(respuesta, { guardar: Boolean(fija) }); // las fijas quedan guardadas para siempre
    const tVoz = Date.now() - t1;
    console.log(
      `[${ev.tipo}${fija ? ' · frase fija' : ''}] ${ev.usuario}: ${ev.texto ?? ev.regalo ?? ''}\n   -> ${respuesta} (${Date.now() - t0} ms: IA ${tPensar} · voz ${tVoz})`
    );

    const id = Date.now() + Math.random().toString(36).slice(2, 7); // para casar el "fin" del overlay con esta frase
    salida.emitir({
      tipo: 'hablar',
      id,
      evento: ev.tipo,
      usuario: ev.usuario,
      grupo: ev.grupo?.length ?? 1,
      hay: ev.hay, // en la ronda de agradecimientos: si hubo regalos, seguidores o compartidos
      entrada: ev.texto ?? null,
      respuesta,
      audio,
    });
    registro?.anotar(ev, respuesta); // para encontrar luego los mejores momentos
    if (ev.tipo === 'chat') memoria?.guardarMensaje(claveDe(ev), String(ev.texto ?? '').slice(0, 80), respuesta); // corto: se reusa en prompts futuros
    await salida.esperarFin(respuesta, id);
  };
}
