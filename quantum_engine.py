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


# ---------- Nivel 2: La Sintonía (Baliza Alfa = q0, Baliza Beta = q1) ----------

def sintonia(gates, shots=1000):
    """Ejecuta el circuito de 2 qubits de La Sintonía (entrelazamiento y correlación)."""
    shots = max(1, min(int(shots), MAX_SHOTS))
    qc = build_circuit(2, gates)
    state = Statevector(qc)
    probs_dict = state.probabilities_dict()
    memory = state.sample_memory(shots)
    
    # Qiskit ordena qubits como q1q0 en las cadenas binarias.
    # Normalizamos a Alfa-Beta (q0, q1) invirtiendo la cadena de 2 caracteres.
    counts = {"00": 0, "01": 0, "10": 0, "11": 0}
    sequence = []
    for m in memory:
        ab = m[::-1]
        counts[ab] = counts.get(ab, 0) + 1
        sequence.append(ab)
        
    probabilities = {
        "00": round(float(probs_dict.get("00", 0.0)), 4),
        "01": round(float(probs_dict.get("10", 0.0)), 4),  # q0=0, q1=1
        "10": round(float(probs_dict.get("01", 0.0)), 4),  # q0=1, q1=0
        "11": round(float(probs_dict.get("11", 0.0)), 4),
    }
    
    agree_shots = counts["00"] + counts["11"]
    disagree_shots = counts["01"] + counts["10"]
    theory_agree = probabilities["00"] + probabilities["11"]
    
    # Correlación de Pearson cuántica: +1.0 (acuerdo total), -1.0 (oposición total), 0.0 (independientes)
    correlation = round((agree_shots - disagree_shots) / shots, 4)
    theory_correlation = round(theory_agree - (probabilities["01"] + probabilities["10"]), 4)

    lines = [
        "from qiskit import QuantumCircuit",
        "from qiskit.quantum_info import Statevector",
        "",
        "qc = QuantumCircuit(2)  # q0 = Baliza Alfa, q1 = Baliza Beta",
    ]
    for g in gates:
        name = g.get("gate")
        if name in ("h", "x", "y", "z"):
            lines.append(f"qc.{name}({g['q']})")
        elif name == "cx":
            lines.append(f"qc.cx({g['c']}, {g['t']})  # compuerta CNOT (entrelazamiento)")
    lines += [
        "",
        "estado = Statevector(qc)",
        f"conteos = estado.sample_counts({shots})",
        "print('Acuerdo:', (conteos.get('00', 0) + conteos.get('11', 0)) / shots)",
    ]

    return {
        "counts": counts,
        "probabilities": probabilities,
        "theory_agree": round(theory_agree, 4),
        "measured_agree": round(agree_shots / shots, 4),
        "theory_correlation": theory_correlation,
        "correlation": correlation,
        "shots": shots,
        "sequence": sequence[:60],
        "diagram": qc.draw(output="text").single_string(),
        "code": "\n".join(lines),
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
