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

LEADERBOARD_FILE = os.path.join(BASE_DIR, "leaderboard.json")

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


@app.route("/")
def index():
    return render_template("index.html")


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
