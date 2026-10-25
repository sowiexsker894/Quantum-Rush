"""Nivel 3 · La Cosecha: clasificador cuántico variacional (VQC) entrenado con parameter shift."""
import math
import random

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Operator, Statevector

from .common import draw

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
        "diagram": draw(vqc_circuit(layers, params)),
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
            "diagram": draw(vqc_circuit(layers, params))}


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
