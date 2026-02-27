#!/bin/bash
cd "$(dirname "$0")"
clear

echo ""
echo "  =========================================="
echo "       PROFEMEET - CONTROL REMOTO"
echo "    Preparando el equipo del alumno..."
echo "  =========================================="
echo ""

# ──────────────────────────────────────────────
# PASO 1: Detectar Python 3
# ──────────────────────────────────────────────
PYTHON_CMD=""

if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    # Verificar que es Python 3
    if python --version 2>&1 | grep -q "Python 3"; then
        PYTHON_CMD="python"
    fi
fi

# ──────────────────────────────────────────────
# PASO 2: Si no hay Python, instalar automáticamente
# ──────────────────────────────────────────────
if [ -z "$PYTHON_CMD" ]; then
    echo "[!] Python 3 no esta instalado. Instalando automaticamente..."
    echo ""

    # Intentar con Homebrew
    if command -v brew &> /dev/null; then
        echo "[+] Instalando Python con Homebrew..."
        brew install python3
        if [ $? -eq 0 ]; then
            PYTHON_CMD="python3"
            echo "[+] Python instalado correctamente."
        fi
    fi

    # Si Homebrew no está o falló, intentar instalar Xcode Command Line Tools
    # (incluyen Python 3 en macOS)
    if [ -z "$PYTHON_CMD" ]; then
        echo "[+] Instalando herramientas de desarrollo (incluye Python)..."
        xcode-select --install 2>/dev/null
        echo ""
        echo "[!] Se ha abierto una ventana de instalacion."
        echo "    1. Acepta la instalacion y espera a que termine"
        echo "    2. Cierra esta ventana"
        echo "    3. Haz doble clic en este archivo otra vez"
        echo ""
        read -p "Pulsa Enter cuando la instalacion haya terminado..."

        # Comprobar de nuevo
        if command -v python3 &> /dev/null; then
            PYTHON_CMD="python3"
        fi
    fi

    if [ -z "$PYTHON_CMD" ]; then
        echo ""
        echo "[ERROR] No se pudo instalar Python automaticamente."
        echo "        Instalalo manualmente desde https://www.python.org/downloads/"
        echo ""
        read -p "Pulsa Enter para cerrar..."
        exit 1
    fi
fi

echo "[+] Python detectado: $($PYTHON_CMD --version)"
echo ""

# ──────────────────────────────────────────────
# PASO 3: Instalar dependencias
# ──────────────────────────────────────────────
echo "[+] Instalando librerias necesarias..."
$PYTHON_CMD -m pip install --upgrade pip > /dev/null 2>&1
$PYTHON_CMD -m pip install pyautogui flask flask-cors > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "[!] Reintentando con --user..."
    $PYTHON_CMD -m pip install --user pyautogui flask flask-cors > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "[ERROR] No se pudieron instalar las librerias."
        echo "        Intenta ejecutar: $PYTHON_CMD -m pip install pyautogui flask flask-cors"
        read -p "Pulsa Enter para cerrar..."
        exit 1
    fi
fi

echo "[+] Librerias listas."
echo ""

# ──────────────────────────────────────────────
# PASO 4: Ejecutar el agente
# ──────────────────────────────────────────────
echo "  =========================================="
echo "    Todo listo! Control remoto activo."
echo ""
echo "    NO CIERRES ESTA VENTANA"
echo "    durante la clase."
echo "  =========================================="
echo ""

$PYTHON_CMD "$(dirname "$0")/profemeet_agent.py"

echo ""
echo "[!] El agente se ha detenido."
read -p "Pulsa Enter para cerrar..."
