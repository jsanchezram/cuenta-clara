# Spec · HU-03 Presupuesto por categoría

> AI-First · Paso B1 (entrevista). Describe el QUÉ y el POR QUÉ. No contiene decisiones técnicas: esas van en `plan.md`.
> Fuentes: `docs/historias-de-usuario.md` (HU03-1..6, R5, R7, R8), `docs/wireframes/03-presupuesto.png`.

## Problema

A fin de mes Diego no sabe si se pasó del presupuesto. Necesita fijar un límite mensual por categoría de gasto y enterarse **antes** de pasarse, con avisos que se entiendan sin depender del color.

## Alcance

**Incluye:**
- Pantalla `presupuesto.html` con una tarjeta por cada una de las 6 categorías de gasto.
- Un resumen del mes.
- Definir, cambiar y quitar el límite **solo en el mes en curso**.
- Consultar meses anteriores en solo lectura.

**No incluye:**
- Presupuestos de ingresos.
- Límites por semana o por día.
- Notificaciones fuera de la pantalla (correo, push).
- Editar límites de meses pasados o futuros.
- Historial visible de cambios de límite.
- Presupuesto total del mes (solo hay límites por categoría).

## Requisitos verificables

### REQ-01 · Mes por defecto y ruta
- **Dado** que Diego abre `presupuesto.html` sin ruta,
- **cuando** carga,
- **entonces** ve el mes en curso y la URL se corrige a `#/AAAA-MM` sin agregar una entrada al historial.
- Una ruta inválida o futura (`#/2026-13`, `#/2027-01`) también se corrige al mes en curso.

### REQ-02 · Una tarjeta por categoría de gasto
- **Dado** el mes en curso,
- **cuando** la pantalla termina de cargar,
- **entonces** hay 6 tarjetas: Comida, Transporte, Vivienda, Servicios, Ocio y Otros.
- Cada tarjeta con límite muestra usado, límite, restante (o excedido), una barra, el porcentaje usado y el estado en texto según R5:
  - "Te quedan S/ X"
  - "Cerca del límite"
  - "Alcanzaste tu límite"
  - "Te pasaste por S/ X"
- Una tarjeta sin límite muestra "Sin límite definido" y lo usado en el mes.

### REQ-03 · Orden por urgencia
- **Dado** el mes con estados mezclados,
- **entonces** las tarjetas aparecen en este orden: `EXCEEDED`, `REACHED`, `NEAR`, `NORMAL` y al final las categorías sin límite.
- Dentro de un mismo estado, el mayor porcentaje usado va primero.
- Las categorías sin límite mantienen el orden fijo de las categorías.

### REQ-04 · Resumen del mes
- **Dado** el mes cargado,
- **entonces** arriba de las tarjetas se lee, por ejemplo, "3 categorías necesitan atención · Gastaste S/ 1 025.00 de S/ 1 250.00 presupuestados".
- "Necesitan atención" cuenta las categorías en `NEAR`, `REACHED` o `EXCEEDED`. Los montos suman solo las categorías que tienen límite.
- Variantes del texto:
  - Con 1: "1 categoría necesita atención".
  - Con 0: "Todo bajo control".
  - Sin ningún límite: "Aún no defines límites este mes. Define uno para recibir avisos."
- El resumen se anuncia al cargar.

### REQ-05 · Editar dentro de la tarjeta
- **Dado** el mes en curso,
- **cuando** Diego toca "Editar límite" (o "Definir límite" si la categoría no tiene),
- **entonces** la misma tarjeta muestra:
  - un campo "Límite mensual" con el valor actual (vacío si no tenía),
  - los botones "Guardar" y "Cancelar",
  - "Quitar límite", solo si la categoría tenía límite.
- El foco va al campo.
- **Cuando** toca "Cancelar" o pulsa Escape, **entonces** se cierra la edición, el valor no cambia y el foco vuelve a "Editar límite".
- Solo puede haber una tarjeta en edición a la vez.

### REQ-06 · Validación del límite (R7)
- **Dado** un límite vacío, 0, negativo, con más de 2 decimales o mayor que S/ 10 000,
- **cuando** Diego guarda,
- **entonces** se muestra el error junto al campo, el foco vuelve al campo y no se borra lo escrito.
- Los mensajes son los mismos que los del monto en HU-02.

### REQ-07 · Guardar un límite (R8)
- **Dado** un límite válido,
- **cuando** Diego guarda,
- **entonces** el límite vale desde el mes en curso y se copia a los meses siguientes. Los meses anteriores conservan el suyo.
- La tarjeta se actualiza y se reordena según su nuevo estado.
- Se anuncia "Límite de Ocio guardado: S/ 150.00."
- El foco vuelve a "Editar límite" de esa tarjeta.

