# Prompts de CuentaClara

Cada prompt tiene 6 bloques y se puntúa con la rúbrica de clase. Cada bloque vale 0 si falta, 1 si es vago y 2 si es específico. Se resta 1 punto si el prompt repite o contradice CLAUDE.md, o si mezcla dos historias. Para enviar se necesita como mínimo **10/12 en AI-Augmented y 12/12 en AI-First**.

| Bloque | 2 · específico cuando… |
|---|---|
| Objetivo | Nombra la historia y un resultado observable |
| Contexto | Archivos con @ y el dato clave |
| Restricciones | Qué archivos sí y cuáles no, qué no cambia y qué se reutiliza |
| Terminado + verificación | Criterios numerados + comando |
| Forma de trabajo | Plan primero, y cuándo parar o preguntar |
| Reporte | Tabla criterio · estado · evidencia |

---

## P-1 · HU-01 Movimientos del mes · AI-Augmented

```
[OBJETIVO] Implementar HU-01: movimientos.html muestra los movimientos del período y la categoría de la URL, con total de gastos, ingresos y saldo, y estados de carga, vacío y error.
[CONTEXTO] @docs/historias-de-usuario.md (HU01-1..13, CC-1..8) · @docs/wireframes/01-movimientos.png y 01-movimientos-periodo.png · @js/rutas.js · @js/state/transactions.js · @js/components/cc-movimiento.js · @styles/components.css (.period-picker, .chip, .summary, .state, .skeleton)
[RESTRICCIONES] Crear solo movimientos.html y js/screens/movimientos.js. No modificar js/logic, js/api, js/contracts ni las pruebas. Reutilizar las clases existentes, sin CSS nuevo. El período y el filtro viven solo en la URL.
[TERMINADO + VERIFICACIÓN] 1) Los 13 criterios HU01 se cumplen. 2) node --test 83/83. 3) 0 hex. 4) revisor-a11y sin "No cumple". 5) Sin scroll a 360 px. 6) ?fallo=movimientos muestra el error y Reintentar funciona.
[FORMA DE TRABAJO] Usar /nueva-pantalla HU-01. Mostrar el plan y esperar el OK. Un archivo a la vez. Si un criterio choca con lo existente, detenerse y preguntar.
[REPORTE] Tabla criterio · estado · archivo:línea, y la lista exacta de pruebas manuales.
```

| Bloque | Puntos | Por qué |
|---|---|---|
| Objetivo | 2 | Nombra la historia y el resultado observable: lista, totales y estados |
| Contexto | 2 | 6 archivos con @, más los criterios y las clases clave |
| Restricciones | 2 | Archivos que sí y que no, sin CSS nuevo, URL como fuente de verdad |
| Terminado + verificación | 2 | 6 criterios numerados, `node --test` y `?fallo=` |
| Forma de trabajo | 2 | Skill con punto de control, un archivo a la vez y cuándo detenerse |
| Reporte | 2 | Tabla con evidencia archivo:línea y pruebas manuales |
| **Total** | **12/12** | No repite reglas de CLAUDE.md (hex, WCAG y tokens se dan por sabidos) |

---

## P-2 · HU-02 Registrar, editar y eliminar · AI-Augmented

```
[OBJETIVO] Implementar HU-02: registrar.html registra un gasto o ingreso, edita uno existente con ?id= y lo elimina con confirmación en la página.
[CONTEXTO] @docs/historias-de-usuario.md (HU02-1..8, R1–R4, R6) · @docs/wireframes/02-registrar.png · @js/logic/rules.js (validateTransaction, canEdit) · @js/api/cuentaclara-api.js (create/get/update/delete, ApiError.fields) · @styles/components.css (.field, .segmented, .action-bar, .confirm, .alert)
[RESTRICCIONES] Crear registrar.html, js/screens/registrar.js y js/state/transaction-form.js. No modificar logic, api, contracts ni pruebas. Sin CSS nuevo. Sin confirm(): la confirmación va en la página.
[TERMINADO + VERIFICACIÓN] 1) HU02-1..8 se cumplen. 2) node --test en verde. 3) Enviar vacío: 4 errores junto al campo, foco al monto y nada borrado. 4) ?id= de octubre → mensaje y sin guardar. 5) ?fallo=guardar conserva lo escrito. 6) revisor-a11y sin "No cumple".
[FORMA DE TRABAJO] /nueva-pantalla HU-02: plan primero y esperar el OK. Un archivo a la vez. Si una regla choca con la API, detenerse y preguntar.
[REPORTE] Tabla criterio · estado · archivo:línea, y la lista de pruebas manuales.
```

| Bloque | Puntos | Por qué |
|---|---|---|
| Objetivo | 2 | Historia y 3 resultados observables (registrar, editar, eliminar) |
| Contexto | 2 | 5 referencias con @, las reglas que aplican y las funciones clave |
| Restricciones | 2 | 3 archivos permitidos, capas que no se tocan, sin CSS nuevo y sin `confirm()` |
| Terminado + verificación | 2 | 6 criterios numerados con casos concretos y comandos |
| Forma de trabajo | 2 | Skill con punto de control, un archivo a la vez y cuándo detenerse |
| Reporte | 2 | Tabla con evidencia y pruebas manuales |
| **Total** | **12/12** | |

**Corrección en el punto de control del plan:** después de guardar, Claude propuso conservar tipo, categoría **y fecha**. Se corrigió para que la fecha vuelva a hoy (bitácora #14).
