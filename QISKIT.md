# Cómo usa Qiskit Quantum Rush

En Quantum Rush, **todo cálculo cuántico lo hace Qiskit en el backend** (Python + Flask). El navegador solo dibuja la interfaz. Cada vez que el jugador presiona **EJECUTAR**, el navegador envía el circuito que armó al servidor. El servidor construye ese circuito con Qiskit, lo simula y devuelve los resultados. La respuesta incluye el diagrama del circuito y el código Qiskit equivalente, que el jugador puede ver con el botón **VER CÓDIGO QISKIT**.

- Versión usada: `qiskit 2.6.1` (en `requirements.txt` se pide `qiskit>=1.0`).
- Componentes de Qiskit utilizados:
  - `QuantumCircuit`: construir los circuitos.
  - `quantum_info.Statevector`: simular el estado cuántico, calcular probabilidades y simular disparos (shots).
  - `quantum_info.Operator`: obtener la matriz del circuito entrenable del Nivel 3.
  - `QuantumCircuit.draw(output="text")`: el diagrama que se muestra en el juego.

---

## Arquitectura

```
Navegador (HTML/CSS/JS)                Servidor Flask (app.py)            Qiskit
───────────────────────                ───────────────────────            ──────
Jugador arma el circuito  ──POST JSON──▶  /api/nivel1        ──▶ quantum_engine.balance()
(arrastra compuertas)                   /api/nivel2/scan    ──▶ levels_engine.swap_test()
                                        /api/nivel3/eval    ──▶ levels_engine.vqc_eval()
                                        /api/nivel3/train   ──▶ levels_engine.vqc_train()
Anima resultados          ◀──JSON──────  probabilidades, conteos, diagrama, código
```

| Archivo | Qué contiene |
|---|---|
| `app.py` | Rutas Flask (API) que reciben el circuito y llaman al motor |
| `quantum_engine.py` | Nivel 1: construir y simular circuitos de 1 qubit (H, X, Y, Z, Ry, CNOT) |
| `levels_engine.py` | Nivel 2 (SWAP test + KNN) y Nivel 3 (clasificador variacional cuántico) |
| `static/js/level1.js`, `level2.js`, `level3.js` | Interfaz: arman la lista de compuertas y la envían con `api(...)` |

### Endpoints

| Ruta | Método | Entrada | Salida |
|---|---|---|---|
| `/api/nivel1` | POST | `{gates: [{gate:'h', q:0}] \| [{gate:'ry', q:0, theta}], shots}` | probabilidades A/B, conteos, secuencia de disparos, diagrama, código |
| `/api/nivel2/data` | GET | — | puntos del mapa y clase correcta de cada punto gris (calculada con Qiskit) |
| `/api/nivel2/scan` | POST | `{gates: ['h','cswap','h'], a, b, shots}` | similitud teórica y medida, conteos, fidelidad, diagrama, código |
| `/api/nivel3/data` | GET | — | 170 arándanos (x1, x2, etiqueta) |
| `/api/nivel3/eval` | POST | `{layers: ['ry','rx','cx'], params: [4 ángulos]}` | precisión, error, puntos mal clasificados, mapa de decisión 36×36 |
| `/api/nivel3/train` | POST | `{layers, params, epochs}` | historial del entrenamiento paso a paso |

---

## Nivel 1 · El Balance (superposición y rotación Ry)

**Idea:** un qubit representa a qué país va un paquete de energía: `|0⟩` = País A y `|1⟩` = País B.

- **Fase 1:** con **Hadamard (H)** el reparto queda 50 / 50.
- **Fase 2:** con **Ry(θ)** el jugador controla el reparto: P(A) = cos²(θ/2). Con θ ≈ 53° se obtiene el objetivo 80 / 20.

```python
# quantum_engine.py
def balance(gates, shots=1000):
    qc = build_circuit(1, gates)          # QuantumCircuit(1) + qc.h(0) o qc.ry(theta, 0)
    state = Statevector(qc)
    probs = state.probabilities()         # probabilidad teórica [P(A), P(B)]
    memory = state.sample_memory(shots)   # resultado de cada disparo, en orden
    ...
```

