# Historias de usuario · CuentaClara

Fuente de verdad de lo que se construye. Cada criterio tiene un código (`HU01-3`) que se cita en prompts, commits, bitácora y verificación.

## Usuario principal

**Diego, diseñador freelance.**
- Registra gastos desde el celular, **con una mano, justo después de pagar**: necesita hacerlo en segundos.
- Revisa el resumen del mes en la laptop.
- Hoy anota en el celular y en papel. A fin de mes no sabe en qué se le fue la plata ni si se pasó del presupuesto.

## Reglas del negocio

| # | Regla |
|---|---|
| R1 | Monto mayor que 0 y hasta S/ 10 000, con 2 decimales como máximo. |
| R2 | Fecha de hoy o anterior, dentro de los últimos 60 días (hoy cuenta como día 0). |
| R3 | Categorías de gasto: Comida, Transporte, Vivienda, Servicios, Ocio y Otros. Categorías de ingreso: Trabajo y Otros ingresos. |
| R4 | Descripción obligatoria, de 60 caracteres como máximo, sin contar los espacios de los extremos. |
| R5 | Cada presupuesto está en uno de 4 estados según lo usado del límite: **Normal** (`NORMAL`, menos de 80 %), **Cerca del límite** (`NEAR`, 80 % o más y menos de 100 %), **Alcanzaste tu límite** (`REACHED`, exactamente 100 %) y **Te pasaste por S/ X** (`EXCEEDED`, más de 100 %). El estado se lee en texto, no solo por color. |
| R6 | Solo se puede editar o eliminar un movimiento del mes en curso. Al editar se aplican las mismas validaciones que al registrar y, además, la fecha nueva también debe quedar en el mes en curso. |
| R7 | El límite de un presupuesto cumple R1 (mayor que 0 y hasta S/ 10 000, con 2 decimales como máximo). |
| R8 | Un límite vale desde el mes en que se define y se copia a los meses siguientes hasta que se cambie. Solo se edita el límite del mes en curso, y el cambio no altera los meses anteriores. |

## Criterios comunes a las 3 pantallas

| Código | Criterio |
|---|---|
| CC-1 | Se puede usar todo con el teclado y el foco siempre está visible. |
| CC-2 | Cada campo tiene una etiqueta visible. |
| CC-3 | Ningún aviso depende solo del color. |
| CC-4 | A 360 px no hay scroll horizontal y los botones miden 44 px o más. |
| CC-5 | Lighthouse Accessibility da 95 o más. |
| CC-6 | Los montos se muestran como `S/ 1 234.50`. |
| CC-7 | Las fechas se muestran en español de Perú. |
| CC-8 | El menú lleva a Movimientos, Registrar y Presupuesto. La página actual se marca con `aria-current="page"`. |

---

## HU-01 · Movimientos del mes · `movimientos.html` · AI-Augmented

**Como** Diego, **quiero** ver los gastos e ingresos del mes o de un período, filtrarlos por categoría y ver el total, **para** saber en qué se me fue la plata.

| Código | Criterio |
|---|---|
| HU01-1 | Sin ruta, se muestra el mes en curso y la URL se corrige a `#/AAAA-MM` sin agregar una entrada al historial. |
| HU01-2 | La lista está ordenada por fecha, de la más reciente a la más antigua. Cada movimiento muestra fecha, descripción, categoría y monto. Gasto e ingreso se distinguen por un texto o signo (`−` / `+`), no solo por color. |
| HU01-3 | Hay un filtro por categoría: "Todas" más las 8 categorías. El filtro activo se marca con `aria-pressed="true"` y con una señal visible además del color. |
| HU01-4 | El período y el filtro viven en la URL. Abrir o recargar la URL muestra lo mismo, así que la ruta se puede compartir. Hay tres formas: **mes** `#/2026-11/comida`, **día** `#/2026-11-20/comida` y **rango** `#/2026-11-01..2026-11-15/comida`. Sin categoría, la ruta muestra "Todas" (`#/2026-11`). |
| HU01-5 | Se muestran el total de gastos, el total de ingresos y el saldo (ingresos − gastos) de lo que está filtrado. |
| HU01-6 | En la vista de mes hay enlaces "Mes anterior" y "Mes siguiente". No se puede pasar del mes en curso. |
| HU01-12 | **Selector de período: un solo componente desplegable.** Un botón muestra el período actual (por ejemplo "Este mes ▾") con `aria-expanded`. Al abrirlo aparecen los atajos "Hoy", "Esta semana" (de lunes a hoy) y "Este mes", y el rango "Desde" / "Hasta" con el botón "Aplicar rango". El atajo activo lleva ✓ y `aria-pressed="true"`. Elegir un atajo o aplicar un rango actualiza la URL y cierra el panel. Escape también lo cierra. En ambos casos, el foco vuelve al botón. |
| HU01-13 | **Rango personalizado:** "Desde" y "Hasta" tienen etiqueta visible. Se valida que desde ≤ hasta y que hasta ≤ hoy, con el error junto al campo y sin cerrar el panel. Al aplicar, la URL cambia a la forma de rango. |
| HU01-7 | **Carga:** se muestra un skeleton, el texto "Cargando movimientos…" y `aria-busy="true"`. |
| HU01-8 | **Vacío:** si no hay movimientos en el mes o en la categoría, se muestra un mensaje y una acción ("Registrar un movimiento" o "Ver todas las categorías"). |
| HU01-9 | **Error:** se muestra "No pudimos cargar tus movimientos." y un botón "Reintentar". El error se puede simular con `?fallo=movimientos`. |
| HU01-10 | Una URL inválida, como `#/2026-13/xyz`, un rango invertido o una fecha futura, se corrige al mes en curso o a "Todas", sin agregar una entrada al historial. |
| HU01-11 | Los movimientos del mes en curso tienen una acción "Editar" que lleva a `registrar.html?id=<id>`. Los de meses anteriores no la tienen (R6). |