### REQ-08 · Límite menor que lo ya gastado
- **Dado** que Diego ya gastó S/ 195 en Ocio,
- **cuando** guarda un límite de S/ 100,
- **entonces** se guarda (es su decisión), la tarjeta pasa a "Te pasaste por S/ 95.00",
- y la confirmación dice "Límite de Ocio guardado: S/ 100.00. Ya te pasaste por S/ 95.00 este mes."

### REQ-09 · Quitar un límite
- **Dado** una categoría con límite en el mes en curso,
- **cuando** Diego toca "Quitar límite",
- **entonces** aparece una confirmación **en la página**: "¿Quitar el límite de Ocio? Desde este mes ya no recibirás avisos de esta categoría." con los botones "Sí, quitar" y "Cancelar".
- Al abrirse la confirmación, el foco va a su título. "Cancelar" devuelve el foco a "Quitar límite".
- **Cuando** confirma, **entonces**:
  - la categoría queda "Sin límite definido" desde el mes en curso y en los meses siguientes;
  - los meses anteriores conservan su límite;
  - se anuncia "Quitaste el límite de Ocio."

### REQ-10 · Meses anteriores en solo lectura
- **Dado** `presupuesto.html#/2026-10`,
- **entonces** se ven los límites que estaban vigentes en octubre y los gastos de octubre, **sin** botones de editar ni quitar.
- Hay "Mes anterior" y "Mes siguiente". "Mes siguiente" no pasa del mes en curso.
- *(Ampliación tras la revisión visual)* El nombre del mes abre la hoja "Elige un mes": el año con ‹ › y los 12 meses, para saltar, por ejemplo, al año pasado sin tocar ‹ doce veces. Los meses futuros no se pueden elegir y el foco vuelve al nombre del mes al cerrarla.
- Un texto indica: "Estás viendo un mes anterior: solo lectura."

### REQ-11 · Estados de carga y error
- **Mientras carga:** un skeleton de las tarjetas y el texto "Cargando presupuesto…".
- **Si falla la carga** (`?fallo=presupuesto`): "No pudimos cargar tu presupuesto." con "Reintentar". Reintentar funciona y el foco no se pierde.
- **Si falla al guardar o quitar** (`?fallo=guardar`): el error aparece dentro de la tarjeta, el valor escrito se conserva y se puede volver a intentar.

### REQ-12 · Accesibilidad y responsive
- Cumple CC-1..CC-8: teclado completo, etiquetas visibles, estados en texto, 360 px sin scroll horizontal, objetivos de 44 px o más y menú común con "Presupuesto" marcado como actual.

## Datos de prueba (`datos/*.json`, mes en curso = noviembre 2026)

| Categoría | Usado / límite | Estado esperado |
|---|---|---|
| Ocio | 195 / 150 | EXCEEDED · 130 % · "Te pasaste por S/ 45.00" |
| Transporte | 200 / 200 | REACHED · 100 % |
| Comida | 510 / 600 | NEAR · 85 % |
| Servicios | 120 / 300 | NORMAL · 40 % · "Te quedan S/ 180.00" |
| Vivienda | 1 200 / — | Sin límite |
| Otros | 35.90 / — | Sin límite |

- Resumen esperado en noviembre: "3 categorías necesitan atención · Gastaste S/ 1 025.00 de S/ 1 250.00 presupuestados".
- En octubre (`#/2026-10`), Ocio tenía un límite de S/ 200 y un uso de S/ 180, por lo que está en NEAR con 90 %.

## Terminado

- REQ-01 a REQ-12 se cumplen.
- `node --test` está en verde, incluidas las pruebas nuevas de orden, resumen y quitar límite.
- La revisión de accesibilidad no tiene ningún "No cumple".
- Diego hace la prueba manual a 360 px y con teclado.

## Preguntas resueltas (entrevista B1)

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | ¿Cómo se edita un límite? | Dentro de la misma tarjeta, con un campo, Guardar y Cancelar. |
| 2 | ¿Se puede quitar un límite? | **Sí**, desde el mes en curso en adelante. Los meses anteriores conservan el suyo. (Claude había recomendado que no.) |
| 3 | ¿Se ven los meses anteriores? | Sí, en solo lectura, con la ruta `#/AAAA-MM`. |
| 4 | ¿En qué orden van las tarjetas? | Por urgencia: excedido, alcanzado, cerca, normal y sin límite. |
| 5 | ¿Hay un resumen arriba? | Sí: categorías que necesitan atención y gastado frente a presupuestado. |
| 6 | ¿Puede el límite ser menor que lo ya gastado? | Sí. Se guarda y se avisa que ya se pasó. |
