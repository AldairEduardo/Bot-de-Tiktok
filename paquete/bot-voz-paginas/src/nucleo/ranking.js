// Ranking de caseritos por PUNTOS: comentarios, tap tap, compartir, regalos y juegos.
// Los puntos se guardan (alGuardar) y se recuperan al arrancar (inicial): no se pierden al reiniciar ni entre LIVEs.
// Avisa los cambios con alCambiar(top), agrupados para no mandar uno por cada punto.
const SIN_NOMBRE = /^(an[oó]nimo|causita|alguien|el público)$/i; // sin nombre real o renombrados por el filtro

export function crearRanking({ alCambiar, alGuardar = () => {}, inicial = [], topN = 5, tapsPorPunto = 20 }) {
  const personas = new Map(); // clave (@) -> { usuario: nombre para mostrar, puntos, taps }
  for (const p of inicial) personas.set(p.clave, { usuario: p.usuario || p.clave, puntos: Number(p.puntos) || 0, taps: Number(p.taps) || 0 });
  const cambiados = new Set(); // claves con puntos nuevos, por guardar
  let aviso = null;

  const top = () => [...personas.values()]
    .filter((p) => p.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, topN)
    .map(({ usuario, puntos }) => ({ usuario, puntos }));

  const persona = (clave, usuario) => {
    const p = personas.get(clave) ?? { usuario, puntos: 0, taps: 0 };
    p.usuario = usuario; // si se cambió el nombre, se muestra el nuevo
    personas.set(clave, p);
    cambiados.add(clave);
    return p;
  };
  function guardar() {
    if (!cambiados.size) return;
    alGuardar([...cambiados].map((clave) => ({ clave, ...personas.get(clave) })));
    cambiados.clear();
  }
  const avisar = () => { clearTimeout(aviso); aviso = setTimeout(() => { guardar(); alCambiar(top()); }, 1500); };

  // clave: el @ (o el nombre si no hay @); usuario: el nombre que se muestra
  function sumar(clave, usuario = clave, puntos = 1) {
    if (!clave || SIN_NOMBRE.test(clave) || puntos <= 0) return;
    persona(clave, usuario).puntos += puntos;
    avisar();
  }

  // Los tap tap se acumulan: cada tapsPorPunto taps es un punto
  function sumarTaps(clave, usuario = clave, cantidad = 1) {
    if (!clave || SIN_NOMBRE.test(clave)) return;
    const p = persona(clave, usuario);
    p.taps += cantidad;
    const ganados = Math.floor(p.taps / tapsPorPunto);
    if (ganados > 0) { p.taps -= ganados * tapsPorPunto; p.puntos += ganados; avisar(); }
  }

  // Puesto y puntos de una persona (null si todavía no tiene puntos)
  function posicion(clave) {
    const p = personas.get(clave);
    if (!p?.puntos) return null;
    const puesto = 1 + [...personas.values()].filter((o) => o.puntos > p.puntos).length;
    return { puesto, puntos: p.puntos };
  }

  return { sumar, sumarTaps, top, guardar, posicion };
}