`sample_memory` devuelve cada disparo por separado, en orden. El juego usa esa secuencia para animar los paquetes de energía que viajan a cada país: lo que se ve en pantalla es el resultado real de Qiskit, no una animación inventada.

Circuito con θ = 53°:

```
   ┌─────────────┐
q: ┤ Ry(0.92502) ├
   └─────────────┘
```

---

## Nivel 2 · El Despliegue (SWAP test + KNN)

**Idea:** comparar a dos operarios sin medir distancias clásicas. Cada operario es un punto (x, y) del mapa y se codifica en un qubit:

```python
def _encode(qc, q, p):
    qc.ry(math.pi * p["x"], q)
    qc.rz(math.pi * p["y"], q)
```

### El "Radar de interferencia" = SWAP test

Usa 3 qubits:

- `q0` es el radar (ancilla).
- `q1` es el operario conocido.
- `q2` es el punto gris.

El jugador arma **H → CSWAP → H**:

```python
def swap_test(gates, a, b, shots=1000):
    qc = QuantumCircuit(3)
    _encode(qc, 1, a)
    _encode(qc, 2, b)
    qc.barrier()
    for g in gates:              # las compuertas que puso el jugador
        if g == "h":     qc.h(0)
        elif g == "cswap": qc.cswap(0, 1, 2)
        ...
    state = Statevector(qc)
    p0 = state.probabilities([0])[0]                 # P(q0 = 0), teórica
    counts = state.sample_counts(shots, qargs=[0])   # medición simulada del radar
```

El radar mide la probabilidad de que `q0` dé 0:

**P(0) = (1 + F) / 2**, donde F = |⟨a|b⟩|² es la **fidelidad** (qué tan parecidos son los estados).

- **100%**: los estados son idénticos (F = 1).
- **50%**: los estados son totalmente distintos u ortogonales (F = 0).

Primer escaneo del juego (operario sano contra el punto gris): resultado teórico 50.8%, con fidelidad 0.016. Es decir, son totalmente distintos y el punto gris está **exhausto**.

```
                                  ░ ┌───┐   ┌───┐
q_0: ─────────────────────────────░─┤ H ├─■─┤ H ├
      ┌──────────┐  ┌─────────┐   ░ └───┘ │ └───┘
q_1: ─┤ Ry(π/25) ├──┤ Rz(π/2) ├───░───────X──────
     ┌┴──────────┴┐┌┴─────────┴─┐ ░       │
q_2: ┤ Ry(24π/25) ├┤ Rz(23π/50) ├─░───────X──────
     └────────────┘└────────────┘ ░
```

Si el jugador arma mal el circuito, Qiskit lo refleja y NOVA lo explica:

| Circuito armado | Resultado de Qiskit | Por qué |
|---|---|---|
| Solo CSWAP (sin H) | 100%, una lectura falsa | sin H no hay interferencia: q0 nunca cambia |
| H → CSWAP (sin la H final) | siempre 50% | la interferencia no se cierra |
| **H → CSWAP → H** | (1 + F) / 2 | SWAP test correcto |

### KNN con K = 3

En la fase 2 el jugador traza cables desde cada punto gris hacia 3 puntos de color. **Cada cable ejecuta un SWAP test en Qiskit** (`/api/nivel2/scan`) y muestra la similitud medida. Con 3 cables, la clase del punto gris se decide por mayoría de votos.

La respuesta correcta también la calcula Qiskit (`l2_data()`): para cada punto gris ordena a todos los operarios por fidelidad (`Statevector.inner`), toma los 3 más parecidos y vota.

---

## Nivel 3 · La Cosecha (clasificador variacional cuántico, VQC)

**Idea:** una "red neuronal cuántica" aprende a separar arándanos sanos (centro) de dañados (anillo exterior). Estos datos son **no lineales**: ninguna línea recta los separa.

### Circuito

1. **Datos:** se codifica `ry(π·x1)` en q0 y `ry(π·x2)` en q1.
2. **Cerebro entrenable:** las compuertas que coloca el jugador:
   - Ry(θ) en los dos qubits (2 parámetros).
   - Rx(θ) en los dos qubits (2 parámetros).
   - CNOT, que entrelaza los dos cables.
3. **Predicción:** P(dañado) = 1 − P(|00⟩).

