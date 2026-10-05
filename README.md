# Avatar asesor para TikTok LIVE

Avatar con IA **en video HD** que atiende un TikTok LIVE: lee el chat, responde con voz a cada persona, saluda a los que entran, agradece regalos y comparte consejos cuando el chat está tranquilo. Pensado para **vender un servicio cumpliendo las normas de TikTok**.

Es una copia aparte del proyecto de Doña Chabela: no la toca y puede correr en otra PC.

## Cada cliente, su carpeta
```
clientes/
  paginas/              ← cliente de ejemplo (asesoría de páginas de Facebook)
    cliente.json        ← nombre del avatar, marca, colores, llamados a la acción, consejos, videos
    personaje.md        ← cómo habla y las reglas que nunca rompe (TikTok y Meta)
    preguntas.md        ← precio, qué incluye, cómo contratar... (lo que diga PENDIENTE no lo inventa)
    .env                ← SUS claves (TikTok, OpenRouter): copia .env.example
    publico/videos/     ← escuchando.mp4, hablando.mp4, celebrando.mp4, saludando.mp4
  _plantilla/           ← para crear un cliente nuevo
```

**Cliente nuevo:** copia `clientes/_plantilla` con otro nombre (por ejemplo `clientes/zapatillas`), edita sus 3 archivos, crea su `.env` y pon sus videos (ver **GUIA-VIDEOS.md**).

## Arrancar
```
npm install                          (solo la primera vez)
npm run simular                      (pruebas: escribes comentarios en la terminal)
npm start                            (LIVE real del primer cliente)
npm start -- --cliente=paginas       (LIVE real de un cliente en particular)
```
- Overlay en el navegador u OBS: `http://localhost:3000`
- TikTok LIVE Studio (Añadir fuente → Enlace): `https://127.0.0.1.nip.io:3443/en-vivo`, con resolución 1080 × 1920, "Activar sonido" y "Mantener siempre activa" encendidos.

Cada cliente guarda aparte su base de datos (`datos/<cliente>.db`) y sus registros (`registros/<cliente>/`). El simulador usa archivos separados del LIVE real.

## Voz por link para el cliente (todo corre en esta PC)
El cliente no recibe el proyecto: solo un link que agrega en su TikTok LIVE Studio. El chat, la IA y la voz corren aquí.
1. `npm run clave` → copia la línea `CLAVE_ACCESO=...` en `clientes/<id>/.env` (una distinta por cliente). Pon también su `TIKTOK_USUARIO`.
2. Terminal 1: `npm start -- --cliente=<id>`
3. Terminal 2: `npm run tunel` → muestra una dirección `https://xxxx.trycloudflare.com` (o tu dominio fijo, ver abajo).
4. Al cliente le das: `https://<túnel>/v/<CLAVE_ACCESO>` → en TikTok LIVE Studio: Añadir fuente → Enlace, con "Activar sonido" y "Mantener siempre activa". Es invisible: solo suena.
   Para ver las respuestas escritas en su navegador (sin que suene doble): el mismo link con `?panel` al final.
- Sin la clave exacta, todo responde 404. Para cortarle el acceso, cambia su `CLAVE_ACCESO` y reinicia.
- Esta PC tiene que estar prendida y con internet durante su LIVE. El cliente tiene que transmitir desde PC (LIVE Studio u OBS), no desde el celular.
- `npm run tunel` (túnel rápido, sin cuenta) cambia de dirección cada vez que se reinicia. Para un link fijo: túnel con nombre en una cuenta de Cloudflare con un dominio propio.

## Reglas que cumple el avatar (personaje.md)
- No vende ni compra páginas, cuentas, seguidores ni likes.
- No promete ganancias ni resultados garantizados.
- Solo recomienda métodos permitidos (contenido original y los programas oficiales de Meta).
- No pide ni comparte datos personales, números ni enlaces de pago: todo por mensaje directo de la cuenta.
- Si le preguntan, dice que es un asistente virtual con IA. El overlay muestra "Asistente virtual con IA".
- En TikTok, marcar siempre "Contenido generado por IA" en la configuración del LIVE.
