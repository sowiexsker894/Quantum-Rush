# Quantum Rush — Entrena tu IA para salvar el universo

Videojuego educativo web para que estudiantes de colegio y primeros ciclos aprendan **Estadística, Machine Learning y Computación Cuántica** sin conocimientos previos.
Acompañas a **NOVA**, un pequeño robot espacial simpático y algo nervioso, a resolver emergencias en distintos planetas.

## Cómo ejecutarlo

```bash
pip install -r requirements.txt
python app.py
```

Abre **http://127.0.0.1:5000** en el navegador.

Accesos directos útiles para presentar:

- `?pantalla=niveles` → selección de niveles (en la demo todos están abiertos: `DEMO_MODE` en `static/js/game.js`).
- `?pantalla=nivel1`, `?pantalla=nivel2`, `?pantalla=nivel3` → abre un nivel directamente.

## Niveles (Proyecto NOVA)

| # | Nivel | Misión | Cuántica | Estadística / ML |
|---|-------|--------|----------|------------------|
| 1 | El Balance | Repartir energía 80/20 entre dos países | Superposición (H), rotación Ry, medición | Probabilidad y frecuencia |
| 2 | El Despliegue | Diagnosticar escuadrones sin biometría clásica | SWAP test (H, CSWAP), fidelidad | KNN (K = 3), votación por mayoría |
| 3 | La Cosecha | Separar arándanos sanos de dañados | Ry, Rx, CNOT (entrelazamiento) | Clasificador variacional, gradiente, entrenamiento |

Cada nivel tiene cronómetro, sonido, pistas, diccionario de términos y el botón **VER CÓDIGO QISKIT**.

## Cómo está hecho

- **Qiskit en el backend** para todos los cálculos cuánticos. Detalle completo en [QISKIT.md](QISKIT.md).
- `app.py`: servidor Flask con la API de cada nivel.
- `quantum_engine.py` (Nivel 1) y `levels_engine.py` (Niveles 2 y 3): motores cuánticos.
- `templates/index.html` + `static/js/`: landing, video de historia, objetivos, niveles (`level1.js`, `level2.js`, `level3.js`, `levelkit.js`).
- `static/js/chapters.js`: diccionario de términos (`GLOSSARY`).
