// Punto de arranque: solo crea las piezas y las conecta entre sí.
// Para cambiar un proveedor (otra IA, otra voz, otra plataforma) se cambia aquí.
import { config, validarConfig } from './config.js';
import { crearCola } from './nucleo/cola.js';
import { crearPipeline } from './nucleo/pipeline.js';
import { crearFiltro, respuestaSegura } from './nucleo/filtro.js';
import { pedirTaps, pedirCompartir, anunciarRanking, pedidoListo, claveDe, silencio, metaCumplida, encuestaInicio, encuestaFin, dibujoInicio, dibujoFin } from './nucleo/eventos.js';
import { crearDibujos } from './nucleo/dibujos.js';
import { generarMomentos } from './salidas/momentos.js';
import { crearEncuestas } from './nucleo/encuestas.js';
import { TRIVIA } from './nucleo/trivia-preguntas.js';
import { crearMemoria } from './servicios/memoria.js';
import { crearCocina } from './nucleo/cocina.js';
import { crearRanking } from './nucleo/ranking.js';
import { crearRegistro } from './salidas/registro.js';
import { crearCerebroClaude } from './servicios/cerebro-claude.js';
import { crearCerebroOpenRouter } from './servicios/cerebro-openrouter.js';
import { crearCerebroGemini } from './servicios/cerebro-gemini.js';
import { crearCerebroFalso } from './servicios/cerebro-falso.js';
import { crearVozOpenRouter } from './servicios/voz-openrouter.js';
import { crearVozElevenLabs } from './servicios/voz-elevenlabs.js';
import { crearVozNavegador } from './servicios/voz-navegador.js';
import { crearVozConCache } from './servicios/voz-cache.js';
import { crearOverlay } from './salidas/overlay-ws.js';
import { datosPublicos } from './servicios/personaje.js';
import { conectarTikTok } from './entradas/tiktok.js';
import { iniciarSimulador } from './entradas/simulador.js';

// Pase lo que pase, el LIVE no se cae: los errores inesperados se avisan en consola y el programa sigue
process.on('uncaughtException', (e) => console.error('[error inesperado]', e?.stack ?? e));
process.on('unhandledRejection', (e) => console.error('[promesa sin manejar]', e?.stack ?? e));

