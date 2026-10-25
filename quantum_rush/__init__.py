"""Quantum Rush: videojuego educativo de computación cuántica (Flask + Qiskit)."""
from flask import Flask, render_template

from .api import bp as api_bp


def create_app():
    app = Flask(__name__)
    app.register_blueprint(api_bp)

    @app.get("/")
    def index():
        return render_template("index.html")

    return app
