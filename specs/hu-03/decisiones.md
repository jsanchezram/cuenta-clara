# Decisiones tomadas durante la ejecución · HU-03

Aquí se registra cada decisión que Claude tomó **sin preguntar** mientras ejecutaba `tasks.md` (B4). La persona las revisa en el diff final.

| # | Tarea | Decisión | Por qué |
|---|---|---|---|
| 1 | T6–T7 | `ApiError` acepta un mensaje opcional para que `NOT_FOUND` de presupuestos diga "Esa categoría no tiene límite este mes." en vez del mensaje de movimientos. | El contrato fija un mensaje por código; reutilizar el de movimientos confundiría a Diego. Cambio retrocompatible. |
| 2 | T7 | Se agregó una prueba de `shiftSeed` con `deleted_at` que no estaba listada en T6. | Lo pedía la tabla de riesgos del plan ("se cubre con una prueba"). |
| 3 | T10 | Tras guardar o quitar, el store vuelve a pedir presupuestos y gastos del mes sin pasar por `loading`. | Evita que la pantalla parpadee con el skeleton y perder el foco; el orden por urgencia se recalcula con datos reales. |
| 4 | T10 | Cancelar la edición deja `focusTarget` en la categoría para devolver el foco a "Editar límite". | REQ-05 pide que el foco vuelva al botón que abrió la edición. |
