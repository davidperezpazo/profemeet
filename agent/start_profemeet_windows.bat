@echo off
title ProfeMeet - Activador de Control Remoto
color 0A

echo.
echo   ==========================================
echo        PROFEMEET - CONTROL REMOTO
echo     Preparando el equipo del alumno...
echo   ==========================================
echo.

:: ------------------------------------------
:: PASO 1: Detectar Python (probar py, python, python3)
:: ------------------------------------------
set "PYTHON_CMD="

:: Intentar con 'py' (Python Launcher, el mas fiable en Windows)
py --version >nul 2>nul
if %errorlevel% equ 0 (
    set "PYTHON_CMD=py"
    goto :python_found
)

:: Intentar con 'python'
python --version >nul 2>nul
if %errorlevel% equ 0 (
    set "PYTHON_CMD=python"
    goto :python_found
)

:: Intentar con 'python3'
python3 --version >nul 2>nul
if %errorlevel% equ 0 (
    set "PYTHON_CMD=python3"
    goto :python_found
)

:: ------------------------------------------
:: PASO 2: Python no encontrado - Instalar automaticamente
:: ------------------------------------------
echo [!] Python no esta instalado. Instalando automaticamente...
echo.

:: Intentar con winget (disponible en Windows 10 1709+ y Windows 11)
winget --version >nul 2>nul
if %errorlevel% equ 0 (
    echo [+] Instalando Python con winget...
    winget install Python.Python.3.12 --accept-package-agreements --accept-source-agreements --silent
    if %errorlevel% equ 0 (
        echo [+] Python instalado correctamente con winget.
        echo [!] Es necesario cerrar y abrir esta ventana para que Python se active.
        echo.
        echo     Cierra esta ventana y haz doble clic en este archivo otra vez.
        echo.
        pause
        exit /b 0
    )
    echo [!] winget fallo. Intentando descarga directa...
    echo.
)

:: Descargar el instalador de Python directamente
echo [+] Descargando Python desde python.org...
set "PYTHON_INSTALLER=%TEMP%\python_installer.exe"
powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.12.8/python-3.12.8-amd64.exe' -OutFile '%PYTHON_INSTALLER%' }"

if not exist "%PYTHON_INSTALLER%" (
    echo [ERROR] No se pudo descargar Python. Comprueba tu conexion a Internet.
    echo         Puedes instalarlo manualmente desde https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [+] Instalando Python (esto puede tardar un momento)...
"%PYTHON_INSTALLER%" /quiet InstallAllUsers=0 PrependPath=1 Include_pip=1 Include_launcher=1
if %errorlevel% neq 0 (
    echo [ERROR] La instalacion automatica fallo.
    echo         Ejecuta manualmente: %PYTHON_INSTALLER%
    echo         IMPORTANTE: Marca "Add Python to PATH" durante la instalacion.
    pause
    exit /b 1
)

del "%PYTHON_INSTALLER%" >nul 2>nul
echo [+] Python instalado correctamente.
echo.
echo [!] Es necesario cerrar y abrir esta ventana para que Python se active.
echo.
echo     Cierra esta ventana y haz doble clic en este archivo otra vez.
echo.
pause
exit /b 0

:: ------------------------------------------
:: PASO 3: Python encontrado - Instalar dependencias y ejecutar
:: ------------------------------------------
:python_found
echo [+] Python detectado:
%PYTHON_CMD% --version
echo.

echo [+] Instalando librerias necesarias...
%PYTHON_CMD% -m pip install --upgrade pip >nul 2>nul
%PYTHON_CMD% -m pip install pyautogui flask flask-cors >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Hubo un problema instalando librerias. Reintentando...
    %PYTHON_CMD% -m pip install --user pyautogui flask flask-cors
    if %errorlevel% neq 0 (
        echo [ERROR] No se pudieron instalar las librerias.
        echo         Intenta ejecutar este archivo como Administrador.
        pause
        exit /b 1
    )
)
echo [+] Librerias listas.
echo.

echo   ==========================================
echo     Todo listo! Control remoto activo.
echo.
echo     NO CIERRES ESTA VENTANA
echo     durante la clase.
echo   ==========================================
echo.

%PYTHON_CMD% "%~dp0profemeet_agent.py"

echo.
echo [!] El agente se ha detenido.
pause
