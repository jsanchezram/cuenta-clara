# Glosario de CuentaClara

| Término | En código | Definición |
|---|---|---|
| Movimiento | `movimiento` | Un gasto o un ingreso. Tiene tipo, categoría, monto, fecha y descripción. |
| Tipo | `tipo` | `GASTO` o `INGRESO`. |
| Gasto | `GASTO` | Dinero que sale. Tiene una de 6 categorías: Comida, Transporte, Vivienda, Servicios, Ocio y Otros. |
| Ingreso | `INGRESO` | Dinero que entra. Tiene una de 2 categorías: Trabajo y Otros ingresos. |
| Categoría | `categoria` | Clasificación fija del movimiento. En el contrato va en MAYÚSCULAS (`OTROS_INGRESOS`); en la URL y en el modelo, en minúsculas. |
| Monto | `monto` / `monto_centimos` | En la UI y el modelo, en soles (`25.5`). En el contrato, en céntimos enteros (`2550`). |
| Mes | `mes` | Período `AAAA-MM`. Es la unidad de la lista y del presupuesto. |
| Mes en curso | — | El mes de hoy en hora de Lima (UTC−5). Solo sus movimientos se editan o eliminan. |
| Período | `periodo` | Lo que muestra la lista: un mes (`2026-11`), un día (`2026-11-20`) o un rango (`2026-11-01..2026-11-15`). |
| Atajo de período | — | "Hoy", "Esta semana" (lunes a hoy), "Este mes" o "Personalizado". |
| Límite | `limite` | Lo máximo que Diego quiere gastar en una categoría en un mes. |
| Límite vigente | `vigente_desde` | Un límite vale desde el mes en que se define y se copia a los meses siguientes hasta el siguiente cambio (R8). |
| Usado | `usado` | Suma de los gastos de una categoría en el mes. |
| Restante | `restante` | Límite − usado. Si es negativo, es el exceso. |
| Estado del presupuesto | `NORMAL` · `CERCA` · `LIMITE` · `EXCEDIDO` | Resultado de comparar lo usado con el límite (regla R5). |
| Saldo | `saldo` | Ingresos − gastos del mes, o de la categoría filtrada. |
| Ruta compartible | `#/<periodo>/<categoria>` | Hash de `movimientos.html` que define el período y el filtro. Ejemplos: `#/2026-11/comida`, `#/2026-11-20`, `#/2026-11-01..2026-11-15/ocio`. |

**Tono:** español de Perú, de tú. Ejemplo: "Te pasaste por S/ 45.00".
