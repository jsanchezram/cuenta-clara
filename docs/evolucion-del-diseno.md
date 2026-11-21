# Del wireframe a la versión final

Los wireframes de `docs/wireframes/` se hicieron al inicio en Figma Make: baja fidelidad, en grises y a 360 px (prompt maestro e iteraciones en `docs/wireframes/prompt.md`). Fueron el punto de partida, no el final. Durante la implementación, cada pantalla pasó por varias rondas de **revisión visual con la persona**, probando en el navegador a 360 px y en laptop. En cada ronda, la IA propuso, la persona corrigió o rechazó, y la decisión quedó en `docs/bitacora-hitl.md`.

Este documento resume qué cambió frente a los wireframes, por qué, y dónde está cada decisión.

## 1. Comparación por pantalla

### Movimientos (HU-01)

| En el wireframe | En la versión final | Por qué | Bitácora |
|---|---|---|---|
| Atajos "Hoy / Esta semana / Este mes / Personalizado" como 4 botones sueltos, más "Mes anterior / Mes siguiente" | **Un solo botón** a todo el ancho que abre una hoja con atajos (Hoy, Esta semana, Este mes, Mes anterior), un calendario de rango y los campos Desde y Hasta. En laptop se abre como desplegable bajo su botón | Menos decisiones a la vista (Hick); el rango personalizado cabe en el mismo componente | #7, #25, #49 |
| Chip activo marcado con ✓ | Chip activo **relleno en azul y con texto más grueso**, sin ✓ ni puntito | El ✓ recargaba la fila. La señal que no es color sigue ahí: relleno frente a contorno y peso del texto | #33, #39 |
| Resumen en texto: Gastos · Ingresos · Saldo | **Tarjeta destacada azul**: el saldo en grande e ingresos y gastos en dos pozos con ↙ ↗ | La cifra principal debía leerse primero; las tarjetas blancas no tenían jerarquía | #23, #40 |
| Fila de dos líneas con un botón "Editar" | **Fila compacta**: toda la fila es el enlace, con ›. "Cargar más" de a 8 | Objetivo táctil grande, sin texto subrayado; la lista no crece sin fin | #29 |
| Título simple | **Barra de marca fija**, título centrado con la fecha de hoy y la palabra clave en azul. Al hacer scroll, el título pasa a la barra y el período y los chips quedan fijos | "Se ve muerto, sin vida"; los controles deben seguir a mano al bajar | #35, #36 |
| — (solo celular) | **Laptop**: panel fijo a la izquierda (período, chips y saldo) y la lista con su propio scroll, todo en una pantalla | En laptop la vista se veía descuadrada y obligaba a bajar | #47, #48 |

### Registrar (HU-02)

| En el wireframe | En la versión final | Por qué | Bitácora |
|---|---|---|---|
| Monto con "S/" fuera del campo; categoría en un desplegable | Monto a todo el ancho con la moneda en la etiqueta; categoría en un **mosaico con íconos** (un toque) | La lista nativa se salía de la pantalla a 360 px | #27, #30 |
| Fecha con el selector nativo | La **misma hoja con calendario** que Movimientos, con atajos Hoy y Ayer | Consistencia entre pantallas | #32 |
| "Guardar" fijo abajo; "Eliminar" arriba, lejos de Guardar | Guardar al final del formulario; al editar, **Eliminar · Guardar mitad y mitad**, con la confirmación en la página | La persona prefirió las acciones juntas y dentro de la vista; la confirmación evita borrar por error | #31, #37, #45 |
| Título "Editar movimiento" | Se mantiene, y ya no se ve un instante "Nuevo gasto" al abrir la edición | Doble movimiento al cargar | #38 |
| — (solo celular) | **Laptop**: formulario en una tarjeta de 2 columnas que se ve completo sin scroll | "Todas las vistas se sienten inmensas" | #51 |

### Presupuesto (HU-03)