async function main() {
  validarConfig(config);

  // Servicios
  let cerebro;
  if (config.openrouter.apiKey) {
    console.log(`[cerebro] Usando OpenRouter (${config.openrouter.modelo})`);
    cerebro = crearCerebroOpenRouter(config.openrouter);
  } else if (config.gemini.apiKey) {
    console.log(`[cerebro] Usando Gemini (${config.gemini.modelo})`);
    cerebro = crearCerebroGemini(config.gemini);
  } else if (config.claude.apiKey) {
    console.log(`[cerebro] Usando Claude (${config.claude.modelo})`);
    cerebro = crearCerebroClaude(config.claude);
  } else {
    console.log('[cerebro] Sin API key de IA: usando respuestas de prueba');
    cerebro = crearCerebroFalso();
  }
  let voz;
  if (config.openrouter.apiKey && config.openrouter.vozModelo) {
    console.log(`[voz] Usando OpenRouter (${config.openrouter.vozModelo})`);
    voz = crearVozOpenRouter({ apiKey: config.openrouter.apiKey, modelo: config.openrouter.vozModelo, voz: config.openrouter.voz, respaldo: config.openrouter.vozRespaldo });
  } else if (config.voz.apiKey && config.voz.vozId) {
    console.log('[voz] Usando ElevenLabs');
    voz = crearVozElevenLabs(config.voz);
  } else {
    console.log('[voz] Usando la voz del navegador');
    voz = crearVozNavegador();
  }
  // La misma frase con la misma voz no se paga dos veces (la firma cambia si cambias de modelo o de voz)
  if (config.ahorro.cacheVoz) {
    voz = crearVozConCache(voz, { carpeta: config.ahorro.carpetaCache, firma: [config.openrouter.vozModelo, config.openrouter.voz].join('|') });
  }
  console.log(`[voz] Ahorro: respuestas de máx. ${config.ahorro.maxPalabras} palabras, frases fijas ${config.ahorro.frasesFijas ? 'sí' : 'no'}, caché ${config.ahorro.cacheVoz ? 'sí' : 'no'}`);

  // Salida
  const overlay = crearOverlay({ ...config.overlay, musica: config.musica, escena: { baileSiempre: config.cola.baileSiempre, liviano: config.cola.modoLiviano, cliente: datosPublicos() } });
  console.log(`[cliente] ${config.cliente.datos.nombreAvatar} · ${config.cliente.datos.marca} (clientes/${config.cliente.id})`);
  await overlay.iniciar();

  // Núcleo
  const registro = crearRegistro({ carpeta: config.registro.carpeta });
  const memoria = config.memoria.activa ? crearMemoria({ archivo: config.memoria.archivo }) : null;
  if (memoria) console.log('[memoria] Recordando caseritos en', config.memoria.archivo);
  // ¿LIVE nuevo o reinicio a mitad del LIVE? Si la última actividad fue hace rato, todo empieza en cero
  const ultimaActividad = memoria?.ultimaActividad() ?? 0;
  if (ultimaActividad && Date.now() - ultimaActividad > config.memoria.nuevoLiveHoras * 3600000) {
    const respaldo = memoria.empezarDeCero(config.memoria.respaldos);
    console.log(`[memoria] LIVE nuevo: todo empieza en cero (lo último fue hace ${Math.round((Date.now() - ultimaActividad) / 3600000)} h). Copia del LIVE anterior: ${respaldo}`);
  }
  let alEvento = () => {}; // se define más abajo; la cocina lo usa para avisar los pedidos listos
  const cocina = config.pedidos.activo
    ? crearCocina({
        memoria,
        minMinutos: config.pedidos.minMinutos,
        maxMinutos: config.pedidos.maxMinutos,
        alCambiar: (lista) => overlay.emitir({ tipo: 'comandas', ahora: Date.now(), lista }),
        alListo: ({ usuario, plato }) => alEvento(pedidoListo(usuario, plato)),
      })
    : null;
  const procesarIA = crearPipeline({ cerebro, voz, salida: overlay, esSegura: respuestaSegura, registro, memoria, cocina, frasesFijas: config.ahorro.frasesFijas });
  let ultimoComentario = Date.now(), ultimaVezHablo = Date.now(); // para detectar silencios
  const procesar = async (ev) => {
    try { await procesarIA(ev); } finally {
      ultimaVezHablo = Date.now();
      // La encuesta aparece en pantalla 3 segundos después de que Doña Chabela termina de anunciarla
      if (ev.tipo === 'encuesta_inicio') setTimeout(() => encuestas.abrir(), 3000);
      if (ev.tipo === 'dibujo_inicio') setTimeout(() => dibujos.abrir(), 1500); // la pizarra aparece y empieza a dibujar
    }
  };
  // Con la fila cargada, seguidores/entradas/compartidos se reconocen solo en pantalla (sin voz)
  const reconocer = (r) => overlay.emitir({ tipo: 'reconocer', evento: r.tipo, usuario: r.usuario, cantidad: r.cantidad });
  // ¿Poco movimiento? Menos de N comentarios en los últimos 2 minutos: los saludos pasan a ser personales y rápidos
  const comentariosRecientes = [];
  const hayPocoMovimiento = () => {
    const desde = Date.now() - 120000;
    while (comentariosRecientes.length && comentariosRecientes[0] < desde) comentariosRecientes.shift();
    return comentariosRecientes.length < config.cola.pocoMovimiento;
  };
  const cola = crearCola({ procesar, reconocer, hayPocoMovimiento, ...config.cola });

  const puntosGuardados = memoria?.cargarPuntos() ?? []; // si reiniciaste a mitad del LIVE (si es LIVE nuevo, ya se vació arriba)
  const ranking = crearRanking({
    tapsPorPunto: config.puntos.tapsPorPunto,
    inicial: puntosGuardados, // si reiniciaste a mitad del LIVE, se recuperan
    alGuardar: (lista) => memoria?.guardarPuntos(lista),
    alCambiar: (top) => overlay.emitir({ tipo: 'ranking', top }),
  });
  if (ranking.top().length) {
    overlay.emitir({ tipo: 'ranking', top: ranking.top() });
    console.log(`[ranking] Puntos recuperados. Va primero ${ranking.top()[0].usuario} con ${ranking.top()[0].puntos}`);
  }
  // Al cerrar con Ctrl+C: se guardan los últimos puntos y se arma el .md con los mejores momentos del LIVE
  process.once('SIGINT', () => {
    ranking.guardar();
    try {
      const archivo = generarMomentos({ carpeta: config.registro.carpeta });
      if (archivo) console.log(`\n[momentos] Mejores momentos del LIVE guardados en ${archivo}`);
    } catch (e) { console.error('[momentos] No se pudieron armar:', e.message); }
    process.exit(0);
  });

  // Meta de tap tap: barra en pantalla; al llegar, Doña Chabela baila y sube la meta
  let likesDelLive = 0, metaLikes = config.retencion.metaLikes, avisoMeta = null;
  const emitirMeta = () => overlay.emitir({ tipo: 'meta', actual: likesDelLive, objetivo: metaLikes });
  function sumarLikes(cantidad) {
    if (config.retencion.metaLikes <= 0) return;
    likesDelLive += cantidad;
    if (likesDelLive >= metaLikes) {
      const cumplida = metaLikes;
      metaLikes += config.retencion.metaLikes;
      alEvento(metaCumplida(cumplida, metaLikes));
    }
    clearTimeout(avisoMeta);
    avisoMeta = setTimeout(emitirMeta, 800); // la barra no necesita actualizarse con cada like
  }
  if (config.retencion.metaLikes > 0) emitirMeta();

  // Trivia: alterna fácil, intermedio y difícil, y Perú / general (mitad y mitad), sin repetir preguntas entre LIVEs
  const triviaUsadas = memoria ? memoria.triviaUsadas() : new Set();
  const NIVELES = ['facil', 'intermedio', 'dificil'];
  let pasoTrivia = 0;
  function elegirTrivia(pedida = null) { // pedida: la dificultad que pidió el chat (si pidió)
    const d = NIVELES.includes(pedida) ? pedida : NIVELES[pasoTrivia % 3], peru = pasoTrivia % 2 === 0;
    pasoTrivia++;
    const libres = TRIVIA.filter((q) => !triviaUsadas.has(q.id));
    if (!libres.length) { triviaUsadas.clear(); memoria?.reiniciarTrivia(); } // salieron todas: empezar de nuevo
    const pool = libres.length ? libres : TRIVIA;
    const candidatas = [pool.filter((q) => q.d === d && q.peru === peru), pool.filter((q) => q.d === d), pool].find((l) => l.length);
    const q = candidatas[Math.floor(Math.random() * candidatas.length)];
    triviaUsadas.add(q.id);
    memoria?.marcarTrivia(q.id);
    return q;
  }

  // Avisos en consola (útiles en el simulador, donde no se ve el contador del overlay)
  let encuestaAnunciada = null, avisoFinal = null;
  function avisarEnConsola(e) {
    if (e.terminada) { clearTimeout(avisoFinal); encuestaAnunciada = null; return console.log(`[${e.modo}] Cerrada: ${e.pregunta} (${e.total} ${e.total === 1 ? 'respuesta' : 'respuestas'})`); }
    if (encuestaAnunciada === e.terminaEn) return; // ya se avisó que estaba abierta
    encuestaAnunciada = e.terminaEn;
    const segundos = Math.round((e.terminaEn - Date.now()) / 1000);
    console.log(`[${e.modo}] En pantalla: ${e.pregunta} — ${e.opciones.map((o, i) => `${i + 1}) ${o.texto}`).join('  ')} — tienen ${segundos} s`);
    clearTimeout(avisoFinal);
    if (segundos > 12) avisoFinal = setTimeout(() => console.log(`[${e.modo}] ¡Quedan 10 segundos!`), (segundos - 10) * 1000);
  }

  // Puntos del podio: 1.º todo, 2.º el 60 %, 3.º el 40 %; los demás que aciertan, "resto"
  const porPuesto = (primero, resto) => (i) => (i === 0 ? primero : i === 1 ? Math.round(primero * 0.6) : i === 2 ? Math.round(primero * 0.4) : resto);

  // Encuestas y trivias: se responden escribiendo el número en el chat
  const encuestas = crearEncuestas({
    duracionTriviaMs: config.retencion.triviaSegundos * 1000,
    elegirTrivia,
    duracionMs: config.retencion.encuestaSegundos * 1000,
    alCambiar: (estado) => {
      overlay.emitir({ tipo: 'encuesta', ahora: Date.now(), ...estado });
      avisarEnConsola(estado);
    },
    alTerminar: (resultado) => {
      // Trivia: podio de 3 por orden de llegada (el 1.º según la dificultad); los demás que aciertan, un poquito
      if (resultado.modo === 'trivia') {
        const puntos = porPuesto(config.puntos.trivia[resultado.dificultad] ?? 5, config.puntos.trivia.acierto);
        resultado.acertaron.forEach((a, i) => ranking.sumar(a.clave, a.usuario, puntos(i)));
        if (resultado.acertaron.length) console.log(`[trivia] Podio: ${resultado.acertaron.slice(0, 3).map((a, i) => `${i + 1}.º ${a.usuario} (+${puntos(i)})`).join(', ')}${resultado.acertaron.length > 3 ? ` y ${resultado.acertaron.length - 3} más` : ''}`);
      }
      alEvento(encuestaFin(resultado));
    },
  });
  // La tía dibuja: un dibujo se traza solo y el chat adivina escribiendo la palabra
  const usadas = memoria ? memoria.triviaUsadas() : new Set(); // misma tabla que la trivia (id "dib-...")
  const dibujos = crearDibujos({
    duracionMs: config.retencion.dibujoSegundos * 1000,
    puntosPorPuesto: porPuesto(config.puntos.dibujo.max, config.puntos.dibujo.resto),
    usadas: new Set([...usadas].filter((id) => id.startsWith('dib-'))),
    alUsar: (id) => memoria?.marcarTrivia(id),
    alReiniciar: () => memoria?.reiniciarDibujos(),
    alCambiar: (estado) => overlay.emitir({ tipo: 'dibujo', ahora: Date.now(), ...estado }),
    alTerminar: (r) => {
      r.acertaron.forEach((a) => ranking.sumar(a.clave, a.usuario, a.puntos));
      const podio = r.acertaron.slice(0, 3).map((a) => `${a.puesto}.º ${a.usuario} (${a.segundos} s, +${a.puntos})`).join(', ');
      console.log(`[dibujo] Era "${r.respuesta}": ${podio ? `podio ${podio}${r.acertaron.length > 3 ? ` y ${r.acertaron.length - 3} más` : ''}` : 'nadie adivinó'} (${r.intentos} intentos)`);
      alEvento(dibujoFin(r));
    },
  });
  const juegoOcupado = () => encuestas.ocupada() || dibujos.ocupado(); // un juego a la vez
  const iniciarDibujo = (pidio = null) => {
    if (juegoOcupado()) return false;
    const d = dibujos.preparar(pidio); // primero lo anuncia; la pizarra sale al terminar de hablar (ver procesar)
    if (!d) return false;
    console.log(`[dibujo] La tía va a dibujar algo de ${d.letras} letras${pidio ? ` (lo pidió ${pidio})` : ''}`);
    cola.encolar(dibujoInicio(d));
    return true;
  };
  const iniciarEncuesta = (tipo = 'encuesta', pidio = null, dificultad = null) => {
    if (dibujos.ocupado()) return false;
    const e = encuestas.preparar(tipo, { dificultad }); // primero la anuncia; se abre al terminar de hablar (ver procesar)
    if (!e) return false;
    if (pidio) e.pidio = pidio;
    cola.encolar(encuestaInicio(e));
    return true;
  };

  // Comandos del chat: "trivia", "encuesta", "dibujo", "pregunta" o "jugar" (con o sin ! o /, solos en el mensaje)
  const COMANDO = /^\s*[!/]?\s*(trivia|encuesta|pregunta|jugar|juego|dibujo|dibuja|dibujar|adivina)\s*[!.]*\s*$/i;
  let ultimoJuego = -Infinity;
  // También dentro de una frase: "tía, quiero trivia nivel intermedio", "juguemos trivia", "otra encuesta pe"
  const sinTildes = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const JUEGO_EN_FRASE = /\b(trivias?|encuestas?|dibujos?|dibuja|dibujar|dibujame)\b/;
  const PIDE = /\b(quiero|queremos|quisiera|juguemos|jugar|jugamos|juega|pon|ponme|pone|ponga|lanza|lanzame|otra|otro|dame|danos|haz|hazme|hagamos|saca|sacame|mas|una|un|vamos|dale|manda|mandame)\b/;
  function juegoPedido(texto) {
    if (!config.juegos) return null; // sin juegos: "trivia", "dibujo"... van a la IA como cualquier comentario
    const solo = texto.match(COMANDO)?.[1]?.toLowerCase();
    if (solo) return { comando: solo };
    const t = sinTildes(texto);
    const juego = t.match(JUEGO_EN_FRASE)?.[1];
    // Frase corta y con ganas de jugar ("la trivia estuvo difícil" no lanza nada)
    if (!juego || t.split(/\s+/).length > 12 || !PIDE.test(t)) return null;
    const dificultad = /\bfacil|\bsencill|\bsuave/.test(t) ? 'facil' : /intermedi|\bmedia\b|\bmedio\b|\bnormal/.test(t) ? 'intermedio'
      : /dificil|\bdura\b|\bheavy|\bbrava|cabezon|\bpro\b/.test(t) ? 'dificil' : null;
    return { comando: juego.startsWith('trivia') ? 'trivia' : juego.startsWith('encuesta') ? 'encuesta' : 'dibujo', dificultad };
  }

  // "¿cómo va el ranking?", "¿cuántos puntos tengo?", "¿quién va primero?", "¿en qué puesto estoy?"
  const PREGUNTA_RANKING = /\b(ranking|rankin|ranquin|tabla|puntos|puntaje|top ?\d?|primer puesto|en que puesto|mi puesto|quien va (primero|ganando)|quien gana|quien lidera)\b/;
  let ultimaTablaPedida = 0;
  // Qué cuenta como pregunta en el modo bot de voz: signo de pregunta o palabras de consulta o de compra
  const ES_PREGUNTA = /\?|\b(cu[aá]nto|c[oó]mo|qu[eé]|cu[aá]l|d[oó]nde|cu[aá]ndo|precio|cuesta|vale|costo|tienen|tiene|hay|garant[ií]a|incluye|seguidores|monetiz|pago|pagar|comprar|compro|info|informaci[oó]n|interesa|quiero|nicho|asesor[ií]a)/i;

  function pedirJuego(comando, quien, dificultad = null) {
    const espera = config.retencion.juegoCooldownSegundos * 1000 - (Date.now() - ultimoJuego);
    if (juegoOcupado()) return console.log(`[juego] ${quien} pidió ${comando}, pero ya hay un juego en curso`);
    if (espera > 0) return console.log(`[juego] ${quien} pidió ${comando}: faltan ${Math.ceil(espera / 1000)} s para la siguiente`);
    const azar = Math.random();
    const tipo = comando === 'trivia' ? 'trivia' : comando === 'encuesta' ? 'encuesta' : /^dibuj|^adivina/.test(comando) ? 'dibujo'
      : azar < 0.45 ? 'trivia' : azar < 0.75 ? 'dibujo' : 'encuesta'; // "jugar": cualquiera
    if (dificultad && tipo === 'trivia') console.log(`[juego] ${quien} pidió trivia ${dificultad}`);
    if (tipo === 'dibujo' ? iniciarDibujo(quien) : iniciarEncuesta(tipo, quien, dificultad)) ultimoJuego = Date.now();
  }

  // Moderación antes de la cola: datos personales, insultos y spam se ignoran sin mostrarse
  const filtro = crearFiltro({ cuentaPropia: config.tiktok.usuario, chismeCadaMs: config.cola.chismeCadaMs });
  let seguidoresNuevos = 0;
  const ultimoPuntoComentario = new Map();
  const alEventoSinProteger = (ev) => {
    if (ev.tipo === 'pedir-encuesta') return iniciarEncuesta(); // pedido manual del simulador
    if (ev.tipo === 'pedir-trivia') return iniciarEncuesta('trivia'); // pedido manual del simulador
    if (ev.tipo === 'pedir-dibujo') return iniciarDibujo(); // pedido manual del simulador
    if (ev.tipo === 'pedir-meta') return sumarLikes(Math.max(1, metaLikes - likesDelLive)); // simulador: llena la barra hasta la meta y celebra
    if (ev.tipo === 'pedir-ranking') { // pedido manual del simulador
      const top = ranking.top();
      return top.length ? cola.encolar(anunciarRanking(top)) : console.log('[ranking] Aún nadie ha comentado');
    }
    const motivo = filtro.revisar(ev);
    if (motivo) return console.log(`[filtrado: ${motivo}] ${ev.usuario}`); // sin el texto: no se repite lo filtrado
    // El contador y la campanita van al instante; la bienvenida hablada entra a la cola
    if (ev.tipo === 'seguir') overlay.emitir({ tipo: 'contador', seguidores: ++seguidoresNuevos });
    // Puntos del ranking: comentarios, regalos (más si valen más diamantes), compartir y tap tap
    const p = config.puntos;
    // Un punto por comentario, pero como mucho uno cada 10 s por persona (que mandar "1" mil veces no llene el ranking)
    if (ev.tipo === 'chat' && Date.now() - (ultimoPuntoComentario.get(claveDe(ev)) ?? 0) >= 10000) {
      ultimoPuntoComentario.set(claveDe(ev), Date.now());
      if (ultimoPuntoComentario.size > 5000) ultimoPuntoComentario.clear();
      ranking.sumar(claveDe(ev), ev.usuario, p.comentario);
    }
    if (ev.tipo === 'chat') { ultimoComentario = Date.now(); comentariosRecientes.push(ultimoComentario); }
    // Comando para jugar: se lanza la pregunta y el comando no se manda a la IA
    const pedido = ev.tipo === 'chat' && juegoPedido(ev.texto);
    const comando = pedido?.comando;
    if (comando) {
      memoria?.verA(claveDe(ev), { nombre: ev.usuario, comento: true });
      return pedirJuego(comando, ev.usuario, pedido.dificultad);
    }
    // La tía dibuja: los mensajes cortos son intentos de adivinar y no se mandan a la IA
    const intento = ev.tipo === 'chat' && dibujos.adivinar(claveDe(ev), ev.texto, ev.usuario);
    if (intento) {
      if (intento === 'intento') console.log(`[dibujo] ${ev.usuario}: ${ev.texto.trim()} ✗`);
      if (intento === 'acerto') console.log(`[dibujo] ${ev.usuario} adivinó ✓ (se revela al final)`);
      memoria?.verA(claveDe(ev), { nombre: ev.usuario, comento: true });
      return;
    }
    // Si es un voto de la encuesta, se cuenta y no se manda a la IA
    const voto = ev.tipo === 'chat' && encuestas.votar(claveDe(ev), ev.texto, ev.usuario);
    if (voto) {
      if (voto === 'voto') console.log(`[voto] ${ev.usuario} → ${ev.texto.trim()}`);
      if (voto === 'repetido') console.log(`[voto] ${ev.usuario} ya había respondido (en la trivia vale la primera)`);
      if (voto === 'tarde') console.log(`[voto] ${ev.usuario} votó tarde: la pregunta ya se había cerrado`);
      memoria?.verA(claveDe(ev), { nombre: ev.usuario, comento: true });
      return;
    }
    if (ev.tipo === 'regalo') ranking.sumar(claveDe(ev), ev.usuario, (p.regalo + (p.porDiamante ? ev.diamantes : 0)) * ev.cantidad);
    if (ev.tipo === 'compartio') ranking.sumar(claveDe(ev), ev.usuario, p.compartir);
    if (ev.tipo === 'likes' && config.simular) sumarLikes(ev.cantidad); // en TikTok la barra ya suma cada tap: no contar doble
    if (ev.tipo === 'tap') { sumarLikes(ev.cantidad); return ranking.sumarTaps(claveDe(ev), ev.usuario, ev.cantidad); } // no se responde
    if (ev.tipo === 'chat' && PREGUNTA_RANKING.test(sinTildes(ev.texto))) {
      ev.ranking = { top: ranking.top(), mio: ranking.posicion(claveDe(ev)) }; // para que responda con los puntos reales
      if (ev.ranking.top.length && Date.now() - ultimaTablaPedida > 15000) {
        ultimaTablaPedida = Date.now();
        overlay.emitir({ tipo: 'mostrar-ranking' }); // la tabla sale al toque, sin esperar a que ella hable
      }
    }
    // Modo bot de voz: solo responde preguntas del chat (nada de saludos, agradecimientos ni relleno)
    if (config.soloPreguntas && (ev.tipo !== 'chat' || !ES_PREGUNTA.test(ev.texto))) return;
    memoria?.verA(claveDe(ev), { nombre: ev.usuario, comento: ev.tipo === 'chat' }); // para recordarlo en próximos LIVEs
    cola.encolar(ev);
  };

  alEvento = (ev) => {
    try { return alEventoSinProteger(ev); } catch (e) { console.error(`[evento] Error con ${ev?.tipo} de ${ev?.usuario}:`, e.message); }
  };

  // Antisilencio: si el chat y Doña Chabela llevan rato callados, ella pregunta, cuenta un chisme o un chiste
  const IDEAS_SILENCIO = {
    consejo: config.cliente.datos.consejos ?? [],
    preguntaCliente: config.cliente.datos.preguntasAlPublico ?? [],
    pregunta: ['¿desde qué distrito o ciudad nos ven?', '¿qué cenaron hoy?', '¿cuál es su peor roche?', '¿quién está chambeando y quién se hace el que estudia?',
      '¿cuál es la mejor crema: ají, huancaína, mayonesa u ocopa?', '¿qué es lo primero que piden en una pollería?', '¿quién se ha comido un pollo entero solo?',
      '¿cuál es la excusa más floro que han dado para llegar tarde?', '¿quién de aquí es el más codo de su grupo?'],
    chisme: ['la vecina del segundo piso y el señor del gas', 'el sereno que se queda dormido en su caseta', 'la tía que vende emoliente en la esquina',
      'el chibolo que dice que va a la academia pero se va a la cabina', 'don Lucho de la bodega y su nueva balanza', 'la pollada misteriosa del sábado'],
    juego: ['trivia', 'encuesta', 'dibujo'],
    chiste: ['un pollo que quería ser influencer', 'la combi que nunca se llena', 'el cliente que pide yapa de la yapa', 'un cuy que fue a la academia',
      'la balanza de la bodega', 'el que dice ya estoy llegando'],
  };
  let rondaSilencio = 0;
  if (config.retencion.silencioSegundos > 0) {
    setInterval(() => {
      const ahora = Date.now(), espera = config.retencion.silencioSegundos * 1000;
      if (ahora - ultimoComentario < espera || ahora - ultimaVezHablo < espera * 0.6 || cola.tamano() > 0) return;
      if (juegoOcupado()) return; // ya hay un juego en pantalla: no se interrumpe
      // En vez de hablar sola, la mayoría de veces lanza un juego: el que entra ve la pizarra o la trivia y se queda.
      // Cada tanto, un chiste o chisme para variar
      if (config.retencion.juegosEnSilencio) {
        const turno = ['dibujo', 'trivia', 'dibujo', 'trivia', 'charla'][rondaSilencio++ % 5];
        if (turno !== 'charla') {
          ultimoComentario = ahora;
          const salio = turno === 'dibujo' ? iniciarDibujo() : iniciarEncuesta('trivia');
          if (salio) { ultimoJuego = ahora; console.log(`[silencio] Chat callado: la tía lanza ${turno === 'dibujo' ? 'un dibujo' : 'una trivia'}`); return; }
        }
      }
      // Sin juegos: alterna un consejo útil (lo que hace quedarse a la gente) y una pregunta al público
      const modos = config.juegos ? (config.retencion.juegosEnSilencio ? ['chisme', 'chiste', 'pregunta'] : ['pregunta', 'pregunta', 'chisme', 'chiste', 'juego']) : ['consejo', 'consejo', 'preguntaCliente'];
      const modo = modos[Math.floor(Math.random() * modos.length)];
      const ideas = IDEAS_SILENCIO[modo];
      ultimoComentario = ahora; // para no repetirlo hasta el próximo silencio
      if (!ideas.length) return;
      cola.encolar(silencio(modo === 'preguntaCliente' ? 'pregunta' : modo, ideas[Math.floor(Math.random() * ideas.length)]));
    }, 5000);
  }

  // Encuesta y trivia cada N minutos (si una sigue en curso, la otra espera a la siguiente vuelta)
  if (config.retencion.encuestaCadaMinutos > 0) {
    setInterval(() => iniciarEncuesta('encuesta'), config.retencion.encuestaCadaMinutos * 60000);
  }
  if (config.retencion.triviaCadaMinutos > 0) {
    setInterval(() => iniciarEncuesta('trivia'), config.retencion.triviaCadaMinutos * 60000);
  }
  if (config.retencion.dibujoCadaMinutos > 0) {
    setInterval(() => iniciarDibujo(), config.retencion.dibujoCadaMinutos * 60000);
  }

  // Cada N minutos, show de personajes bailando (aunque nadie regale nada)
  if (config.cola.showCadaMinutos > 0) {
    setInterval(() => overlay.emitir({ tipo: 'show' }), config.cola.showCadaMinutos * 60000);
  }

  // Cada N minutos pide que compartan el LIVE
  if (config.cola.compartirCadaMinutos > 0) {
    setInterval(() => alEvento(pedirCompartir()), config.cola.compartirCadaMinutos * 60000);
  }

  // Cada N minutos anuncia el ranking de caseritos (si ya hay al menos dos personas comentando)
  if (config.cola.rankingCadaMinutos > 0) {
    setInterval(() => {
      const top = ranking.top();
      if (top.length >= 2) cola.encolar(anunciarRanking(top));
    }, config.cola.rankingCadaMinutos * 60000);
  }

  // Cada N minutos pide tap tap a la pantalla
  if (config.cola.pedirTapsMinutos > 0) {
    setInterval(() => alEvento(pedirTaps()), config.cola.pedirTapsMinutos * 60000);
    console.log(`[taps] Pedirá tap tap cada ${config.cola.pedirTapsMinutos} min`);
  }

  // Entrada
  if (config.simular) {
    iniciarSimulador({ alEvento });
  } else {
    await conectarTikTok({
      usuario: config.tiktok.usuario,
      signApiKey: config.tiktok.signApiKey,
      alEvento,
      likesParaReaccion: config.cola.likesParaReaccion,
    }).catch((e) => {
      console.error('[tiktok] No se pudo conectar:', e.message);
      console.error('¿La cuenta está en vivo ahora mismo? Prueba sin TikTok con: npm run simular');
    });
  }
}

main().catch((e) => {
  console.error('Error al iniciar:', e.message);
  process.exit(1);
});
