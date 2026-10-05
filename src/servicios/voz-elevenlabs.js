// Proveedor de voz con ElevenLabs. Interfaz: { sintetizar(texto) -> base64 mp3 | null }
export function crearVozElevenLabs({ apiKey, vozId, modelo }) {
  async function sintetizar(texto) {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${vozId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
          body: JSON.stringify({ text: texto, model_id: modelo }),
        }
      );
      if (!res.ok) {
        console.error('[voz] ElevenLabs respondió', res.status, await res.text());
        return null; // el overlay usará la voz del navegador
      }
      return Buffer.from(await res.arrayBuffer()).toString('base64');
    } catch (e) {
      console.error('[voz] Error:', e.message);
      return null;
    }
  }
  return { sintetizar };
}
