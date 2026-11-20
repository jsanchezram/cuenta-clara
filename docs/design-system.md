# Design system · CuentaClara

Es un acuerdo escrito sobre cómo se ve y cómo se comporta la UI. El CSS es una de sus salidas.

| Archivo | Rol |
|---|---|
| `styles/tokens.css` | Valores en 3 capas, en tema claro y oscuro. Es el único archivo con hex. |
| `styles/components.css` | Layouts y componentes de UI. |
| `componentes.html` | Vitrina: cada componente en cada estado y un botón "Tema oscuro". |
| `.claude/rules/estilos-css.md`, `html-accesibilidad.md` | Reglas que Claude aplica al tocar CSS, HTML, componentes y pantallas. |

## 1. Tokens

Tres capas, donde cada una solo usa la de abajo. Ningún componente usa primitivos de color.

| Capa | Ejemplos | Uso |
|---|---|---|
| 1 · Primitivo | `--green-700`, `--amber-800`, `--space-4`, `--font-size-lg` | Valor crudo |
| 2 · Semántico | `--color-action-primary`, `--color-text-muted`, `--color-budget-near-text` | Intención. El tema oscuro (`[data-theme="dark"]`) redefine solo esta capa |
| 3 · Componente | `--button-height` (48 px), `--control-height` (44 px), `--budget-bar-height` | Decisión de un componente |

Contraste medido con un script. Las cifras son del tema claro, sobre la superficie donde se usa cada color:
- Texto 14.8:1.
- Texto secundario 6.5:1.
- Bordes de control 4.6:1.
- Avisos de presupuesto entre 6.6:1 y 7.3:1.
- Rellenos de la barra frente a la pista: 5.3:1 o más.

En el tema oscuro todos los pares de texto pasan de 7:1.

## 2. Flujos de usuario

**Registrar un gasto**, en el celular, con una mano:

| Paso | Lo que hace | Pantalla y zona | Componentes | Estados |
|---|---|---|---|---|
| 1 | Toca "Registrar" | Navegación inferior | `.bottom-nav` | Actual con `aria-current` |
| 2 | Escribe el monto | Registrar · arriba | `.field`, `.field__money` | Normal, error |
| 3 | Elige categoría y descripción | Registrar · centro | `.field`, `.segmented` | Error, contador |
| 4 | Toca "Guardar" | Barra fija abajo | `.btn--primary.btn--block` | Guardando, deshabilitado |
| 5 | Ve la confirmación | Registrar · arriba | `.alert--success` | Éxito con "Registrar otro" |

**Revisar el mes**, en la laptop:

| Paso | Lo que hace | Pantalla y zona | Componentes | Estados |
|---|---|---|---|---|
| 1 | Abre Movimientos | Movimientos | `.period-picker`, `.summary` | Cargando, error |
| 2 | Filtra por categoría | Chips | `.chip[aria-pressed]` | Vacío por filtro |
| 3 | Comparte el enlace | URL `#/2026-11/comida` | — | URL inválida corregida |
| 4 | Revisa su presupuesto | Presupuesto | `.card`, `.budget-bar`, `.budget-status` | Normal, cerca, límite, excedido, sin límite |

## 3. Layouts

- Primitivas: `.container` (máximo 40rem, con 16 px a los lados), `.stack` (vertical, con gap de token) y `.cluster` (fila que se envuelve).
- **Un solo breakpoint:** `@media (min-width: 48rem)`. Se diseña mobile-first desde 360 px.
- Navegación inferior fija. La acción primaria va en `.action-bar`, pegada encima de ella, en la zona del pulgar.
- **Escritorio (≥ 48rem, la laptop de Diego):**
  - El menú inferior pasa a ser una barra superior y el contenido se amplía a 72rem.
  - `.layout` (Movimientos): período, filtros y resumen a la izquierda (22rem) y la lista a la derecha.
  - `.card-grid` (Presupuesto): las tarjetas van en 2 columnas.
  - `.container--narrow` (Registrar): el formulario se centra con 36rem.

## 4. Componentes

| Componente | Para qué |
|---|---|
| `.btn` (`--primary`, `--secondary`, `--danger`, `--danger-solid`, `--link`, `--block`) | Acciones. Un solo primario por vista |
| `.field` (`__label`, `__control`, `__hint`, `__error`, `__counter`, `__money`) | Campos con etiqueta visible y error junto al campo |
| `.segmented` | Gasto o Ingreso con radios nativos y ✓ |
| `.chip` / `.chip-group` | Filtro por categoría y atajos de período, con `aria-pressed` y ✓ |
| `.period-picker` | Desplegable con atajos y rango Desde/Hasta (HU01-12/13) |
| `.month-nav` | Mes anterior o siguiente. El siguiente se deshabilita en el mes en curso |
| `.summary` | Gastos, Ingresos y Saldo de lo filtrado |
| `.list` / `.list-row`, `.amount--income`/`--expense` | Filas de movimientos. El signo − o + es el dato y el color solo refuerza |
| `.card`, `.budget-figures`, `.budget-bar`, `.budget-status` | Tarjeta de presupuesto con barra y estado en texto |
| `.alert` (`--success`, `--error`), `.state`, `.skeleton` | Mensajes y estados de vista |
| `.confirm` | Confirmación de eliminar dentro de la página |
| `.bottom-nav`, `.page-header`, `.skip-link`, `.visually-hidden` | Estructura y accesibilidad |

