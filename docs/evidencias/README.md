# Evidencias de verificación

Fecha de las verificaciones: 20 de noviembre de 2026 (hora de Lima). Todas se hicieron sobre `master` antes de la entrega.

## 1. Lighthouse · Accesibilidad 100 en las 4 pantallas (la meta es 95 o más)

Lo corrió la persona en Chrome DevTools, con el celular emulado a 360 × 800. Lighthouse viene con Chrome: no se instala nada. Cada captura muestra la pantalla y sus 4 puntajes.

| Pantalla | Rendimiento | Accesibilidad | Recomendaciones | SEO | Captura |
|---|---|---|---|---|---|
| `movimientos.html` | 97 | **100** | 96 | 100 | [lighthouse-movimientos.png](lighthouse-movimientos.png) |
| `registrar.html` | 98 | **100** | 96 | 100 | [lighthouse-registrar.png](lighthouse-registrar.png) |
| `presupuesto.html` | 97 | **100** | 96 | 100 | [lighthouse-presupuesto.png](lighthouse-presupuesto.png) |
| `perfil.html` (añadida) | 99 | **100** | 96 | 100 | [lighthouse-perfil.png](lighthouse-perfil.png) |

En la primera corrida, Presupuesto dio 83 en Rendimiento por la carga inicial (Speed Index); al repetirla dio 97. Accesibilidad dio 100 en las dos.

<table>
  <tr>
    <td><img src="lighthouse-movimientos.png" alt="Lighthouse en Movimientos: Accesibilidad 100" width="400"></td>
    <td><img src="lighthouse-registrar.png" alt="Lighthouse en Registrar: Accesibilidad 100" width="400"></td>
  </tr>
  <tr>
    <td><img src="lighthouse-presupuesto.png" alt="Lighthouse en Presupuesto: Accesibilidad 100" width="400"></td>
    <td><img src="lighthouse-perfil.png" alt="Lighthouse en Perfil: Accesibilidad 100" width="400"></td>
  </tr>
</table>

Para repetirlo, abre el proyecto con Live Server y entra a cada pantalla en Chrome. Presiona F12, abre la pestaña **Lighthouse**, elige Mode: Navigation y Device: Mobile, y presiona **Analyze page load**.

## 2. axe-core 4.10.2 · 0 violaciones en 28 revisiones

axe-core es el motor de reglas que usa Lighthouse. Se cargó desde un CDN **solo dentro de la prueba**, en Chrome sin interfaz, así que no es una dependencia del proyecto. Reglas revisadas: WCAG 2.0, 2.1 y 2.2 A y AA, más buenas prácticas.

| Estado | 360 px · claro | 1280 px · claro | 360 px · oscuro |
|---|---|---|---|
| Movimientos | 0 | 0 | 0 |
| Movimientos · hoja de período abierta | 0 | 0 | — |
| Registrar | 0 | 0 | 0 |
| Registrar · errores al guardar | 0 | 0 | — |
| Registrar · editar con la confirmación abierta | 0 | 0 | — |
| Registrar · hoja de fecha abierta | 0 | 0 | — |
| Presupuesto | 0 | 0 | 0 |
| Presupuesto · editando un límite | 0 | 0 | — |
| Presupuesto · hoja "Elige un mes" abierta | 0 | 0 | — |
| Perfil | 0 | 0 | 0 |
| Perfil · confirmación de restablecer abierta | 0 | 0 | — |
| Vitrina (`componentes.html`) | 0 | 0 | — |

En la vitrina, axe encontró un `<ol role="log">`: el rol anulaba la lista y dejaba sus `<li>` huérfanos. El rol pasó a un contenedor y la lista quedó intacta adentro.

## 3. Teclado y foco

Se probaron con teclas y clics simulados en Chrome (protocolo DevTools):

- Hojas (período, mes y fecha): al abrir, el foco va al atajo o al mes activo; al cerrar por cualquier camino (atajo, Aplicar, Cancelar, ✕, Escape o el fondo), vuelve al botón que la abrió y `aria-expanded` vuelve a `false`.
- Tarjeta de presupuesto: Enter abre la edición con el foco en el campo del límite; Escape la cierra y devuelve el foco a la tarjeta.
- Registrar: al guardar con errores, el foco va al primer campo con error (`aria-invalid` y mensaje con `aria-describedby`). La confirmación de eliminar lleva el foco a su título, y Escape o "Cancelar" lo devuelven a "Eliminar".
- "Cargar más" y "Ver N categorías más" llevan el foco al primer elemento nuevo.
- Lo enfocado nunca queda tapado por las barras fijas (WCAG 2.4.11): `scroll-padding-top` usa la altura medida de las barras.

## 4. Responsive

Sin scroll horizontal en las 5 páginas (`movimientos`, `registrar`, `presupuesto`, `perfil` y `componentes`) a **360 px**, a 1024 × 768 y a 1280 × 800: el ancho del documento es igual al de la ventana.

## 5. Contraste

Cada par de colores de texto y fondo de `tokens.css` se midió con un script, en el tema claro y en el oscuro: todos dan 4.5:1 o más. Por ejemplo, el blanco sobre la tarjeta destacada da 5.17:1 y el título en azul sobre el fondo da 4.82:1. Los valores van comentados junto a cada token.

## 6. Hook "guardián de tokens"

`.claude/hooks/guardian-tokens.mjs` corre después de cada Edit o Write (configurado en `.claude/settings.json`). Prueba con un archivo que tenía `color: #ff6600;`:

```text
código de salida: 2
Guardián de tokens: hay 1 color(es) hex fuera de styles/tokens.css.
  styles/prueba-hook.css:2  #ff6600  →  color: #ff6600;
Usa un token semántico o de componente (var(--color-…)). Si falta, créalo en tokens.css en sus 3 capas y en el tema oscuro.
```

Con `styles/components.css` sale con código 0. Búsqueda de colores hex fuera de `tokens.css` en todo el proyecto: **0**.

## 7. Pruebas

- `node --test`: **113 pruebas en verde**, ordenadas por capa en `tests/`.
- `node scripts/verificar-hu03.mjs`: **14 de 14** verificaciones de la HU-03, incluida `// @ts-check` en todos los archivos de `js/`.
- Ninguna página ni pantalla usa `localStorage`: todo pasa por `js/api/`.

## 8. Pantallas finales

Las capturas a 360 px y en laptop están en `pantallas/`. La comparación con los wireframes está en [`../evolucion-del-diseno.md`](../evolucion-del-diseno.md).
