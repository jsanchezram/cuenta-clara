# Contrato de la API · CuentaClara v1

Es la API que tendría CuentaClara. **No existe:** la simula `js/api/cuentaclara-api.js` con la misma forma de datos y los mismos errores. El DTO de `js/contracts/dto.js` copia este documento. **Este contrato no se cambia sin una versión nueva.**

## Convenciones

| Convención | Regla | Ejemplo |
|---|---|---|
| Nombres | `snake_case` y en inglés | `created_at`, `effective_from` |
| Dinero | **Céntimos enteros**, en los campos `amount` y `limit` | `1500` = S/ 15.00 |
| Fechas | `YYYY-MM-DD` (sin hora) | `"2026-11-18"` |
| Mes | `YYYY-MM` | `"2026-11"` |
| Marcas de auditoría | ISO 8601 con zona de Lima `-05:00` | `"2026-11-18T13:05:00-05:00"` |
| Enumeraciones | MAYÚSCULAS | `"EXPENSE"`, `"FOOD"` |
| Ausencia | `null`, nunca se omite el campo | `"deleted_at": null` |
| Base | `/api/v1` | — |
| Formato | `application/json; charset=utf-8` | — |

## Enumeraciones

| Enumeración | Valores |
|---|---|
| `TransactionType` | `EXPENSE`, `INCOME` |
| `ExpenseCategory` | `FOOD`, `TRANSPORT`, `HOUSING`, `UTILITIES`, `LEISURE`, `OTHER` |
| `IncomeCategory` | `WORK`, `OTHER_INCOME` |
| `ErrorCode` | `VALIDATION_ERROR`, `NOT_FOUND`, `OUTSIDE_CURRENT_MONTH`, `SERVER_ERROR` |

## Recursos

### Transaction (movimiento)

```json
{
  "id": "txn_0001",
  "type": "EXPENSE",
  "category": "FOOD",
  "amount": 1500,
  "date": "2026-11-18",
  "description": "Almuerzo menú",
  "created_at": "2026-11-18T13:05:00-05:00",
  "updated_at": "2026-11-18T13:05:00-05:00",
  "deleted_at": null
}
```

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string | Lo asigna el servidor: `txn_` + 4 dígitos o más. |
| `type` | `TransactionType` | Obligatorio. |
| `category` | enumeración | Si `type` es `EXPENSE`, una `ExpenseCategory`. Si es `INCOME`, una `IncomeCategory` (R3). |
| `amount` | entero | Céntimos: de 1 a 1 000 000, es decir, de S/ 0.01 a S/ 10 000 (R1). |
| `date` | `YYYY-MM-DD` | Entre hoy − 60 días y hoy, en hora de Lima (R2). |
| `description` | string | 1 a 60 caracteres, sin contar los espacios de los extremos (R4). |
| `created_at` | ISO 8601 | Lo asigna el servidor al crear. Sirve para ordenar los movimientos del mismo día. |
| `updated_at` | ISO 8601 | Lo asigna el servidor al crear y en cada edición. |
| `deleted_at` | ISO 8601 o `null` | Eliminación **lógica**. Un movimiento con `deleted_at` no se lista ni suma. |

### Budget (presupuesto)

```json
{
  "category": "FOOD",
  "limit": 60000,
  "effective_from": "2026-10",
  "created_at": "2026-10-01T09:00:00-05:00",
  "updated_at": "2026-10-01T09:00:00-05:00"
}
```

| Campo | Tipo | Regla |
|---|---|---|
| `category` | `ExpenseCategory` | Solo los gastos tienen presupuesto. |
| `limit` | entero | Céntimos, con la misma regla que `amount` (R7). |
| `effective_from` | `YYYY-MM` | Mes desde el que vale el límite. Para un mes M, el límite vigente es el registro con el mayor `effective_from ≤ M` (R8). |
| `created_at`, `updated_at` | ISO 8601 | Auditoría. |
| `deleted_at` | ISO 8601 o `null` (**opcional**, agregado por HU-03) | Si está lleno, el límite fue **quitado** desde `effective_from`: para un mes M, si el registro vigente tiene `deleted_at`, la categoría no tiene límite ese mes. Es un cambio aditivo: un registro sin el campo equivale a `null`. |

## Endpoints

### `GET /api/v1/transactions`

Lista los movimientos **no eliminados** de un período, ordenados por `date` descendente y, dentro del mismo día, por `created_at` descendente.

| Parámetro | Obligatorio | Ejemplo | Nota |
|---|---|---|---|
| `month` | uno de los dos | `2026-11` | Un mes completo |
| `from` + `to` | uno de los dos | `2026-11-01`, `2026-11-15` | Rango cerrado, con `from ≤ to` |
| `category` | no | `FOOD` | Filtra por categoría |

`200 OK`
```json
{ "data": [ { "id": "txn_0016", "type": "EXPENSE", "category": "FOOD", "amount": 1500, "date": "2026-11-18", "description": "Almuerzo menú", "created_at": "…", "updated_at": "…", "deleted_at": null } ] }
```

La API **no** calcula totales, saldo ni porcentajes. Lo hace el cliente con funciones puras (`js/logic/`), que tienen pruebas.

Errores: `422 VALIDATION_ERROR` en estos casos:
- Se envían `month` y `from`/`to` a la vez, o ninguno de los dos.
- El rango está invertido.
- Una fecha tiene formato inválido.

### `GET /api/v1/transactions/{id}`

Lee un movimiento no eliminado. Lo usa la edición (`registrar.html?id=…`).

