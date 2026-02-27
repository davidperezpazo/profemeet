# 📖 Guía de Uso: ProfeMeet

Esta guía contiene todo lo que necesitas para operar ProfeMeet de forma exitosa.

## 🛠️ Configuración Inicial (Solo la primera vez)

### Para el Alumno:
El alumno debe preparar su ordenador para permitir el control remoto de forma sencilla:

1.  **Ejecutar el Activador:**
    - **En Windows:** Doble clic en `agent/start_profemeet_windows.bat`.
    - **En Mac:** Doble clic en `agent/start_profemeet_mac.command`.
2.  **Permisos del Sistema:** La primera vez, el sistema operativo pedirá permisos de **Accesibilidad**. El alumno debe activarlos para Terminal/Python.

*Nota: Estos archivos instalarán automáticamente todo lo necesario (Python y librerías) si no están presentes.*

---

## 🚀 Cómo iniciar una clase

### Paso 1: Iniciar la Aplicación Web
En tu ordenador (Profesor), asegúrate de que el servidor está corriendo:
```bash
npm run dev
```
Y abre en tu navegador: `http://localhost:3000/profemeet`

### Paso 2: El Alumno activa el "Agente"
El alumno debe abrir su terminal, ir a la carpeta del proyecto y ejecutar:
```bash
python agent/profemeet_agent.py
```
*(Debe dejar esta ventana abierta durante toda la clase).*

### Paso 3: Conexión
1.  **Profesor:** Haz clic en **"Crear Nueva Clase"**. Se generará un enlace o ID (ej: `a1b2c3d`).
2.  **Alumno:** Entra en la web, ve a la sección "Soy Alumno", pega el ID y haz clic en **"Unirse"**.
3.  **Alumno:** Haz clic en el botón azul **"Compartir mi pantalla"** que aparecerá en el centro.

### Paso 4: Control Remoto
Una vez que veas la pantalla del alumno, haz clic en **"Tomar Control"**. 
*   Tus movimientos de ratón y clicks se replicarán en el ordenador del alumno en tiempo real.

---

## ☁️ Sobre el uso en Internet (Vercel)

Actualmente, la aplicación está configurada para funcionar **en red local o en tu mismo ordenador** para pruebas.

*   **¿Es necesario subirla a Vercel?** 
    Para que un alumno en **otra casa** pueda entrar, sí necesitas subir la web a un servidor como Vercel. 
*   **Importante:** La versión actual usa una "memoria temporal" para la conexión. Si la subes a Vercel, deberíamos conectar un servicio como **Supabase Realtime** para que la conexión sea estable a través de Internet (ya que los servidores de Vercel "olvidan" los datos rápidamente).

---

## 🆘 Solución de Problemas
*   **No se mueve el ratón:** Verifica que el alumno ha ejecutado el script de Python y que no hay errores en esa terminal.
*   **No veo la pantalla:** Asegúrate de que el alumno ha pulsado "Compartir mi pantalla" y ha seleccionado la ventana correcta.
