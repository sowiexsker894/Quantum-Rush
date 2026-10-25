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

- `?pantalla=niveles` → selección de niveles (en la demo todos están abiertos: `DEMO_MODE` en `quantum_rush/static/js/core/app.js`).
- `?pantalla=nivel1`, `?pantalla=nivel2`, `?pantalla=nivel3` → abre un nivel directamente.

## Niveles (Proyecto NOVA)

| # | Nivel | Misión | Cuántica | Estadística / ML |
|---|-------|--------|----------|------------------|
| 1 | El Balance | Repartir energía 80/20 entre dos países | Superposición (H), rotación Ry, medición | Probabilidad y frecuencia |
| 2 | El Despliegue | Diagnosticar escuadrones sin biometría clásica | SWAP test (H, CSWAP), fidelidad | KNN (K = 3), votación por mayoría |
| 3 | La Cosecha | Separar arándanos sanos de dañados | Ry, Rx, CNOT (entrelazamiento) | Clasificador variacional, gradiente, entrenamiento |

Cada nivel tiene cronómetro, sonido, pistas, diccionario de términos y el botón **VER CÓDIGO QISKIT**.

## Estructura del proyecto

```
Quantum-Rush/
├── app.py                      # Punto de entrada: python app.py
├── quantum_rush/               # Paquete de la aplicación
│   ├── __init__.py             # create_app(): crea la app Flask
│   ├── api.py                  # API JSON (/api/nivel1, /api/nivel2/..., /api/nivel3/...)
│   ├── quantum/                # Motores cuánticos (todo con Qiskit)
│   │   ├── common.py           #   utilidades: construir circuitos, disparos, diagramas
│   │   ├── level1_balance.py   #   Nivel 1: superposición y rotación Ry
│   │   ├── level2_swap_test.py #   Nivel 2: SWAP test + KNN
│   │   └── level3_vqc.py       #   Nivel 3: clasificador variacional + parameter shift
│   ├── templates/
│   │   ├── index.html          # Página única: incluye las pantallas
│   │   ├── screens/            # Una plantilla por pantalla (landing, intro, niveles, nivel1-3...)
│   │   └── components/         # Diccionario, tooltip y avisos
│   └── static/
│       ├── css/                # base.css + screens/ + levels/
│       ├── js/
│       │   ├── core/           # app.js (API, progreso, navegación), glossary.js, levelkit.js
│       │   ├── screens/        # landing.js, intro.js, levels.js
│       │   └── levels/         # level1.js, level2.js, level3.js
│       ├── img/                # characters/ (NOVA) y scenes/ (fondos de cada nivel)
│       └── video/              # mision.mp4 (historia al presionar DESPEGAR)
├── tests/                      # Pruebas automáticas (pytest)
├── docs/
│   ├── QISKIT.md               # Cómo se usa Qiskit en cada nivel
│   └── referencias/            # Imágenes y videos de diseño (no se usan en el juego)
├── requirements.txt            # Dependencias para ejecutar el juego
├── requirements-dev.txt        # + herramientas de desarrollo (pytest)
└── pyproject.toml              # Metadatos y configuración de pytest
```

### Flujo de una jugada

1. El jugador arma un circuito en el navegador (`static/js/levels/levelN.js`).
2. El navegador lo envía a la API (`quantum_rush/api.py`).
3. El motor del nivel lo simula con Qiskit (`quantum_rush/quantum/`).
4. El navegador anima el resultado.

Detalle completo en [docs/QISKIT.md](docs/QISKIT.md).

### Dónde cambiar cosas

| Quiero cambiar... | Archivo |
|---|---|
| Diálogos y fases de un nivel | `quantum_rush/static/js/levels/levelN.js` |
| Botones y textos fijos de una pantalla | `quantum_rush/templates/screens/*.html` |
| Definiciones del diccionario | `quantum_rush/static/js/core/glossary.js` |
| Datos o física cuántica de un nivel | `quantum_rush/quantum/levelN_*.py` |
| Tarjetas de la selección de niveles | `quantum_rush/static/js/screens/levels.js` |

## Pruebas automáticas

```bash
pip install -r requirements-dev.txt
python -m pytest
```

Las pruebas verifican la física de cada nivel (por ejemplo: H da 50/50, Ry(53°) da 80/20, el SWAP test cumple (1 + F)/2 y el entrenamiento llega a 90% o más) y que la API responde bien.
