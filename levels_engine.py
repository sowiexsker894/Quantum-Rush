"""Motor cuántico de los Niveles 2 y 3 (Qiskit)."""
import math
import random

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Operator, Statevector

MAX_SHOTS = 5000

# ---------- Nivel 2: El Despliegue (SWAP test + KNN) ----------
# Cada operario es un punto (x, y) del mapa en [0, 1]. Se codifica en un qubit:
# theta = pi * x (inclinación en la esfera) y phi = pi * y (giro alrededor del eje).

L2_POINTS = [
    # Aptos (0)
    {"id": "a1", "x": 0.10, "y": 0.22, "label": 0}, {"id": "a2", "x": 0.20, "y": 0.48, "label": 0},
    {"id": "a3", "x": 0.30, "y": 0.18, "label": 0}, {"id": "a4", "x": 0.14, "y": 0.72, "label": 0},
    {"id": "a5", "x": 0.33, "y": 0.62, "label": 0}, {"id": "a6", "x": 0.24, "y": 0.90, "label": 0},
    {"id": "a7", "x": 0.42, "y": 0.38, "label": 0},
    # Exhaustos (1)
    {"id": "e1", "x": 0.62, "y": 0.16, "label": 1}, {"id": "e2", "x": 0.76, "y": 0.30, "label": 1},
    {"id": "e3", "x": 0.90, "y": 0.14, "label": 1}, {"id": "e4", "x": 0.70, "y": 0.62, "label": 1},
    {"id": "e5", "x": 0.88, "y": 0.58, "label": 1}, {"id": "e6", "x": 0.62, "y": 0.86, "label": 1},
    {"id": "e7", "x": 0.80, "y": 0.84, "label": 1},
]
L2_HEALTHY = {"x": 0.04, "y": 0.50}                  # perfil cuántico de un operario sano
L2_FIRST_GRAY = {"id": "g0", "x": 0.96, "y": 0.46}    # escuadrón gris del primer escaneo
L2_GRAYS = [{"id": "g1", "x": 0.26, "y": 0.32}, {"id": "g2", "x": 0.80, "y": 0.44}, {"id": "g3", "x": 0.30, "y": 0.80}]


def _encode(qc, q, p):
    qc.ry(math.pi * p["x"], q)
    qc.rz(math.pi * p["y"], q)


def fidelity(a, b):
    """|<a|b>|^2 exacto entre dos operarios codificados."""
    sa, sb = QuantumCircuit(1), QuantumCircuit(1)
    _encode(sa, 0, a)
    _encode(sb, 0, b)
    return float(abs(Statevector(sa).inner(Statevector(sb))) ** 2)


def swap_test(gates, a, b, shots=1000):
    """Radar de interferencia: q0 = radar, q1 = |Apto>, q2 = |Gris>. Lee P(q0 = 0)."""
    shots = max(1, min(int(shots), MAX_SHOTS))
    qc = QuantumCircuit(3)
    _encode(qc, 1, a)
    _encode(qc, 2, b)
    qc.barrier()
    used = []
    for g in gates:
        if g == "h":
            qc.h(0)
        elif g == "cswap":
            qc.cswap(0, 1, 2)
        elif g in ("x", "y", "z"):
            getattr(qc, g)(0)
        else:
            continue
        used.append(g)
    state = Statevector(qc)
    p0 = float(state.probabilities([0])[0])
    counts = state.sample_counts(shots, qargs=[0])
    zeros = int(counts.get("0", 0))
    lines = [
        "from qiskit import QuantumCircuit",
        "from qiskit.quantum_info import Statevector",
        "import math",
        "",
        "qc = QuantumCircuit(3)  # q0 = radar, q1 = |Apto>, q2 = |Gris>",
        f"qc.ry(math.pi * {a['x']}, 1); qc.rz(math.pi * {a['y']}, 1)",
        f"qc.ry(math.pi * {b['x']}, 2); qc.rz(math.pi * {b['y']}, 2)",
    ]
    lines += ["qc.cswap(0, 1, 2)" if g == "cswap" else f"qc.{g}(0)" for g in used]
    lines += ["", "estado = Statevector(qc)",
              f"conteos = estado.sample_counts({shots}, qargs=[0])",
              f"similitud = conteos.get('0', 0) / {shots}   # 100% = idénticos, 50% = totalmente distintos"]
    return {
        "theory": round(p0, 4),
        "measured": round(zeros / shots, 4),
        "counts": {"0": zeros, "1": shots - zeros},
        "shots": shots,
        "fidelity": round(fidelity(a, b), 4),
        "diagram": qc.draw(output="text").single_string(),
        "code": "\n".join(lines),
    }


def l2_data():
    """Datos del mapa + la clase correcta de cada gris según sus 3 vecinos más parecidos (KNN, K = 3)."""
    grays = []
    for g in L2_GRAYS:
        ranked = sorted(L2_POINTS, key=lambda p: -fidelity(g, p))[:3]
        votes = sum(p["label"] for p in ranked)
        grays.append({**g, "label": 1 if votes >= 2 else 0, "nearest": [p["id"] for p in ranked]})
    return {"points": L2_POINTS, "healthy": L2_HEALTHY, "first": {**L2_FIRST_GRAY, "label": 1}, "grays": grays}


# ---------- Nivel 3: La Cosecha (clasificador variacional cuántico) ----------
# Datos: arándanos con 2 medidas (x1, x2) en [-1, 1]. Sanos (0) en el centro, dañados (1) en el anillo exterior.
# Codificación: RY(pi*x1) en q0 y RY(pi*x2) en q1. Modelo: capas Ry / Rx (2 parámetros cada una) y CNOT.
# Predicción: P(dañado) = 1 - P(|00>) al final del circuito.

