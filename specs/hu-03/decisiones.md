# Decisiones tomadas durante la ejecución · HU-03

Aquí se registra cada decisión que Claude tomó **sin preguntar** mientras ejecutaba `tasks.md` (B4). La persona las revisa en el diff final.

| # | Tarea | Decisión | Por qué |
|---|---|---|---|
| 1 | T6–T7 | `ApiError` acepta un mensaje opcional para que `NOT_FOUND` de presupuestos diga "Esa categoría no tiene límite este mes." en vez del mensaje de movimientos. | El contrato fija un mensaje por código; reutilizar el de movimientos confundiría a Diego. Cambio retrocompatible. |
| 2 | T7 | Se agregó una prueba de `shiftSeed` con `deleted_at` que no estaba listada en T6. | Lo pedía la tabla de riesgos del plan ("se cubre con una prueba"). |
| 3 | T10 | Tras guardar o quitar, el store vuelve a pedir presupuestos y gastos del mes sin pasar por `loading`. | Evita que la pantalla parpadee con el skeleton y perder el foco; el orden por urgencia se recalcula con datos reales. |
| 4 | T10 | Cancelar la edición deja `focusTarget` en la categoría para devolver el foco a "Editar límite". | REQ-05 pide que el foco vuelva al botón que abrió la edición. |
| 5 | T11 | La ruta raíz del script se calcula con `fileURLToPath`. | La carpeta del proyecto tiene espacios ("AI Frontend Engineering") y `URL.pathname` los deja como `%20`. Fue el primer fallo de la verificación de T11. |
| 6 | T12 | Se agregó un sexto evento, `cc-cancelar-quitar`, además de los 5 del plan. | REQ-09 pide que "Cancelar" en la confirmación devuelva el foco a "Quitar límite": la pantalla necesita saber que se canceló la confirmación (no la edición). |
| 7 | T12 | El estado de la tarjeta entra con un solo `setState()` en lugar de 5 propiedades sueltas. | Evita 5 repintados seguidos por cada cambio del store y que el campo pierda lo escrito a mitad de una actualización. |
| 8 | T14 | Los montos del resumen se envuelven en `.amount` (sin corte de línea) en la pantalla, sin cambiar `formatMoney`. | En la captura a 360 px "S/ 1 250.00" se partía en el espacio de miles; cambiar el separador de `formatMoney` obligaba a modificar pruebas existentes, lo que la spec prohíbe. |
| 9 | T14 | La pantalla reutiliza las tarjetas por categoría y solo las reordena si cambió el orden. | Si se recrearan en cada cambio del store, el campo que Diego está escribiendo perdería el foco (plan, D6). |
| 11 | T15 | Si en `setState()` solo cambia `saving` (o `draft`), el componente actualiza el botón en su lugar en vez de rehacer la tarjeta; `row` no repinta si es la misma fila. | Corrige el único "No cumple" del revisor: el foco caía en `<body>` y no se anunciaba "Guardando…"/"Quitando…". |
| 10 | T2–T13 | El script auxiliar con el que Claude marcaba las casillas tenía un error y pegó todas las marcas en la primera línea de `tasks.md`; se detectó en T14 y se reconstruyó la tabla a mano con los resultados reales de cada tarea (el historial de commits conserva cada resultado). | Transparencia: las casillas son evidencia de la verificación por tarea. |
