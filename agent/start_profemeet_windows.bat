@echo off
title ProfeMeet - Activador de Control Remoto
echo ==========================================
echo    PREPARANDO PROFEMEET PARA LA CLASE
echo ==========================================
echo.

:: Comprobar si Python está instalado
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python no está instalado. 
    echo Por favor, descarga Python desde https://www.python.org/ e instalalo.
    echo Asegurate de marcar "Add Python to PATH" durante la instalacion.
    pause
    exit
)

echo [+] Instalando librerias necesarias...
python -m pip install --upgrade pip >nul
pip install pyautogui flask flask-cors >nul

echo.
echo [+] ¡Todo listo! El control remoto se esta activando...
echo.
echo [AVISO] No cierres esta ventana durante la clase.
echo.
python profemeet_agent.py
pause
