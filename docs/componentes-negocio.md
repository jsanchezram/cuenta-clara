# Componentes de negocio · CuentaClara

Son custom elements **sin Shadow DOM y sin CSS propio**. Se arman con clases de `styles/components.css`. Siguen la regla "datos hacia abajo, eventos hacia arriba": reciben los modelos por propiedad y avisan con eventos `cc-*` que burbujean. No importan la API ni el store; quien los conecta es la pantalla.

Las etiquetas y los eventos `cc-*` van en español, como las dos etiquetas que fija el enunciado.

## `<cc-movimiento>` · `js/components/business/cc-movimiento.js`

| Contrato | Detalle |
|---|---|
| Propiedades | `transaction: Transaction` (obligatoria) · `editHref: string \| null` |
| Atributos | — |
| Eventos | `cc-editar { id }` al activar la fila |
| Clases que usa | `.list-row`, `.list-row--link`, `.list-row__text`, `.list-row__title`, `.list-row__meta`, `.cat-icon`, `.amount--income/--expense`, `.list-row__chevron` |

Fila compacta en una sola línea: ícono · descripción con "categoría · fecha" · monto con signo · ›.

| Estado | Qué pinta | Evento |
|---|---|---|
| Gasto del mes en curso | "Almuerzo menú", "Comida · 18 nov", **− S/ 15.00** y ›. Toda la fila es el enlace de edición | `cc-editar` |
| Ingreso del mes en curso | **+ S/ 1 800.00** y ›, también como enlace | `cc-editar` |
| Mes anterior (`editHref = null`) | La misma fila, sin enlace ni › (R6, HU01-11) | — |

Accesibilidad:
- La fila-enlace se nombra así: "Editar: Almuerzo menú, Comida · 18 nov, Gasto de S/ 15.00". El signo − / + es visible y "Gasto de" se lee con el lector de pantalla.
- El objetivo táctil es la fila completa (56 px de alto como mínimo), sin un "Editar" subrayado aparte.
- La descripción va escapada con `esc()`.
- El ícono es decorativo (`aria-hidden`).

## `<cc-barra-presupuesto>` · `js/components/business/cc-barra-presupuesto.js`

| Contrato | Detalle |
|---|---|
| Propiedades | `row: BudgetRow` (de `buildBudgetRows`) |
| Atributos | `editable` (solo en el mes en curso, R8) · `heading-level="2\|3"` |
| Eventos | `cc-editar-limite`, `cc-cancelar-limite`, `cc-guardar-limite { value }`, `cc-quitar-limite`, `cc-confirmar-quitar` y `cc-cancelar-quitar`, todos con `{ category }` |
| Métodos | `setState({ editing, confirmingRemoval, saving, error, draft })` · `focusAction()` · `focusField()` · `focusConfirm()` · `focusRemove()` |
| Clases que usa | `.budget-row` (`__head`, `__text`, `__title`, `__figures`, `__money`, `__percent`, `__chevron`, `__action`), `.budget-bar--*`, `.budget-status--*`, `.cat-icon` |

Cada categoría es una **tarjeta independiente** (la da `.budget-list`) con la misma estructura que la fila de un movimiento: ícono · nombre con "S/ usado de S/ límite" debajo · porcentaje · ›. Abajo van la **barra sólida** y el estado en texto, con un puntito del color del estado y lo que queda o el exceso. Toda la tarjeta es el botón de editar (enlace estirado). Un monto nunca se parte entre dos líneas:

| Estado (R5) | Puntito | Texto | Botón (toda la tarjeta) |
|---|---|---|---|
| `NORMAL` | verde | "Te quedan S/ 180.00" | Editar límite |
| `NEAR` | ámbar | "Cerca del límite · Quedan S/ 90.00" | Editar límite |
| `REACHED` | naranja | "Alcanzaste tu límite · Quedan S/ 0.00" | Editar límite |
| `EXCEEDED` | rojo | "Te pasaste por S/ 45.00" | Editar límite |
| Sin límite | gris | "Sin límite definido" + lo usado | Definir límite |

### Edición dentro de la tarjeta (HU-03, REQ-05..09)

| Estado de la tarjeta | Qué pinta | Eventos |
|---|---|---|
| `editing` | Campo "Límite mensual de X (S/)" a todo el ancho con `draft`, Guardar, Cancelar y, si tiene límite, Quitar límite | `cc-guardar-limite`, `cc-cancelar-limite` (también con Escape), `cc-quitar-limite` |
| `editing` + `error` | El mismo campo con `aria-invalid` y el mensaje debajo; el valor escrito se conserva | — |
| `saving` | "Guardando…" / "Quitando…" con `aria-disabled`. Solo se actualiza el botón, así no se pierde el foco | — |
| `confirmingRemoval` | Confirmación en la página: "¿Quitar el límite de X?", con "Sí, quitar" y "Cancelar" | `cc-confirmar-quitar`, `cc-cancelar-quitar` (también con Escape) |

Accesibilidad:
- `role="progressbar"`, con `aria-valuenow` acotado a 100 y un `aria-valuetext` que dice el porcentaje real y el estado.
- El título le da nombre al `article`.
- El botón incluye un texto oculto con la categoría: "Editar límite de Ocio".

El foco lo mueve la pantalla con los métodos `focus*()`, buscando la tarjeta por categoría, porque las tarjetas se reordenan por urgencia.

## Componente de UI: `<cc-calendario-rango>` · `js/components/ui/cc-calendario-rango.js`

No es de negocio, pero sigue las mismas reglas: no tiene Shadow DOM ni CSS propio y no conoce rutas, API ni store.

| Contrato | Detalle |
|---|---|
| Propiedades | `today` · `min` · `value: { from, to } \| null` |
| Atributos | `single`: elige un solo día |
| Eventos | `cc-cambiar-rango { from, to }` · en modo `single`, `cc-elegir-fecha { date }` |
| Lo usan | La hoja del período en Movimientos (rango) y la hoja de la fecha en Registrar (`single`, con `min` según R2 o R6) |

Accesibilidad:
- Solo un día está en el orden de tabulación (tabindex itinerante).
- Las flechas del teclado mueven el día; Re Pág / Av Pág cambian de mes; Inicio / Fin van al lunes y al domingo.
- Cada día tiene un nombre completo, por ejemplo "viernes 20 de noviembre de 2026, hoy, fin del rango".
- Los días futuros, y los anteriores a `min`, están deshabilitados.
