// Juego de pedidos: la cocina es de mentira. Si alguien pide algo del menú, se "cocina" unos minutos
// y luego se avisa con alListo({ usuario, plato }). alCambiar(lista) avisa al overlay para la comanda.

// Carta del juego. Los que van primero ganan si un texto calza con varios (salchibroaster antes que salchipapa).
// rapido: bebidas y cosas que salen al toque (1 minuto)
const PLATOS = [
  { plato: 'salchibroaster', corto: 'Salchibro', re: /\bsalchi ?broaster\b/i },
  { plato: 'salchipapa', corto: 'Salchi', re: /\bsalchi(papa)?s?\b/i },
  { plato: '1/8 de pollo', corto: '1/8', re: /\b(1\/8|un octavo|octavo)\b/i },
  { plato: '1/4 de pollo', corto: '1/4', re: /(\b1\/4\b|\bcuarto\b|\bcuartito\b)/i },
  { plato: '1/2 pollo', corto: '1/2', re: /(\b1\/2\b|\bmedio pollo\b|\bmedio\b)/i },
  { plato: 'pollo entero', corto: 'Entero', re: /\b(pollo entero|un pollo|un pollito)\b/i },
  { plato: 'alitas broaster', corto: 'Alitas', re: /\balitas?\b/i },
  { plato: 'mostrito', corto: 'Mostrito', re: /\bmostrito\b/i },
  { plato: 'chaufa de pollo', corto: 'Chaufa', re: /\bchaufa\b/i },
  { plato: 'hamburguesa', corto: 'Hambur', re: /\bhamburguesas?\b/i },
  { plato: 'porción de papas', corto: 'Papas', re: /\b(porci[oó]n de papas|papas fritas)\b/i },
  { plato: 'ensalada', corto: 'Ensalada', re: /\bensalada\b/i, rapido: true },
  { plato: 'gaseosa', corto: 'Gaseosa', re: /\b(gaseosas?|soda|la amarilla|la negra|inka|coca)\b/i, rapido: true },
  { plato: 'agua mineral', corto: 'Agua', re: /\bagua\b/i, rapido: true },
  { plato: 'chicha morada', corto: 'Chicha', re: /\bchicha\b/i, rapido: true },
  { plato: 'limonada', corto: 'Limonada', re: /\blimonadas?\b/i, rapido: true },
  { plato: 'jugo', corto: 'Jugo', re: /\bjugos?(\s+de\s+[\p{L}]+)?/iu, rapido: true },
  { plato: 'maracuyá', corto: 'Maracuyá', re: /\bmaracuy[aá]/i, rapido: true },
  { plato: 'refresco', corto: 'Refresco', re: /\brefrescos?\b/i, rapido: true },
  { plato: 'café', corto: 'Café', re: /(\bcaf[eé]|\binfusi[oó]n|\bt[eé](?=[\s,.!?]|$)|\ban[ií]s|\bmanzanilla)/i, rapido: true },
  { plato: 'cerveza', corto: 'Chela', re: /\b(cervezas?|chelas?|chelita)\b/i, rapido: true },
];
const QUIERE = /\b(quiero|quisiera|dame|deme|d[eé]me|me das|me da|me vendes|p[aá]same|pido|ponme|p[oó]nme|s[ií]rveme|m[aá]ndame|me antoja|me provoca|tr[aá]eme|para llevar|me alistas|al[ií]stame|por ?favor|porfa|porfis|xfa|para m[ií])\b|^\s*(t[ií]a[,!]?\s*)?(un|una|1)\s/i;
// "¿a cómo el cuarto?" o "¿hay salchipapa?" son preguntas, no pedidos ("¿me das un cuarto?" sí es pedido)
const PREGUNTA = /cu[aá]nto|a c[oó]mo|precio|cuesta|\bvale\b|\bhay\b|tienen|tienes/i;
const FIADO = /fiado|f[ií]ame|me f[ií]as|te pago|ap[uú]nta|an[oó]ta/i; // eso lo bate el personaje, no se cocina

// ¿Este comentario es un pedido de la carta? Devuelve el pedido (puede juntar hasta 3 productos) o null
export function detectarPedido(texto) {
  let t = String(texto ?? '');
  if (!QUIERE.test(t) || PREGUNTA.test(t) || FIADO.test(t)) return null;
  const elegidos = [];
  for (const p of PLATOS) {
    if (elegidos.length >= 3) break;
    if (p.re.test(t)) { elegidos.push(p); t = t.replace(p.re, ' '); } // que "salchibroaster" no cuente también como salchipapa
  }
  if (!elegidos.length) return null;
  return {
    plato: elegidos.length > 2
      ? `${elegidos.slice(0, -1).map((p) => p.plato).join(', ')} y ${elegidos.at(-1).plato}`
      : elegidos.map((p) => p.plato).join(' con '),
    corto: elegidos.map((p) => p.corto).join('+'),
    rapido: elegidos.every((p) => p.rapido), // solo bebidas: sale en 1 minuto
  };
}

export function crearCocina({ memoria, alListo, alCambiar, minMinutos = 2, maxMinutos = 4, maxActivos = 8 }) {
  const activos = new Map(); // clave (@) -> { id, usuario (nombre), plato, corto, listoEn }
  const listos = []; // recién salidos, para mostrar "¡LISTO!" un rato en la comanda

  const lista = () => [
    ...[...activos.values()].sort((a, b) => a.listoEn - b.listoEn).map((p) => ({ ...p, listo: false })),
    ...listos.map((p) => ({ ...p, listo: true })),
  ];

  // Devuelve qué pasó con el pedido, para que Doña Chabela lo diga
  function pedir(clave, usuario, { plato, corto, rapido }) {
    const ya = activos.get(clave);
    if (ya) return { estado: 'ya-tiene', plato: ya.plato, faltaMin: Math.max(1, Math.ceil((ya.listoEn - Date.now()) / 60000)) };
    if (activos.size >= maxActivos) return { estado: 'cocina-llena', plato };

    const minutos = rapido ? 1 : minMinutos + Math.floor(Math.random() * (maxMinutos - minMinutos + 1));
    const listoEn = Date.now() + minutos * 60000;
    const id = memoria ? memoria.crearPedido(clave, plato, listoEn) : Date.now();
    activos.set(clave, { id, usuario, plato, corto, listoEn });
    setTimeout(() => terminar(clave), minutos * 60000);
    alCambiar(lista());
    return { estado: 'nuevo', plato, minutos };
  }

  function terminar(clave) {
    const p = activos.get(clave);
    if (!p) return;
    activos.delete(clave);
    memoria?.marcarListo(p.id);
    listos.push(p);
    setTimeout(() => { listos.splice(listos.indexOf(p), 1); alCambiar(lista()); }, 25000);
    alCambiar(lista());
    alListo({ usuario: p.usuario, plato: p.plato });
  }

  return { pedir, lista };
}
