// Contenido del juego: capítulos, diálogos de NOVA, misiones y diccionario.
// En los textos, [[palabra]] se convierte en una palabra del diccionario con explicación al pasar el mouse.

const GLOSSARY = {
  'qubit': 'La unidad de información de una computadora cuántica. Como una moneda: al mirarla muestra 0 o 1, pero antes de mirarla puede estar "girando".',
  'medición': 'Mirar el qubit. Al medirlo, deja de girar y muestra un solo resultado: 0 o 1.',
  'superposición': 'Cuando el qubit está "girando": tiene posibilidades de dar 0 y de dar 1 al mismo tiempo, hasta que lo medimos.',
  'Hadamard': 'Compuerta H. Pone el qubit a girar de forma pareja: 50% de dar 0 y 50% de dar 1.',
  'compuerta': 'Una acción que le hacemos al qubit, como girarlo o voltearlo. Las computadoras cuánticas funcionan aplicando compuertas.',
  'circuito': 'La lista ordenada de compuertas que aplicamos a los qubits, como una receta de cocina.',
  'probabilidad': 'Qué tan posible es que algo pase, de 0% (nunca) a 100% (siempre). Es lo que esperamos en teoría.',
  'frecuencia': 'Cuántas veces pasó algo realmente al repetir el experimento. Ej.: salió 1 en 48 de 100 intentos = 48%.',
  'disparos': 'Cuántas veces repetimos el experimento (en inglés "shots"). Más disparos = resultados más confiables.',
  'ley de los grandes números': 'Mientras más veces repites un experimento, más se parece la frecuencia real a la probabilidad teórica.',
  'rotación': 'Girar el qubit un ángulo. 0° = siempre 0, 180° = siempre 1, ángulos intermedios = mezcla.',
  'entrelazamiento': 'Dos qubits conectados: aunque estén lejos, sus resultados quedan coordinados. Einstein lo llamó "acción fantasmal a distancia".',
  'CNOT': 'Compuerta de 2 qubits: si el primero (control) es 1, voltea al segundo (objetivo). Sirve para entrelazar.',
  'correlación': 'Qué tanto se parecen dos resultados. Si siempre coinciden, la correlación es perfecta.',
  'dato': 'Una observación del mundo real. Aquí: el tamaño de un meteorito.',
  'etiqueta': 'La respuesta correcta de un dato. Aquí: si el meteorito es peligroso (1) o seguro (0).',
  'modelo': 'La "IA": una fórmula con perillas que recibe un dato y hace una predicción.',
  'parámetro': 'Una perilla del modelo. Entrenar = encontrar los mejores valores de las perillas.',
  'precisión': 'Porcentaje de predicciones correctas del modelo (en inglés "accuracy").',
  'error': 'Qué tan lejos están las predicciones de las respuestas correctas (en inglés "loss"). Entrenar busca bajarlo.',
  'entrenamiento': 'Ajustar los parámetros poco a poco, usando los datos, para que el modelo se equivoque cada vez menos.',
  // Nivel 1
  'Ry': 'Compuerta de Rotación Y. Gira el qubit un ángulo θ: con ella eliges exactamente qué probabilidad tendrá cada resultado.',
  'Pauli-X': 'Compuerta X. Voltea el qubit: si estaba en 0 pasa a 1 y viceversa (como dar vuelta una moneda).',
  'Pauli-Y': 'Compuerta Y. También voltea el qubit, pero además le cambia la "fase" (un giro invisible al medir).',
  'Pauli-Z': 'Compuerta Z. Cambia la fase del qubit. Sola no cambia las probabilidades al medir, por eso parece que "no hace nada".',
  // Nivel 2
  'estado cuántico': 'La "ficha" que describe a un qubit. Aquí, cada operario se convierte en un estado según sus datos.',
  'fidelidad': 'Qué tan parecidos son dos estados cuánticos. 1 = idénticos, 0 = totalmente distintos.',
  'SWAP test': 'Circuito "radar" que compara dos estados: H, CSWAP y H. Si el monitor marca 100% son idénticos; si marca 50%, totalmente distintos.',
  'CSWAP': 'Compuerta de 3 cables (Fredkin). Si el primer qubit es 1, intercambia los otros dos. Es el corazón del SWAP test.',
  'ortogonal': 'Dos estados que no se parecen en nada (fidelidad 0). En el radar se ven como una lectura de 50%.',
  'KNN': 'K vecinos más cercanos (K-Nearest Neighbors). Para clasificar un dato nuevo, se miran los K datos más parecidos y gana la mayoría.',
  'vecino': 'Un dato ya conocido que se parece al dato que queremos clasificar.',
  'mayoría': 'Regla de votación: si 2 de 3 vecinos son rojos, el dato nuevo se clasifica como rojo.',
  'clasificar': 'Decidir a qué grupo pertenece un dato (por ejemplo: apto o exhausto).',
  // Nivel 3
  'red neuronal cuántica': 'Un circuito cuántico con perillas (parámetros) que aprende de los datos, como una red neuronal pero hecha de qubits.',
  'VQC': 'Clasificador Cuántico Variacional: una red neuronal cuántica que se entrena para separar datos en grupos.',
  'no lineal': 'Datos que no se pueden separar con una línea recta (por ejemplo: un grupo rodeado por otro).',
  'Rx': 'Compuerta de Rotación X. Otra perilla que gira el qubit, en otra dirección que Ry.',
  'frontera de decisión': 'La línea que separa lo que el modelo llama "sano" de lo que llama "dañado".',
  'gradiente': 'La dirección en la que hay que girar cada perilla para que el error baje más rápido.',
  'optimizador de gradiente': 'Algoritmo que mide el error, calcula el gradiente y gira las perillas automáticamente, paso a paso.',
  'convergencia': 'Cuando el entrenamiento ya no mejora más: el modelo encontró sus mejores perillas.',
};

