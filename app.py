from flask import Flask, jsonify, render_template, request

import levels_engine as le
import quantum_engine as qe

app = Flask(__name__)
METEORS = qe.make_meteor_dataset()


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/api/run")
def api_run():
    body = request.get_json(force=True)
    try:
        result = qe.run(body.get("n_qubits", 1), body.get("gates", []), body.get("shots", 100))
    except (ValueError, KeyError, TypeError) as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@app.post("/api/nivel1")
def api_nivel1():
    body = request.get_json(force=True)
    try:
        result = qe.balance(body.get("gates", []), body.get("shots", 1000))
    except (ValueError, KeyError, TypeError) as e:
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
    except (ValueError, KeyError, TypeError) as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@app.get("/api/nivel3/data")
def api_nivel3_data():
    return jsonify(le.l3_data())


@app.post("/api/nivel3/eval")
def api_nivel3_eval():
    body = request.get_json(force=True)
    return jsonify(le.vqc_eval(body.get("layers", []), body.get("params", [])))


@app.post("/api/nivel3/train")
def api_nivel3_train():
    body = request.get_json(force=True)
    return jsonify(le.vqc_train(body.get("layers", []), body.get("params", []), epochs=int(body.get("epochs", 36))))


@app.get("/api/meteors")
def api_meteors():
    return jsonify(METEORS)


@app.post("/api/classify")
def api_classify():
    body = request.get_json(force=True)
    return jsonify(qe.evaluate(METEORS, float(body["w"]), float(body["b"])))


@app.post("/api/train")
def api_train():
    body = request.get_json(force=True)
    return jsonify(qe.train(METEORS, float(body.get("w", 0.2)), float(body.get("b", 0.0)),
                            epochs=int(body.get("epochs", 40))))


if __name__ == "__main__":
    app.run(debug=True, port=5000)
