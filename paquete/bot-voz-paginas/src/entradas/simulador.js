// Entrada de prueba por consola: permite probar todo sin estar en vivo.
import readline from 'node:readline';
import * as ev from '../nucleo/eventos.js';

// Secuencia de prueba para /demo: [segundo, línea]. Recorre todo lo que puede pasar en un LIVE
const DEMO = [
  [0, 'carla: hola tía, saludos desde Arequipa'],
  [1, 'pepe: tía ¿a cómo el cuarto de pollo?'],
  [2, 'rosa: ¿tienen ceviche?'],
  [3, 'lucho: oe huevón atiende rápido'], // insulto: se filtra
  [3.5, 'promo: sigueme en mi perfil'], // spam: se filtra
  [4, 'ana: mi número es 987654321'], // dato personal: se filtra
  [5, '/regalo maria Rosa 10'], [5.4, '/regalo pedro León 1'], [5.8, '/regalo lucho Rosa 5'], // se agrupan
  [9, '/sigue juanito'], [9.5, '/sigue sofi'], // se agrupan
  [10, '/entra kathy'], [10.3, '/entra luis'], [10.6, '/entra rocky'], // un solo saludo para los tres
  [12, 'beto: jajaja'], [12.2, 'kiki: xd'], [12.4, 'jose: ¿quién va a ganar las elecciones?'], [12.6, 'mile: tía estoy triste hoy'],
  [16, '/likes 500'],
  [20, '/comparte mile'],
  [24, 'jorge: tía quiero un cuarto de pollo'],
  [30, '/ranking'],
  [38, '/compartir'],
  [45, '/taps'],
];

export function iniciarSimulador({ alEvento }) {
  console.log(`
Modo simulación. Escribe eventos y presiona Enter:
  pepe: hola tía, un cuarto de pollo     -> comentario
  /regalo pepe Rosa 5                     -> regalo
  /sigue pepe                             -> nuevo seguidor
  /entra pepe                             -> alguien entra al LIVE (saludo)
  /comparte pepe                          -> alguien compartió el LIVE
  /compartir                              -> pedir que compartan el LIVE
  /ranking                                -> anunciar el ranking de caseritos
  /tap pepe 40                            -> pepe da 40 tap tap (suma al ranking y a la meta)
  /encuesta                               -> empieza una encuesta (se vota escribiendo: pepe: 1)
  /meta                                   -> celebra la meta de likes: la tía baila
  /trivia                                 -> lanza una trivia (se responde: pepe: 2)
  /dibujo                                 -> la tía dibuja (se adivina escribiendo: pepe: cuy)
  /likes 500                              -> lluvia de likes
  /taps                                   -> pedir tap tap (sale solo cada pocos minutos)
  /demo                                   -> secuencia automática con todo lo anterior
`);

  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', procesarLinea);

  function procesarLinea(linea) {
    linea = linea.trim();
    if (!linea) return;

    if (linea === '/demo') {
      console.log('[demo] Arranca la secuencia de prueba (dura un par de minutos)');
      for (const [seg, l] of DEMO) setTimeout(() => { console.log(`[demo] > ${l}`); procesarLinea(l); }, seg * 1000);
      return;
    }

    const [cmd, a = 'anónimo', b = 'Rosa', c = '1'] = linea.split(/\s+/);
    if (cmd === '/regalo') {
      // Valor aproximado en diamantes de algunos regalos (en TikTok real el valor lo manda TikTok)
      const REGALOS = { rosa: ['Rosa', 1], tiktok: ['TikTok', 1], dona: ['Dona', 30], perfume: ['Perfume', 20], galaxia: ['Galaxia', 1000], leon: ['León', 29999], universo: ['Universo', 44999] };
      const [nombre, diamantes] = REGALOS[b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] ?? [b, 0];
      return alEvento(ev.regalo(a, nombre, c, diamantes));
    }
    if (cmd === '/sigue') return alEvento(ev.seguir(a));
    if (cmd === '/entra') return alEvento(ev.unirse(a));
    if (cmd === '/comparte') return alEvento(ev.compartio(a));
    if (cmd === '/compartir') return alEvento(ev.pedirCompartir());
    if (cmd === '/tap') return alEvento(ev.tap(a, Number(b) || 20));
    if (cmd === '/encuesta') return alEvento({ tipo: 'pedir-encuesta' });
    if (cmd === '/meta') return alEvento({ tipo: 'pedir-meta' });
    if (cmd === '/trivia') return alEvento({ tipo: 'pedir-trivia' });
    if (cmd === '/dibujo') return alEvento({ tipo: 'pedir-dibujo' });
    if (cmd === '/ranking') return alEvento({ tipo: 'pedir-ranking' }); // index.js lo arma con los datos reales
    if (cmd === '/likes') return alEvento(ev.likes(Number(a) || 300));
    if (cmd === '/taps') return alEvento(ev.pedirTaps());

    const i = linea.indexOf(':');
    const usuario = i > 0 ? linea.slice(0, i) : 'anónimo';
    const texto = i > 0 ? linea.slice(i + 1) : linea;
    alEvento(ev.chat(usuario, texto, { sinCooldown: true }));
  }
}
