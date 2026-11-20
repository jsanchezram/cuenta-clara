# Glosario de CuentaClara

## Regla de idioma

- **Código en inglés.** Variables, funciones, tipos, carpetas y archivos de `js/`, clases CSS, tokens, eventos, y campos y enumeraciones del contrato.
- **Español para lo que lee una persona.** Textos de la UI, mensajes de error, documentación, nombres de pruebas y commits.
- **Excepciones que fija el enunciado:**
  - Las páginas `movimientos.html`, `registrar.html`, `presupuesto.html` y `componentes.html`, con sus pantallas en `js/screens/` y el mismo nombre.
  - `js/rutas.js` y `datos/*.json`.
  - Las etiquetas `<cc-movimiento>` y `<cc-barra-presupuesto>`.
  - El fragmento de categoría en la URL (`#/2026-11/comida`).

## Términos

| Término (UI) | En código | En el contrato v1 | Definición |
|---|---|---|---|
| Movimiento | `Transaction` / `transaction` | `TransactionDTO` | Un gasto o un ingreso. Tiene tipo, categoría, monto, fecha y descripción. |
| Tipo | `type` | `type` | `EXPENSE` (gasto) o `INCOME` (ingreso). |
| Gasto | `'expense'` | `EXPENSE` | Dinero que sale. |
| Ingreso | `'income'` | `INCOME` | Dinero que entra. |
| Categoría | `category` | `category` | Clasificación fija del movimiento (tabla de abajo). |
| Monto | `amount` (soles) | `amount_cents` (entero) | `25.5` en el modelo y `2550` en el contrato. |
| Fecha | `date` | `date` | `YYYY-MM-DD`. |
| Descripción | `description` | `description` | De 1 a 60 caracteres. |
| Mes | `month` | `month` | Período `YYYY-MM`. Es la unidad del presupuesto. |
| Mes en curso | `currentMonth(today)` | — | El mes de hoy en hora de Lima (UTC−5). Solo sus movimientos se editan o eliminan. |
| Período | `period` | `from` / `to` | Lo que muestra la lista: un mes, un día o un rango. |
| Atajo de período | `PeriodShortcut`: `TODAY` · `WEEK` · `MONTH` · `CUSTOM` | — | "Hoy", "Esta semana" (de lunes a hoy), "Este mes" y "Personalizado". |
| Presupuesto | `Budget` | `BudgetDTO` | Límite de una categoría para un mes. |
| Límite | `limit` | `limit_cents` | Lo máximo que Diego quiere gastar en una categoría en un mes. |
| Límite vigente | `effectiveFrom` | `effective_from` | Mes desde el que vale un límite. Se copia a los meses siguientes hasta el siguiente cambio (R8). |
| Usado | `spent` | — | Suma de los gastos de la categoría en el mes. |
| Restante | `remaining` | — | Límite − usado. Si es negativo, es el exceso. |
| Estado del presupuesto | `BudgetStatus` | — | `NORMAL`, `NEAR` "Cerca del límite", `REACHED` "Alcanzaste tu límite" y `EXCEEDED` "Te pasaste por S/ X" (R5). |
| Saldo | `balance` | — | Ingresos − gastos de lo que se está viendo. |
| Ruta compartible | `parseTransactionsRoute()` | — | Hash de `movimientos.html`: `#/2026-11/comida`, `#/2026-11-20` o `#/2026-11-01..2026-11-15/ocio`. |

## Categorías

| UI | Enumeración (contrato) | Modelo | En la URL |
|---|---|---|---|
| Comida | `FOOD` | `'food'` | `comida` |
| Transporte | `TRANSPORT` | `'transport'` | `transporte` |
| Vivienda | `HOUSING` | `'housing'` | `vivienda` |
| Servicios | `UTILITIES` | `'utilities'` | `servicios` |
| Ocio | `LEISURE` | `'leisure'` | `ocio` |
| Otros | `OTHER` | `'other'` | `otros` |
| Trabajo | `WORK` | `'work'` | `trabajo` |
| Otros ingresos | `OTHER_INCOME` | `'other_income'` | `otros-ingresos` |

**Tono de la UI:** español de Perú, de tú. Ejemplo: "Te pasaste por S/ 45.00".
