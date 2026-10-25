// Objetivos de aprendizaje que se muestran antes de empezar cada nivel.
// En los textos, [[palabra]] se convierte en una palabra del diccionario (explicación al pasar el mouse).
const LEVEL_OBJECTIVES = {
  1: {
    num: '01', name: 'El Balance', accent: '#63d8e6',
    mission: 'Los sistemas de NOVA están descalibrados: envían el 90% de la energía de rescate al País A y solo el 10% al País B. Primero repartirás la energía en partes iguales y después la ajustarás con precisión a 80% / 20%.',
    goals: [
      'Explicar qué es un [[qubit]] y por qué, antes de la [[medición]], puede estar en [[superposición]] (0 y 1 a la vez).',
      'Usar la compuerta [[Hadamard]] (H) para crear un reparto 50 / 50 y comprobarlo midiendo 1000 veces.',
      'Controlar la [[probabilidad]] con la rotación [[Ry]]: el ángulo θ decide el reparto, según P(A) = cos²(θ/2).',
      'Distinguir [[probabilidad]] (lo que esperamos en teoría) de [[frecuencia]] (lo que realmente salió), y entender por qué con más [[disparos]] se parecen más.',
    ],
    areas: [
      ['Computación cuántica', 'Qubit, superposición, compuertas H y Ry, medición.'],
      ['Estadística', 'Probabilidad, frecuencia relativa, ley de los grandes números.'],
      ['Base para la IA', 'Las probabilidades son el lenguaje con el que una IA expresa qué tan segura está.'],
    ],
    steps: [
      'Escucha a NOVA (clic en su mensaje para avanzar).',
      'Arrastra la compuerta H al circuito y presiona EJECUTAR.',
      'Observa los paquetes de energía y las barras de probabilidad.',
      'Cambia H por Ry, gira el ángulo θ hasta 80 / 20 y vuelve a ejecutar.',
    ],
    world: 'Repartir recursos con probabilidades controladas se usa para balancear servidores en internet, hacer sorteos justos y simular fenómenos aleatorios.',
  },
  2: {
    num: '02', name: 'El Despliegue', accent: '#ffd36e',
    mission: 'La biometría clásica de los rescatistas falló. Hay escuadrones sin diagnóstico (puntos grises) y debes decidir si están aptos o exhaustos comparándolos con operarios ya diagnosticados.',
    goals: [
      'Entender que un [[dato]] (la posición de un operario en el mapa) se puede guardar como un [[estado cuántico]].',
      'Armar el [[SWAP test]] (H → [[CSWAP]] → H) e interpretar su lectura: 100% = idénticos, 50% = totalmente distintos ([[ortogonal]]).',
      'Relacionar la lectura con la [[fidelidad]] F entre dos estados: P(0) = (1 + F) / 2.',
      'Aplicar [[KNN]] con K = 3: elegir los 3 [[vecino]]s más parecidos y [[clasificar]] por [[mayoría]].',
      'Reconocer por qué elegir vecinos poco parecidos lleva a un diagnóstico equivocado.',
    ],
    areas: [
      ['Computación cuántica', 'Codificación de datos, compuerta CSWAP, interferencia, fidelidad.'],
      ['Estadística', 'Medida de similitud, mediciones repetidas (1000 disparos), votación por mayoría.'],
      ['Machine Learning', 'Clasificación supervisada con datos etiquetados: el algoritmo KNN.'],
    ],
    steps: [
      'Observa el mapa: verde = aptos, rojo = exhaustos, gris = sin diagnóstico.',
      'Arma el radar H → CSWAP → H siguiendo los tres cables y presiona EJECUTAR.',
      'Lee el porcentaje del monitor: cerca de 100% = parecidos, cerca de 50% = distintos.',
      'Arrastra cables desde cada punto gris hasta 3 puntos de color: la mayoría decide.',
    ],
    world: 'Comparar casos parecidos es la base de los diagnósticos médicos asistidos, las recomendaciones ("a personas como tú también les gustó...") y la detección de fraudes.',
  },
  3: {
    num: '03', name: 'La Cosecha', accent: '#a98bff',
    mission: 'Una plaga dañó la cosecha de arándanos de exportación. Los arándanos dañados rodean a los sanos y ninguna línea recta los separa: construirás y entrenarás una red neuronal cuántica que aprenda a distinguirlos.',
    goals: [
      'Reconocer datos [[no lineal]]es y por qué una línea recta no basta para separarlos.',
      'Armar un circuito variacional ([[VQC]]) con rotaciones [[Ry]] y [[Rx]] ([[parámetro]]s ajustables) y [[CNOT]] ([[entrelazamiento]]).',
      'Comprobar que ajustar los parámetros a mano es lento e impreciso.',
      'Entender qué hace un [[optimizador de gradiente]]: mide el [[error]] y corrige los parámetros paso a paso ([[entrenamiento]]).',
      'Leer la curva de error y la [[precisión]] para saber cuándo el modelo llegó a la [[convergencia]].',
    ],
    areas: [
      ['Computación cuántica', 'Rotaciones con parámetros, CNOT y entrelazamiento entre qubits.'],
      ['Estadística', 'Error cuadrático medio, precisión, conjunto de datos.'],
      ['Machine Learning', 'Red neuronal, frontera de decisión, gradiente, entrenamiento y convergencia.'],
    ],
    steps: [
      'Observa los datos: azul = sanos, rojo = dañados.',
      'Arrastra Ry, Rx y CNOT al circuito y presiona EJECUTAR.',
      'Mueve las perillas a mano y mira cómo cambia la frontera de decisión.',
      'Arrastra el OPTIMIZADOR DE GRADIENTE sobre el circuito, presiona EJECUTAR y llega al 90% de precisión.',
    ],
    world: 'Los mismos principios se usan en el control de calidad con cámaras, la detección de enfermedades en imágenes médicas y cualquier IA que aprende a partir de ejemplos.',
  },
};

// Muestra los objetivos del nivel y resuelve la promesa cuando el jugador cierra la ventana.
function showObjectives(level) {
  const o = LEVEL_OBJECTIVES[level];
  const modal = document.getElementById('modal-objectives');
  modal.style.setProperty('--obj', o.accent);
  modal.querySelector('.obj-kicker').textContent = `NIVEL ${o.num} · OBJETIVOS DE APRENDIZAJE`;
  modal.querySelector('.obj-title').innerHTML = o.name.replace(/(\S+)$/, '<span>$1</span>');
  modal.querySelector('.obj-mission').innerHTML = richText(o.mission);
  modal.querySelector('.obj-goals').innerHTML = o.goals.map(g => `<li><span>${richText(g)}</span></li>`).join('');
  modal.querySelector('.obj-areas').innerHTML = o.areas.map(([k, v]) => `<div><b>${k}</b><span>${v}</span></div>`).join('');
  modal.querySelector('.obj-steps').innerHTML = o.steps.map(s => `<li>${s}</li>`).join('');
  modal.querySelector('.obj-world').textContent = o.world;
  modal.querySelector('.obj-body').scrollTop = 0;
  modal.classList.add('open');
  return new Promise(done => {
    const close = () => {
      modal.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      modal.querySelectorAll('[data-obj-close]').forEach(b => b.onclick = null);
      Kit.sfx('click');
      done();
    };
    const onKey = e => { if (e.key === 'Escape') close(); };
    modal.querySelectorAll('[data-obj-close]').forEach(b => b.onclick = close);
    document.addEventListener('keydown', onKey);
  });
}
