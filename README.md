# Quantum Rush — Entrena tu IA para salvar el universo

Videojuego educativo web para que estudiantes de colegio y primeros ciclos aprendan **Estadística, Machine Learning y Computación Cuántica** sin conocimientos previos.
Acompañas a **NOVA**, un pequeño robot espacial simpático y algo nervioso, a resolver emergencias en distintos planetas.

## Cómo ejecutar el juego (paso a paso)

### Requisitos (solo la primera vez)

- **Python 3.10 o superior** ([python.org/downloads](https://www.python.org/downloads/)).
  - En Windows, al instalarlo marca la casilla **"Add Python to PATH"**.
- **Git** ([git-scm.com](https://git-scm.com/downloads)).
- Un navegador moderno: Chrome, Edge o Firefox.

Para comprobar que están instalados, abre una terminal y ejecuta:

```bash
python --version
git --version
```

En Windows la terminal puede ser **PowerShell** o **CMD**. En Mac o Linux, usa `python3` en lugar de `python`.

### Paso 1 · Descargar el proyecto

```bash
git clone https://github.com/sowiexsker894/Quantum-Rush.git
cd Quantum-Rush
```

Si ya lo tenías descargado, entra a la carpeta y actualízalo con `git pull`.

### Paso 2 · (Opcional) Crear un entorno virtual

Este paso evita mezclar las librerías del juego con las de otros proyectos.

```bash
python -m venv .venv
```

Actívalo según tu sistema:

| Sistema | Comando |
|---|---|
| Windows (PowerShell) | `.venv\Scripts\Activate.ps1` |
| Windows (CMD) | `.venv\Scripts\activate.bat` |
| Mac / Linux | `source .venv/bin/activate` |

Si PowerShell bloquea el script, ejecuta esto una vez y vuelve a activarlo:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Paso 3 · Instalar las librerías (Qiskit y Flask)

```bash
pip install -r requirements.txt
```

Tarda uno o dos minutos la primera vez. Si `pip` no se reconoce, usa `python -m pip install -r requirements.txt`.

### Paso 4 · Iniciar el servidor

```bash
python app.py
```

Cuando veas `Running on http://127.0.0.1:5000`, el juego está listo. **No cierres esa terminal mientras juegas.**

### Paso 5 · Abrir el juego

Entra a **http://127.0.0.1:5000** en el navegador.

1. Presiona **DESPEGAR**.
2. Mira el video de la misión, u **OMITIR ANIMACIÓN**.
3. Lee los objetivos y acepta la misión.
4. Elige un nivel.

En cada nivel:

- Haz clic en el mensaje de NOVA para avanzar el diálogo.
- Arrastra las compuertas al circuito y presiona **EJECUTAR**.
- Usa **PISTA** si te atascas y **DICCIONARIO** para ver qué significa cada término.

### Paso 6 · Detener el juego

En la terminal del servidor presiona **Ctrl + C**.

### Problemas frecuentes

| Problema | Solución |
|---|---|
| `python` no se reconoce | Reinstala Python marcando "Add Python to PATH", o usa `py` en lugar de `python` |
| `ModuleNotFoundError: No module named 'qiskit'` | No hiciste el Paso 3, o el entorno virtual no está activado |
| `Address already in use` / puerto 5000 ocupado | Ya hay otro servidor abierto: ciérralo con Ctrl + C, o cierra esa terminal |
| La página no cambia después de actualizar el código | Recarga con **Ctrl + F5** |
| El video no suena | El navegador bloquea el audio hasta que haces clic: usa el botón de sonido debajo del video |

Accesos directos útiles para presentar:

- `?pantalla=niveles` → selección de niveles (en la demo todos están abiertos: `DEMO_MODE` en `static/js/game.js`).
- `?pantalla=nivel1`, `?pantalla=sintonia`, `?pantalla=nivel2`, `?pantalla=nivel3` → abre un nivel directamente.

## Niveles (Proyecto NOVA)

| # | Nivel | Misión | Cuántica | Estadística / ML |
|---|-------|--------|----------|------------------|
| 1 | El Balance | Repartir energía 80/20 entre dos países | Superposición (H), rotación Ry, medición | Probabilidad y frecuencia |
| 2 | La Sintonía | Coordinar balizas de emergencia espaciales | 2 qubits, CNOT, entrelazamiento | Probabilidad conjunta y correlación |
| 3 | El Despliegue | Diagnosticar escuadrones sin biometría clásica | SWAP test (H, CSWAP), fidelidad | KNN (K = 3), votación por mayoría |
| 4 | La Cosecha | Separar arándanos sanos de dañados | Ry, Rx, CNOT (entrelazamiento) | Clasificador variacional, gradiente, entrenamiento |

Cada nivel tiene cronómetro, sonido, pistas, diccionario de términos y el botón **VER CÓDIGO QISKIT**.

## Cómo está hecho

- **Qiskit en el backend** para todos los cálculos cuánticos. Detalle completo en [QISKIT.md](QISKIT.md).
- `app.py`: servidor Flask con la API de cada nivel.
- `quantum_engine.py` (Nivel 1 y 2) y `levels_engine.py` (Niveles 3 y 4): motores cuánticos.
- `templates/index.html` + `static/js/`: landing, video de historia, objetivos, niveles (`level1.js`, `levelsintonia.js`, `level2.js`, `level3.js`, `levelkit.js`).
- `static/js/chapters.js`: diccionario de términos (`GLOSSARY`).
