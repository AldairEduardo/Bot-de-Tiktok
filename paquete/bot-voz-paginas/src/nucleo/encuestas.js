// Encuestas y trivias en pantalla: una pregunta con opciones numeradas; el chat responde escribiendo el número
// (1, 2, 3...) o el texto exacto de la opción. No sabe nada de TikTok ni de la IA.
//  - Encuesta: de opinión, se puede cambiar el voto y los porcentajes se ven en vivo.
//  - Trivia: tiene respuesta correcta, vale UNA respuesta por persona y el resultado se revela al final.
// Va en dos pasos: preparar() elige la pregunta para que Doña Chabela la anuncie, y abrir() la muestra y corre el tiempo.

export const PREGUNTAS = [
  { pregunta: '¿Qué es mejor?', opciones: ['Cuarto de pollo', 'Salchipapa'] },
  { pregunta: '¿La mejor crema?', opciones: ['Ají', 'Huancaína', 'Mayonesa', 'Ocopa'] },
  { pregunta: '¿Con qué acompañas?', opciones: ['Chicha morada', 'Gaseosa', 'Limonada'] },
  { pregunta: '¿Qué presa pides?', opciones: ['Pierna', 'Pecho', 'Ala'] },
  { pregunta: '¿Tú eres…?', opciones: ['Puntual', 'Ya estoy llegando'] },
  { pregunta: '¿Mejor plan del domingo?', opciones: ['Pollada', 'Parrillada', 'Dormir'] },
  { pregunta: '¿Quién paga la cuenta?', opciones: ['El que invita', 'Se divide', 'El que se hace el loco'] },
  { pregunta: '¿Qué es más peruano?', opciones: ['Ceviche', 'Pollo a la brasa'] },
  { pregunta: '¿Desde dónde nos ves?', opciones: ['Lima', 'Provincia', 'Extranjero'] },
  { pregunta: '¿Papas o arroz?', opciones: ['Papas', 'Arroz chaufa'] },
  { pregunta: '¿Cuándo es mejor el pollo?', opciones: ['Viernes de quincena', 'Domingo familiar'] },
  { pregunta: '¿Qué haces en el LIVE?', opciones: ['Chambeando', 'Haciéndome el que estudio', 'Echado en la cama'] },
  // ---------- Comida ----------
  { pregunta: '¿Pollo a la brasa o broaster?', opciones: ['A la brasa', 'Broaster', 'Los dos, no seas tacaño'] },
  { pregunta: '¿La papa frita cómo?', opciones: ['Crocante', 'Blandita', 'Bañada en cremas'] },
  { pregunta: '¿Cuántas cremas le echas?', opciones: ['Una nomás', 'Todas', 'Hasta que se acabe el pote'] },
  { pregunta: '¿El mejor bajón de madrugada?', opciones: ['Salchipapa', 'Hamburguesa', 'Pan con lo que haya'] },
  { pregunta: '¿Qué pides en la pollería?', opciones: ['Cuarto', 'Medio pollo', 'Un pollo entero, solo'] },
  { pregunta: '¿Chicha morada o maracuyá?', opciones: ['Chicha morada', 'Maracuyá', 'Limonada'] },
  { pregunta: '¿Desayuno peruano?', opciones: ['Pan con chicharrón', 'Pan con tamal', 'Emoliente con quinua'] },
  { pregunta: '¿El postre ganador?', opciones: ['Picarones', 'Arroz zambito', 'Mazamorra morada'] },
  { pregunta: '¿Ají en todo?', opciones: ['Siempre', 'A veces', 'Soy de lágrima fácil'] },
  { pregunta: '¿La presa que nadie quiere?', opciones: ['La rabadilla', 'El ala', 'El pescuezo'] },
  { pregunta: '¿Arroz chaufa o tallarín saltado?', opciones: ['Chaufa', 'Tallarín saltado', 'Aeropuerto, los dos'] },
  { pregunta: '¿Ceviche con qué?', opciones: ['Camote', 'Choclo', 'Cancha'] },
  // ---------- Vida de barrio ----------
  { pregunta: '¿Cuando dices "ya estoy llegando"…?', opciones: ['Ya llegué', 'Recién me baño', 'Sigo en la cama'] },
  { pregunta: '¿Quién es el más chismoso de la familia?', opciones: ['La tía', 'La abuela', 'Yo, no te hagas'] },
  { pregunta: '¿En la reunión familiar tú eres…?', opciones: ['El que baila', 'El que come', 'El del celular'] },
  { pregunta: '¿Combi o taxi?', opciones: ['Combi, al toque', 'Taxi, con estilo', 'Caminando, misio'] },
  { pregunta: '¿Qué te dice tu mamá?', opciones: ['Abrígate', 'Ya comiste', '¿A qué hora llegas?'] },
  { pregunta: '¿La quincena te dura…?', opciones: ['Una semana', 'Tres días', 'Ni llegó y ya se fue'] },
  { pregunta: '¿En la pollada tú…?', opciones: ['Compras tu tarjeta', 'Vendes tarjetas', 'Llegas sin tarjeta'] },
  { pregunta: '¿El mejor plan del sábado?', opciones: ['Fiesta', 'Pollo y película', 'Dormir hasta tarde'] },
  { pregunta: '¿Lunes de qué?', opciones: ['Chamba', 'Flojera', 'Dieta, que no dura'] },
  { pregunta: '¿Cómo saludas a tu pata?', opciones: ['¿Qué fue?', '¿Qué tal conchán?', 'Habla, causa'] },
  { pregunta: '¿Tu grupo de WhatsApp familiar es…?', opciones: ['Puro buenos días', 'Puro chisme', 'Lo tengo silenciado'] },
  { pregunta: '¿Cuándo pagas lo que debes?', opciones: ['Al toque', 'A fin de mes', 'Cuando se olviden'] },
  // ---------- Fiesta y música ----------
  { pregunta: '¿Qué se baila en la fiesta?', opciones: ['Cumbia', 'Salsa', 'Reguetón'] },
  { pregunta: '¿En la fiesta tú eres…?', opciones: ['El primero en bailar', 'El que se esconde', 'El que pide la última'] },
  { pregunta: '¿Hora pico de la fiesta?', opciones: ['Medianoche', 'Las tres', 'Cuando sale la comida'] },
  { pregunta: '¿Mejor fecha del año?', opciones: ['Fiestas Patrias', 'Navidad', 'Tu cumpleaños'] },
  // ---------- Del LIVE ----------
  { pregunta: '¿Cómo está la tía hoy?', opciones: ['Picante', 'Cariñosa', 'Más achorada que nunca'] },
  { pregunta: '¿Qué quieres más en el LIVE?', opciones: ['Trivias', 'Encuestas', 'Que la tía baile'] },
  { pregunta: '¿A qué hora nos ves?', opciones: ['En la chamba', 'En el carro', 'Antes de dormir'] },
  { pregunta: '¿Quién te mandó el LIVE?', opciones: ['Un pata', 'Me salió solito', 'Mi tía chismosa'] },
];

