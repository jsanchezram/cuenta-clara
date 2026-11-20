# Wireframes de CuentaClara · prompts de Figma Make

Herramienta: Figma Make. Baja fidelidad, en grises, con marco de 360 px.

Exportados:
- `01-movimientos.png` (HU-01)
- `02-registrar.png` (HU-02)
- `03-presupuesto.png` (HU-03)

## Prompt maestro

```
[1 · CONTEXTO] Wireframes de CuentaClara, una app web para registrar gastos personales y controlar
un presupuesto mensual por categoría. Moneda: soles (S/ 25.50). Español de Perú, tratando de tú.

[2 · USUARIO] Diego, diseñador freelance. Registra cada gasto en el celular, con una mano, justo
después de pagar, en menos de 15 segundos. Revisa el resumen del mes en la laptop.

[3 · PANTALLAS] 3 pantallas móviles de 360 px, con un menú inferior común: Movimientos · Registrar · Presupuesto.
 1) Movimientos: título con el período, atajos "Hoy / Esta semana / Este mes / Personalizado",
    "Mes anterior / Mes siguiente", filtro de categorías en chips con scroll, resumen
    (Gastos, Ingresos, Saldo) y lista de movimientos (fecha, descripción, categoría, monto con − o +, botón Editar).
 2) Registrar: selector Gasto / Ingreso, Monto, Fecha, Categoría, Descripción con contador 0/60,
    botón "Guardar" fijo abajo y a todo el ancho. En modo edición: título "Editar movimiento" y botón
    "Eliminar" lejos de Guardar.
 3) Presupuesto: una tarjeta por categoría de gasto con límite, usado, restante, una barra de progreso,
    el texto del estado y el botón "Editar límite".

[4 · CONTENIDO] Usa datos reales:
 "Almuerzo menú · Comida · 18 nov · − S/ 15.00",
 "Taxi a reunión · Transporte · 17 nov · − S/ 22.50",
 "Pago proyecto logo · Trabajo · 15 nov · + S/ 1 800.00".
 Presupuestos: Comida S/ 600 (usado S/ 510, "Cerca del límite"); Transporte S/ 200 (usado S/ 200,
 "Alcanzaste tu límite"); Ocio S/ 150 (usado S/ 195, "Te pasaste por S/ 45.00");
 Servicios S/ 300 (usado S/ 120, "Te quedan S/ 180.00"); Vivienda: "Sin límite definido".

[5 · FIDELIDAD] Solo grises, cajas con X para íconos y 360 px. Es una app, no una landing: sin hero,
sin ilustraciones, sin testimonios ni gráficos decorativos.

[6 · ESTADOS] Agrega estos estados:
 - Movimientos: carga (skeleton), vacío ("No hay movimientos en Ocio" + "Ver todas las categorías") y error
   ("No pudimos cargar tus movimientos." + Reintentar).
 - Registrar: error junto a cada campo, botón "Guardando…" y confirmación "Gasto registrado: S/ 15.00 en Comida"
   con "Registrar otro" y "Ver movimientos". Confirmación de eliminar dentro de la página, no en un pop-up del sistema.
 - Presupuesto: los 4 estados de la barra, cada uno con su texto (el estado no depende del color).
Botones de 44 px o más y etiqueta visible en cada campo.
```

## Iteraciones

Un cambio por prompt, terminando con "No cambies nada más".

| # | Prompt | Por qué |
|---|---|---|
| I-1 | _(anotar aquí el prompt real)_ | _(regla que lo motivó, ej. H1, WCAG 1.4.1, Fitts)_ |
| I-2 | | |

## Revisión HITL de los wireframes

Copia aquí y en `docs/bitacora-hitl.md` lo que corregiste o rechazaste de lo que generó Figma Make.

| Pantalla | Qué viste (evidencia) | Regla | Decisión | Acción |
|---|---|---|---|---|
| | | | | |
