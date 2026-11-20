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

## Iteraciones

Un cambio por prompt, nombrando la pantalla y el elemento, y terminando con "No cambies nada más". Ejemplos de correcciones típicas; usa solo las que necesites y anota las reales:

| # | Prompt | Por qué |
|---|---|---|
| I-1 | En Presupuesto, cada estado debe distinguirse sin color: agrega un ícono y el texto del estado junto a la barra en las 5 tarjetas. No cambies nada más. | WCAG 1.4.1 · R5 |
| I-2 | En Registrar, el botón "Guardar" debe quedar fijo abajo, a todo el ancho y de 48 px, en la zona del pulgar. No cambies nada más. | Fitts |
| I-3 | En Movimientos, el chip de categoría activo debe llevar un check ✓ además del fondo. No cambies nada más. | WCAG 1.4.1 · HU01-3 |
| _real_ | _(anota aquí los prompts que usaste de verdad)_ | |

## Revisión HITL de los wireframes

Copia aquí y en `docs/bitacora-hitl.md` lo que corregiste o rechazaste de lo que generó Figma Make.

| Pantalla | Qué viste (evidencia) | Regla | Decisión | Acción |
|---|---|---|---|---|
| | | | | |
