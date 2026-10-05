// Único lugar donde se lee el .env. El resto del código recibe la config ya armada.
// Cada cliente tiene su carpeta en clientes/<id>: su personaje, sus preguntas frecuentes, sus videos y su propio .env
// (con SUS claves de IA y voz). Se elige con --cliente=<id> (o CLIENTE en el .env); si no, el primero que haya.
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.join(import.meta.dirname, '..');
const CLIENTES = path.join(RAIZ, 'clientes');
const pedido = process.argv.find((a) => a.startsWith('--cliente='))?.split('=')[1];
const idCliente = pedido || process.env.CLIENTE || fs.readdirSync(CLIENTES).filter((d) => !d.startsWith('_') && fs.existsSync(path.join(CLIENTES, d, 'cliente.json')))[0];
const carpetaCliente = path.join(CLIENTES, idCliente ?? '');
if (!idCliente || !fs.existsSync(path.join(carpetaCliente, 'cliente.json'))) {
  console.error(`[config] No encontré el cliente "${idCliente}". Crea su carpeta en clientes/ (copia clientes/_plantilla).`);
  process.exit(1);
}
// Primero el .env del cliente (sus claves mandan); lo que falte, del .env general
dotenv.config({ path: path.join(carpetaCliente, '.env') });
dotenv.config({ path: path.join(RAIZ, '.env') });
const SIM = process.argv.includes('--simular');

// Lee un número del .env. Tolera errores de tipeo ("60)" → 60) y si no hay número usa el valor por defecto
const num = (v, def) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  if (Number.isFinite(n)) return n;
  if (v !== undefined && v !== '') console.warn(`[config] Valor inválido en el .env: "${v}". Se usa ${def}.`);
  return def;
};

