# Guía: los videos del avatar (opción A)

El avatar son **4 videos cortos en bucle**. El overlay cambia de uno a otro con un fundido según lo que pase en el LIVE:

| Archivo | Cuándo se ve | Qué hace la persona |
|---|---|---|
| `escuchando.mp4` | Casi todo el tiempo (nadie habla) | Mira a cámara, sonríe, asiente, parpadea. Boca cerrada |
| `hablando.mp4` | Mientras responde | Habla a cámara con gestos naturales de manos |
| `celebrando.mp4` | Regalos, metas, nuevos seguidores | Sonríe, aplaude o levanta los brazos contenta |
| `saludando.mp4` | Cuando alguien entra | Saluda con la mano y sonríe |

Se guardan en `clientes/<cliente>/publico/videos/` con esos nombres exactos. Si falta alguno, el overlay usa `escuchando.mp4`; si faltan todos, muestra el avatar de reemplazo.

## Medidas (importante para que se vea HD)
- **Vertical 1080 × 1920** (9:16), **30 fps**, formato **MP4 (H.264)**.
- **Duración: 6 a 10 segundos** cada uno.
- **Misma persona, misma ropa, mismo fondo, mismo encuadre y misma luz en los 4.** Si cambia algo, el salto entre videos se nota.
- **Que empiece y termine en la misma pose** (de frente, manos abajo): así el bucle no se nota.
- **Sin sonido**: la voz la pone el sistema.
- **Encuadre:** la cara entre la altura 400 y 900 px (en el tercio superior). Arriba hay franjas de la marca, y de la altura 940 para abajo van los subtítulos y el chat de TikTok.

## Herramientas para generarlos
Cualquiera que haga video con IA a partir de un texto o una foto, por ejemplo **HeyGen, Hedra, Kling, Runway o Pika**. Lo más práctico:
1. Crear **una imagen** de la asesora (con la misma herramienta o con un generador de imágenes).
2. Usar esa imagen como base para los 4 videos ("imagen a video"), así es siempre la misma persona.

⚠️ **Debe ser un personaje inventado.** No usar la cara de una persona real ni de un famoso. TikTok exige marcar "Contenido generado por IA", y el overlay ya muestra "Asistente virtual con IA".

## Indicaciones (prompts) para copiar
Imagen base:
> Retrato vertical 9:16 de una asesora digital latinoamericana de unos 30 años, sonriente y profesional, camisa azul, en un estudio moderno con luces suaves azules y un monitor de fondo desenfocado. Iluminación de estudio, alta definición, estilo realista. Mirando a cámara, plano medio (de la cintura para arriba).

Videos (partiendo de esa imagen):
- **escuchando:** "La mujer mira a cámara, sonríe con calma, asiente suavemente y parpadea. Boca cerrada. Cámara fija. 8 segundos. Empieza y termina en la misma pose."
- **hablando:** "La mujer habla a cámara con naturalidad, moviendo las manos al explicar. Cámara fija. 8 segundos. Empieza y termina en la misma pose."
- **celebrando:** "La mujer sonríe ampliamente y aplaude contenta mirando a cámara. Cámara fija. 6 segundos. Empieza y termina en la misma pose."
- **saludando:** "La mujer saluda con la mano a cámara y sonríe. Cámara fija. 6 segundos. Empieza y termina en la misma pose."

## Probarlos
1. Copia los 4 archivos a `clientes/paginas/publico/videos/`.
2. `npm run simular` y abre `http://localhost:3000`.
3. Escribe en la terminal `pepe: hola, ¿cómo crezco mi página?` y mira que cambie a "hablando". Con `/regalo pepe Rosa 1` debe pasar a "celebrando".
