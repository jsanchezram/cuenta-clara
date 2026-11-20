# Design system · CuentaClara

Es un acuerdo escrito sobre cómo se ve y cómo se comporta la UI. El CSS es una de sus salidas.

| Archivo | Rol |
|---|---|
| `styles/tokens.css` | Valores en 3 capas, en tema claro y oscuro. Es el único archivo con hex. |
| `styles/components.css` | Layouts y componentes de UI. |
| `js/components/icons.js` | Íconos SVG sólidos y monocromos (una sola fuente; `scripts/expandir-iconos.mjs` los copia a las páginas). |
| `componentes.html` | Vitrina: cada componente en cada estado y un botón "Tema oscuro". |
| `.claude/rules/estilos-css.md`, `html-accesibilidad.md` | Reglas que Claude aplica al tocar CSS, HTML, componentes y pantallas. |

**Identidad.** La interfaz es limpia y móvil:
- La marca es azul vibrante, en una barra fina con el logotipo. En laptop, la barra también lleva el menú.
- Las superficies son blancas, con sombra suave y esquinas de 16 px, sin bordes gruesos ni subrayados.
- La tipografía es Inter. Solo los títulos de vista van en negrita y los números principales en semibold; el resto va en peso regular o medio.
- Así quedó después de la revisión de la persona (bitácora #21 a #34).

## 1. Tokens

Tres capas, donde cada una solo usa la de abajo. Ningún componente usa primitivos.

| Capa | Ejemplos | Uso |
|---|---|---|
| 1 · Primitivo | `--blue-600`, `--amber-700`, `--space-4`, `--font-size-md` | Valor crudo |
| 2 · Semántico | `--color-action-primary`, `--color-accent-text`, `--color-budget-near-text` | Intención. El tema oscuro (`[data-theme="dark"]`) redefine solo esta capa |
| 3 · Componente | `--button-height` (48 px), `--control-height` (44 px), `--chip-visual-height`, `--calendar-day-size` | Decisión de un componente |

**Tipografía compacta:**
- Cuerpo de 15 px y etiquetas de 13 px.
- Los campos se quedan en 16 px (`--font-size-input`) para evitar el zoom de iOS.
- Títulos de vista de 28 px en peso 700, con tracking −0.025em (36 px en laptop).

**Contraste.** Los 50 pares de color se midieron con un script, en tema claro y oscuro:
- Texto de 6.7:1 a 16.3:1. Lo mínimo es 5.0:1 (ingresos y "Cerca del límite").
- Botón primario: 5.2:1.
- Bordes de campo: 4.8:1.
- Rellenos de barra frente a la pista: 4.1:1 o más.

## 2. Flujos de usuario

**Registrar un gasto**, en el celular, con una mano:

| Paso | Lo que hace | Pantalla y zona | Componentes | Estados |
|---|---|---|---|---|
| 1 | Toca "Registrar" | Menú inferior | `.bottom-nav` | Actual en azul con `aria-current` |
| 2 | Escribe el monto | Registrar · arriba | `.field__control--amount` | Normal, error |
| 3 | Toca una categoría | Mosaico | `.tile-group` (radios nativos) | Elegida en azul, error |
| 4 | Elige la fecha (por defecto, hoy) | Hoja inferior | `.date-trigger`, `.sheet`, `<cc-calendario-rango single>` | Hoy, Ayer, día del calendario |
| 5 | Toca "Guardar" | Barra fija sobre el menú | `.action-bar`, `.btn--primary` | Guardando, confirmación con `role="status"` |

**Revisar el mes**, en la laptop:

| Paso | Lo que hace | Pantalla y zona | Componentes | Estados |
|---|---|---|---|---|
| 1 | Abre Movimientos | Columna izquierda | `.period-trigger`, `.summary` | Cargando, error |
| 2 | Cambia el período | Hoja / diálogo | `.option` (atajos), `<cc-calendario-rango>` | Atajo activo con ✓, rango marcado |
| 3 | Filtra por categoría | Chips | `.chip[aria-pressed]` | Vacío por filtro |
| 4 | Revisa la lista | Columna derecha | `<cc-movimiento>`, `.list-more` | 8 por tanda, "Cargar más" |
| 5 | Revisa su presupuesto | Presupuesto | `.budget-summary`, `<cc-barra-presupuesto>` | 4 estados de R5, sin límite, "Ver más" |

## 3. Layouts

- Primitivas: `.container` (contenido a 40rem en el celular y 72rem en laptop, siempre con margen lateral), `.stack` (vertical; `--compact` 12 px, `--sm` 8 px) y `.cluster` (fila que se envuelve).
- **Un solo breakpoint:** `@media (min-width: 48rem)`. Se diseña mobile-first desde 360 px. `.card-grid` usa una cuadrícula intrínseca (`auto-fill`) que no necesita breakpoints extra.
- En el celular, el menú va abajo y "Guardar" queda fijo justo encima. En laptop, el menú sube a la barra de marca. Movimientos usa `.layout` en 2 columnas y Registrar usa `.container--narrow`.
- Las hojas (`.sheet`) son diálogos modales: en el celular se abren desde abajo, sobre la pantalla, y en laptop se ven como un diálogo centrado.

## 4. Componentes

| Componente | Para qué |
|---|---|
| `.btn` (`--primary`, `--secondary`, `--danger`, `--danger-solid`, `--link`, `--block`), `.icon-btn` | Acciones. Un solo primario por vista y sin subrayados |
| `.field` (`__label`, `__control`, `__control--amount`, `__hint`, `__error`, `__counter`) | Campos con etiqueta visible y error junto al campo |
| `.segmented` | Gasto o Ingreso con radios nativos. El elegido se rellena en azul y lleva ✓ |
| `.tile-group` / `.tile` | Categoría en mosaico con ícono. Un toque, sin desplegable que se salga de la pantalla a 360 px |
| `.chip` / `.chip-group` | Filtro por categoría. Se ven de 36 px, con área táctil de 44 px, `aria-pressed` y ✓ en el activo |
| `.period-trigger`, `.date-trigger` | Botones que abren una hoja: período en Movimientos y fecha en Registrar |
| `.sheet`, `.option` | Hoja modal y atajos en píldoras (Hoy, Esta semana, Este mes, Mes anterior / Hoy, Ayer) |
| `<cc-calendario-rango>` · `.calendar` | Calendario de un mes. Marca un rango o un día (`single`), con tabindex itinerante y flechas del teclado |
| `.summary` | Saldo arriba, y Gastos e Ingresos debajo, de lo filtrado |
| `.list`, `.list-row`, `.list-more` | Fila compacta (`<cc-movimiento>`) y "Cargar más" de a 8 |
| `.cat-icon` | Ícono de categoría: azul de marca sobre un círculo azul claro |
| `.budget-summary`, `.budget-card`, `.budget-bar`, `.budget-status` | Resumen del mes y tarjeta compacta con barra sólida y estado en texto |
| `.alert` (`--success`, `--error`), `.state`, `.skeleton`, `.confirm` | Mensajes, vacío o error, carga y confirmación de eliminar en la página |
| `.brand-bar`, `.brand`, `.bottom-nav`, `.page-header`, `.skip-link`, `.visually-hidden` | Estructura y accesibilidad |

Los componentes de negocio `<cc-movimiento>` y `<cc-barra-presupuesto>` se arman con estas clases y no traen CSS propio. El detalle está en `docs/componentes-negocio.md`.

## 5. Design tokens del dominio

Los nombres siguen el patrón `categoría-rol-variante`.

| Token | Capa | Intención |
|---|---|---|
| `--color-budget-{normal,near,reached,exceeded}-text` / `-fill` | Semántico | Texto del estado y relleno sólido de la barra (R5) |
| `--color-budget-track` | Semántico | Pista de la barra |
| `--color-income-text`, `--color-expense-text` | Semántico | Montos |
| `--color-brand`, `--color-on-brand`, `--color-accent-text`, `--color-selected-bg`, `--color-selected-text` | Semántico | Marca, acento (enlaces y menú activo) y selección suave |
| `--color-cat-icon-bg`, `--color-cat-icon-fg` | Semántico | Ícono de categoría monocromo |
| `--color-backdrop`, `--shadow-card`, `--shadow-raised`, `--shadow-nav` | Semántico | Velo del modal y elevación |
| `--calendar-day-size`, `--chip-visual-height`, `--action-bar-space`, `--list-row-min-height` | Componente | Medidas |

## 6. Estados de UI

| Elemento | default | hover | focus | seleccionado | deshabilitado | cargando | vacío | error |
|---|---|---|---|---|---|---|---|---|
| Botón | ✓ | ✓ | ✓ anillo de 3 px | — | ✓ | ✓ "Guardando…" con `aria-disabled` | — | — |
| Campo | ✓ | — | ✓ | — | — | — | — | ✓ borde de 2 px + ⚠ + mensaje |
| Chip, atajo | ✓ | ✓ | ✓ | ✓ relleno azul + ✓ | — | — | — | — |
| Mosaico de categoría | ✓ | — | ✓ | ✓ relleno azul | — | — | — | ✓ borde rojo + mensaje |
| Día del calendario | ✓ | ✓ | ✓ | ✓ círculo azul (extremos) y franja clara (rango) | ✓ futuro o fuera de R2/R6 | — | — | — |
| Lista | ✓ | ✓ fila | ✓ fila | — | — | ✓ skeleton + "Cargando…" | ✓ `.state` + acción | ✓ alerta + Reintentar |
| Barra de presupuesto | normal ✓ | — | — | — | — | ✓ | sin límite ✓ | — |

La barra tiene los 4 estados de R5. Se distinguen **en texto**, con un ícono que refuerza; el color de la barra sólida es solo un refuerzo:

| Estado | Ícono | Texto |
|---|---|---|
| NORMAL | ✓ | "Te quedan S/ X" |
| NEAR | ⚠ | "Cerca del límite · Quedan S/ X" |
| REACHED | ● | "Alcanzaste tu límite · Quedan S/ 0.00" |
| EXCEEDED | ✕ | "Te pasaste por S/ X" |

## 7. Reglas y responsive

El detalle está en `.claude/rules/estilos-css.md` y `.claude/rules/html-accesibilidad.md`. Lo esencial:
- El estado se lee en texto. El color y el ícono solo refuerzan.
- `role="status"` en las confirmaciones. `role="alert"` solo para errores que interrumpen.
- Durante la carga: `aria-busy="true"` y un skeleton con `aria-hidden`.
- Objetivos táctiles de 44 px o más (48 px el primario). Los chips y atajos se ven de 36 px, pero su área táctil es de 44 px.
- Excepción: los días del calendario miden 46 × 36 px. Cumplen WCAG 2.5.8 (24 px como mínimo); se achicaron para que la hoja no ocupe toda la pantalla.
- Las hojas devuelven el foco al botón que las abrió al cerrarse por cualquier camino: atajo, Aplicar, Cancelar, ✕, Escape o tocar el fondo.
- Se prueba a 360 px y a 1280 px, sin scroll horizontal.
- Respeta `prefers-reduced-motion`.
