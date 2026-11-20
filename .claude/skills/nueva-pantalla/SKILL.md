---
name: nueva-pantalla
description: Implementa una pantalla de CuentaClara (movimientos, registrar o presupuesto) a partir de una historia de usuario, con punto de control antes de editar. Úsala al empezar HU-01, HU-02 o HU-03.
argument-hint: "[HU-0X]"
disable-model-invocation: true
---
# Nueva pantalla para la historia $ARGUMENTS

1. **Entender, sin editar nada.**
   - Lee los criterios de $ARGUMENTS en `docs/historias-de-usuario.md` y las reglas R1–R8 que cita.
   - Lee el wireframe en `docs/wireframes/`.
   - Lee las clases de `styles/components.css`, los componentes `cc-*` de `js/components/`, las acciones de `js/state/` y `js/rutas.js`.
2. **Planificar.**
   - Archivos que creas o cambias, en orden: armazón HTML → ruta → pantalla → mensajes → foco.
   - Clases y componentes que reutilizas.
   - Cómo cumples cada criterio.
   - Qué NO vas a hacer.
   - Diagrama del flujo: ruta → acciones → store → pintar → eventos.

   **PUNTO DE CONTROL: espera mi aprobación antes de editar.**
3. **Implementar** en modo Manual, un archivo a la vez.
   - La página es solo armazón y la lógica de pantalla va en `js/screens/`.
   - El código va en inglés y los textos de la UI en español.
   - Marca cada criterio en el código con un comentario `[HU0X-n]`.
   - Incluye los estados de carga, vacío y error, con el error simulable por `?fallo=`.
4. **Verificar.**
   - `node --test` en verde.
   - 0 colores hex fuera de `styles/tokens.css` (el hook también lo revisa).
   - Ninguna página usa `localStorage`: búscalo con Grep en `*.html` y `js/screens/`.
   - Delega una revisión al subagente `revisor-a11y` sobre los archivos nuevos y corrige todo lo que reporte como "No cumple".
5. **Reportar.**
   - Tabla con las columnas criterio · estado · evidencia (archivo:línea).
   - Lista exacta de las pruebas manuales: teclado, 360 px, URL compartible, error simulado y Lighthouse.
   - Propuesta de entrada para `docs/bitacora-hitl.md` si corregí o rechacé algo.
