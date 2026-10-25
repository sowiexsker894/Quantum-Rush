"""Utilidades compartidas por los motores cuánticos de cada nivel."""
from qiskit import QuantumCircuit

MAX_SHOTS = 5000


def clamp_shots(shots):
    """Limita la cantidad de disparos a un rango seguro para el servidor."""
    return max(1, min(int(shots), MAX_SHOTS))


def draw(qc):
    """Diagrama de texto del circuito, tal como lo dibuja Qiskit."""
    return qc.draw(output="text").single_string()


def build_circuit(n_qubits, gates):
    """Construye un QuantumCircuit a partir de la lista de compuertas enviada por la web.

    Cada compuerta es un dict: {"gate": "h", "q": 0}, {"gate": "ry", "q": 0, "theta": 0.9}
    o {"gate": "cx", "c": 0, "t": 1}.
    """
    qc = QuantumCircuit(n_qubits)
    for g in gates:
        name = g.get("gate")
        if name in ("h", "x", "y", "z"):
            getattr(qc, name)(int(g["q"]))
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