Los componentes de negocio `<cc-movimiento>` y `<cc-barra-presupuesto>` se arman con estas clases y no traen CSS propio.

## 5. Design tokens del dominio

Los nombres siguen el patrón `categoría-rol-variante`.

| Token | Capa | Intención |
|---|---|---|
| `--color-budget-{normal,near,reached,exceeded}-text` | Semántico | Texto del estado (R5) |
| `--color-budget-{near,reached,exceeded}-bg` | Semántico | Fondo de la etiqueta de estado |
| `--color-budget-*-fill`, `--color-budget-track`, `--color-budget-track-border` | Semántico | Barra de progreso |
| `--color-income-text`, `--color-expense-text` | Semántico | Montos |
| `--budget-bar-height`, `--list-row-min-height`, `--bottom-nav-height` | Componente | Medidas |
| `--color-brand-bg`, `--color-brand-bg-deep`, `--color-on-brand` (6.5:1), `--color-on-brand-muted` (5.8:1) | Semántico | Banda de marca del encabezado (`.page-header`, `.brand`) |
| `--color-cat-{categoría}-bg` / `-fg` (las 8, de 4.7:1 a 7.4:1 en claro y 7.1:1 o más en oscuro) | Semántico | Ícono de categoría (`.cat-icon--food`…). Es decorativo, porque el nombre de la categoría siempre va escrito |
| `--shadow-card`, `--shadow-raised`, `--radius-lg`, `--cat-icon-size` | Componente | Elevación y forma de las tarjetas, la lista y el resumen |

**Identidad visual:**
- Un verde profundo de marca en la banda del encabezado, con el logotipo "CuentaClara".
- Tarjetas blancas con sombra suave.
- La selección (chip activo y Gasto/Ingreso) se rellena con el color de acción y conserva el ✓, que es la señal que no depende del color.
- Cada categoría tiene un ícono y un color. Los íconos están en `CATEGORY_ICONS` (`js/models/types.js`) y llevan `aria-hidden`.

## 6. Estados de UI

La matriz cruza cada elemento con cada estado:
- ✓: el estado está definido.
- —: el estado no aplica a ese elemento.

| Elemento | default | hover | focus | seleccionado | deshabilitado | cargando | vacío | error |
|---|---|---|---|---|---|---|---|---|
| Botón | ✓ | ✓ | ✓ anillo 3 px | — | ✓ | ✓ "Guardando…" | — | — |
| Campo | ✓ | — | ✓ | — | — | — | — | ✓ borde 2 px + ⚠ + mensaje |
| Chip / atajo | ✓ | — | ✓ | ✓ ✓ + borde 2 px | — | — | — | — |
| Gasto/Ingreso | ✓ | — | ✓ | ✓ ✓ + borde 2 px | — | — | — | — |
| Mes siguiente | ✓ | ✓ subrayado | ✓ | — | ✓ gris + texto oculto | — | — | — |
| Lista | ✓ | — | — | — | — | ✓ skeleton + "Cargando…" | ✓ `.state` + acción | ✓ alerta + Reintentar |
| Barra de presupuesto | normal ✓ | — | — | — | — | ✓ | sin límite ✓ | — |

La barra tiene 4 estados de R5 y cada uno se distingue **sin color**:

| Estado | Patrón | Ícono | Texto |
|---|---|---|---|
| NORMAL | Relleno liso | ✓ | "Te quedan S/ X" |
| NEAR | Rayas diagonales | ⚠ | "Cerca del límite" |
| REACHED | Barra llena con rayas verticales | ● | "Alcanzaste tu límite" |
| EXCEEDED | Cuadriculado | ✕ | "Te pasaste por S/ X" |

## 7. Reglas y responsive

El detalle está en `.claude/rules/estilos-css.md` y `.claude/rules/html-accesibilidad.md`. Lo esencial:
- El estado se lee en texto. El color y el ícono solo refuerzan.
- `role="status"` en las confirmaciones. `role="alert"` solo para errores que interrumpen.
- Durante la carga: `aria-busy="true"` y un skeleton con `aria-hidden`.
- Objetivos de 44 px o más (48 px el primario).
- Se prueba a 360 px y a 1024 × 768, sin scroll horizontal.
- Respeta `prefers-reduced-motion`.
