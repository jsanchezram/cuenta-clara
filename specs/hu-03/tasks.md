# Tareas · HU-03 Presupuesto por categoría

> AI-First · Paso B3. Las tareas van en orden y cada una toca **un archivo como máximo** (salvo T1, que es documental).
> Al terminar cada tarea se ejecuta su verificación y se marca la casilla con el resultado.
> **Regla de parada:** si una verificación falla 2 veces seguidas, me detengo y pregunto.
> Toda decisión que tome sin preguntar se anota en `decisiones.md`.

Verificación base, después de cada tarea: `node --test` en verde. Desde T11, también `node scripts/verificar-hu03.mjs`.

| # | Tarea | Archivo | Requisitos | Verificación | Estado |
|---|---|---|---|---|---|
| T1 | Contrato: `DELETE /budgets/{category}`, `deleted_at` opcional y fila en la tabla de mapeo | `docs/api/contrato-v1.md`, `docs/api/mapeo-v1.md` | REQ-09 | El contrato documenta el endpoint, sus respuestas y la regla de vigencia | [x] Contrato documenta DELETE, respuestas y vigencia |
| T2 | Pruebas de `toBudgetRecord`: registro activo y quitado | `tests/contracts.test.js` | REQ-09 | Las pruebas nuevas fallan (todavía no hay implementación) | [x] 2 pruebas nuevas en rojo (falta toBudgetRecord) |
| T3 | `BudgetDTO.deleted_at` y `toBudgetRecord` | `js/contracts/dto.js` y `js/contracts/mappers.js` (un cambio por archivo) | REQ-09 | `node --test`: las pruebas de T2 pasan | [x] 85/85 en verde |
| T4 | Pruebas de `sortByUrgency`, `budgetSummary` y `effectiveLimit` con registro quitado | `tests/budget.test.js` | REQ-03, 04, 09 | Las pruebas nuevas fallan | [x] 4 pruebas nuevas en rojo (faltan sortByUrgency y budgetSummary) |
| T5 | Implementar las funciones de T4 | `js/logic/budget.js` | REQ-03, 04, 09 | `node --test` en verde | [x] 89/89 en verde |
| T6 | Pruebas de la API: quitar en el mes en curso, meses anteriores intactos, volver a definir, `404` si no hay límite | `tests/api.test.js` | REQ-07, 09 | Las pruebas nuevas fallan | [x] 4 pruebas nuevas en rojo (falta removeBudget) |
| T7 | `removeBudget`, `listBudgets` y `saveBudget` con `deleted_at`; `shiftSeed` corre `deleted_at` | `js/api/cuentaclara-api.js` | REQ-07, 09 | `node --test` en verde | [x] 94/94 en verde (incluye prueba de shiftSeed con deleted_at) |
| T8 | Pruebas de `parseBudgetRoute` y `routes.budget` | `tests/rutas.test.js` | REQ-01, 10 | Las pruebas nuevas fallan | [x] 4 pruebas nuevas en rojo (falta parseBudgetRoute) |
| T9 | Implementar la ruta de presupuesto | `js/rutas.js` | REQ-01, 10 | `node --test` en verde | [x] 98/98 en verde (1 fallo de escapado corregido al segundo intento) |
| T10 | Store y acciones de la pantalla, con protección contra carreras | `js/state/budget.js` | REQ-02..11 | `node --test` en verde, con una prueba de acciones en `tests/store.test.js` | [x] 102/102 en verde (4 pruebas de acciones) |
| T11 | Script de verificación estática `[HU03-n]` | `scripts/verificar-hu03.mjs` | Terminado | Corre y muestra N/N. Lo que todavía no existe aparece como pendiente | [x] Corre: 7/14; los 7 pendientes son página, pantalla y eventos del componente (T12–T14). El primer intento falló por la ruta con espacios y se corrigió |
| T12 | Componente: edición en la tarjeta, confirmación de quitar, eventos y `focusAction` | `js/components/cc-barra-presupuesto.js` (+ `docs/componentes-negocio.md`) | REQ-05..09, 12 | `node --test` + `verificar-hu03`. La vitrina sigue pintando los 4 estados | [x] 102/102 · verificar-hu03 8/14 · la vitrina pinta normal, near, reached, exceeded y sin límite |
| T13 | Armazón de la página | `presupuesto.html` | REQ-01, 04, 10, 11, 12 | `verificar-hu03`: los chequeos de la página pasan | [x] verificar-hu03: HU03-1..4 pasan (12/14; faltan HU03-5 y HU03-13, la pantalla) |
| T14 | Pantalla: conecta ruta, acciones, store y componente, y gestiona el foco | `js/screens/presupuesto.js` | REQ-01..12 | `node --test` + `verificar-hu03` N/N + prueba en Chrome a 360 px (`#/2026-11`, `#/2026-10`, `?fallo=presupuesto`) | [x] 102/102 · verificar-hu03 14/14 · Chrome a 360 px: los 8 pasos de T16 se cumplen con clics simulados, `?fallo=presupuesto` con Reintentar y foco en "Categorías", sin scroll horizontal |
| T15 | Revisión de accesibilidad con el subagente revisor-a11y y corrección de cada "No cumple" | (los que indique) | REQ-12 | Sin "No cumple" | [x] El revisor encontró 1 "No cumple": el foco se perdía mientras guardaba o quitaba porque la tarjeta se repintaba entera. Se corrigió en 2 intentos (el primero no consideraba que también cambiaba `draft`). Verificado en Chrome: foco en "Guardando…"/"Quitando…" y luego en "Editar límite"/"Definir límite". 102/102 · 14/14 |
| T16 | **Prueba manual de la persona** | — | REQ-01..12 | La lista de abajo, hecha a mano | [ ] |

## T16 · Prueba manual (la hace Diego, a 360 px y solo con teclado)

1. Abre `presupuesto.html`. La URL debe ser `#/2026-11` y el resumen debe decir "3 categorías necesitan atención · Gastaste S/ 1 025.00 de S/ 1 250.00 presupuestados".
2. El orden debe ser: Ocio (te pasaste), Transporte (alcanzaste), Comida (cerca), Servicios (te quedan), Vivienda y Otros (sin límite).
3. Pon un límite de 12.345 en Comida. Debe aparecer el error junto al campo y el valor no se borra.
4. Pon un límite de S/ 100 en Ocio. Se anuncia "Ya te pasaste por S/ 95.00" y el foco vuelve a "Editar límite" de Ocio.
5. Quita el límite de Servicios con "Sí, quitar". La tarjeta pasa a "Sin límite definido". Luego abre `#/2026-10`: Servicios sigue con S/ 300.
6. En `#/2026-10` no hay botones de editar y se lee "Estás viendo un mes anterior: solo lectura".
7. Abre `presupuesto.html?fallo=presupuesto`. Debe salir el error, y "Reintentar" carga la pantalla.
8. A 360 px no hay scroll horizontal.
