"""Motor cuántico de Quantum Rush: toda la física pasa por Qiskit."""
import math
import random

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

MAX_QUBITS = 3
MAX_SHOTS = 5000


def build_circuit(n_qubits, gates):
    """Construye un QuantumCircuit a partir de la lista de compuertas enviada por la web."""
    qc = QuantumCircuit(n_qubits)
    for g in gates:
        name = g.get("gate")
        if name == "h":
            qc.h(int(g["q"]))
        elif name == "x":
            qc.x(int(g["q"]))
        elif name == "y":
            qc.y(int(g["q"]))
        elif name == "z":
            qc.z(int(g["q"]))
        elif name == "ry":
            qc.ry(float(g["theta"]), int(g["q"]))
        elif name == "cx":
            qc.cx(int(g["c"]), int(g["t"]))
        else:
            raise ValueError(f"Compuerta desconocida: {name}")
    return qc


def circuit_to_code(n_qubits, gates, shots):
    """Genera el código Qiskit equivalente para que el jugador lo vea."""
    lines = [
        "from qiskit import QuantumCircuit",
        "from qiskit.quantum_info import Statevector",
        "",
        f"qc = QuantumCircuit({n_qubits})",
    ]
    for g in gates:
        if g["gate"] in ("h", "x", "y", "z"):
            lines.append(f"qc.{g['gate']}({g['q']})")
        elif g["gate"] == "ry":
            lines.append(f"qc.ry({float(g['theta']):.3f}, {g['q']})")
        elif g["gate"] == "cx":
            lines.append(f"qc.cx({g['c']}, {g['t']})")
    lines += [
        "",
        "estado = Statevector(qc)",
        f"conteos = estado.sample_counts(shots={shots})",
        "print(conteos)",
    ]
    return "\n".join(lines)


def run(n_qubits, gates, shots):
    n_qubits = max(1, min(int(n_qubits), MAX_QUBITS))
    shots = max(1, min(int(shots), MAX_SHOTS))
    qc = build_circuit(n_qubits, gates)
    state = Statevector(qc)
    probs = state.probabilities_dict()
    counts = state.sample_counts(shots=shots)
    # Asegura que aparezcan todos los resultados posibles, aunque tengan 0
    all_keys = [format(i, f"0{n_qubits}b") for i in range(2 ** n_qubits)]
    return {
        "counts": {k: int(counts.get(k, 0)) for k in all_keys},
        "probabilities": {k: round(float(probs.get(k, 0.0)), 4) for k in all_keys},
        "shots": shots,
        "diagram": qc.draw(output="text").single_string(),
        "code": circuit_to_code(n_qubits, gates, shots),
    }


# ---------- Nivel 1: El Balance (País A = |0>, País B = |1>) ----------

def balance(gates, shots=1000):
    """Ejecuta el circuito de 1 qubit del Nivel 1 y devuelve probabilidades y la secuencia de disparos."""
    shots = max(1, min(int(shots), MAX_SHOTS))
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
        "diagram": qc.draw(output="text").single_string(),
        "code": circuit_to_code(1, gates, shots),
    }


# ---------- Capítulo 4: clasificador cuántico de 1 qubit ----------

def make_meteor_dataset(n=24, seed=7):
    """Meteoritos con tamaño x en [0,1]: mitad seguros (0, pequeños) y mitad peligrosos (1, grandes).
    Hay algunos casos dudosos cerca del límite, como en la vida real."""
    rng = random.Random(seed)
    data = []
    for i in range(n):
        label = i % 2
        x = rng.uniform(0.05, 0.6) if label == 0 else rng.uniform(0.42, 0.95)
        data.append({"x": round(x, 3), "y": label})
    rng.shuffle(data)
    return data


def classifier_prob(x, w, b):
    """P(peligroso) = probabilidad de medir |1> tras RY(w*x*pi + b)."""
    qc = QuantumCircuit(1)
    qc.ry(w * x * math.pi + b, 0)
    return float(Statevector(qc).probabilities()[1])


def evaluate(data, w, b):
    preds, loss, correct = [], 0.0, 0
    for d in data:
        p = classifier_prob(d["x"], w, b)
        pred = 1 if p >= 0.5 else 0
        correct += pred == d["y"]
        loss += (p - d["y"]) ** 2
        preds.append({"x": d["x"], "y": d["y"], "p": round(p, 4), "pred": pred})
    n = len(data)
    return {"accuracy": round(correct / n, 4), "loss": round(loss / n, 4), "points": preds}


def train(data, w, b, epochs=40, lr=0.35):
    """Descenso de gradiente con la regla de 'parameter shift' (como en hardware cuántico real)."""
    history = []
    shift = math.pi / 2
    for epoch in range(epochs):
        gw = gb = 0.0
        for d in data:
            p = classifier_prob(d["x"], w, b)
            # dP/dθ por parameter shift; θ = w*x*pi + b
            dp = (classifier_prob(d["x"], w, b + shift) - classifier_prob(d["x"], w, b - shift)) / 2
            err = 2 * (p - d["y"])
            gw += err * dp * d["x"] * math.pi
            gb += err * dp
        w -= lr * gw / len(data)
        b -= lr * gb / len(data)
        ev = evaluate(data, w, b)
        history.append({"epoch": epoch + 1, "w": round(w, 4), "b": round(b, 4),
                        "loss": ev["loss"], "accuracy": ev["accuracy"]})
    final = evaluate(data, w, b)
    return {"w": w, "b": b, "history": history, **final}
