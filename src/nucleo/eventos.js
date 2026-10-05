// Formato común de eventos. Toda entrada (TikTok, simulador, YouTube...)
// debe convertir sus datos a estos objetos antes de pasarlos al núcleo.

export const TIPO = Object.freeze({
  CHAT: 'chat',
  REGALO: 'regalo',
  SEGUIR: 'seguir',
  LIKES: 'likes',
  TAPS: 'taps', // recordatorio automático para pedir tap tap
  UNIRSE: 'unirse', // alguien entró al LIVE
  COMPARTIR: 'compartir', // recordatorio automático para pedir que compartan el LIVE
  COMPARTIO: 'compartio', // alguien compartió el LIVE
  RANKING: 'ranking', // anuncio de cómo va el ranking de caseritos
  PEDIDO_LISTO: 'pedido_listo', // juego de pedidos: salió un pedido de la freidora
  AGRADECIMIENTOS: 'agradecimientos', // ronda: regalos + seguidores + compartidos en una sola frase
  TAP: 'tap', // tap tap de una persona: solo suma puntos al ranking, no se responde
  SILENCIO: 'silencio', // el chat lleva rato callado: pregunta, chisme o chiste
  META: 'meta', // el público llegó a la meta de tap tap
  ENCUESTA_INICIO: 'encuesta_inicio', // empieza una encuesta en pantalla
  ENCUESTA_FIN: 'encuesta_fin', // terminó la encuesta: anunciar el resultado
  DIBUJO_INICIO: 'dibujo_inicio', // "La tía dibuja": anuncia que va a dibujar
  DIBUJO_FIN: 'dibujo_fin', // "La tía dibuja": alguien adivinó (o nadie)
});

const limpiar = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export const chat = (usuario, texto, opciones = {}) => ({
  tipo: TIPO.CHAT,
  usuario: limpiar(usuario, 40) || 'alguien',
  texto: limpiar(texto, 200),
  sinCooldown: !!opciones.sinCooldown,
});

export const regalo = (usuario, nombreRegalo, cantidad = 1, diamantes = 0) => ({
  tipo: TIPO.REGALO,
  usuario: limpiar(usuario, 40) || 'alguien',
  regalo: limpiar(nombreRegalo, 40) || 'un regalo',
  cantidad: Math.max(1, Number(cantidad) || 1),
  diamantes: Math.max(0, Number(diamantes) || 0), // lo que vale cada uno en TikTok (para el ranking)
});

// Tap tap de una persona (TikTok los manda por persona): solo suma al ranking
export const tap = (usuario, cantidad = 1) => ({
  tipo: TIPO.TAP,
  usuario: limpiar(usuario, 40) || 'alguien',
  cantidad: Math.max(1, Number(cantidad) || 1),
});

export const seguir = (usuario) => ({
  tipo: TIPO.SEGUIR,
  usuario: limpiar(usuario, 40) || 'alguien',
});

export const likes = (cantidad) => ({
  tipo: TIPO.LIKES,
  usuario: 'el público',
  cantidad,
});

// Alguien entró al LIVE (la cola junta varios en un solo saludo)
export const unirse = (usuario) => ({
  tipo: TIPO.UNIRSE,
  usuario: limpiar(usuario, 40) || 'alguien',
});

// El chat está callado: Doña Chabela rompe el silencio (modo: pregunta, chisme o chiste; idea: para variar)
export const silencio = (modo, idea) => ({ tipo: TIPO.SILENCIO, usuario: 'el público', modo, idea });
// Se llegó a la meta de tap tap
export const metaCumplida = (meta, siguiente) => ({ tipo: TIPO.META, usuario: 'el público', meta, siguiente });
// Encuesta: inicio (pregunta y opciones) y fin (con votos)
export const encuestaInicio = (encuesta) => ({ tipo: TIPO.ENCUESTA_INICIO, usuario: 'el público', encuesta });
export const encuestaFin = (encuesta) => ({ tipo: TIPO.ENCUESTA_FIN, usuario: 'el público', encuesta });
// La tía dibuja: inicio (cuántas letras tiene, quién lo pidió) y fin (respuesta y ganador)
export const dibujoInicio = (dibujo) => ({ tipo: TIPO.DIBUJO_INICIO, usuario: 'el público', dibujo });
export const dibujoFin = (dibujo) => ({ tipo: TIPO.DIBUJO_FIN, usuario: dibujo.ganador?.usuario ?? 'el público', dibujo });

// Juego de pedidos: el pedido de alguien ya está listo
export const pedidoListo = (usuario, plato) => ({ tipo: TIPO.PEDIDO_LISTO, usuario, plato });

// Alguien compartió el LIVE (se agradece, agrupado como los seguidores)
export const compartio = (usuario) => ({
  tipo: TIPO.COMPARTIO,
  usuario: limpiar(usuario, 40) || 'alguien',
});

// Recordatorio periódico: pedir que compartan el LIVE
export const pedirCompartir = () => ({ tipo: TIPO.COMPARTIR, usuario: 'el público' });

// Anuncio periódico del ranking de caseritos (top = [{ usuario, n }])
export const anunciarRanking = (top) => ({ tipo: TIPO.RANKING, usuario: 'el público', top });

// Recordatorio periódico: Doña Chabela pide que toquen la pantalla
export const pedirTaps = () => ({
  tipo: TIPO.TAPS,
  usuario: 'el público',
});

// Identidad de la persona: su @ de TikTok (único, no cambia) si se conoce; si no, el nombre (simulador)
export const claveDe = (ev) => ev.cuenta || ev.usuario;

// Los eventos que no son chat se atienden antes
export const esPrioritario = (ev) => ev.tipo !== TIPO.CHAT;