const CHAPTERS = [
  // ---------------------------------------------------------------- 1
  {
    id: 'lumora',
    number: 'Capítulo 1',
    name: 'Lumora: El Faro Apagado',
    planet: { color1: '#ffd36e', color2: '#ff8a3d', emoji: '🗼' },
    summary: 'Arregla el faro cuántico para que las naves aterricen por turnos justos.',
    skills: ['Qubit', 'Superposición', 'Probabilidad'],
    lab: 'coin',
    intro: [
      { mood: 'nervous', text: '¡Ay, ay, ay! ¡Compañero, qué bueno que llegaste! Soy NOVA. El faro de Lumora está fallando y hay naves dando vueltas sin poder aterrizar...' },
      { mood: 'thinking', text: 'El faro decide qué fila de naves aterriza usando un [[qubit]]. Imagina una moneda mágica: cuando la miramos (eso se llama [[medición]]) muestra 0 o 1.' },
      { mood: 'sad', text: 'El problema: el faro SIEMPRE muestra 0. Siempre la misma fila. ¡La otra fila lleva horas esperando!' },
      { mood: 'happy', text: 'Necesitamos que sea justo: mitad de veces 0, mitad de veces 1. Primero veamos el problema. Pulsa MEDIR sin activar nada.' },
    ],
    missions: [
      {
        text: 'Mide el qubit sin activar ninguna compuerta',
        hint: 'Deja el interruptor de la compuerta H apagado y pulsa el botón MEDIR.',
        check: ev => !ev.hasH,
        reaction: { mood: 'surprised', text: '¿Ves? 100% ceros. Un qubit siempre empieza en 0, como una moneda quieta sobre la mesa mostrando la misma cara.' },
      },
      {
        text: 'Activa la compuerta H y vuelve a medir',
        hint: 'Enciende el interruptor "Compuerta H" (la H es de Hadamard) y pulsa MEDIR.',
        check: ev => ev.hasH,
        reaction: { mood: 'happy', text: '¡Ahora salen 0 y 1! La [[compuerta]] [[Hadamard]] pone la moneda a girar. Mientras gira está en [[superposición]]: puede caer en 0 o en 1.' },
      },
      {
        text: 'Con H activa, mide con 1000 disparos y logra entre 45% y 55% de unos',
        hint: 'Mueve el control de "disparos" hasta 1000. Con pocos disparos el resultado varía mucho; con muchos se estabiliza.',
        check: ev => ev.hasH && ev.shots >= 1000 && ev.p1 >= 0.45 && ev.p1 <= 0.55,
        reaction: { mood: 'celebrate', text: '¡Lo lograste! Con pocos [[disparos]] la [[frecuencia]] salta mucho, pero con muchos se acerca a la [[probabilidad]] de 50%. Eso es la [[ley de los grandes números]].' },
      },
    ],
    learned: [
      'Un <b>qubit</b> es como una moneda: al medirlo da 0 o 1.',
      'La compuerta <b>H (Hadamard)</b> lo pone en <b>superposición</b>: 50% / 50%.',
      '<b>Estadística:</b> la frecuencia observada se parece más a la probabilidad cuantas más repeticiones hacemos.',
    ],
  },
  // ---------------------------------------------------------------- 2
  {
    id: 'rotania',
    number: 'Capítulo 2',
    name: 'Rotania: Escudos al 75%',
    planet: { color1: '#7ef0ff', color2: '#3d7bff', emoji: '🛡️' },
    summary: 'Ajusta el escudo cuántico para resistir la lluvia de meteoros sin sobrecalentarse.',
    skills: ['Rotación', 'Probabilidad', 'Estimación'],
    lab: 'dial',
    intro: [
      { mood: 'nervous', text: '¡Alerta! Viene una lluvia de meteoros hacia Rotania. El escudo se enciende cada vez que el qubit da 1.' },
      { mood: 'thinking', text: 'Si lo encendemos siempre (100%) se sobrecalienta y explota. Si lo encendemos poco, pasan meteoros. Los ingenieros dicen que lo ideal es 75%.' },
      { mood: 'happy', text: 'En vez de un interruptor de encendido/apagado, aquí tenemos una perilla de [[rotación]]. Girando el qubit podemos elegir CUALQUIER probabilidad. ¡Probemos!' },
    ],
    missions: [
      {
        text: 'Gira el qubit 180° y mide',
        hint: 'Arrastra la perilla de ángulo hasta 180°: la flecha apuntará hacia abajo, al 1.',
        check: ev => ev.thetaDeg >= 178,
        reaction: { mood: 'surprised', text: 'Media vuelta = siempre 1. Es como voltear la moneda. Ahora, ¿qué pasará a mitad de camino?' },
      },
      {
        text: 'Pon la flecha en 90° y mide. ¿Te suena el resultado?',
        hint: 'Deja la perilla en 90°: la flecha queda acostada, a mitad entre el 0 y el 1.',
        check: ev => ev.thetaDeg >= 88 && ev.thetaDeg <= 92,
        reaction: { mood: 'happy', text: '¡50% / 50%! Igual que la compuerta H del faro. Una rotación de 90° crea la misma superposición pareja.' },
      },
      {
        text: 'Consigue que el escudo se encienda entre 70% y 80% de las veces (mínimo 500 disparos)',
        hint: 'La probabilidad teórica aparece junto a la perilla. Busca un ángulo donde diga cerca de 75% (alrededor de 120°) y mide con 500 disparos o más.',
        check: ev => ev.shots >= 500 && ev.p1 >= 0.70 && ev.p1 <= 0.80,
        reaction: { mood: 'celebrate', text: '¡Escudos al 75%! Elegiste la probabilidad exacta girando el qubit, y lo comprobaste con datos: eso es estimar una probabilidad con una muestra.' },
      },
    ],
    learned: [
      'Una <b>rotación</b> del qubit permite elegir cualquier probabilidad entre 0% y 100%.',
      '0° → siempre 0 · 90° → 50% · 180° → siempre 1.',
      '<b>Estadística:</b> medir muchas veces nos permite <b>estimar</b> una probabilidad desconocida.',
    ],
  },
  // ---------------------------------------------------------------- 3
  {
    id: 'binara',
    number: 'Capítulo 3',
    name: 'Binara: Los Planetas Gemelos',
    planet: { color1: '#ff8ad8', color2: '#8a5bff', emoji: '🪐' },
    summary: 'Conecta a NOVA con su primo ZIP para que tomen la misma decisión a distancia.',
    skills: ['Entrelazamiento', 'CNOT', 'Correlación'],
    lab: 'builder',
    intro: [
      { mood: 'happy', text: 'Te presento a mi primo ZIP. Él cuida el planeta gemelo de Binara, ¡a millones de kilómetros!' },
      { mood: 'nervous', text: 'Los dos planetas deben activar sus defensas a la vez, pero están tan lejos que los mensajes no llegan a tiempo. Si uno se activa y el otro no... ¡desastre!' },
      { mood: 'thinking', text: 'Cada uno tiene un qubit: el mío es q0 y el de ZIP es q1. Aquí puedes armar un [[circuito]]: una receta de compuertas. Empecemos simple.' },
    ],
    missions: [
      {
        text: 'Pon una H en NOVA (q0) y mide. ¿Coinciden NOVA y ZIP?',
        hint: 'Pulsa el botón "H en NOVA" para agregarla al circuito y luego MEDIR.',
        check: ev => ev.hasH0 && !ev.hasCX && ev.shots > 0,
        reaction: { mood: 'sad', text: 'Yo decido al azar, pero ZIP siempre dice 0. No estamos coordinados: solo coincidimos la mitad de las veces.' },
      },
      {
        text: 'Logra que NOVA y ZIP coincidan siempre, pero que sigan siendo al azar',
        hint: 'Prueba: H en NOVA, y después la compuerta CNOT (NOVA → ZIP). La CNOT copia la decisión de NOVA en ZIP.',
        check: ev => ev.agree >= 0.98 && ev.frac['00'] >= 0.3 && ev.frac['11'] >= 0.3,
        reaction: { mood: 'celebrate', text: '¡INCREÍBLE! Ahora solo sale 00 o 11: a veces ambos 0, a veces ambos 1, pero SIEMPRE iguales. Eso es [[entrelazamiento]]. Nuestra [[correlación]] es perfecta.' },
      },
      {
        text: 'Reto extra: que SIEMPRE estén en desacuerdo (01 o 10)',
        hint: 'Arma el circuito entrelazado y agrega una X en ZIP al final: la X voltea su resultado.',
        check: ev => ev.agree <= 0.02 && ev.frac['01'] >= 0.3 && ev.frac['10'] >= 0.3,
        reaction: { mood: 'celebrate', text: '¡Correlación inversa! Cuando yo digo 0, ZIP dice 1, y al revés. Ya dominas el entrelazamiento.' },
      },
    ],
    learned: [
      'El <b>entrelazamiento</b> conecta dos qubits: sus resultados quedan coordinados.',
      'Receta: <b>H</b> en el primer qubit + <b>CNOT</b> = estado entrelazado (estado de Bell).',
      '<b>Estadística:</b> la <b>correlación</b> mide qué tanto coinciden dos variables.',
    ],
  },
  // ---------------------------------------------------------------- 4
  {
    id: 'kora',
    number: 'Capítulo 4',
    name: 'Cinturón de Kora: Entrena tu IA',
    planet: { color1: '#9dff8a', color2: '#1fae7a', emoji: '☄️' },
    summary: 'Entrena un modelo cuántico que detecte meteoritos peligrosos.',
    skills: ['Machine Learning', 'Parámetros', 'Precisión'],
    lab: 'classifier',
    intro: [
      { mood: 'nervous', text: '¡El cinturón de Kora está lleno de meteoritos! Algunos son inofensivos, otros pueden destruir la nave. No puedo revisarlos uno por uno...' },
      { mood: 'thinking', text: 'Tenemos [[dato]]s de meteoritos ya revisados: su tamaño y su [[etiqueta]] (🟢 seguro o 🔴 peligroso). Con eso podemos crear un [[modelo]]: una IA que aprenda a decidir sola.' },
      { mood: 'happy', text: 'Mi modelo usa un qubit con rotación: el tamaño del meteorito decide cuánto gira. Las perillas w y b son sus [[parámetro]]s. La curva muestra qué tan peligroso cree el modelo que es cada tamaño.' },
    ],
    missions: [
      {
        text: 'Mueve las perillas w y b y observa cómo cambia la curva',
        hint: 'Arrastra cualquiera de las dos perillas del panel "Parámetros del modelo".',
        check: ev => ev.kind === 'manual',
        reaction: { mood: 'happy', text: 'Cada perilla cambia la forma de la curva. Si la curva está arriba de la línea del 50%, el modelo dice "peligroso".' },
      },
      {
        text: 'Ajustando tú las perillas, llega a 70% de precisión',
        hint: 'Los 🔴 están a la derecha (meteoritos grandes). Sube w hasta ~1 y mueve b para que la curva cruce el 50% cerca del medio.',
        check: ev => ev.kind === 'manual' && ev.accuracy >= 0.70,
        reaction: { mood: 'surprised', text: '¡Bien! Pero ajustar a mano es lento... ¿Y si dejamos que el modelo aprenda solo con los datos?' },
      },
      {
        text: 'Pulsa "Entrenar IA" y supera el 85% de precisión',
        hint: 'Pulsa el botón ENTRENAR IA y mira cómo el error baja en cada paso.',
        check: ev => ev.kind === 'train' && ev.accuracy >= 0.85,
        reaction: { mood: 'celebrate', text: '¡Eso es [[entrenamiento]]! En cada paso el modelo mira su [[error]] y mueve las perillas un poquito para equivocarse menos. ¡La nave está a salvo!' },
      },
    ],
    learned: [
      'Un <b>modelo</b> de IA es una fórmula con <b>parámetros</b> (perillas).',
      '<b>Entrenar</b> = ajustar los parámetros con datos para que el <b>error</b> baje.',
      'La <b>precisión</b> mide qué porcentaje de predicciones son correctas.',
      'Usaste un <b>clasificador cuántico</b>: ¡un qubit que aprende!',
    ],
  },
];
