# ProfeMeet Local Agent (Python)
# Este script debe ser ejecutado por el ALUMNO para permitir el control remoto.
# Requisitos: pip install pyautogui flask flask-cors

import pyautogui
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Desactivar el fail-safe para evitar que se detenga si mueves el ratón a una esquina (Usar con precaución)
# pyautogui.FAILSAFE = False

@app.route('/exec', methods=['POST'])
def execute_command():
    data = request.json
    cmd_type = data.get('type')
    
    if cmd_type == 'mousemove':
        x_percent = data.get('x')
        y_percent = data.get('y')
        screen_width, screen_height = pyautogui.size()
        pyautogui.moveTo(x_percent * screen_width, y_percent * screen_height)
        
    elif cmd_type == 'click':
        pyautogui.click()
        
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    print("ProfeMeet Agent iniciado en el puerto 8080")
    app.run(port=8080)
