# UX y accesibilidad aplicadas · CuentaClara

Las 3 heurísticas o leyes que guían el diseño, la pantalla donde se ven y cómo se comprueban.

## 1. Ley de Fitts · `registrar.html`

> `T = a + b·log₂(1 + D/W)`: un objetivo grande y cercano se alcanza más rápido.

**Problema.** Diego registra con una mano, de pie, justo después de pagar. Si el botón Guardar es pequeño o queda arriba, fuera de la zona del pulgar, el registro se vuelve lento y se equivoca.

**Aplicación:**
- "Guardar" es la única acción primaria. Va fija abajo, a todo el ancho y mide 48 px de alto (`--button-height`).
- "Eliminar" (destructiva) va lejos de Guardar, como botón secundario arriba del formulario, y además pide confirmación en la página.
- Los objetivos táctiles miden 44 px o más (WCAG 2.5.8 pide 24 px como mínimo).
- El tipo Gasto/Ingreso se elige con dos controles grandes, uno al lado del otro.

**Cómo se comprueba:** a 360 px, Guardar queda visible sin hacer scroll y en la mitad inferior. DevTools muestra 48 px de alto.

## 2. Heurística H1 · Visibilidad del estado del sistema · `presupuesto.html` y `movimientos.html`

> El sistema siempre informa qué está pasando, con una respuesta oportuna.

**Problema.** A fin de mes Diego no sabe si se pasó del presupuesto.

**Aplicación:**
- `<cc-barra-presupuesto>` muestra cuánto se usó (barra + "S/ 510.00 de S/ 600.00 · 85 %") y su estado **en texto**:
  - "Te quedan S/ X"
  - "Cerca del límite"
  - "Alcanzaste tu límite"
  - "Te pasaste por S/ X"

  El color y el ícono solo refuerzan (WCAG 1.4.1).
- Carga: skeleton + "Cargando movimientos…" con `aria-busy`.
- Al guardar, el botón cambia a "Guardando…" y aparece una confirmación con `role="status"`.
- La lista muestra el saldo de lo filtrado: Gastos · Ingresos · Saldo.

**Cómo se comprueba:**
- En la vitrina `componentes.html`, la barra aparece en sus 4 estados.
- Con la emulación de acromatopsia en DevTools, los 4 estados se siguen distinguiendo.

## 3. Heurísticas H5 · Prevención de errores y H9 · Recuperarse de errores · `registrar.html`

> Mejor evitar el error que corregirlo. Si ocurre, se explica en lenguaje claro y se indica cómo resolverlo.

**Aplicación (prevención):**
- Monto con `inputmode="decimal"`.
- Fecha con `type="date"` y `min`/`max`, para que no se elija una fecha futura ni una de hace más de 60 días. Al editar, solo se pueden elegir fechas del mes en curso.
- Las categorías cambian según el tipo, así que no se puede registrar un gasto como "Trabajo".
- Contador `n/60` en la descripción.
- Eliminar pide confirmación en la página mostrando qué se elimina ("Almuerzo menú · S/ 15.00").

**Aplicación (recuperación):**
- El error aparece junto al campo y dice qué hacer: "Usa como máximo 2 decimales.", "La fecha no puede ser futura."
- Se marca con `aria-invalid` y `aria-describedby`, y el foco va al primer error.
- Nunca se borra lo escrito.
- Si la API falla, se conservan los datos y se puede reintentar.

**Cómo se comprueba:**
- Enviar el formulario vacío muestra un mensaje por campo y el foco va al monto.
- Con `?fallo=guardar`, los datos siguen escritos.

---

## Leyes complementarias

- **Hick:** el filtro de categorías se muestra como chips en un solo grupo, con "Todas" primero. Los atajos de período se reducen a 4 opciones.
- **Jakob:** controles nativos (radio, `type="date"`, `<select>`, `<progress>`) que Diego ya conoce de otras apps.
