# Plan · HU-03 Presupuesto por categoría

> AI-First · Paso B2. Describe el CÓMO. La fuente de verdad es `spec.md` (aprobada), y este plan no agrega alcance.
> Respeta las 5 capas de CLAUDE.md: contrato → lógica pura → API → estado → componente → ruta y pantalla.

## Decisiones técnicas

### D1 · Quitar un límite (REQ-09) sin romper el contrato v1
- Nuevo endpoint `DELETE /api/v1/budgets/{category}`. Responde `204`, o `404 NOT_FOUND` si no hay un límite vigente en el mes en curso.
- El presupuesto gana el campo **opcional** `deleted_at` (ISO o `null`). Se usa la misma convención de eliminación lógica que en los movimientos, y es un cambio **aditivo**: los datos existentes sin el campo siguen siendo válidos.
- **Quitar** es un registro con `effective_from` = mes en curso y `deleted_at` lleno:
  - si ya existe un registro de ese mes, se marca;
  - si no existe, se crea uno con el último límite y `deleted_at`.
- Volver a definir el límite en el mismo mes reemplaza ese registro y limpia `deleted_at`.
- `effectiveLimit` sigue eligiendo el registro con el mayor `effective_from ≤ mes`. Si ese registro tiene `deleted_at`, la categoría **no tiene límite** ese mes. Así R8 se cumple también al quitar.
- Alternativa descartada: `limit: null`. Habría cambiado el tipo de un campo existente, que es un cambio que rompe.

### D2 · La lógica nueva va en funciones puras con pruebas
- `sortByUrgency(rows)` cubre REQ-03.
- `budgetSummary(rows)` cubre REQ-04: devuelve `{ attention, spent, limit, text }`.
- `effectiveLimit` acepta registros con `removed`.

### D3 · El componente edita dentro de la tarjeta (REQ-05..09), sin conocer la API
`<cc-barra-presupuesto>` suma varias propiedades:
- `editing` (boolean)
- `confirmingRemoval` (boolean)
- `saving` (boolean)
- `error` (string)
- `draft` (string)

Y emite estos eventos:
- `cc-editar-limite { category }`
- `cc-cancelar-limite`
- `cc-guardar-limite { category, value }`
- `cc-quitar-limite { category }`
- `cc-confirmar-quitar { category }`

La pantalla decide y llama a las acciones. El componente solo pinta y avisa.

### D4 · Estado de la pantalla en un store propio
`js/state/budget.js` define:
- **Estado:** `status`, `month`, `rows`, `editing`, `confirmingRemoval`, `saving`, `error`, `draft` y `notice`.
- **Acciones:** `load(month)`, `startEdit`, `cancelEdit`, `saveLimit(category, text)`, `askRemove`, `removeLimit(category)` y `retry`.

`load` pide en paralelo los presupuestos vigentes y los gastos del mes, y arma las filas con `buildBudgetRows` y `sortByUrgency`. Usa la misma protección contra carreras que la lista de movimientos.

### D5 · Ruta `presupuesto.html#/AAAA-MM` en `js/rutas.js`
- `parseBudgetRoute(hash, today)` y `routes.budget(month)`.
- Un mes inválido o futuro se corrige al mes en curso con `replaceState`.
- Solo el mes en curso es editable (atributo `editable`).

### D6 · Foco tras reordenar (REQ-07)
Después de guardar o quitar, la tarjeta puede cambiar de posición. La pantalla busca la tarjeta por `data-category` y llama a `focusAction()`, así el foco no depende de la posición.

### D7 · Verificación automática
`scripts/verificar-hu03.mjs` hace chequeos estáticos `[HU03-n]`:
- existen los archivos y tienen `// @ts-check`;
- no hay hex;
- no hay `localStorage` en la pantalla;
- el componente emite sus eventos;
- la página tiene `aria-busy` y una región `role="status"`;
- el contrato documenta `DELETE /budgets`.

Muestra un conteo N/N. Se ejecuta junto con `node --test` después de cada tarea.

## Archivos y requisito que cubre cada uno

| # | Archivo | Cambio | Requisitos |
|---|---|---|---|
| 1 | `docs/api/contrato-v1.md`, `docs/api/mapeo-v1.md` | `DELETE /budgets/{category}` y `deleted_at` opcional | REQ-09 |
| 2 | `js/contracts/dto.js`, `js/contracts/mappers.js` | `BudgetDTO.deleted_at` y `toBudgetRecord` | REQ-09 |
| 3 | `tests/budget.test.js`, `tests/contracts.test.js` | Pruebas de orden, resumen, registro quitado y vigencia | REQ-03, 04, 09 |
| 4 | `js/logic/budget.js` | `sortByUrgency`, `budgetSummary` y `effectiveLimit` con quitados | REQ-03, 04, 09 |
| 5 | `tests/api.test.js` | Pruebas de quitar límite (mes en curso, meses anteriores intactos, volver a definir) | REQ-07, 09 |
| 6 | `js/api/cuentaclara-api.js` | `removeBudget` y `listBudgets`/`saveBudget` con `deleted_at` | REQ-07, 09 |
| 7 | `tests/rutas.test.js`, `js/rutas.js` | `parseBudgetRoute` y `routes.budget` | REQ-01, 10 |
| 8 | `js/state/budget.js` | Acciones y store de la pantalla | REQ-02..11 |
| 9 | `js/components/cc-barra-presupuesto.js`, `docs/componentes-negocio.md` | Edición en la tarjeta, confirmación de quitar y eventos | REQ-05..09, 12 |
| 10 | `presupuesto.html`, `js/screens/presupuesto.js` | Armazón y pantalla | REQ-01..12 |
| 11 | `scripts/verificar-hu03.mjs` | Verificación estática N/N | Terminado |

No se tocan `movimientos.html`, `registrar.html`, sus pantallas ni las pruebas existentes.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Cambiar el contrato rompe datos o pruebas existentes | El campo es opcional y aditivo. Las 83 pruebas deben seguir en verde después de cada tarea |
| El foco se pierde al reordenar tarjetas o al reemplazar la lista | D6: buscar por `data-category`. Tras la carga y Reintentar, el foco va al título, como en HU-01 y HU-02 |
| Dos tarjetas en edición a la vez | El store guarda una sola `editing`. Abrir otra cierra la anterior |
| `?fallo=guardar` deja la tarjeta bloqueada | Un fallo vuelve a `ready`, con el error en la tarjeta y el borrador conservado |
| Corrimiento de los datos de ejemplo (`shiftSeed`) con `deleted_at` | `shiftSeed` también corre `deleted_at` de los presupuestos. Se cubre con una prueba |
| Quitar un límite y volver a definirlo en el mismo mes | Se reemplaza el registro del mes y se limpia `deleted_at`. Se cubre con una prueba |
