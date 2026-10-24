import os
import sys

# Agregar la raíz del proyecto al sys.path para importar app y los módulos cuánticos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel Serverless handler
app = app
