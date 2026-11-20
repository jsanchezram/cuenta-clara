# Bitácora human-in-the-loop · CuentaClara

Registro de los puntos donde revisé lo que propuso Claude y lo aprobé ✅, lo corregí ✏️ o lo rechacé ❌.

Puntos de control:
- **Plan:** el plan de trabajo o de implementación.
- **Spec:** historias, contrato y specs.
- **Diff:** cambios de código.
- **Verificación:** la app funcionando.
- **Integración:** commit o merge.

| # | Punto de control | Qué propuso Claude | Decisión | Por qué |
|---|---|---|---|---|
| 1 | Plan | Plan de 7 días, con un commit por historia directo en `master`. | ✏️ Corregir | El trabajo se termina en 1 día. Uso una rama por historia, con varios commits en formato Conventional Commits (`feat`, `fix`, `docs`…) y `merge --no-ff` a `master`, para que cada historia quede agrupada en el historial. |
| 2 | Plan | Al llegar exactamente al 100 % del presupuesto, mostrar "Cerca del límite". | ✏️ Corregir | Llegar justo al límite no es lo mismo que estar cerca: Diego necesita saber que ya no le queda nada en esa categoría. Agregué un estado propio, **"Alcanzaste tu límite"**, y la regla R5 quedó con 4 estados: NORMAL, CERCA, LIMITE y EXCEDIDO. |
| 3 | Spec | HU01-6: navegar solo con "Mes anterior" y "Mes siguiente". | ✏️ Corregir | Diego también quiere ver lo de hoy o lo de esta semana sin recorrer el mes entero. Agregué atajos (Hoy, Esta semana, Este mes) y un rango personalizado, también en la URL compartible (HU01-12, HU01-13). |
| 4 | Spec | Pregunta abierta: al editar, ¿la fecha puede quedar en el mes anterior, dentro de los 60 días? | ✏️ Corregir | No. Si se permitiera, se podría "sacar" un movimiento del mes en curso y luego ya no se podría corregir. La fecha editada debe quedar en el mes en curso (R6). |
| 5 | Spec | Pregunta abierta: ¿el presupuesto se define cada mes o se copia? | ✏️ Corregir | Se copia al mes siguiente y se edita solo en el mes en curso. El nuevo valor sigue vigente hasta el siguiente cambio y los meses anteriores no cambian (R8). Así Diego no tiene que volver a cargar 6 límites cada mes. |
| 6 | Spec | HU01-5 (total de gastos, ingresos y saldo de lo filtrado), HU02-4 (quedarse en el formulario con "Registrar otro") y CC-8 (menú común). | ✅ Aprobar | Encajan con el uso real: Diego registra varios gastos seguidos con una mano y necesita el saldo de lo que está viendo. |
