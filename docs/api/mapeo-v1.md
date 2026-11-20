# Mapeo DTO ↔ modelo · v1

`js/contracts/mappers.js` es el **único** lugar que conoce las dos formas. Ahí se valida cada DTO que llega: si no cumple el contrato, lanza `ContractError`.

## TransactionDTO → Transaction

| DTO (contrato) | Modelo (UI) | Transformación | Por qué |
|---|---|---|---|
| `id` | `id` | Se copia | — |
| `type` `"EXPENSE"` | `type` `'expense'` | Pasa a minúsculas y se valida contra la enumeración | El modelo usa las mismas minúsculas que el resto del código |
| `category` `"FOOD"` | `category` `'food'` | Pasa a minúsculas y se valida que sea coherente con `type` (R3) | Valores cerrados: un dato fuera de la lista rompería el filtro |
| `amount` `1500` | `amount` `15` | ÷ 100 y se valida que sea entero entre 1 y 1 000 000 | La UI y las reglas trabajan en soles. Un decimal en céntimos indica un contrato roto |
| `date` `"2026-11-18"` | `date` `"2026-11-18"` | Se copia y se valida el formato `YYYY-MM-DD` | Se compara como texto, sin zona horaria (decisión de bitácora) |
| `description` | `description` | Se copia | Se escapa al pintar con `esc()`, no al mapear |
| `created_at` | `createdAt` | camelCase | Desempata el orden dentro del mismo día |
| `updated_at` | `updatedAt` | camelCase | Auditoría |
| `deleted_at` | — | **Se filtra**: un DTO con `deleted_at` no llega a la UI | La eliminación es lógica y la UI no muestra eliminados |

## Transaction (formulario) → cuerpo de POST / PATCH

| Modelo | DTO | Transformación | Por qué |
|---|---|---|---|
| `type` `'expense'` | `type` `"EXPENSE"` | Pasa a MAYÚSCULAS | Convención del contrato |
| `category` `'food'` | `category` `"FOOD"` | Pasa a MAYÚSCULAS | — |
| `amount` `15.5` | `amount` `1550` | `Math.round(× 100)` | Evita el error de coma flotante (`0.1 + 0.2`) |
| `date` | `date` | Se copia | — |
| `description` | `description` | Se recortan los espacios de los extremos | R4 cuenta sin los espacios de los extremos |
| (PATCH) | solo los campos que cambiaron | Se compara con el original | Edición parcial (bitácora) |

## BudgetDTO → Budget

| DTO | Modelo | Transformación | Por qué |
|---|---|---|---|
| `category` `"LEISURE"` | `category` `'leisure'` | Pasa a minúsculas y se valida que sea de gasto | Solo los gastos tienen presupuesto |
| `limit` `15000` | `limit` `150` | ÷ 100 y se valida que sea entero entre 1 y 1 000 000 (R7) | — |
| `effective_from` `"2026-11"` | `effectiveFrom` `"2026-11"` | camelCase y se valida `YYYY-MM` | R8 |
| `created_at`, `updated_at` | — | Se descartan | La UI no los muestra |
| `deleted_at` | `removed` (solo en `BudgetRecord`) | `!= null` → `true` | La API lo usa para calcular el límite vigente; la UI solo ve presupuestos activos (`Budget`) |

## Error

| DTO | Modelo | Transformación |
|---|---|---|
| `{ error: { code, message, fields } }` | `ApiError` (`code`, `message`, `fields`) | La API simulada lo lanza como excepción. La pantalla muestra `message` y pone cada `fields[campo]` junto a su campo. |
