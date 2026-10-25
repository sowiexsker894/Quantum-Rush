"""API JSON del juego: recibe el circuito que armó el jugador y lo simula con Qiskit."""
from flask import Blueprint, jsonify, request

from . import quantum

bp = Blueprint("api", __name__, url_prefix="/api")


@bp.errorhandler(ValueError)
@bp.errorhandler(KeyError)
@bp.errorhandler(TypeError)
def bad_request(error):
    return jsonify({"error": str(error)}), 400


def _body():
    return request.get_json(force=True) or {}


# ---------- Nivel 1 · El Balance ----------

@bp.post("/nivel1")
def nivel1():
    body = _body()
    return jsonify(quantum.balance(body.get("gates", []), body.get("shots", 1000)))


# ---------- Nivel 2 · El Despliegue ----------

@bp.get("/nivel2/data")
def nivel2_data():
    return jsonify(quantum.l2_data())


@bp.post("/nivel2/scan")
def nivel2_scan():
    body = _body()
    return jsonify(quantum.swap_test(body.get("gates", []), body["a"], body["b"], body.get("shots", 1000)))


# ---------- Nivel 3 · La Cosecha ----------

@bp.get("/nivel3/data")
def nivel3_data():
    return jsonify(quantum.l3_data())


@bp.post("/nivel3/eval")
def nivel3_eval():
    body = _body()
    return jsonify(quantum.vqc_eval(body.get("layers", []), body.get("params", [])))


@bp.post("/nivel3/train")
def nivel3_train():
    body = _body()
    return jsonify(quantum.vqc_train(body.get("layers", []), body.get("params", []), epochs=int(body.get("epochs", 36))))