const normal = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, '').trim();

export function crearEncuestas({ duracionMs = 60000, duracionTriviaMs = 30000, elegirTrivia, alCambiar, alTerminar }) {
  let actual = null; // pregunta en pantalla, con votos: Map(clave -> { i, usuario, t })
  let pendiente = null; // elegida y anunciada, pero todavía no en pantalla
  const adelantados = new Map(); // respuestas que llegaron durante el anuncio
  let bolsaEncuestas = []; // encuestas que faltan salir: no se repiten hasta usar todas
  let fin = null;
  let cerradaEn = -Infinity; // para reconocer los votos que llegan tarde

  const esTrivia = () => actual?.modo === 'trivia';
  const contar = (votos, i) => [...votos.values()].filter((v) => v.i === i).length;

  // Lo que se manda al overlay. En la trivia no se muestran los votos por opción hasta el final (para que nadie copie)
  function estado({ revelar = false } = {}) {
    if (!actual) return null;
    const ocultar = esTrivia() && !revelar;
    return {
      activa: true,
      modo: actual.modo, // encuesta o trivia (no "tipo": ese nombre lo usa el mensaje al overlay)
      dificultad: actual.dificultad,
      pregunta: actual.pregunta,
      opciones: actual.opciones.map((texto, i) => ({ texto, votos: ocultar ? 0 : contar(actual.votos, i) })),
      total: actual.votos.size,
      terminaEn: actual.terminaEn,
    };
  }

  // Paso 1: elegir la pregunta (encuesta de opinión o trivia). No se muestra ni corre el tiempo todavía
  function preparar(tipo = 'encuesta', { dificultad = null } = {}) {
    if (actual || pendiente) return null;
    if (tipo === 'trivia' && elegirTrivia) {
      const q = elegirTrivia(dificultad);
      pendiente = { modo: 'trivia', id: q.id, pregunta: q.p, opciones: q.o, correcta: q.c, dificultad: q.d, dato: q.dato };
    } else {
      if (!bolsaEncuestas.length) bolsaEncuestas = [...PREGUNTAS].sort(() => Math.random() - 0.5);
      pendiente = { modo: 'encuesta', ...bolsaEncuestas.pop() };
    }
    return { modo: pendiente.modo, dificultad: pendiente.dificultad, pregunta: pendiente.pregunta, opciones: pendiente.opciones.map((texto) => ({ texto, votos: 0 })) };
  }

  // Paso 2: aparece en pantalla y empieza la cuenta regresiva
  function abrir() {
    if (!pendiente || actual) return;
    const dura = pendiente.modo === 'trivia' ? duracionTriviaMs : duracionMs;
    actual = { ...pendiente, votos: new Map(adelantados), terminaEn: Date.now() + dura };
    adelantados.clear();
    pendiente = null;
    fin = setTimeout(terminar, dura);
    alCambiar(estado());
  }

  function terminar() {
    if (!actual) return;
    const resultado = estado({ revelar: true });
    if (esTrivia()) {
      // Los que acertaron, en el orden en que respondieron: el primero es el ganador
      const acertaron = [...actual.votos.entries()]
        .filter(([, v]) => v.i === actual.correcta)
        .sort((a, b) => a[1].t - b[1].t)
        .map(([clave, v]) => ({ clave, usuario: v.usuario }));
      Object.assign(resultado, { correcta: actual.correcta, dato: actual.dato, acertaron });
    }
    actual = null;
    cerradaEn = Date.now();
    clearTimeout(fin);
    alCambiar({ ...resultado, activa: false, terminada: true });
    alTerminar(resultado);
  }

  // ¿El comentario es una respuesta? Devuelve 'voto' si se contó, 'repetido' si ya había respondido (trivia),
  // 'tarde' si es un número que llegó justo después del cierre, o false si no es una respuesta (va a la IA)
  function votar(clave, texto, usuario = clave) {
    const enCurso = actual ?? pendiente; // también vale responder mientras Doña Chabela la está anunciando
    if (!enCurso) return /^\s*[1-9]\s*$/.test(String(texto)) && Date.now() - cerradaEn < 20000 ? 'tarde' : false;
    if (!clave) return false;
    const t = normal(texto);
    const i = /^[1-9]$/.test(t) ? Number(t) - 1 : enCurso.opciones.findIndex((o) => normal(o) === t);
    if (i < 0 || i >= enCurso.opciones.length) return false;
    const votos = actual ? actual.votos : adelantados;
    if (enCurso.modo === 'trivia' && votos.has(clave)) return 'repetido'; // en la trivia vale la primera respuesta
    votos.set(clave, { i, usuario, t: Date.now() });
    if (actual) alCambiar(estado());
    return 'voto';
  }

  return { preparar, abrir, votar, activa: () => !!actual, ocupada: () => !!(actual || pendiente) };
}