export const config = {
  simular: SIM,

  cliente: {
    id: idCliente,
    carpeta: carpetaCliente,
    datos: JSON.parse(fs.readFileSync(path.join(carpetaCliente, 'cliente.json'), 'utf8')),
  },
  soloPreguntas: (process.env.SOLO_PREGUNTAS ?? 'false').toLowerCase() === 'true', // bot de voz: solo contesta preguntas del chat
  juegos: (process.env.JUEGOS ?? 'false').toLowerCase() === 'true', // trivia/dibujo/encuestas (de la versión broastería): apagados

  tiktok: {
    usuario: process.env.TIKTOK_USUARIO,
    signApiKey: process.env.EULER_API_KEY, // opcional: clave de eulerstream.com si TikTok rechaza la conexión
  },

  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    modelo: process.env.CLAUDE_MODELO || 'claude-haiku-4-5-20251001',
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    modelo: process.env.OPENROUTER_MODELO || 'openai/gpt-5.6-luna',
    // Voz (texto a voz). Si OPENROUTER_VOZ_MODELO está vacío, no se usa OpenRouter para la voz.
    vozModelo: process.env.OPENROUTER_VOZ_MODELO,
    voz: process.env.OPENROUTER_VOZ,
    // Texto a voz puro que se usa si el modelo de chat con audio no lee bien el texto
    vozRespaldo: process.env.OPENROUTER_VOZ_RESPALDO ?? 'fish-audio/s2.1-pro-free:free',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    modelo: process.env.GEMINI_MODELO || 'gemini-2.5-flash',
  },

  voz: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    vozId: process.env.ELEVENLABS_VOICE_ID,
    modelo: process.env.ELEVENLABS_MODELO || 'eleven_multilingual_v2',
  },

  cola: {
    cooldownMs: num(process.env.COOLDOWN_USUARIO, 20) * 1000,
    maxCola: num(process.env.MAX_COLA, 5),
    caducidadMs: num(process.env.CADUCIDAD_SEGUNDOS, 30) * 1000,
    maxPorMinuto: num(process.env.MAX_RESPUESTAS_MINUTO, 8), // 0 = sin tope
    likesParaReaccion: num(process.env.LIKES_PARA_REACCION, 300),
    pedirTapsMinutos: num(process.env.PEDIR_TAPS_MINUTOS, 8), // 0 = no pedir
    chismeCadaMs: num(process.env.CHISME_CADA_SEGUNDOS, 120) * 1000,
    saludoCadaMs: num(process.env.SALUDO_CADA_SEGUNDOS, 45) * 1000, // saludo a los que entran; 0 = no saludar
    // Con poco movimiento (menos de pocoMovimiento comentarios en 2 min) se saluda a cada uno por su nombre, rápido
    saludoRapidoMs: num(process.env.SALUDO_RAPIDO_SEGUNDOS, 10) * 1000,
    pocoMovimiento: num(process.env.POCO_MOVIMIENTO_COMENTARIOS, 6),
    compartirCadaMinutos: num(process.env.COMPARTIR_CADA_MINUTOS, 10), // pedir que compartan el LIVE; 0 = nunca
    rankingCadaMinutos: num(process.env.RANKING_CADA_MINUTOS, 7), // anunciar el ranking de caseritos; 0 = nunca
    showCadaMinutos: num(process.env.SHOW_CADA_MINUTOS, 3), // cada cuánto cambia el grupo que baila (o sale un show); 0 = nunca
    baileSiempre: (process.env.BAILE_SIEMPRE ?? 'true').toLowerCase() !== 'false', // personajes bailando todo el tiempo
    // Modo liviano: menos efectos pesados en el overlay, para que la PC transmita en HD sin trabarse
    modoLiviano: (process.env.MODO_LIVIANO ?? 'false').toLowerCase() === 'true',
  },

  musica: {
    // Volumen de 0 a 1. La música de public/musica baja a volumenHablando mientras ella habla
    volumen: num(process.env.MUSICA_VOLUMEN, 0.25),
    volumenHablando: num(process.env.MUSICA_VOLUMEN_HABLANDO, 0.06),
  },

  retencion: {
    silencioSegundos: num(process.env.SILENCIO_SEGUNDOS, 45), // sin comentarios este tiempo: ella rompe el silencio; 0 = nunca
    juegosEnSilencio: (process.env.JUEGOS_EN_SILENCIO ?? 'false').toLowerCase() !== 'false', // en vez de hablar sola, lanza dibujo o trivia
    metaLikes: num(process.env.META_LIKES, 5000), // meta de tap tap (y de cuánto en cuánto sube); 0 = sin meta
    encuestaCadaMinutos: num(process.env.ENCUESTA_CADA_MINUTOS, 0), // automáticas; 0 = solo cuando el chat las pide
    encuestaSegundos: num(process.env.ENCUESTA_SEGUNDOS, 60), // cuánto dura cada encuesta
    triviaCadaMinutos: num(process.env.TRIVIA_CADA_MINUTOS, 0), // automáticas; 0 = solo cuando el chat la pide
    juegoCooldownSegundos: num(process.env.JUEGO_COOLDOWN_SEGUNDOS, 45), // espera mínima entre preguntas pedidas por el chat
    triviaSegundos: num(process.env.TRIVIA_SEGUNDOS, 30), // tiempo para responder
    dibujoSegundos: Math.max(20, num(process.env.DIBUJO_SEGUNDOS, 45)), // La tía dibuja: tiempo para adivinar
    dibujoCadaMinutos: num(process.env.DIBUJO_CADA_MINUTOS, 0), // automático; 0 = solo cuando el chat lo pide
  },

  puntos: {
    // Cuánto suma cada acción en el ranking de caseritos
    comentario: num(process.env.PUNTOS_COMENTARIO, 1),
    tapsPorPunto: Math.max(1, num(process.env.TAPS_POR_PUNTO, 20)),
    compartir: num(process.env.PUNTOS_COMPARTIR, 3),
    regalo: num(process.env.PUNTOS_REGALO, 10), // por cada regalo
    porDiamante: (process.env.PUNTOS_POR_DIAMANTE ?? 'true').toLowerCase() !== 'false', // + 1 por diamante que vale
    // Trivia: puntos para el primero que acierta según la dificultad, y para los demás que aciertan
    // La tía dibuja: el 1.º que adivina (2.º 60 %, 3.º 40 %); los demás que adivinan, "resto"
    dibujo: { max: num(process.env.PUNTOS_DIBUJO_MAX, 20), resto: num(process.env.PUNTOS_DIBUJO_RESTO, 2) },
    trivia: { facil: num(process.env.PUNTOS_TRIVIA_FACIL, 5), intermedio: num(process.env.PUNTOS_TRIVIA_INTERMEDIO, 10), dificil: num(process.env.PUNTOS_TRIVIA_DIFICIL, 20), acierto: num(process.env.PUNTOS_TRIVIA_ACIERTO, 2) },
  },

  // Ahorro de voz: con Gemini TTS se paga por segundo de audio
  ahorro: {
    maxPalabras: Math.max(8, num(process.env.MAX_PALABRAS, 15)), // largo máximo de cada respuesta
    frasesFijas: (process.env.FRASES_FIJAS ?? 'false').toLowerCase() !== 'false', // relleno con frases grabadas (sin IA)
    cacheVoz: (process.env.CACHE_VOZ ?? 'true').toLowerCase() !== 'false', // no volver a pagar la misma frase
    carpetaCache: path.join(import.meta.dirname, '..', 'datos', 'voz-cache'),
  },

  memoria: {
    activa: (process.env.MEMORIA ?? 'true').toLowerCase() !== 'false', // recordar caseritos entre LIVEs
    // El simulador usa su propia base: las pruebas no ensucian el ranking ni la memoria del LIVE real
    archivo: path.join(RAIZ, 'datos', SIM ? `${idCliente}-simulador.db` : `${idCliente}.db`), // una base por cliente
    // Cada LIVE nuevo empieza en cero (gente, mensajes, pedidos y puntos). Es LIVE nuevo si pasaron más de estas horas
    // desde la última actividad; si reinicias el programa a mitad del LIVE, no se borra nada
    nuevoLiveHoras: num(process.env.NUEVO_LIVE_HORAS ?? process.env.RANKING_NUEVO_LIVE_HORAS, 2),
    respaldos: path.join(RAIZ, 'datos', SIM ? `respaldos-${idCliente}-simulador` : `respaldos-${idCliente}`),
  },

  pedidos: {
    activo: (process.env.JUEGO_PEDIDOS ?? 'false').toLowerCase() !== 'false', // cocina de mentira con comandas
    minMinutos: num(process.env.PEDIDO_MINUTOS_MIN, 2),
    maxMinutos: Math.max(num(process.env.PEDIDO_MINUTOS_MIN, 2), num(process.env.PEDIDO_MINUTOS_MAX, 4)),
  },

  registro: {
    // CSV con cada batida, para sacar videos. El simulador escribe aparte: el registro del LIVE real queda limpio
    carpeta: path.join(RAIZ, 'registros', SIM ? `${idCliente}-simulador` : idCliente),
  },

  overlay: {
    puerto: num(process.env.PORT, 3000),
    // https para TikTok LIVE Studio (solo acepta enlaces https). El certificado vive en datos/certificado (no se sube a GitHub)
    puertoSeguro: num(process.env.PORT_HTTPS, 3443),
    certificado: {
      cert: path.join(RAIZ, 'datos', 'certificado', 'local.crt'),
      key: path.join(RAIZ, 'datos', 'certificado', 'local.key'),
    },
    archivo: path.join(RAIZ, 'public', 'avatar.html'),
    carpetaCliente: path.join(carpetaCliente, 'publico'), // videos e imágenes del cliente, servidos en /cliente/...
    // Página de voz que el cliente abre desde SU PC por el túnel (https://<túnel>/v/<clave>). Sin CLAVE_ACCESO no se abre
    publico: {
      puerto: num(process.env.PORT_PUBLICO, 3100),
      clave: process.env.CLAVE_ACCESO?.trim() || null,
      pagina: path.join(RAIZ, 'public', 'voz.html'),
    },
  },
};

export function validarConfig(cfg) {
  const faltan = [];
  // En simulación se permite sin key: se usa el cerebro falso
  const hayIA = cfg.openrouter.apiKey || cfg.gemini.apiKey || cfg.claude.apiKey;
  if (!hayIA && !cfg.simular) faltan.push('OPENROUTER_API_KEY, GEMINI_API_KEY o ANTHROPIC_API_KEY');
  if (!cfg.simular && !cfg.tiktok.usuario) faltan.push('TIKTOK_USUARIO');
  const clave = cfg.overlay.publico.clave;
  if (clave && !/^[A-Za-z0-9_-]{20,}$/.test(clave)) throw new Error('CLAVE_ACCESO debe tener al menos 20 letras, números, "-" o "_". Genera una con: npm run clave');
  if (faltan.length) throw new Error(`Faltan variables en .env: ${faltan.join(', ')}`);
}
