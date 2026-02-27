#!/bin/bash
cd "$(dirname "$0")"
clear
echo "=========================================="
echo "   PREPARANDO PROFEMEET PARA LA CLASE"
echo "=========================================="
echo

# Comprobar si Python está instalado
if ! command -v python3 &> /dev/null
then
    echo "[ERROR] Python 3 no está instalado."
    echo "Por favor, instálalo desde https://www.python.org/"
    exit
fi

echo "[+] Instalando librerías necesarias..."
python3 -m pip install --upgrade pip > /dev/null
pip3 install pyautogui flask flask-cors > /dev/null

echo
echo "[+] ¡Todo listo! El control remoto se está activando..."
echo
echo "[AVISO] No cierres esta ventana durante la clase."
echo
python3 profemeet_agent.py
