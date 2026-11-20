# Wireframes de CuentaClara · prompts de Figma Make

Herramienta: Figma Make. Baja fidelidad, en grises, con marco de 360 px.

Exportados:
- `01-movimientos.png` (HU-01)
- `02-registrar.png` (HU-02)
- `03-presupuesto.png` (HU-03)

Límite: **2000 caracteres por prompt**. El prompt maestro arma las 3 pantallas con sus estados, y cada iteración corrige **un solo cambio**.

## Prompt maestro (≤ 2000 caracteres)

```
[1 · CONTEXTO] Wireframes de CuentaClara, una app web para registrar gastos personales y controlar un presupuesto mensual por categoría. Moneda: soles (S/ 25.50). Español de Perú, de tú.
[2 · USUARIO] Diego, diseñador freelance. Registra cada gasto en el celular, con una mano, justo después de pagar, en menos de 15 s. Revisa el resumen del mes en la laptop.
[3 · PANTALLAS] 3 pantallas móviles de 360 px con menú inferior: Movimientos · Registrar · Presupuesto.
1) Movimientos: título con el período; atajos "Hoy / Esta semana / Este mes / Personalizado"; "Mes anterior / Mes siguiente"; chips de categoría con scroll; resumen Gastos · Ingresos · Saldo; lista con fecha, descripción, categoría, monto con − o + y botón Editar.
2) Registrar: Gasto / Ingreso, Monto, Fecha, Categoría, Descripción con contador 0/60 y "Guardar" fijo abajo a todo el ancho. Modo edición: título "Editar movimiento" y "Eliminar" arriba, lejos de Guardar, con confirmación dentro de la página.
3) Presupuesto: una tarjeta por categoría de gasto con límite, usado, restante, barra, texto del estado y "Editar límite".
[4 · CONTENIDO] Datos reales: "Almuerzo menú · Comida · 18 nov · − S/ 15.00", "Taxi a reunión · Transporte · 17 nov · − S/ 22.50", "Pago proyecto logo · Trabajo · 15 nov · + S/ 1 800.00". Presupuestos: Comida S/ 510 de 600 "Cerca del límite"; Transporte 200 de 200 "Alcanzaste tu límite"; Ocio 195 de 150 "Te pasaste por S/ 45.00"; Servicios 120 de 300 "Te quedan S/ 180.00"; Vivienda "Sin límite definido".
[5 · FIDELIDAD] Solo grises, cajas con X para íconos, 360 px. Es una app, no una landing: sin hero ni ilustraciones.
[6 · ESTADOS] Movimientos: carga (skeleton), vacío ("No hay movimientos en Ocio" + "Ver todas") y error ("No pudimos cargar tus movimientos." + Reintentar). Registrar: error junto a cada campo, "Guardando…" y confirmación "Gasto registrado: S/ 15.00 en Comida" con "Registrar otro". Botones ≥ 44 px, etiqueta visible en cada campo y estados nunca solo por color.
```

## Iteraciones usadas

Cada prompt nombra la pantalla y el elemento y termina con "No cambies nada más".

| # | Prompt | Por qué |
|---|---|---|
| I-1 | En Registrar agrega 2 variantes de la pantalla: 1) Error: envío con monto "12.345" y descripción vacía; cada campo con borde marcado, ícono y mensaje debajo ("Usa como máximo 2 decimales.", "Escribe una descripción."), sin borrar lo escrito. 2) Guardado: botón "Guardando…" deshabilitado y luego el mensaje "Gasto registrado: S/ 15.00 en Comida" con los botones "Registrar otro" y "Ver movimientos". No cambies nada más. | H1 · H9 · HU02-3 · HU02-4 |
| I-2 | En Registrar agrega la variante de edición: título "Editar movimiento", campos con "Almuerzo menú · Comida · S/ 15.00 · 18/11/2026" y el botón secundario "Eliminar" arriba, lejos de Guardar. Al pulsarlo aparece una confirmación dentro de la página (no un pop-up): "¿Eliminar Almuerzo menú · S/ 15.00? No se puede deshacer." con "Sí, eliminar" y "Cancelar". No cambies nada más. | HU02-5 · HU02-7 · Fitts · H5 |
| I-3 | En Movimientos agrega 3 variantes de la lista: 1) Carga: skeleton de 3 filas y el texto "Cargando movimientos…". 2) Vacío con el filtro Ocio: "No hay movimientos en Ocio" y el botón "Ver todas las categorías". 3) Error: "No pudimos cargar tus movimientos." con el botón "Reintentar". No cambies nada más. | H1 · HU01-7..9 |
| I-4 | En Movimientos, como noviembre 2026 es el mes en curso, muestra "Mes siguiente →" deshabilitado (texto gris claro y sin subrayado) con la nota oculta "No hay meses futuros". No cambies nada más. | HU01-6 |
| I-5 | En Presupuesto las barras de Transporte (100 %) y Ocio (130 %) se ven iguales. Para Ocio usa otro patrón (cuadriculado) y una marca vertical en el 100 % que muestre el exceso. Muestra también la tarjeta Vivienda con "Sin límite definido" y el botón "Definir límite". No cambies nada más. | R5 · WCAG 1.4.1 · HU03-4 |
| I-6 | Marca con un check "✓" delante del texto la opción seleccionada en: el atajo "Este mes", el chip "Todas" y "Gasto" en Registrar. No cambies nada más. | WCAG 1.4.1 · HU01-3 |
| I-7 | La sección "Hoy / Esta semana / Este mes / Personalizado" debe ser un solo componente que, al abrirse, permita seleccionar un rango de fechas o un atajo (hoy, semana, mes). No cambies nada más. | H8 · Hick · decisión propia (bitácora #7) |

I-2 a I-6 se enviaron juntas en un solo prompt para ahorrar créditos. Figma Make aplicó los 5 cambios sin tocar el resto.

## Revisión HITL de los wireframes

| Pantalla | Qué viste (evidencia) | Regla | Decisión | Acción |
|---|---|---|---|---|
| Presupuesto | Estados con texto, ícono, barra con rayas y "% usado" | R5 · WCAG 1.4.1 | ✅ Aprobar | — |
| Registrar | Guardar fijo abajo, a todo el ancho; etiqueta visible en cada campo | Fitts · WCAG 3.3.2 | ✅ Aprobar | — |
| Registrar | Sin errores, sin "Guardando…" y sin confirmación | H1 · H9 | ✏️ Corregir | I-1 |
| Registrar | Sin modo edición ni eliminar | HU02-5 · HU02-7 | ✏️ Corregir | I-2 |
| Registrar | Fecha 18/11/2025 (año equivocado) | H2 | ✏️ Corregir | Quedó en 18/11/2026 |
| Movimientos | Sin estados de carga, vacío ni error | H1 | ✏️ Corregir | I-3 |
| Movimientos | "Mes siguiente →" activo en el mes en curso | HU01-6 | ✏️ Corregir | I-4 |
| Movimientos | "S/ 1,800.00" con coma frente a "S/ 3 200.00" con espacio | H4 · CC-6 | ✏️ Corregir | Point and edit (verificar) |
| Presupuesto | Ocio (130 %) y Transporte (100 %) con la misma barra | R5 · WCAG 1.4.1 | ✏️ Corregir | I-5 |
| Todas | Selección marcada solo con fondo gris | WCAG 1.4.1 | ✏️ Corregir | I-6 |
| Movimientos | 4 botones de atajo que ocupan media pantalla | H8 · Hick | ✏️ Corregir | I-7: un solo desplegable |
