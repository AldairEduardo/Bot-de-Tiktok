// Nombres de TikTok "decorados" (𝓜𝓪𝓻𝓲𝓪, ⓜⓐⓡⓘⓐ, ᴍᴀʀɪᴀ, ｍａｒｉａ, m̶a̶r̶i̶a̶, ✨maria✨) se convierten a letras
// normales para que la voz los pueda leer. Si el nombre no tiene letras legibles, se usa el @ de la cuenta.

// Versalitas: no las arregla Unicode por sí solo
const VERSALITAS = {
  'ᴀ': 'a', 'ʙ': 'b', 'ᴄ': 'c', 'ᴅ': 'd', 'ᴇ': 'e', 'ꜰ': 'f', 'ɢ': 'g', 'ʜ': 'h', 'ɪ': 'i', 'ᴊ': 'j', 'ᴋ': 'k', 'ʟ': 'l', 'ᴍ': 'm',
  'ɴ': 'n', 'ᴏ': 'o', 'ᴘ': 'p', 'ǫ': 'q', 'ʀ': 'r', 'ꜱ': 's', 'ᴛ': 't', 'ᴜ': 'u', 'ᴠ': 'v', 'ᴡ': 'w', 'ʏ': 'y', 'ᴢ': 'z',
};
// Letras de otros alfabetos que se usan solo para "decorar" (parecen latinas)
const PARECIDAS = {
  'α': 'a', 'в': 'b', '∂': 'd', 'є': 'e', 'ƒ': 'f', 'н': 'h', 'ι': 'i', 'к': 'k', 'ℓ': 'l', 'м': 'm', 'η': 'n', 'σ': 'o',
  'ρ': 'p', 'я': 'r', 'ѕ': 's', 'т': 't', 'υ': 'u', 'ν': 'v', 'ω': 'w', 'χ': 'x', 'у': 'y', 'ѵ': 'v', 'ɑ': 'a', 'ɛ': 'e',
};

function convertir(texto) {
  const t = String(texto ?? '')
    .normalize('NFKC') // 𝓜→M, ⓜ→m, ｍ→m (letras matemáticas, en círculo y de ancho completo)
    .replace(/\p{M}/gu, '') // marcas sueltas que tachan o adornan (las tildes del español ya vienen unidas)
    .replace(/./gu, (c) => VERSALITAS[c] ?? PARECIDAS[c] ?? c)
    .replace(/[_.\-]+/g, ' ') // maria_lopez → maria lopez
    .replace(/[^\p{L}\p{N}' ]+/gu, ' ') // emojis y símbolos fuera
    .replace(/\s+/g, ' ')
    .trim();
  // "xX maria Xx" → "maria"
  const sinX = t.replace(/^(x+\s*)+(?=\S)/i, '').replace(/(\s*x+)+$/i, '').trim();
  return (/\p{L}{2}/u.test(sinX) ? sinX : t).slice(0, 24).trim();
}

const tieneLetras = (s) => (s.match(/\p{L}/gu) || []).length >= 2;

export function nombreLegible(nombre, cuenta) {
  const deNombre = convertir(nombre);
  if (tieneLetras(deNombre)) return deNombre;
  const deCuenta = convertir(cuenta);
  if (tieneLetras(deCuenta)) return deCuenta;
  return 'causita';
}