| En el wireframe | En la versión final | Por qué | Bitácora |
|---|---|---|---|
| Tarjeta grande por categoría, con barra rayada o cuadriculada para el exceso | **Una tarjeta compacta por categoría**, con la misma estructura que la fila de un movimiento: barra sólida y estado en texto con un puntito del color del estado | Las tarjetas eran "grandes y escandalosas". El estado se lee en el texto (R5) y el color solo refuerza | #26, #41 |
| Sin resumen del mes | **Resumen destacado**: lo usado de lo presupuestado, la barra del total con su % y "3 categorías necesitan atención" | Ver de un vistazo si el mes va bien (REQ-04) | #40 |
| "Mes anterior / Mes siguiente" | ‹ mes › y, al tocar el nombre del mes, la hoja **"Elige un mes"** con el año y los 12 meses | Ir al año pasado obligaba a tocar ‹ doce veces | #42 |
| Todas las categorías a la vista | Primero las 4 más urgentes y "Ver N categorías más" | Lo urgente arriba, sin una lista larga (HU03-7) | #29 |

### Toda la app

| En el wireframe | En la versión final | Por qué | Bitácora |
|---|---|---|---|
| Grises e íconos de caja con X | Azul de marca vibrante, Inter con pesos livianos e íconos monocromos sobre un círculo azul claro | Identidad propia, sin perder contraste AA (todos los pares medidos) | #20–#24, #28 |
| — | Tamaños propios para laptop: controles de 36 px, desplegables compactos y texto base de 14 px | Con la pantalla al 125 %, todo se veía gigante | #49, #51 |
| — | **Perfil** (añadido): tema Claro · Oscuro · Sistema y restablecer los datos de ejemplo | Lo pidió la persona como añadido (HU-04) | #52 |

## 2. Lo que se mantuvo del wireframe

- Las 3 pantallas con menú inferior en el celular, y el flujo Movimientos → Registrar → Presupuesto.
- Los estados de carga (skeleton), vacío ("No hay movimientos en Ocio") y error con "Reintentar".
- Los textos de R5 ("Cerca del límite", "Alcanzaste tu límite", "Te pasaste por S/ X") y "Sin límite definido".
- Los errores junto a cada campo, "Guardando…" y la confirmación "Gasto registrado: S/ 15.00 en Comida".
- La confirmación de eliminar dentro de la página, nunca un pop-up.

## 3. Capturas: wireframe y versión final

| Pantalla | Wireframe (Figma Make, 360 px) | Final a 360 px | Final en laptop (1280 px) |
|---|---|---|---|
| Movimientos | [01-movimientos.png](wireframes/01-movimientos.png) | [01-movimientos-360.png](evidencias/pantallas/01-movimientos-360.png) | [01-movimientos-1280.png](evidencias/pantallas/01-movimientos-1280.png) |
| Selector de período | [01-movimientos-periodo.png](wireframes/01-movimientos-periodo.png) | [01-movimientos-periodo-360.png](evidencias/pantallas/01-movimientos-periodo-360.png) | [01-movimientos-periodo-1280.png](evidencias/pantallas/01-movimientos-periodo-1280.png) |
| Registrar | [02-registrar.png](wireframes/02-registrar.png) | [02-registrar-360.png](evidencias/pantallas/02-registrar-360.png) | [02-registrar-1280.png](evidencias/pantallas/02-registrar-1280.png) |
| Editar movimiento | (variante I-2 del wireframe) | [02-registrar-editar-360.png](evidencias/pantallas/02-registrar-editar-360.png) | [02-registrar-editar-1280.png](evidencias/pantallas/02-registrar-editar-1280.png) |
| Presupuesto | [03-presupuesto.png](wireframes/03-presupuesto.png) | [03-presupuesto-360.png](evidencias/pantallas/03-presupuesto-360.png) | [03-presupuesto-1280.png](evidencias/pantallas/03-presupuesto-1280.png) |
| Elige un mes | — | [03-presupuesto-mes-360.png](evidencias/pantallas/03-presupuesto-mes-360.png) | [03-presupuesto-mes-1280.png](evidencias/pantallas/03-presupuesto-mes-1280.png) |
| Perfil (añadido) | — | [04-perfil-360.png](evidencias/pantallas/04-perfil-360.png) | [04-perfil-1280.png](evidencias/pantallas/04-perfil-1280.png) |
