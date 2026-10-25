"""Nivel 1 · El Balance: superposición (H) y rotación controlada (Ry).

País A = |0>, País B = |1>. Con H el reparto es 50/50; con Ry(θ), P(A) = cos²(θ/2).
"""
from qiskit.quantum_info import Statevector

from .common import build_circuit, circuit_to_code, clamp_shots, draw


def balance(gates, shots=1000):
    """Ejecuta el circuito de 1 qubit y devuelve probabilidades y la secuencia de disparos."""
    shots = clamp_shots(shots)
    qc = build_circuit(1, gates)
    state = Statevector(qc)
    probs = state.probabilities()
    memory = state.sample_memory(shots)  # resultado de cada disparo, en orden
    count_b = sum(1 for m in memory if m == "1")
    return {
        "theory": {"A": round(float(probs[0]), 4), "B": round(float(probs[1]), 4)},
        "counts": {"A": shots - count_b, "B": count_b},
        "shots": shots,
        "sequence": "".join("A" if m == "0" else "B" for m in memory[:60]),
        "diagram": draw(qc),
        "code": circuit_to_code(1, gates, shots),
    }
