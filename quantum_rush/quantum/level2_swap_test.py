"""Nivel 2 · El Despliegue: SWAP test (fidelidad entre estados) + KNN con K = 3."""
import math

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

from .common import clamp_shots, draw

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
    shots = clamp_shots(shots)
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
        "diagram": draw(qc),
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
