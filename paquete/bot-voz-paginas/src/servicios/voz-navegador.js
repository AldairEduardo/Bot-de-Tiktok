// Proveedor "vacío": no genera audio en el servidor. El overlay lee el texto
// con la voz del navegador. Se usa cuando no hay ElevenLabs configurado.
export function crearVozNavegador() {
  return { sintetizar: async () => null };
}
