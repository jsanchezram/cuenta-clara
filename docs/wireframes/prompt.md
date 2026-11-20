# Wireframes de CuentaClara · prompts de Figma Make

Herramienta: Figma Make. Baja fidelidad, en grises, con marco de 360 px.

Exportados:
- `01-movimientos.png` (HU-01)
- `02-registrar.png` (HU-02)
- `03-presupuesto.png` (HU-03)

Límite autoimpuesto: **1000 caracteres por prompt**. El prompt maestro arma la base y cada iteración agrega **un solo cambio**.

## Prompt maestro (≤ 1000 caracteres)

```
[1 · CONTEXTO] Wireframes de CuentaClara: app para registrar gastos y controlar un presupuesto mensual. Soles (S/), español de Perú, de tú.
[2 · USUARIO] Diego, freelance: registra en el celular con una mano justo tras pagar, en < 15 s.
[3 · PANTALLAS] 3 pantallas móviles de 360 px con menú inferior Movimientos · Registrar · Presupuesto.
1) Movimientos: atajos Hoy/Semana/Mes/Personalizado, chips de categoría, Gastos · Ingresos · Saldo y lista.
2) Registrar: Gasto/Ingreso, monto, fecha, categoría, descripción 0/60 y Guardar fijo abajo.
3) Presupuesto: una tarjeta por categoría con barra, usado de límite y estado en texto.
[4 · CONTENIDO] "Almuerzo menú · Comida · − S/ 15.00". Comida S/ 510 de 600: "Cerca del límite". Transporte 200 de 200: "Alcanzaste tu límite". Ocio 195 de 150: "Te pasaste por S/ 45.00".
[5 · FIDELIDAD] Solo grises, 360 px, sin hero.
[6 · ESTADOS] Carga, vacío, error con Reintentar y error junto al campo. Botones ≥ 44 px. El estado nunca solo por color.
```

## Iteraciones sugeridas

Un cambio por prompt, terminando con "No cambies nada más". Usa solo las que hagan falta: cada prompt gasta créditos.

| # | Prompt | Por qué |
|---|---|---|
| I-1 | En Registrar agrega el modo edición: título "Editar movimiento" y botón "Eliminar" arriba, lejos de Guardar. Al pulsarlo, una confirmación dentro de la página: "¿Eliminar Almuerzo menú · S/ 15.00?" con "Sí, eliminar" y "Cancelar". No cambies nada más. | HU02-7 · Fitts (lo destructivo lejos) · H5 |
| I-2 | En Registrar agrega el estado después de guardar: botón "Guardando…" y luego el mensaje "Gasto registrado: S/ 15.00 en Comida" con "Registrar otro" y "Ver movimientos". No cambies nada más. | HU02-4 · H1 |
| I-3 | En Movimientos, cada fila muestra fecha, descripción, categoría y monto con signo: "−" en gastos y "+" en ingresos. Agrega "Pago proyecto logo · Trabajo · + S/ 1 800.00" y el botón "Editar" en cada fila. No cambies nada más. | HU01-2 · WCAG 1.4.1 |
| I-4 | En Presupuesto agrega Servicios "S/ 120 de 300 · Te quedan S/ 180.00" y Vivienda "Sin límite definido" con el botón "Definir límite". No cambies nada más. | HU03-4 · R5 (los 4 estados) |
| _real_ | _(anota aquí los prompts que usaste de verdad, si difieren)_ | |

## Revisión HITL de los wireframes

Copia aquí y en `docs/bitacora-hitl.md` lo que corregiste o rechazaste de lo que generó Figma Make.

| Pantalla | Qué viste (evidencia) | Regla | Decisión | Acción |
|---|---|---|---|---|
| | | | | |