def _make_berries(n=170, seed=3):
    rng = random.Random(seed)
    pts = []
    while len(pts) < n:
        x, y = rng.uniform(-1, 1), rng.uniform(-1, 1)
        r = math.hypot(x, y)
        if r < 0.42:
            pts.append((round(x, 3), round(y, 3), 0))
        elif 0.62 < r < 0.97:
            pts.append((round(x, 3), round(y, 3), 1))
    return pts


def _encode_states(xy):
    """Estados cuánticos de cada dato, calculados con Qiskit una sola vez."""
    states = []
    for x1, x2 in xy:
        qc = QuantumCircuit(2)
        qc.ry(math.pi * x1, 0)
        qc.ry(math.pi * x2, 1)
        states.append(Statevector(qc).data)
    return np.array(states)


BERRIES = _make_berries()
GRID_N = 36
_GRID_XY = [(-1 + 2 * (i + 0.5) / GRID_N, -1 + 2 * (j + 0.5) / GRID_N) for j in range(GRID_N) for i in range(GRID_N)]
_BERRY_STATES = _encode_states([(b[0], b[1]) for b in BERRIES])
_GRID_STATES = _encode_states(_GRID_XY)
_BERRY_Y = np.array([b[2] for b in BERRIES])
VQC_LAYERS = ("ry", "rx", "cx")


def vqc_circuit(layers, params):
    """Parte entrenable del circuito (el 'cerebro')."""
    qc = QuantumCircuit(2)
    k = 0
    for layer in layers:
        if layer in ("ry", "rx"):
            getattr(qc, layer)(params[k], 0)
            getattr(qc, layer)(params[k + 1], 1)
            k += 2
        elif layer == "cx":
            qc.cx(0, 1)
    return qc


def _clean(layers, params):
    layers = [l for l in layers if l in VQC_LAYERS]
    n = 2 * sum(l in ("ry", "rx") for l in layers)
    params = [float(v) for v in params][:n]
    params += [0.0] * (n - len(params))
    return layers, params


def _vqc_probs(layers, params, states):
    u = Operator(vqc_circuit(layers, params)).data
    return 1 - np.abs((states @ u.T)[:, 0]) ** 2


def vqc_eval(layers, params):
    layers, params = _clean(layers, params)
    p = _vqc_probs(layers, params, _BERRY_STATES)
    pred = (p >= 0.5).astype(int)
    return {
        "accuracy": round(float(np.mean(pred == _BERRY_Y)), 4),
        "loss": round(float(np.mean((p - _BERRY_Y) ** 2)), 4),
        "wrong": [int(i) for i in np.where(pred != _BERRY_Y)[0]],
        "grid": [round(float(v), 2) for v in _vqc_probs(layers, params, _GRID_STATES)],
        "code": vqc_code(layers, params),
        "diagram": vqc_circuit(layers, params).draw(output="text").single_string(),
    }


def vqc_train(layers, params, epochs=36, lr=1.2):
    """Optimizador de gradiente con la regla de 'parameter shift' (como en hardware cuántico real)."""
    layers, params = _clean(layers, params)
    history = []
    shift = math.pi / 2
    for epoch in range(1, epochs + 1):
        p = _vqc_probs(layers, params, _BERRY_STATES)
        grads = []
        for i in range(len(params)):
            up, down = list(params), list(params)
            up[i] += shift
            down[i] -= shift
            dp = (_vqc_probs(layers, up, _BERRY_STATES) - _vqc_probs(layers, down, _BERRY_STATES)) / 2
            grads.append(float(np.mean(2 * (p - _BERRY_Y) * dp)))
        params = [v - lr * g for v, g in zip(params, grads)]
        p = _vqc_probs(layers, params, _BERRY_STATES)
        pred = (p >= 0.5).astype(int)
        step = {"epoch": epoch, "params": [round(v, 4) for v in params],
                "loss": round(float(np.mean((p - _BERRY_Y) ** 2)), 4),
                "accuracy": round(float(np.mean(pred == _BERRY_Y)), 4)}
        if epoch % 2 == 0 or epoch == epochs:
            step["grid"] = [round(float(v), 2) for v in _vqc_probs(layers, params, _GRID_STATES)]
            step["wrong"] = [int(i) for i in np.where(pred != _BERRY_Y)[0]]
        history.append(step)
    return {"history": history, "code": vqc_code(layers, params),
            "diagram": vqc_circuit(layers, params).draw(output="text").single_string()}


def vqc_code(layers, params):
    lines = ["from qiskit import QuantumCircuit", "from qiskit.quantum_info import Statevector", "import math", "",
             "def predecir(x1, x2):", "    qc = QuantumCircuit(2)",
             "    qc.ry(math.pi * x1, 0)   # datos del arándano", "    qc.ry(math.pi * x2, 1)"]
    k = 0
    for layer in layers:
        if layer in ("ry", "rx"):
            lines.append(f"    qc.{layer}({params[k]:.3f}, 0); qc.{layer}({params[k + 1]:.3f}, 1)   # perillas")
            k += 2
        elif layer == "cx":
            lines.append("    qc.cx(0, 1)   # entrelazamiento")
    lines += ["    p00 = Statevector(qc).probabilities()[0]", "    return 1 - p00   # probabilidad de que esté dañado"]
    return "\n".join(lines)


def l3_data():
    return {"berries": [{"x": b[0], "y": b[1], "label": b[2]} for b in BERRIES], "grid_n": GRID_N}
