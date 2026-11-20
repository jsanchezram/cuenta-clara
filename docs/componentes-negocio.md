# Componentes de negocio · CuentaClara

Son custom elements **sin Shadow DOM y sin CSS propio**. Se arman con clases de `styles/components.css`. Siguen la regla "datos hacia abajo, eventos hacia arriba": reciben los modelos por propiedad y avisan con eventos `cc-*` que burbujean. No importan la API ni el store; quien los conecta es la pantalla.

## `<cc-movimiento>` · `js/components/cc-movimiento.js`

| Contrato | Detalle |
|---|---|
| Propiedades | `transaction: Transaction` (obligatoria) · `editHref: string \| null` |
| Atributos | — |
| Eventos | `cc-editar { id }` al activar "Editar" |
| Clases que usa | `.list-row` (en el host), `.list-row__title`, `.list-row__meta`, `.amount--income/--expense`, `.btn--link` |

| Estado | Qué pinta | Evento |
|---|---|---|
| Gasto del mes en curso | "Almuerzo menú", "Comida · 18 nov · Gasto", **− S/ 15.00** y el enlace "Editar" | `cc-editar` |
| Ingreso del mes en curso | **+ S/ 1 800.00** y el enlace "Editar" | `cc-editar` |
| Mes anterior (`editHref = null`) | Igual, sin "Editar" (R6, HU01-11) | — |

Accesibilidad:
- El signo − / + es visible y el lector de pantalla oye "Gasto de S/ 15.00".
- El enlace "Editar" tiene un texto oculto con la descripción, para que en la lista no se lean 16 "Editar" iguales.
- La descripción va escapada con `esc()`.

## `<cc-barra-presupuesto>` · `js/components/cc-barra-presupuesto.js`

| Contrato | Detalle |
|---|---|
| Propiedades | `row: BudgetRow` (de `buildBudgetRows`) |
| Atributos | `editable` (solo en el mes en curso, R8) · `heading-level="2\|3"` |
| Eventos | `cc-editar-limite { category }` |
| Métodos | `focusAction()`: devuelve el foco a "Editar límite" al cerrar el formulario |
| Clases que usa | `.card`, `.budget-figures`, `.budget-bar--*`, `.budget-status--*`, `.budget-meta` |

| Estado (R5) | Barra | Ícono | Texto | Botón |
|---|---|---|---|---|
| `NORMAL` | Relleno liso | ✓ | "Te quedan S/ 180.00" | Editar límite |
| `NEAR` | Rayas diagonales | ⚠ | "Cerca del límite" | Editar límite |
| `REACHED` | Llena, con rayas verticales | ● | "Alcanzaste tu límite" | Editar límite |
| `EXCEEDED` | Cuadriculado; la tercera cifra dice "Excedido" | ✕ | "Te pasaste por S/ 45.00" | Editar límite |
| Sin límite | Sin barra | ○ | "Sin límite definido" + lo usado | Definir límite |

Accesibilidad:
- `role="progressbar"`, con `aria-valuenow` acotado a 100 y un `aria-valuetext` que dice el porcentaje real y el estado, por ejemplo "130 % usado. Te pasaste por S/ 45.00".
- El título de la tarjeta le da nombre al `article` mediante `aria-labelledby`.
- El botón tiene un texto oculto con la categoría: "Editar límite de Ocio".