## HU-02 · Registrar, editar y eliminar un movimiento · `registrar.html` · AI-Augmented

**Como** Diego, **quiero** registrar un gasto o un ingreso en segundos y corregirlo o eliminarlo si me equivoqué, **para** tener mis cuentas al día.

| Código | Criterio |
|---|---|
| HU02-1 | El tipo se elige entre "Gasto" e "Ingreso" con controles nativos. Por defecto es "Gasto". Las categorías disponibles cambian según el tipo (R3). |
| HU02-2 | El formulario tiene estos campos: tipo, monto (teclado decimal en el celular), fecha (por defecto hoy), categoría y descripción (con contador `n/60`). |
| HU02-3 | Cada regla se valida al enviar (R1–R4). El mensaje de error aparece junto al campo con `aria-invalid` y `aria-describedby`. El foco va al primer campo con error y no se borra nada de lo escrito. |
| HU02-4 | Mientras se guarda, el botón está deshabilitado y dice "Guardando…". Al terminar, una confirmación con `role="status"` dice qué se guardó (por ejemplo "Gasto registrado: S/ 25.50 en Comida") y ofrece "Registrar otro" y "Ver movimientos". |
| HU02-5 | **Editar:** `registrar.html?id=<id>` carga el movimiento, el título dice "Editar movimiento" y aplica las mismas validaciones. La fecha solo puede quedar en el mes en curso (R6): el campo limita `min` al día 1 del mes, y si se sale de ese rango el error dice "Al editar, la fecha debe ser de este mes." |
| HU02-6 | Si el `id` no existe o el movimiento no es del mes en curso, se muestra un mensaje que lo explica y no se puede guardar ni eliminar (R6). |
| HU02-7 | **Eliminar** solo aparece al editar. Pide confirmación **en la página**, sin `confirm()`, mostrando la descripción y el monto. El foco va a la confirmación. "Cancelar" devuelve el foco a "Eliminar". Al confirmar, se vuelve a la lista con un mensaje. |
| HU02-8 | Si la API falla al guardar o eliminar, se muestra un error y se conservan los datos escritos. El fallo se puede simular con `?fallo=guardar`. |

## HU-03 · Presupuesto por categoría · `presupuesto.html` · AI-First

**Como** Diego, **quiero** fijar un límite mensual por categoría y ver cuánto llevo usado, **para** enterarme antes de pasarme.

Criterios de alto nivel. El detalle verificable (Dado / Cuando / Entonces) se escribe en `specs/hu-03/spec.md`.

| Código | Criterio |
|---|---|
| HU03-1 | Por cada categoría de gasto del mes se muestran el límite, lo usado, lo que queda y una barra de progreso con su porcentaje. |
| HU03-2 | Cada categoría muestra su estado según R5 en texto: "Cerca del límite", "Alcanzaste tu límite" o "Te pasaste por S/ X". |
| HU03-3 | Diego puede definir o cambiar el límite de una categoría **solo en el mes en curso**. El límite se valida con R7. |
| HU03-4 | Una categoría sin límite dice "Sin límite definido" y ofrece la acción para definirlo. |
| HU03-5 | La pantalla tiene estados de carga, vacío y error, con Reintentar. |
| HU03-6 | El límite se copia a los meses siguientes hasta que se cambie (R8). Si Diego cambia el límite en el mes en curso, ese valor queda guardado para ese mes y los siguientes, y los meses anteriores conservan el suyo. |

## Preguntas resueltas

| Pregunta | Respuesta | Regla |
|---|---|---|
| Al editar, ¿la fecha puede quedar en el mes anterior? | No: debe quedar en el mes en curso. | R6 |
| ¿El límite sigue las reglas del monto? | Sí. | R7 |
| ¿El presupuesto se copia al mes siguiente o se define cada mes? | Se copia. Se edita en el mes en curso y el valor sigue vigente hasta el siguiente cambio. | R8 |
