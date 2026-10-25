"""Quantum Rush: videojuego educativo de computación cuántica (Flask + Qiskit)."""
from pathlib import Path

from flask import Flask, render_template

from .api import bp as api_bp


def create_app():
    app = Flask(__name__)
    app.register_blueprint(api_bp)

    @app.get("/")
    def index():
        music = "audio/musica-inicio.mp3"
        has_music = (Path(app.static_folder) / music).is_file()
        return render_template("index.html", menu_music=music if has_music else None)

    return app
