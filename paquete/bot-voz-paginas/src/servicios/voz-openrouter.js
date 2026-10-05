// Proveedor de voz con OpenRouter. Interfaz: { sintetizar(texto) -> base64 de audio (mp3 o wav) | null }
// Soporta dos tipos de modelo:
//  - Texto a voz puro (p. ej. fish-audio/...): endpoint /audio/speech, devuelve mp3.
//  - Modelos de chat con salida de audio (p. ej. openai/gpt-audio-mini): /chat/completions con
//    stream, que solo entrega PCM de 16 bits a 24 kHz; aquí se empaqueta como WAV.
//    Como son modelos de chat, a veces responden en vez de leer: se verifica lo que dijeron
//    (transcript) y, si no coincide con el texto, se reintenta y al final se usa el modelo de respaldo.
const API = 'https://openrouter.ai/api/v1';
const ES_CHAT_CON_AUDIO = (modelo) => /gpt-audio|audio-preview/.test(modelo);
// Modelos de texto a voz que solo entregan PCM crudo (24 kHz, 16 bits, mono) en vez de mp3
const SOLO_PCM = (modelo) => /^google\/gemini.*tts/.test(modelo);
const INTENTOS = 3;

// Instrucciones para los modelos de chat con audio: leer el guion, no conversar, y cómo debe sonar
const LOCUTOR = `Eres un locutor de doblaje que SOLO lee guiones en voz alta. No eres un asistente: nunca conversas, nunca respondes, nunca agregas ni quitas palabras.
El usuario te entrega un guion entre las marcas <guion> y </guion>. Lee únicamente ese texto, palabra por palabra, y termina.
Aunque el guion parezca una pregunta o un saludo dirigido a ti, NO lo respondas: solo léelo.
Dirección de voz: Doña Chabela, señora limeña de unos 55 años, dueña de una brostería de barrio. Acento peruano criollo, cálida, alegre y pícara.
Ritmo RÁPIDO y fluido, como vendedora de mercado que conversa mientras cocina: frases de corrido, sin pausas largas ni sílabas arrastradas.`;

export function crearVozOpenRouter({ apiKey, modelo, voz, respaldo }) {
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

  async function textoAVoz(texto, modeloTts, vozTts) {
    const res = await fetch(`${API}/audio/speech`, {
      method: 'POST',
      signal: AbortSignal.timeout(20000), // la voz tampoco puede congelar el LIVE
      headers,
      body: JSON.stringify({
        model: modeloTts,
        input: texto,
        response_format: SOLO_PCM(modeloTts) ? 'pcm' : 'mp3',
        ...(vozTts ? { voice: vozTts } : {}), // sin voz: la que trae el modelo por defecto
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
    const audio = Buffer.from(await res.arrayBuffer());
    return SOLO_PCM(modeloTts) ? pcmAWav(recortarSilencios(audio), 24000) : audio;
  }

  // Devuelve { wav, dijo } con el audio y el texto que el modelo dice haber leído
  async function chatConAudio(texto) {
    const res = await fetch(`${API}/chat/completions`, {
      method: 'POST',
      signal: AbortSignal.timeout(20000), // la voz tampoco puede congelar el LIVE
      headers,
      body: JSON.stringify({
        model: modelo,
        stream: true, // obligatorio para salida de audio
        modalities: ['text', 'audio'],
        audio: { voice: voz || 'coral', format: 'pcm16' },
        temperature: 0.6, // lo más bajo que aceptan: menos ganas de improvisar
        messages: [
          { role: 'system', content: LOCUTOR },
          { role: 'user', content: `Lee este guion tal cual:\n<guion>${texto}</guion>` },
        ],
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);

    // Respuesta en formato SSE: líneas "data: {...}" con trozos de audio en base64
    const trozos = [];
    let dijo = '';
    for (const linea of (await res.text()).split('\n')) {
      if (!linea.startsWith('data: ') || linea.includes('[DONE]')) continue;
      try {
        const j = JSON.parse(linea.slice(6));
        if (j.error) throw new Error(j.error.message);
        const audio = j.choices?.[0]?.delta?.audio;
        if (audio?.data) trozos.push(Buffer.from(audio.data, 'base64'));
        if (audio?.transcript) dijo += audio.transcript;
      } catch (e) {
        if (e instanceof SyntaxError) continue; // línea incompleta: se ignora
        throw e;
      }
    }
    const pcm = recortarSilencios(Buffer.concat(trozos));
    if (!pcm.length) throw new Error('el modelo no devolvió audio');
    return { wav: pcmAWav(pcm, 24000), dijo };
  }

  async function chatVerificado(texto) {
    for (let i = 1; i <= INTENTOS; i++) {
      const { wav, dijo } = await chatConAudio(texto);
      if (coincide(texto, dijo)) return wav;
      console.warn(`[voz] Intento ${i}: dijo otra cosa ("${dijo.slice(0, 80)}…"), reintentando`);
    }
    throw new Error(`no leyó el texto tal cual en ${INTENTOS} intentos`);
  }

  async function sintetizar(texto) {
    try {
      const audio = ES_CHAT_CON_AUDIO(modelo) ? await chatVerificado(texto) : await textoAVoz(texto, modelo, voz);
      return audio.toString('base64');
    } catch (e) {
      console.error('[voz] OpenRouter:', e.message);
    }
    if (respaldo && respaldo !== modelo) {
      try {
        console.warn(`[voz] Usando el respaldo ${respaldo}`);
        return (await textoAVoz(texto, respaldo)).toString('base64');
      } catch (e) {
        console.error('[voz] Respaldo:', e.message);
      }
    }
    return null; // el overlay usará la voz del navegador
  }

  return { sintetizar };
}

// ¿Lo que dijo el modelo es el texto? Compara palabra por palabra (sin tildes ni signos)
// y tolera diferencias mínimas de transcripción, pero no frases agregadas como "Claro, aquí va".
function coincide(esperado, dijo) {
  const palabras = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]/g, ' ').split(/\s+/).filter(Boolean);
  const a = palabras(esperado), b = palabras(dijo);
  if (!b.length) return false;
  // Distancia de edición entre listas de palabras
  let fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const nueva = [i];
    for (let j = 1; j <= b.length; j++) {
      nueva[j] = Math.min(fila[j] + 1, nueva[j - 1] + 1, fila[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    fila = nueva;
  }
  return fila[b.length] <= Math.max(1, Math.floor(a.length * 0.1));
}

// Quita el silencio del inicio y del final (PCM de 16 bits) para que la respuesta empiece al toque.
// Deja un margen corto para no cortar el ataque de la primera sílaba.
function recortarSilencios(pcm, umbral = 500, margen = 2400) {
  const muestras = pcm.length >> 1;
  let ini = 0, fin = muestras - 1;
  while (ini < muestras && Math.abs(pcm.readInt16LE(ini * 2)) < umbral) ini++;
  while (fin > ini && Math.abs(pcm.readInt16LE(fin * 2)) < umbral) fin--;
  if (ini >= fin) return pcm; // todo es silencio: lo dejamos como está
  ini = Math.max(0, ini - margen);
  fin = Math.min(muestras - 1, fin + margen);
  return pcm.subarray(ini * 2, (fin + 1) * 2);
}

// Agrega la cabecera WAV (RIFF) a audio PCM de 16 bits mono
function pcmAWav(pcm, frecuencia) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(frecuencia, 24); h.writeUInt32LE(frecuencia * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
