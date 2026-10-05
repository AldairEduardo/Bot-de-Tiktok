// Arma a mano el .md de mejores momentos del último LIVE: npm run momentos (o npm run momentos -- --simular)
import { config } from '../config.js';
import { generarMomentos } from '../salidas/momentos.js';

const archivo = generarMomentos({ carpeta: config.registro.carpeta });
console.log(archivo ? `[momentos] Mejores momentos guardados en ${archivo}` : '[momentos] No hay batidas en el registro todavía');