| Respuesta | Cuándo |
|---|---|
| `200 OK` | Devuelve el `Transaction` |
| `404 NOT_FOUND` | No existe o está eliminado |

### `POST /api/v1/transactions`

Crea un movimiento.

Cuerpo:
```json
{ "type": "EXPENSE", "category": "FOOD", "amount": 1500, "date": "2026-11-18", "description": "Almuerzo menú" }
```

Respuestas:
- `201 Created`: devuelve el `Transaction` completo.
- `422 VALIDATION_ERROR`: si no cumple R1–R4.

### `PATCH /api/v1/transactions/{id}`

Edición **parcial**: se envían solo los campos que cambian, del conjunto `type`, `category`, `amount`, `date` y `description`. El servidor combina esos campos con el movimiento guardado y valida **el resultado completo** con las mismas reglas que POST (R6). Así, por ejemplo, cambiar `type` sin cambiar `category` puede dejar una categoría inválida, y eso da error.

Cuerpo de ejemplo:
```json
{ "amount": 1800, "description": "Almuerzo menú + postre" }
```

| Respuesta | Cuándo |
|---|---|
| `200 OK` | Devuelve el `Transaction` actualizado, con un `updated_at` nuevo |
| `404 NOT_FOUND` | No existe o ya está eliminado |
| `409 OUTSIDE_CURRENT_MONTH` | El movimiento guardado no es del mes en curso (R6) |
| `422 VALIDATION_ERROR` | El resultado combinado no cumple R1–R4, o la fecha nueva sale del mes en curso (R6, en `fields.date`) |

### `DELETE /api/v1/transactions/{id}`

Eliminación **lógica**: llena `deleted_at` y el movimiento deja de listarse.

| Respuesta | Cuándo |
|---|---|
| `204 No Content` | Eliminado |
| `404 NOT_FOUND` | No existe o ya estaba eliminado |
| `409 OUTSIDE_CURRENT_MONTH` | No es del mes en curso (R6) |

### `GET /api/v1/budgets?month=YYYY-MM`

Devuelve el límite **vigente** en ese mes para cada categoría que tenga uno (R8). Las categorías sin límite no aparecen.

`200 OK`
```json
{ "data": [ { "category": "LEISURE", "limit": 15000, "effective_from": "2026-11", "created_at": "…", "updated_at": "…" } ] }
```

### `PUT /api/v1/budgets/{category}`

Define o cambia el límite de una categoría **desde el mes en curso** (R8). El servidor fija `effective_from` en el mes en curso:
- Si ya existe un registro de ese mes, lo reemplaza.
- Si no existe, crea uno nuevo.

Los meses anteriores conservan su límite.

Cuerpo:
```json
{ "limit": 15000 }
```

Respuestas:
- `200 OK`: devuelve el `Budget`.
- `422 VALIDATION_ERROR`: si no cumple R7 o si la categoría no es de gasto.

Es `PUT` y no `PATCH` porque el límite es el único campo editable.

### `DELETE /api/v1/budgets/{category}`

Quita el límite de una categoría **desde el mes en curso** (HU-03, REQ-09). Es una eliminación lógica que respeta R8:
- Si existe un registro con `effective_from` = mes en curso, se llena su `deleted_at`.
- Si no existe, se crea uno con ese mes, el último `limit` y `deleted_at` lleno.

Los meses anteriores conservan su límite. Volver a definir el límite en el mismo mes con `PUT` reemplaza el registro y deja `deleted_at` en `null`.

| Respuesta | Cuándo |
|---|---|
| `204 No Content` | Límite quitado |
| `404 NOT_FOUND` | La categoría no tiene un límite vigente en el mes en curso |
| `422 VALIDATION_ERROR` | La categoría no es de gasto |

`GET /budgets?month=` no devuelve las categorías cuyo registro vigente está quitado.

## Errores

Todos los errores tienen la misma forma:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisa los campos marcados.",
    "fields": {
      "amount": "Usa como máximo 2 decimales.",
      "description": "Escribe una descripción."
    }
  }
}
```

| `code` | HTTP | `message` (para mostrar) | `fields` |
|---|---|---|---|
| `VALIDATION_ERROR` | 422 | "Revisa los campos marcados." | Sí: campo → mensaje |
| `NOT_FOUND` | 404 | "No encontramos ese movimiento." (o "Esa categoría no tiene límite este mes." en presupuestos) | No |
| `OUTSIDE_CURRENT_MONTH` | 409 | "Solo puedes editar o eliminar movimientos de este mes." | No |
| `SERVER_ERROR` | 500 | "Tuvimos un problema. Intenta de nuevo." | No |

`message` y `fields` están en español porque se muestran a Diego.

## Simulación

- Guarda los DTO en `localStorage` con las claves `cuentaclara.v1.transactions` y `cuentaclara.v1.budgets`.
- Si el almacén está vacío, siembra `datos/movimientos.json` y `datos/presupuestos.json`. Al sembrar, **corre los meses** para que el último mes de los datos coincida con el mes en curso. El archivo no cambia, y la demo funciona en cualquier fecha.
- Simula latencia (`delayMs`) y fallos a pedido con `?fallo=movimientos`, `?fallo=guardar` o `?fallo=presupuesto`, que responden `500 SERVER_ERROR`. El fallo ocurre **solo en el primer pedido**, así que "Reintentar" funciona.
- Al sembrar, los meses se corren **por meses completos**, y cualquier fecha que quede después de hoy se ajusta a hoy. Así cada movimiento sigue en su mes y se mantienen los estados del presupuesto.