```python
def vqc_circuit(layers, params):
    qc = QuantumCircuit(2)
    for layer in layers:              # orden elegido por el jugador
        if layer in ("ry", "rx"):
            getattr(qc, layer)(params[k], 0)
            getattr(qc, layer)(params[k + 1], 1)
        elif layer == "cx":
            qc.cx(0, 1)
    return qc
```

```
     ┌─────────┐┌─────────┐
q_0: ┤ Ry(1.6) ├┤ Rx(0.9) ├───■──
     ├─────────┤├─────────┴┐┌─┴─┐
q_1: ┤ Ry(1.6) ├┤ Rx(-0.9) ├┤ X ├
     └─────────┘└──────────┘└───┘
```

### Evaluación (EJECUTAR y perillas manuales)

Para que el juego responda en tiempo real mientras el jugador mueve las perillas, se precalcula con `Statevector` el estado cuántico de cada dato (una sola vez). En cada evaluación se obtiene la matriz del circuito entrenable con `Operator` y se aplica a todos los estados a la vez:

```python
def _vqc_probs(layers, params, states):
    u = Operator(vqc_circuit(layers, params)).data   # matriz 4x4 del circuito
    return 1 - np.abs((states @ u.T)[:, 0]) ** 2       # P(dañado) para cada dato
```

El resultado es matemáticamente idéntico a simular cada circuito completo con `Statevector`, pero mucho más rápido. Con los mismos cálculos se generan:

- la precisión del modelo;
- el error (error cuadrático medio);
- la lista de puntos mal clasificados;
- el mapa de calor de 36×36 que dibuja la **frontera de decisión**.

Sin entrenar, el modelo acierta 62%.

### Optimizador de gradiente (entrenamiento)

Cuando el jugador conecta el **OPTIMIZADOR DE GRADIENTE** y presiona EJECUTAR, el servidor entrena el modelo con descenso de gradiente. Usa la **regla de parameter shift**, la misma técnica con la que se calculan gradientes en hardware cuántico real:

```python
def vqc_train(layers, params, epochs=36, lr=1.2):
    shift = math.pi / 2
    for epoch in range(1, epochs + 1):
        p = _vqc_probs(layers, params, _BERRY_STATES)
        for i in range(len(params)):
            up, down = params + shift en i, params - shift en i
            dp = (P(up) - P(down)) / 2                     # derivada exacta por parameter shift
            grads.append(mean(2 * (p - y) * dp))           # gradiente del error cuadrático
        params = [v - lr * g for v, g in zip(params, grads)]
```

El servidor devuelve el historial completo: en cada paso, los ángulos, el error y la precisión, y cada 2 pasos también el mapa de decisión. El navegador anima ese historial: las perillas giran solas, la curva de error baja y la frontera se cierra alrededor de los arándanos sanos. En 36 pasos la precisión sube de **62% a 100%** (unos 0.8 s de cálculo).

---

## Resumen: qué aprende el jugador y dónde lo calcula Qiskit

| Nivel | Concepto | Herramienta de Qiskit |
|---|---|---|
| 1 | Superposición (H), rotación controlada (Ry), medición y disparos | `QuantumCircuit.h/ry`, `Statevector.probabilities`, `sample_memory` |
| 2 | Fidelidad, SWAP test, interferencia, KNN | `QuantumCircuit.cswap`, `Statevector.probabilities([0])`, `sample_counts(qargs=[0])`, `Statevector.inner` |
| 3 | Datos no lineales, entrelazamiento (CNOT), parámetros, entrenamiento | `QuantumCircuit.ry/rx/cx`, `Operator`, `Statevector`, gradiente por parameter shift |

## Cómo probarlo sin el juego

```bash
pip install -r requirements.txt
python -c "import levels_engine as le; print(le.swap_test(['h','cswap','h'], le.L2_HEALTHY, le.L2_FIRST_GRAY)['diagram'])"
python -c "import levels_engine as le; print(le.vqc_train(['ry','rx','cx'], [1.6,1.6,0.9,-0.9])['history'][-1]['accuracy'])"
```

Dentro del juego, el botón **VER CÓDIGO QISKIT** de cada nivel muestra el diagrama y un código Qiskit equivalente que se puede copiar y ejecutar por separado.
