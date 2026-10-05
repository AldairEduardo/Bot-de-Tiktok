// Banco de "La tía dibuja": dibujos hechos con trazos (caminos SVG en un lienzo de 200 x 200).
// En pantalla se dibujan solos, trazo por trazo, en el orden de la lista: primero lo que menos delata.
// r = respuesta que se muestra; v = otras formas de escribirla que también valen (sin tildes da igual).
// Para agregar uno: copia el formato, con un id nuevo que empiece con "dib-". No se repiten hasta que salgan todos.

// Ayudantes para no escribir caminos a mano
const C = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`; // círculo
const E = (x, y, rx, ry) => `M${x - rx} ${y}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`; // óvalo
const L = (...p) => 'M' + p.reduce((s, n, i) => s + (i % 2 ? `${n}` : (i ? ' L' : '') + `${n} `), ''); // línea quebrada
const Z = (...p) => L(...p) + 'Z'; // figura cerrada
const vapor = (...xs) => xs.map((x) => `M${x} 40c-7-7 7-11 0-18s7-11 0-18`); // humito que sale

export const DIBUJOS = [
  // ---------- Perú ----------
  { id: 'dib-pollo', peru: true, r: 'pollo a la brasa', v: ['pollo', 'pollito', 'pollo broaster', 'broaster', 'pollo frito', 'cuarto de pollo'], trazos: [
    E(100, 162, 84, 14),
    E(100, 122, 64, 38),
    'M62 104C42 98 30 80 38 68C46 58 60 64 64 76C68 88 72 96 78 102', 'M38 68L28 58', C(24, 52, 5), C(32, 48, 5),
    'M138 104C158 98 170 80 162 68C154 58 140 64 136 76C132 88 128 96 122 102', 'M162 68L172 58', C(176, 52, 5), C(168, 48, 5),
    'M84 120q9-7 18 0', 'M108 132q9-7 18 0', 'M70 138q9-6 18 0',
    ...vapor(92, 112),
  ] },
  { id: 'dib-cuy', peru: true, r: 'cuy', v: ['cuyes', 'cuycito', 'cobayo', 'cobaya'], trazos: [
    'M40 120C36 86 70 70 108 72C146 74 170 96 168 122C166 146 140 156 104 156C68 156 42 148 40 120Z',
    'M132 82q2-18 18-10', C(146, 104, 4), 'M164 116l6 2', 'M162 122l22-6', 'M162 126l22 6',
    'M62 154l-4 12', 'M84 156l-2 12', 'M120 156l2 12', 'M142 152l4 12',
    'M52 98q-10 2-8 14', 'M70 82q-6-8 2-14', 'M96 76q-2-10 8-12',
  ] },
  { id: 'dib-llama', peru: true, r: 'llama', v: ['llamas', 'alpaca', 'alpacas', 'vicuna', 'guanaco'], trazos: [
    'M48 116C46 98 66 94 98 96C126 98 136 102 136 116C136 132 118 136 92 136C64 136 48 132 48 116Z',
    'M58 132l-2 40', 'M74 136v36', 'M112 136v36', 'M128 132l2 40',
    'M120 100l6-58', 'M136 106l6-54',
    'M126 42C124 28 152 26 158 38C162 48 150 54 142 52',
    'M130 30l-4-16 10 12', 'M142 28l2-16 6 14', C(148, 40, 2.5),
    'M48 112q-12-2-10-16',
  ] },
  { id: 'dib-machu', peru: true, r: 'machu picchu', v: ['machupicchu', 'machu pichu', 'machupichu', 'machu picchu cusco', 'huayna picchu'], trazos: [
    L(10, 170, 190, 170),
    L(20, 170, 20, 158, 50, 158, 50, 146, 80, 146, 80, 134, 104, 134),
    Z(28, 158, 28, 142, 36, 134, 44, 142, 44, 158), Z(56, 146, 56, 130, 64, 122, 72, 130, 72, 146),
    'M104 170L124 84Q134 40 150 46Q164 56 170 100L190 170',
    'M60 108L84 70L108 104', 'M124 84q12 8 26 2', 'M136 120q10 6 22 0', 'M128 148q14 8 34 0',
  ] },
  { id: 'dib-ceviche', peru: true, r: 'ceviche', v: ['cebiche', 'sebiche', 'seviche', 'ceviche de pescado'], trazos: [
    'M26 104H174C168 146 138 168 100 168C62 168 32 146 26 104Z',
    'M52 104v-15h15v15', 'M82 104l2-17 16 2-1 15', 'M116 104v-13h15v13',
    'M66 92q12-20 26 0', 'M102 90q12-20 26 0',
    'M142 84a22 22 0 0 0 40 0Z', 'M162 84v20',
    'M40 128q20 10 40 0', 'M110 140q20 8 40-4',
  ] },
  { id: 'dib-choclo', peru: true, r: 'choclo', v: ['choclos', 'maiz', 'mazorca', 'elote', 'choclo con queso'], trazos: [
    E(100, 92, 28, 60),
    'M100 34v116', 'M86 38Q80 92 86 148', 'M114 38Q120 92 114 148',
    'M76 62q24 6 48 0', 'M72 82q28 6 56 0', 'M72 102q28 6 56 0', 'M76 124q24 6 48 0',
    'M100 152C60 148 44 118 54 82C62 118 80 138 100 152', 'M100 152C140 148 156 118 146 82C138 118 120 138 100 152',
    'M100 152v28',
  ] },
  { id: 'dib-papa', peru: true, r: 'papa', v: ['papas', 'papita', 'papa amarilla', 'papa huayro', 'patata'], trazos: [
    'M42 104C36 64 86 46 128 54C172 62 172 116 148 138C122 160 52 154 42 104Z',
    'M78 86l7 2', 'M120 74l6 3', 'M108 124l7-1', 'M142 104l4 5', 'M66 120l4 4',
    'M56 96q4-16 18-22',
  ] },
  { id: 'dib-aji', peru: true, r: 'aji', v: ['aji amarillo', 'aji limo', 'rocoto', 'chile', 'pimiento', 'aji panca'], trazos: [
    'M64 56C52 112 94 168 168 170C126 146 106 106 102 56C92 46 74 46 64 56Z',
    'M64 56C74 64 92 64 102 56', 'M84 52C82 38 90 28 102 24',
    'M76 78C76 108 92 132 114 148',
  ] },
  { id: 'dib-picarones', peru: true, r: 'picarones', v: ['picaron', 'picaroncitos'], trazos: [
    E(100, 164, 84, 16),
    E(66, 130, 36, 22), E(66, 128, 10, 6), E(134, 130, 36, 22), E(134, 128, 10, 6),
    E(100, 98, 36, 22), E(100, 96, 10, 6),
    'M58 70C78 90 98 58 120 84C130 96 140 78 152 90', 'M80 76v14', 'M126 86v12',
  ] },
  { id: 'dib-combi', peru: true, r: 'combi', v: ['combis', 'custer', 'micro', 'coaster', 'van', 'cobrador'], trazos: [
    'M20 140V82Q22 64 40 62H150Q166 64 176 96L182 140Z',
    C(56, 142, 16), C(146, 142, 16),
    Z(34, 76, 34, 102, 64, 102, 64, 76), Z(74, 76, 74, 102, 104, 102, 104, 76), Z(114, 76, 114, 102, 142, 102, 142, 76),
    'M150 76L166 102H150Z', 'M108 106v32',
    C(126, 52, 8), 'M126 60v10', 'M118 50l-12-14',
    'M2 96h12', 'M2 116h12',
  ] },
  { id: 'dib-mototaxi', peru: true, r: 'mototaxi', v: ['mototaxis', 'motocar', 'torito', 'moto taxi', 'moto'], trazos: [
    C(58, 150, 18), C(162, 152, 14),
    'M26 66Q28 56 40 56H140Q152 56 154 66Z',
    'M36 66V150', 'M120 66V140', 'M76 150H120L146 104',
    'M44 112H110V140', 'M146 66V104L162 152', 'M136 104H156',
    C(132, 82, 8), 'M132 90L138 104',
  ] },
  { id: 'dib-cajon', peru: true, r: 'cajon', v: ['cajon peruano', 'cajones', 'el cajon'], trazos: [
    'M60 52H130V170H60Z', 'M130 52L156 36V154L130 170', 'M60 52L86 36H156',
    C(96, 90, 12),
    'M40 100l-14-6', 'M40 114H24', 'M40 128l-14 6',
    'M176 76V50l14 4', E(171, 78, 6, 4), 'M168 118V96l12 4', E(163, 120, 6, 4),
  ] },
  { id: 'dib-chullo', peru: true, r: 'chullo', v: ['chullos', 'gorro', 'gorro andino', 'chullito'], trazos: [
    'M44 122C44 72 74 48 100 48C126 48 156 72 156 122Z',
    'M46 122Q42 152 60 160Q72 144 74 122', 'M154 122Q158 152 140 160Q128 144 126 122',
    'M50 102L62 90L74 102L86 90L98 102L110 90L122 102L134 90L148 102', 'M46 112H154',
    C(100, 40, 8), 'M60 160v10', C(60, 175, 5), 'M140 160v10', C(140, 175, 5),
  ] },
  { id: 'dib-pan', peru: true, r: 'pan', v: ['panes', 'pan frances', 'pancito', 'pan con chicharron', 'pan del dia'], trazos: [
    'M28 124C28 82 70 70 100 70C130 70 172 82 172 124C172 140 28 140 28 124Z',
    'M66 86l16 30', 'M98 80l16 32', 'M130 86l14 26',
    'M40 138q60 12 120 0',
  ] },
  { id: 'dib-salchipapa', peru: true, r: 'salchipapa', v: ['salchipapas', 'salchi', 'salchipapita'], trazos: [
    'M48 84H152L128 176H72Z',
    'M64 84l-6-52', 'M80 84l2-58', 'M94 84l-4-48', 'M110 84l6-56', 'M126 84l4-46', 'M140 84l4-38',
    C(74, 74, 9), C(104, 68, 9), C(132, 74, 9),
    'M58 110q40 10 84 0',
  ] },
  { id: 'dib-anticucho', peru: true, r: 'anticucho', v: ['anticuchos', 'brocheta', 'pincho', 'anticuchito'], trazos: [
    'M20 176L180 28',
    E(60, 139, 18, 14), E(96, 106, 18, 14), E(132, 73, 18, 14),
    'M52 132l14 12', 'M88 99l14 12', 'M124 66l14 12',
    ...vapor(156),
  ] },
  { id: 'dib-condor', peru: true, r: 'condor', v: ['condores', 'condor andino', 'el condor pasa'], trazos: [
    'M100 92C80 72 50 66 10 80L26 88L14 96L36 98L28 106L56 104C76 102 90 106 100 112',
    'M100 92C120 72 150 66 190 80L174 88L186 96L164 98L172 106L144 104C124 102 110 106 100 112',
    'M92 112L100 138L108 112',
    E(100, 88, 10, 6), 'M100 84C96 72 104 64 110 68L118 72L110 76',
  ] },
  { id: 'dib-zampona', peru: true, r: 'zampona', v: ['zamponas', 'antara', 'flauta de pan', 'quena', 'siku'], trazos: [
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => Z(40 + i * 17, 40, 40 + i * 17, 172 - i * 16, 54 + i * 17, 172 - i * 16, 54 + i * 17, 40)),
    'M36 62H164', 'M36 74H164',
    'M170 120q10-10 18 0', 'M174 140q8-8 14 0',
  ] },
  { id: 'dib-charango', peru: true, r: 'charango', v: ['charangos', 'guitarra', 'guitarrita', 'mandolina'], trazos: [
    'M100 106C80 106 78 118 84 126C70 132 66 160 80 172C92 180 108 180 120 172C134 160 130 132 116 126C122 118 120 106 100 106Z',
    C(100, 146, 8), 'M94 106V32', 'M106 106V32', 'M92 32H108L110 14H90Z',
    'M98 32V162', 'M102 32V162', 'M88 164H112',
  ] },
  { id: 'dib-tumi', peru: true, r: 'tumi', v: ['el tumi', 'cuchillo ceremonial', 'tumi de oro'], trazos: [
    'M48 140A52 32 0 0 0 152 140Z',
    'M90 140V82H110V140',
    'M80 82L70 40L90 56L100 30L110 56L130 40L120 82Z',
    'M94 98h5', 'M103 98h5', 'M96 110h10',
  ] },
  { id: 'dib-colibri', peru: true, r: 'colibri', v: ['picaflor', 'lineas de nazca', 'nazca', 'el colibri de nazca', 'colibri de nazca'], trazos: [
    'M70 112C80 82 118 72 142 66C134 88 114 102 90 116Z',
    C(150, 64, 8), 'M158 62L196 50',
    'M98 92L70 38L120 82', 'M112 86L122 28L132 74',
    'M72 112L40 150', 'M76 114L56 162', 'M82 114L72 166',
  ] },
  { id: 'dib-totora', peru: true, r: 'caballito de totora', v: ['caballitos de totora', 'totora', 'caballito', 'huanchaco'], trazos: [
    'M18 112C60 142 140 142 176 70C150 116 70 122 18 112Z',
    'M40 120C80 132 130 128 160 96', 'M30 116C80 124 130 120 166 84',
    C(92, 84, 7), 'M92 91v22', 'M92 100l12 6', 'M72 74L122 134',
    'M6 156q16-10 32 0t32 0 32 0 32 0 32 0 32 0',
  ] },
  { id: 'dib-limon', peru: true, r: 'limon', v: ['limones', 'limoncito', 'limon sutil'], trazos: [
    'M40 110C40 76 70 62 100 62C130 62 160 76 160 110C160 144 130 158 100 158C70 158 40 144 40 110Z',
    'M40 110l-12 0', 'M160 110l12 0',
    'M100 62C96 44 112 32 132 34C126 52 112 60 100 62', 'M104 58l20-18',
    'M66 92q8-10 20-12',
  ] },
  { id: 'dib-olla', peru: true, r: 'olla', v: ['ollas', 'olla comun', 'ollita', 'cacerola'], trazos: [
    'M42 84H158L150 160Q148 170 138 170H62Q52 170 50 160Z',
    'M42 98H26V114H46', 'M158 98H174V114H154',
    'M44 84Q100 54 156 84', C(100, 60, 6),
    ...vapor(76, 124),
  ] },
  { id: 'dib-sol', peru: true, r: 'sol', v: ['el sol', 'inti', 'solcito'], trazos: [
    C(100, 100, 34),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const a = (i * Math.PI) / 4, x1 = 100 + 46 * Math.cos(a), y1 = 100 + 46 * Math.sin(a), x2 = 100 + 72 * Math.cos(a), y2 = 100 + 72 * Math.sin(a);
      return L(+x1.toFixed(1), +y1.toFixed(1), +x2.toFixed(1), +y2.toFixed(1));
    }),
    C(88, 92, 3), C(112, 92, 3), 'M86 110q14 12 28 0',
  ] },
  { id: 'dib-gaseosa', peru: true, r: 'gaseosa', v: ['gaseosas', 'botella', 'refresco', 'soda', 'botella de gaseosa'], trazos: [
    'M88 22H112V46C112 62 130 66 130 92V174C130 182 70 182 70 174V92C70 66 88 62 88 46Z',
    'M86 22H114V12H86Z', 'M70 112H130', 'M70 142H130',
    C(90, 96, 3), C(106, 82, 2.5), C(112, 100, 3.5),
  ] },

  // ---------- Generales ----------
  { id: 'dib-pelota', peru: false, r: 'pelota', v: ['pelotas', 'balon', 'futbol', 'pelota de futbol'], trazos: [
    C(100, 100, 62),
    'M100 76L124 93L115 121H85L76 93Z',
    'M100 76V40', 'M124 93L156 80', 'M115 121L134 150', 'M85 121L66 150', 'M76 93L44 80',
  ] },
  { id: 'dib-celular', peru: false, r: 'celular', v: ['celulares', 'telefono', 'movil', 'cel', 'smartphone', 'iphone'], trazos: [
    'M64 26Q64 14 76 14H124Q136 14 136 26V174Q136 186 124 186H76Q64 186 64 174Z',
    'M72 34H128V160H72Z', C(100, 172, 5), 'M90 24H110',
  ] },
  { id: 'dib-pizza', peru: false, r: 'pizza', v: ['pizzas', 'pitsa', 'pizza de peperoni'], trazos: [
    'M40 52L160 52L100 182Z', 'M38 52Q100 30 162 52',
    C(84, 76, 9), C(120, 80, 8), C(100, 116, 8), C(98, 148, 5),
  ] },
  { id: 'dib-pescado', peru: false, r: 'pescado', v: ['pez', 'peces', 'pescadito', 'pescados', 'jurel', 'bonito'], trazos: [
    'M28 100C60 58 128 58 150 100C128 142 60 142 28 100Z',
    'M150 100L186 70L178 100L186 130Z',
    C(54, 92, 4), 'M74 80Q84 100 74 120', 'M100 66l10-14 14 16', 'M96 134l10 12 12-12',
  ] },
  { id: 'dib-helado', peru: false, r: 'helado', v: ['helados', 'cono', 'barquillo', 'heladito', 'cono de helado'], trazos: [
    'M68 104L100 182L132 104',
    'M76 122L120 112', 'M84 142L114 134', 'M80 112L110 166', 'M100 106L120 136',
    'M66 104C56 80 78 62 100 70C122 62 144 80 134 104Z',
    'M80 64C76 40 124 40 120 64', C(100, 34, 6),
  ] },
  { id: 'dib-gato', peru: false, r: 'gato', v: ['gatos', 'gatito', 'michi', 'michis', 'minino'], trazos: [
    C(100, 108, 50), 'M62 76L60 36L92 62', 'M138 76L140 36L108 62',
    E(82, 100, 6, 9), E(118, 100, 6, 9), 'M94 118L106 118L100 126Z',
    'M100 126q-8 10-16 4', 'M100 126q8 10 16 4',
    'M76 122L36 114', 'M76 128L36 134', 'M124 122L164 114', 'M124 128L164 134',
  ] },
  { id: 'dib-perro', peru: false, r: 'perro', v: ['perros', 'perrito', 'perro peruano', 'firulais', 'chusco', 'can'], trazos: [
    E(100, 104, 44, 48),
    'M62 80C40 90 40 132 56 142C62 122 62 100 62 80', 'M138 80C160 90 160 132 144 142C138 122 138 100 138 80',
    C(84, 94, 5), C(116, 94, 5), E(100, 118, 11, 7),
    'M100 125v10', 'M88 138q12 8 24 0', 'M96 140q4 14 8 0',
  ] },
  { id: 'dib-casa', peru: false, r: 'casa', v: ['casas', 'casita', 'hogar', 'jato', 'mi jato'], trazos: [
    'M40 96H160V172H40Z', 'M28 100L100 36L172 100',
    'M86 172V126H114V172', 'M52 112H76V136H52Z', 'M64 112V136', 'M52 124H76',
    'M136 62V36H150V74',
  ] },
  { id: 'dib-bicicleta', peru: false, r: 'bicicleta', v: ['bici', 'bicicletas', 'bicla', 'cicla'], trazos: [
    C(50, 132, 32), C(150, 132, 32),
    'M50 132H86L120 82H70L50 132', 'M86 132L64 72', 'M120 82L150 132',
    'M54 70H76', 'M120 82L114 62L132 60',
  ] },
  { id: 'dib-avion', peru: false, r: 'avion', v: ['aviones', 'avioneta', 'jet'], trazos: [
    'M100 18Q110 18 110 40V160L100 182L90 160V40Q90 18 100 18',
    'M90 80L20 116V126L90 110', 'M110 80L180 116V126L110 110',
    'M92 156L70 170V176L96 168', 'M108 156L130 170V176L104 168',
  ] },
  { id: 'dib-arbol', peru: false, r: 'arbol', v: ['arboles', 'arbolito', 'palta', 'palto', 'planta'], trazos: [
    'M88 180V120H112V180', 'M30 180H170',
    'M100 124C60 130 36 100 54 78C44 52 76 30 100 44C124 30 156 52 146 78C164 100 140 130 100 124Z',
    'M100 124V96', 'M100 106l-16-12', 'M100 100l14-12',
  ] },
  { id: 'dib-luna', peru: false, r: 'luna', v: ['la luna', 'media luna', 'lunita'], trazos: [
    'M120 28A72 72 0 1 0 120 172A56 56 0 1 1 120 28Z',
    'M160 50l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z', 'M170 130l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
  ] },
  { id: 'dib-reloj', peru: false, r: 'reloj', v: ['relojes', 'relojito', 'hora'], trazos: [
    C(100, 104, 66), C(100, 104, 4),
    'M100 44v10', 'M160 104h-10', 'M100 164v-10', 'M40 104h10',
    'M100 104V64', 'M100 104L130 118',
    'M60 46L42 30', 'M140 46L158 30',
  ] },
  { id: 'dib-sombrero', peru: false, r: 'sombrero', v: ['sombreros', 'sombrero chotano', 'sombrero de paja'], trazos: [
    'M18 140Q100 172 182 140Q100 120 18 140Z',
    'M60 134L64 80Q100 64 136 80L140 134', 'M62 114H138',
  ] },
  { id: 'dib-corazon', peru: false, r: 'corazon', v: ['corazones', 'corazoncito', 'amor', 'love'], trazos: [
    'M100 170C40 124 20 96 34 70C48 44 84 46 100 72C116 46 152 44 166 70C180 96 160 124 100 170Z',
    'M58 80q6-14 22-14',
  ] },
  { id: 'dib-carro', peru: false, r: 'carro', v: ['carros', 'auto', 'autos', 'coche', 'taxi', 'carrito'], trazos: [
    'M20 134V112Q20 100 34 98L58 72H132L158 98Q180 100 180 112V134Z',
    C(56, 136, 16), C(146, 136, 16),
    'M66 80L52 98H96V80Z', 'M106 80V98H148L128 80Z',
    'M2 108h10', 'M2 124h10',
  ] },
  { id: 'dib-barco', peru: false, r: 'barco', v: ['barcos', 'bote', 'velero', 'lancha', 'barquito'], trazos: [
    'M30 128H170L150 160H50Z', 'M100 128V30', 'M100 34L150 116H100', 'M100 46L60 116H100',
    'M10 172q15-10 30 0t30 0 30 0 30 0 30 0 30 0',
  ] },
  { id: 'dib-huevo', peru: false, r: 'huevo frito', v: ['huevo', 'huevos', 'huevos fritos', 'huevito', 'huevo estrellado'], trazos: [
    'M40 100C30 62 80 50 100 60C130 40 176 70 160 112C150 150 90 160 60 140C46 130 46 116 40 100Z',
    C(100, 102, 22), 'M90 94q4-6 10-6',
  ] },
  { id: 'dib-lentes', peru: false, r: 'lentes', v: ['lente', 'anteojos', 'gafas', 'lentes de sol', 'antiparras'], trazos: [
    C(60, 104, 30), C(140, 104, 30), 'M90 100q10-10 20 0', 'M30 100L10 86', 'M170 100L190 86',
  ] },
  { id: 'dib-torta', peru: false, r: 'torta', v: ['tortas', 'pastel', 'keke', 'queque', 'torta de cumpleanos', 'cumpleanos'], trazos: [
    'M36 112H164V172H36Z', 'M36 132q16 12 32 0t32 0 32 0 32 0',
    'M70 112V82', 'M100 112V76', 'M130 112V82',
    'M70 80q-6-10 0-18q6 8 0 18', 'M100 74q-6-10 0-18q6 8 0 18', 'M130 80q-6-10 0-18q6 8 0 18',
  ] },
  { id: 'dib-paraguas', peru: false, r: 'paraguas', v: ['sombrilla', 'paragua'], trazos: [
    'M20 100Q100 10 180 100', 'M20 100q20-12 40 0t40 0 40 0 40 0',
    'M100 100V164Q100 178 86 176Q76 174 78 164',
    'M60 100Q70 50 100 34', 'M140 100Q130 50 100 34',
  ] },

  // ---------- Perú (tanda 2) ----------
  { id: 'dib-oso', peru: true, r: 'oso de anteojos', v: ['oso', 'osito', 'oso andino', 'ucumari', 'oso anteojos'], trazos: [
    C(100, 110, 52), C(58, 66, 14), C(142, 66, 14),
    E(80, 100, 16, 13), E(120, 100, 16, 13), C(80, 100, 4), C(120, 100, 4),
    E(100, 132, 20, 15), E(100, 125, 7, 5), 'M100 130v8',
  ] },
  { id: 'dib-pinguino', peru: true, r: 'pinguino', v: ['pinguinos', 'pinguino de humboldt', 'pingui', 'pinguinito'], trazos: [
    E(100, 110, 40, 62), E(100, 122, 26, 46),
    C(88, 72, 3), C(112, 72, 3), Z(93, 82, 107, 82, 100, 92),
    'M62 100Q42 130 64 150', 'M138 100Q158 130 136 150',
    Z(82, 170, 72, 182, 94, 182), Z(118, 170, 106, 182, 128, 182),
  ] },
  { id: 'dib-pelicano', peru: true, r: 'pelicano', v: ['pelicanos', 'pelicano peruano', 'alcatraz'], trazos: [
    E(88, 122, 46, 30), 'M122 104Q142 72 124 50', C(120, 44, 12),
    'M130 40L192 58L130 52', 'M130 52Q162 82 190 60', C(117, 41, 2.5),
    'M58 112Q90 96 122 122', 'M76 150v26', 'M98 151v25', 'M43 120l-16-6',
  ] },
  { id: 'dib-chancho', peru: true, r: 'chancho', v: ['cerdo', 'puerco', 'cochino', 'chanchito', 'marrano', 'chanchos'], trazos: [
    E(100, 112, 60, 50), 'M56 78L48 46L82 66', 'M144 78L152 46L118 66',
    E(100, 126, 22, 15), E(93, 126, 3, 5), E(107, 126, 3, 5),
    C(80, 100, 4), C(120, 100, 4), 'M88 150q12 8 24 0',
  ] },
  { id: 'dib-camiseta', peru: true, r: 'camiseta', v: ['camiseta de peru', 'camiseta de la seleccion', 'polo', 'polo de peru', 'seleccion', 'blanquirroja', 'la blanquirroja', 'camiseta peruana'], trazos: [
    'M72 30L40 46L20 82L46 94L56 76V180H144V76L154 94L180 82L160 46L128 30Q100 50 72 30Z',
    'M80 34Q100 48 120 34',
    'M60 60L144 150', 'M56 90L134 176',
  ] },
  { id: 'dib-volcan', peru: true, r: 'volcan', v: ['volcanes', 'misti', 'el misti', 'volcan misti'], trazos: [
    'M0 172H200', 'M10 172L70 62Q100 50 130 62L190 172', 'M70 62Q100 76 130 62',
    'M58 84L72 96L86 86L100 98L114 86L128 96L142 84',
    'M92 52c-10-10 0-22 10-22c0-12 20-14 22-2c12-2 14 14 4 18',
  ] },
  { id: 'dib-quena', peru: true, r: 'quena', v: ['quenas', 'flauta', 'flauta andina', 'quenita'], trazos: [
    'M40 168L150 30', 'M52 176L162 38', 'M40 168L52 176', 'M150 30L162 38',
    C(72, 134, 4), C(87, 115, 4), C(102, 96, 4), C(117, 77, 4),
    'M176 96V72l12 4', E(171, 98, 6, 4),
  ] },
  { id: 'dib-poncho', peru: true, r: 'poncho', v: ['ponchos', 'manta', 'ponchito'], trazos: [
    C(100, 36, 16), 'M84 56H116L174 150H26Z',
    'M44 122L58 110L72 122L86 110L100 122L114 110L128 122L142 110L156 122',
    ...[36, 54, 72, 90, 110, 128, 146, 164].map((x) => `M${x} 150v12`),
    'M86 162V188', 'M114 162V188',
  ] },
  { id: 'dib-huaco', peru: true, r: 'huaco', v: ['huacos', 'huaco retrato', 'ceramica', 'vasija', 'cantaro', 'jarron'], trazos: [
    'M62 92C40 122 50 176 100 178C150 176 160 122 138 92Z',
    'M78 92Q74 44 100 42Q126 44 122 92', 'M100 42V18', 'M94 18H106',
    'M82 122h10', 'M108 122h10', 'M100 122v14l-5 2', 'M90 150h20',
  ] },
  { id: 'dib-toro', peru: true, r: 'toro', v: ['torito', 'torito de pucara', 'toros', 'vaca', 'buey'], trazos: [
    'M70 82Q60 142 86 160Q100 168 114 160Q140 142 130 82Q100 62 70 82Z',
    'M70 84Q40 72 38 40Q55 62 80 72', 'M130 84Q160 72 162 40Q145 62 120 72',
    'M68 94l-20 8 18 6', 'M132 94l20 8-18 6',
    C(86, 106, 4), C(114, 106, 4), E(100, 146, 20, 12), C(93, 146, 3), C(107, 146, 3),
    'M92 88l8-8 8 8-8 8Z',
  ] },
  { id: 'dib-caballo', peru: true, r: 'caballo', v: ['caballos', 'caballo de paso', 'caballito', 'yegua', 'potro', 'equino'], trazos: [
    E(94, 108, 48, 25),
    'M128 98L148 52', 'M138 110L162 62', 'M148 52L182 64L178 76L162 70',
    'M152 50l2-12 6 10', 'M144 58q-8 10-4 22', 'M138 72q-8 10-4 22',
    'M60 126L55 172', 'M76 130L73 172', 'M114 130L117 172', 'M130 126L136 172',
    'M47 102Q24 112 30 142',
  ] },
  { id: 'dib-mono', peru: true, r: 'mono', v: ['monos', 'monito', 'mico', 'chimpance', 'tocon'], trazos: [
    C(100, 100, 48), C(48, 100, 14), C(152, 100, 14),
    'M70 96Q70 70 100 78Q130 70 130 96Q140 140 100 145Q60 140 70 96Z',
    C(86, 96, 4), C(114, 96, 4), 'M95 116h2', 'M103 116h2', 'M84 128q16 12 32 0',
  ] },
  { id: 'dib-loro', peru: true, r: 'loro', v: ['loros', 'guacamayo', 'guacamayos', 'perico', 'lorito', 'papagayo'], trazos: [
    'M40 150H160', C(108, 56, 22), 'M126 50Q150 54 142 76Q134 72 128 66', C(112, 50, 4),
    'M92 70C70 92 72 140 100 150C120 140 124 100 118 76', 'M98 92Q90 120 108 140',
    'M96 150L86 194', 'M106 150L112 194', 'M88 150l-4 8', 'M110 150l4 8',
  ] },
  { id: 'dib-tamal', peru: true, r: 'tamal', v: ['tamales', 'tamalito', 'humita', 'humitas'], trazos: [
    'M40 80Q100 62 160 80L170 130Q100 148 30 130Z',
    'M50 106Q100 96 150 106', 'M70 72v66', 'M130 72v66', 'M70 72l-8-10', 'M70 72l8-10', 'M130 72l-8-10', 'M130 72l8-10',
    'M40 80L20 70', 'M30 130L10 140', 'M160 80L180 70', 'M170 130L190 140',
  ] },
  { id: 'dib-bandera', peru: true, r: 'bandera', v: ['bandera del peru', 'bandera peruana', 'la bandera', 'banderita', 'bandera de peru'], trazos: [
    'M40 28V186', 'M24 186H58', 'M40 36H172V118H40', 'M84 36V118', 'M128 36V118',
  ] },
  { id: 'dib-moneda', peru: true, r: 'moneda', v: ['monedas', 'un sol', 'sencillo', 'plata', 'moneda de un sol', 'luca'], trazos: [
    C(100, 100, 62), C(100, 100, 50), 'M92 80L104 70V132', 'M88 132H120',
    'M60 60l6 6', 'M140 60l-6 6',
  ] },

  // ---------- Generales (tanda 2) ----------
  { id: 'dib-mariposa', peru: false, r: 'mariposa', v: ['mariposas', 'polilla', 'mariposita'], trazos: [
    'M100 62V150', C(100, 54, 7), 'M97 48Q90 30 80 28', 'M103 48Q110 30 120 28',
    'M100 82C60 30 18 62 40 102C55 112 86 106 100 96', 'M100 82C140 30 182 62 160 102C145 112 114 106 100 96',
    'M100 106C70 112 50 140 70 156C86 166 100 136 100 122', 'M100 106C130 112 150 140 130 156C114 166 100 136 100 122',
    C(64, 76, 6), C(136, 76, 6),
  ] },
  { id: 'dib-flor', peru: false, r: 'flor', v: ['flores', 'florcita', 'margarita', 'girasol'], trazos: [
    'M100 128V188', 'M100 162Q70 142 66 162Q80 174 100 167', 'M100 152Q130 132 134 152Q120 164 100 157',
    C(100, 50, 16), C(126, 65, 16), C(126, 95, 16), C(100, 110, 16), C(74, 95, 16), C(74, 65, 16),
    C(100, 80, 14),
  ] },
  { id: 'dib-cactus', peru: false, r: 'cactus', v: ['cactos', 'cacto', 'tuna', 'san pedro'], trazos: [
    'M64 180H136L128 196H72Z',
    'M86 180V60Q86 40 100 40Q114 40 114 60V180',
    'M86 122H66Q56 122 56 112V86Q56 76 63 76Q70 76 70 86V106H86',
    'M114 102H134Q144 102 144 92V70Q144 60 137 60Q130 60 130 70V86H114',
    'M94 70l-6-3', 'M106 90l6-3', 'M94 140l-6-3', 'M106 158l6-3',
  ] },
  { id: 'dib-hongo', peru: false, r: 'hongo', v: ['hongos', 'champinon', 'champinones', 'seta'], trazos: [
    'M30 100Q30 40 100 40Q170 40 170 100Z',
    'M80 100V160Q80 172 100 172Q120 172 120 160V100',
    C(70, 74, 9), C(110, 60, 10), C(142, 82, 8),
  ] },
  { id: 'dib-caracol', peru: false, r: 'caracol', v: ['caracoles', 'caracolito', 'babosa'], trazos: [
    'M30 150H168Q180 150 178 140L162 122',
    C(96, 105, 45), 'M96 105a8 8 0 1 1 8 8a16 16 0 1 1-16-16a26 26 0 1 1 26 26',
    'M150 140Q164 112 170 96', 'M168 98L160 70', 'M172 98L182 72', C(159, 66, 4), C(183, 68, 4),
  ] },
  { id: 'dib-tortuga', peru: false, r: 'tortuga', v: ['tortugas', 'tortuguita', 'galapago', 'charapa', 'motelo'], trazos: [
    'M40 130Q45 60 100 60Q155 60 160 130Z',
    'M86 104L100 92L114 104L110 120H90Z', 'M86 104L66 110', 'M114 104L134 110', 'M100 92V64', 'M90 120L82 130', 'M110 120L118 130',
    C(172, 118, 12), C(176, 114, 2),
    'M56 130L50 150H70L72 130', 'M128 130L130 150H150L145 130', 'M40 128L25 136',
  ] },
  { id: 'dib-ballena', peru: false, r: 'ballena', v: ['ballenas', 'ballenita', 'orca', 'delfin', 'cachalote'], trazos: [
    'M20 112C20 72 110 62 150 92L186 66L180 102L192 132L155 112C120 152 20 152 20 112Z',
    C(50, 106, 4), 'M22 117Q60 127 90 120',
    'M70 66Q64 46 54 40', 'M70 66Q72 44 72 34', 'M70 66Q78 46 88 40',
    'M10 176q15-10 30 0t30 0 30 0 30 0 30 0 30 0',
  ] },
  { id: 'dib-pulpo', peru: false, r: 'pulpo', v: ['pulpos', 'pulpito', 'calamar'], trazos: [
    'M60 100C55 40 145 40 140 100Z', C(85, 80, 5), C(115, 80, 5),
    'M66 100Q48 136 32 146a7 7 0 1 1 6-12', 'M80 100Q74 148 62 166a7 7 0 1 1 10-6', 'M100 100Q102 150 94 176a7 7 0 1 1 12 0',
    'M120 100Q126 148 138 166a7 7 0 1 0-10-6', 'M134 100Q152 136 168 146a7 7 0 1 0-6-12',
    C(80, 120, 3), C(100, 124, 3), C(120, 120, 3),
  ] },
  { id: 'dib-cangrejo', peru: false, r: 'cangrejo', v: ['cangrejos', 'jaiba', 'jaibas', 'carretilla'], trazos: [
    E(100, 116, 45, 28),
    'M88 89V72', 'M112 89V72', C(88, 67, 5), C(112, 67, 5),
    'M58 106Q40 96 36 76', C(30, 62, 14), 'M24 56L36 62',
    'M142 106Q160 96 164 76', C(170, 62, 14), 'M176 56L164 62',
    'M62 126L35 140', 'M66 136L42 158', 'M138 126L165 140', 'M134 136L158 158',
    'M94 120q6 6 12 0',
  ] },
  { id: 'dib-foco', peru: false, r: 'foco', v: ['focos', 'bombilla', 'bombillo', 'lampara', 'idea', 'luz'], trazos: [
    'M70 122C40 96 50 40 100 40C150 40 160 96 130 122V140H70Z',
    'M72 150H128', 'M75 160H125', 'M86 172H114',
    'M88 122V96L94 86L100 96L106 86L112 96V122',
    'M100 26V10', 'M46 46L34 34', 'M154 46L166 34',
  ] },
  { id: 'dib-llave', peru: false, r: 'llave', v: ['llaves', 'llavecita'], trazos: [
    C(55, 100, 28), C(55, 100, 10), 'M83 100H182', 'M150 100V120H160V110H170V126H182V100',
  ] },
  { id: 'dib-tijera', peru: false, r: 'tijera', v: ['tijeras', 'tijerita'], trazos: [
    'M82 144L135 30', 'M118 144L65 30', C(100, 105, 4), C(75, 160, 18), C(125, 160, 18),
  ] },
  { id: 'dib-cohete', peru: false, r: 'cohete', v: ['cohetes', 'nave', 'nave espacial', 'cohetito'], trazos: [
    'M100 20C130 50 130 110 120 140H80C70 110 70 50 100 20Z', C(100, 72, 12),
    'M80 116L55 152L80 140', 'M120 116L145 152L120 140',
    'M86 140Q100 192 114 140', 'M93 140Q100 170 107 140',
  ] },
  { id: 'dib-fantasma', peru: false, r: 'fantasma', v: ['fantasmas', 'fantasmita', 'espiritu', 'alma en pena'], trazos: [
    'M50 172V92C50 40 150 40 150 92V172L133 156L117 172L100 156L83 172L67 156Z',
    E(82, 92, 7, 10), E(118, 92, 7, 10), E(100, 124, 8, 10),
  ] },
  { id: 'dib-regalo', peru: false, r: 'regalo', v: ['regalos', 'caja', 'sorpresa', 'presente', 'cajita'], trazos: [
    'M40 90H160V176H40Z', 'M32 70H168V90H32Z', 'M100 70V176',
    'M100 70C85 44 60 50 72 66Q85 72 100 70', 'M100 70C115 44 140 50 128 66Q115 72 100 70',
  ] },
  { id: 'dib-semaforo', peru: false, r: 'semaforo', v: ['semaforos', 'luz roja', 'semaforito'], trazos: [
    'M70 22H130V160H70Z', C(100, 50, 15), C(100, 91, 15), C(100, 132, 15), 'M100 160V192',
  ] },
  { id: 'dib-audifonos', peru: false, r: 'audifonos', v: ['audifono', 'auriculares', 'headphones', 'cascos', 'audifonos inalambricos'], trazos: [
    'M48 112C48 40 152 40 152 112', E(48, 138, 14, 26), E(152, 138, 14, 26),
    'M164 96l10-4', 'M166 112h12',
  ] },
];
