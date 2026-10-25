from flask import Flask, jsonify, render_template, request
from qiskit.exceptions import QiskitError

import levels_engine as le
import quantum_engine as qe

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static"),
)
METEORS = qe.make_meteor_dataset()
ERRORS = (ValueError, KeyError, TypeError, AttributeError, QiskitError)


import json
import re

# En Vercel Serverless el sistema de archivos raíz es de solo lectura, por lo que usamos /tmp
if os.environ.get("VERCEL"):
    LEADERBOARD_FILE = os.path.join("/tmp", "leaderboard.json")
    COMMUNITY_FILE = os.path.join("/tmp", "community_challenges.json")
else:
    LEADERBOARD_FILE = os.path.join(BASE_DIR, "leaderboard.json")
    COMMUNITY_FILE = os.path.join(BASE_DIR, "community_challenges.json")

def load_leaderboard():
    if not os.path.exists(LEADERBOARD_FILE):
        return []
    try:
        with open(LEADERBOARD_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
    except Exception:
        pass
    return []

def save_leaderboard(entries):
    try:
        with open(LEADERBOARD_FILE, "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

DEFAULT_COMMUNITY_CHALLENGES = [
    {
        "id": "com-1",
        "theme": "balance",
        "title": "Suministro Crítico Hospitalario",
        "author": "Dra. S. Ramos",
        "context": "Un hospital de campaña (Nodo A) y un centro de investigación (Nodo B) compiten por el generador cuántico. El hospital requiere el 85% de la carga energética constante y el centro solo el 15%.",
        "target_desc": "Configura la probabilidad para que el Nodo A reciba el 85% (0.85) y Nodo B el 15% (0.15).",
        "target_val": 0.85,
        "date": "2026-10-25"
    },
    {
        "id": "com-2",
        "theme": "sintonia",
        "title": "Cripto-Enlace Cuántico Satelital",
        "author": "Ing. Aris Thorne",
        "context": "Dos sondas orbitales deben verificar claves seguras sin intermediarios. Deben entrelazarse para lograr una correlación idéntica absoluta (100% de acuerdo).",
        "target_desc": "Genera el estado entrelazado de Bell logrando 100% de acuerdo y correlación +1.00.",
        "target_val": 1.0,
        "date": "2026-10-25"
    },
    {
        "id": "com-3",
        "theme": "despliegue",
        "title": "Clasificación de Drones de Reconocimiento",
        "author": "Comandante Vane",
        "context": "Varios drones autónomos regresaron dañados por radiación cósmica. Usa el radar SWAP Test y clasifícalos con KNN comparándolos contra firmas de vuelo sanas y comprometidas.",
        "target_desc": "Diagnostica los drones sin etiquetar mediante comparación cuántica de fidelidad.",
        "target_val": 1.0,
        "date": "2026-10-25"
    },
    {
        "id": "com-4",
        "theme": "cosecha",
        "title": "Detección de Plasma Inestable en Reactores",
        "author": "Dra. H. Lin",
        "context": "Los sensores del reactor tokamak captan lecturas no lineales de densidad y temperatura. Entrena una Red Neuronal Cuántica (VQC) para aislar las bolsas de plasma inestables.",
        "target_desc": "Entrena el circuito variacional hasta superar el 90% de precisión.",
        "target_val": 0.90,
        "date": "2026-10-25"
    }
]

def load_community_challenges():
    if not os.path.exists(COMMUNITY_FILE):
        return DEFAULT_COMMUNITY_CHALLENGES
    try:
        with open(COMMUNITY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list) and len(data) > 0:
                return data
    except Exception:
        pass
    return DEFAULT_COMMUNITY_CHALLENGES

def save_community_challenges(challenges):
    try:
        with open(COMMUNITY_FILE, "w", encoding="utf-8") as f:
            json.dump(challenges, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


@app.route("/")
def index():
    return render_template("index.html")


@app.get("/api/community")
def api_get_community():
    return jsonify(load_community_challenges())


@app.post("/api/community")
def api_post_community():
    body = request.get_json(force=True) or {}
    title = str(body.get("title", "")).strip()
    author = str(body.get("author", "")).strip() or "Operador Anónimo"
    theme = str(body.get("theme", "")).strip().lower()
    context = str(body.get("context", "")).strip()
    target_desc = str(body.get("target_desc", "")).strip()
    
    if not title or not context:
        return jsonify({"error": "Título y contexto son obligatorios"}), 400
    if theme not in ("balance", "sintonia", "despliegue", "cosecha"):
        return jsonify({"error": "Tema cuántico no válido"}), 400

    target_val = body.get("target_val")
    try:
        target_val = float(target_val) if target_val is not None else 0.8
    except (ValueError, TypeError):
        target_val = 0.8

    import datetime
    now_str = datetime.datetime.now().strftime("%Y-%m-%d")
    import uuid
    new_id = f"com-{uuid.uuid4().hex[:6]}"

    challenges = load_community_challenges()
    new_challenge = {
        "id": new_id,
        "theme": theme,
        "title": title,
        "author": author,
        "context": context,
        "target_desc": target_desc or "Completa la configuración requerida por el reto.",
        "target_val": target_val,
        "date": now_str
    }
    challenges.insert(0, new_challenge)
    save_community_challenges(challenges)
    return jsonify({"success": True, "challenge": new_challenge, "challenges": challenges})


@app.get("/api/leaderboard")
def api_get_leaderboard():
    entries = load_leaderboard()
    # Sort by total_seconds ascending
    entries.sort(key=lambda x: (x.get("total_seconds", 999999), x.get("timestamp", "")))
    return jsonify(entries[:50])


@app.post("/api/leaderboard")
def api_post_leaderboard():
    body = request.get_json(force=True) or {}
    email = str(body.get("email", "")).strip().lower()
    total_seconds = body.get("total_seconds")
    
    # Validations
    if not email or "@" not in email or "." not in email:
        return jsonify({"error": "Correo electrónico inválido"}), 400
    try:
        total_seconds = float(total_seconds)
        if total_seconds <= 0:
            return jsonify({"error": "Tiempo inválido"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Tiempo inválido"}), 400
        
    mins = int(total_seconds // 60)
    secs = int(total_seconds % 60)
    time_str = f"{mins:02d}:{secs:02d}"
    
    entries = load_leaderboard()
    import datetime
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # Check if email already exists, update if better time
    existing = next((item for item in entries if item.get("email") == email), None)
    if existing:
        if total_seconds < existing.get("total_seconds", 999999):
            existing["total_seconds"] = total_seconds
            existing["time"] = time_str
            existing["date"] = now_str
    else:
        entries.append({
            "email": email,
            "total_seconds": total_seconds,
            "time": time_str,
            "date": now_str
        })
        
    entries.sort(key=lambda x: (x.get("total_seconds", 999999), x.get("timestamp", "")))
    save_leaderboard(entries)
    return jsonify({"success": True, "leaderboard": entries[:50]})



@app.post("/api/run")
def api_run():
    body = request.get_json(force=True)
    try:
        result = qe.run(body.get("n_qubits", 1), body.get("gates", []), body.get("shots", 100))
    except ERRORS as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@app.post("/api/nivel1")
def api_nivel1():
    body = request.get_json(force=True)
    try:
        result = qe.balance(body.get("gates", []), body.get("shots", 1000))
    except ERRORS as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@app.post("/api/sintonia")
def api_sintonia():
    body = request.get_json(force=True)
    try:
        result = qe.sintonia(body.get("gates", []), body.get("shots", 1000))
    except ERRORS as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@app.get("/api/nivel2/data")
def api_nivel2_data():
    return jsonify(le.l2_data())


@app.post("/api/nivel2/scan")
def api_nivel2_scan():
    body = request.get_json(force=True)
    try:
        result = le.swap_test(body.get("gates", []), body["a"], body["b"], body.get("shots", 1000))
    except ERRORS as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@app.get("/api/nivel3/data")
def api_nivel3_data():
    return jsonify(le.l3_data())


@app.post("/api/nivel3/eval")
def api_nivel3_eval():
    body = request.get_json(force=True)
    try:
        result = le.vqc_eval(body.get("layers", []), body.get("params", []))
    except ERRORS as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@app.post("/api/nivel3/train")
def api_nivel3_train():
    body = request.get_json(force=True)
    epochs = max(1, min(int(body.get("epochs", 36)), 50))
    try:
        result = le.vqc_train(body.get("layers", []), body.get("params", []), epochs=epochs)
    except ERRORS as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@app.get("/api/meteors")
def api_meteors():
    return jsonify(METEORS)


@app.post("/api/classify")
def api_classify():
    body = request.get_json(force=True)
    try:
        result = qe.evaluate(METEORS, float(body["w"]), float(body["b"]))
    except ERRORS as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@app.post("/api/train")
def api_train():
    body = request.get_json(force=True)
    epochs = max(1, min(int(body.get("epochs", 40)), 50))
    try:
        result = qe.train(METEORS, float(body.get("w", 0.2)), float(body.get("b", 0.0)), epochs=epochs)
    except ERRORS as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
