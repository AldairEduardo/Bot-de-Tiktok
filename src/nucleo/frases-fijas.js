// Frases fijas para el relleno (pedir tap tap, compartir, ranking, likes, saludos).
// No pasan por la IA y su audio se genera UNA sola vez (queda guardado en datos/voz-cache):
// después salen gratis. Se rotan al azar sin repetir hasta usarlas todas. Agrega las que quieras.
import { TIPO } from './eventos.js';

const FRASES = {
  [TIPO.TAPS]: [
    'Oe, ese dedito está más quieto que pollo sin freidora. ¡Tap tap a la pantalla, ya pues!',
    '¿Qué pasó, causitas? ¿Se les acabó la batería del dedo? ¡Denle tap tap!',
    'Miren cómo se mueve mi freidora y ustedes ni un tap. ¡Qué roche, caseritos!',
    'Tap tap a la pantalla, que es gratis, no les estoy cobrando ni un sol.',
    'Si no me dan tap tap, el pollo sale crudo y la culpa es de ustedes.',
    'A ver, ¿quién tiene el dedo más rápido del barrio? ¡Tap tap, sin miedo!',
    'Más tiesos que maniquí de Gamarra están. ¡Muévanse, tap tap a la pantalla!',
    'Doble toque a la pantalla, caseritos, que la tía necesita corazones para freír.',
    '¿Están viendo el LIVE o están jateando? ¡Despierten y denle tap tap!',
    'Cada tap tap es una papa frita más para la tía. ¡No sean codos con el dedo!',
    'Oigan, mi vecina tiene más likes vendiendo emoliente. ¡Tap tap, pues, causitas!',
    'El dedo no se gasta, mi amor. ¡Tap tap a la pantalla, al toque!',
  ],
  [TIPO.COMPARTIR]: [
    'Compartan el LIVE, no sean codos, que el chisme se comparte, causitas.',
    'Mándenle el LIVE a su grupo de WhatsApp de la familia, que la tía también quiere fama.',
    'Ese botón de compartir no muerde, caserito. ¡Tráete a tu mancha!',
    '¿Tienes un pata aburrido? Mándale el LIVE, que acá se le quita la flojera.',
    'Compartan el LIVE, que una brostería sin gente es como pollo sin papas.',
    'A ver, el que comparta el LIVE es mi caserito favorito. Bueno, hasta que comparta otro.',
    'Pásale el LIVE a tu ex, para que vea lo bien que la estás pasando sin él.',
    'Compartan, compartan, que la tía no se va a hacer famosa sola.',
    'Dale a compartir y tráete a tu tía, a tu primo y al vecino chismoso.',
    'Si te estás riendo, compártelo, que reírse solo es de locos, causita.',
  ],
  [TIPO.RANKING]: [
    '¡Atención, caseritos! Así va el ranking del día. Comenten y den tap tap para subir.',
    'Miren el ranking, causitas. El que está abajo, ¡a chambear con ese dedo!',
    '¡Ranking de caseritos! El primero está sacando pecho, ¿quién le quita el puesto?',
    'Así va la tabla, mi gente. Comentar y dar tap tap suma puntos, no se duerman.',
    'Ranking calientito, como mi pollo. ¡A ver quién se pone las pilas!',
    '¡Miren quién manda en la brostería! Los demás, a comentar más, que se quedan.',
    'Esta es la tabla del barrio, caseritos. El último invita la gaseosa.',
    'Ranking del LIVE: el primero está más contento que perro con dos colas. ¡Alcáncenlo!',
  ],
  [TIPO.LIKES]: [
    '¡Uy, cuántos corazones! Así me gusta, que suene esa freidora.',
    '¡Eso, caseritos, esos likes calientan más que mi aceite!',
    '¡Ay, mi gente! Con tanto cariño hasta el pollo sale más crocante.',
    '¡Bótame tu gaaa! Esa lluvia de likes me tiene bailando, causitas.',
    'Así, así, sigan con esos likes, que la tía se pone contenta.',
    '¡Qué tal lluvia de corazones! Ni en el Día de la Madre me quieren tanto.',
  ],
  [TIPO.UNIRSE]: [
    '¡Pasen nomás, caseritos, que acá no se cobra entrada!',
    '¡Llegó gente nueva! Siéntense, que el pollo ya sale, causitas.',
    'Bienvenidos a la brostería más chismosa de Lima. Comenten sin miedo.',
    '¡Pasen, pasen! Acá hay pollo, chisme y una tía que no se calla.',
    '¡Qué tal conchán! Llegan justo cuando sale el pollo. Saluden en el chat.',
    'Bienvenidos, mi gente. Escriban algo, que la tía no muerde. Bueno, a veces.',
    '¡Llegaron! Pónganse cómodos y escriban en el chat, que acá se bate a todos.',
    'Adelante, causitas. Primera regla de la brostería: acá se comenta, no se mira calladito.',
  ],
};

// La tía dibuja: el anuncio y el "nadie adivinó" ({r} = la respuesta). El ganador sí va con la IA (dice su nombre)
const DIBUJO_INICIO = [
  '¡La tía dibuja! A ver si adivinan qué es, causitas. Escriban la palabra en el chat.',
  'Saquen sus lentes, que la tía se pone a dibujar. ¡El primero que adivine gana puntos!',
  'Ahí les va mi obra de arte. Picasso, a tu lado, es un chibolo. ¿Qué es? Escríbanlo.',
  '¡Pizarra lista! Dibujo más rápido de lo que frío un pollo. Adivinen en el chat.',
  'Atención, que la tía dibuja. Si no le atinan, no me echen la culpa a mí.',
  'A ver, mis artistas. ¿Qué estoy dibujando? El más rápido se lleva los puntos.',
  'Modo pintora activado. Escriban qué es, y el que adivine primero gana.',
  '¡Concurso de la tía! Yo dibujo, ustedes adivinan. Sin trampa, ah.',
];
const DIBUJO_NADIE = [
  '¡Nadie le atinó! Era {r}, causitas. ¿Tan feo dibujo? Mejor ni me respondan.',
  'Era {r}, pues. Clarito estaba. Ustedes necesitan lentes, no un dibujo.',
  '¡Uy, qué roche! Era {r}. Hasta mi sobrino de cinco años le atinaba.',
  'Era {r}, mis queridos. La próxima dibujo con letras, para que entiendan.',
  'Nadie, ni uno. Era {r}. Me voy a dedicar al pollo nomás, qué pena.',
  '¡Era {r}! Me dejaron con la obra de arte en la mano, causitas.',
];

const bolsas = {}; // frases que faltan salir, por tipo (sin repetir hasta usar todas)
function sacar(clave, lista) {
  if (!bolsas[clave]?.length) bolsas[clave] = [...lista].sort(() => Math.random() - 0.5);
  return bolsas[clave].pop();
}

// Devuelve una frase fija para el evento, o null si ese evento debe ir con la IA
export function fraseFija(ev) {
  if (ev.tipo === TIPO.DIBUJO_INICIO) return sacar('dibujo_inicio', DIBUJO_INICIO);
  if (ev.tipo === TIPO.DIBUJO_FIN) return ev.dibujo?.ganador ? null : sacar('dibujo_nadie', DIBUJO_NADIE).replace('{r}', ev.dibujo.respuesta);
  const lista = FRASES[ev.tipo];
  if (!lista) return null;
  // Los que vuelven (caseritos de siempre) sí merecen un saludo hecho a medida
  if (ev.tipo === TIPO.UNIRSE && (ev.regulares?.length || ev.personal)) return null; // por su nombre: va con la IA
  return sacar(ev.tipo, lista);
}
