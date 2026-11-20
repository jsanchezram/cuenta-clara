# CuentaClara

App web para registrar gastos personales y controlar un presupuesto mensual por categoría.

## 1. Contexto tecnológico
- Stack: HTML, CSS y JavaScript con módulos ES (`<script type="module">`). Sin frameworks, librerías ni build. No hay npm ni package.json: no propongas instalarlos.
- Tipos con JSDoc y `// @ts-check` en la primera línea de cada archivo de `js/`.
- Pruebas: `node --test` (Node LTS) busca `tests/*.test.js`. Usa solo `node:test` y `node:assert/strict`.
- Se abre con Live Server (VS Code): los módulos ES no funcionan con `file://`. El equipo trabaja en Windows (PowerShell).

## 2. Contexto arquitectónico
- Una página HTML por pantalla, en la raíz: `movimientos.html`, `registrar.html`, `presupuesto.html`. La página es solo el armazón y su pantalla vive en `js/screens/` con el mismo nombre.
- Hay 5 capas y las dependencias van en una sola dirección:
  1. Design system: `styles/tokens.css` → `styles/components.css` → vitrina `componentes.html`.
  2. Modelos y contratos: `js/models/types.js`, `js/contracts/{dto,mappers}.js`.
  3. Estado y lógica: `js/logic/` (reglas puras), `js/api/` (API simulada), `js/state/` (store y acciones).
  4. Componentes: `js/components/` (de negocio `<cc-movimiento>`, `<cc-barra-presupuesto>`; de UI `<cc-calendario-rango>` e `icons.js`).
  5. Rutas y pantallas: `js/rutas.js`, `js/screens/`.
- Una pantalla es el único módulo que conoce rutas, API, store y componentes. Solo conecta: no tiene reglas ni estilos.
- Un componente no importa ni la API ni el store: recibe los datos por propiedades y avisa con eventos `cc-*`.
- `localStorage` solo se usa dentro de `js/api/`, con claves `cuentaclara.v1.*`. Las páginas nunca lo tocan.
- Fuentes de verdad: `docs/historias-de-usuario.md` (criterios y reglas R1–R8), `docs/api/contrato-v1.md` (datos) y `docs/design-system.md` (UI).
- Antes de crear UI, revisa `docs/design-system.md` y reutiliza las clases de `components.css`.

## 3. Contexto de ingeniería
- Idioma: el código va en inglés y lo que lee una persona va en español.
  - En inglés: variables, funciones, tipos, carpetas y archivos de `js/`, clases CSS, tokens, eventos, campos y enumeraciones del contrato.
  - En español: textos de la UI, mensajes de error, documentación, nombres de pruebas y commits.
  - Excepciones fijadas por el enunciado: nombres de las páginas, `js/rutas.js`, `datos/*.json`, las etiquetas y eventos `cc-*` (como `<cc-movimiento>` y `cc-editar`), y el fragmento de categoría en la URL (`#/2026-11/comida`). El mapeo entre ese fragmento y la enumeración vive solo en `js/rutas.js`.
- WCAG 2.2 AA obligatoria. La meta es Lighthouse Accessibility de 95 o más en cada pantalla.
- Ningún color hex fuera de `styles/tokens.css`: un hook lo bloquea. Los componentes usan tokens semánticos o de componente, nunca primitivos.
- Los interactivos son `<a>`, `<button>` o controles nativos, nunca `<div onclick>`.
- Mobile-first: se diseña a 360 px y se amplía con `min-width`. Sin scroll horizontal a 360 px y con objetivos táctiles de 44 px o más (los días del calendario: 46 × 36 px).
- Los avisos y estados se leen en texto. El color y el ícono solo refuerzan.
- Las reglas del negocio son funciones puras: la fecha de hoy llega como parámetro (`today`), nunca `new Date()` ni `Date.now()` dentro de `js/logic/`.
- Montos en céntimos enteros en el contrato y en soles en el modelo. Las conversiones solo se hacen en `js/contracts/mappers.js` y `js/utils/`.
- Todo dato que escribe una persona se escapa con `esc()` de `js/utils/html.js` antes de pintarlo.
- No modifiques ni debilites una prueba para que pase.
- Antes de decir "terminado":
  1. Ejecuta `node --test`.
  2. Cita la línea que cumple cada criterio.
  3. Busca colores hex fuera de tokens.css: deben ser 0.
  4. Dime qué debo probar a mano.
- El detalle de cada tema está en `.claude/rules/`, que se carga según los archivos que toques.

## 4. Contexto de negocio
- Usuario: Diego, diseñador freelance.
  - Registra gastos en el celular, con una mano, justo después de pagar: tiene que hacerlo en segundos.
  - Revisa el resumen del mes en la laptop.
- Reglas (el detalle está en `docs/historias-de-usuario.md`):
  - R1 Monto mayor que 0 y hasta S/ 10 000, con 2 decimales como máximo.
  - R2 Fecha de hoy o anterior, dentro de los últimos 60 días.
  - R3 Categorías de gasto: Comida, Transporte, Vivienda, Servicios, Ocio y Otros. De ingreso: Trabajo y Otros ingresos.
  - R4 Descripción obligatoria, de 60 caracteres como máximo.
  - R5 Estados del presupuesto (se compara en céntimos):
    - `NORMAL`: menos de 80 %.
    - `NEAR`: 80 % o más y menos de 100 %, "Cerca del límite".
    - `REACHED`: exactamente 100 %, "Alcanzaste tu límite".
    - `EXCEEDED`: más de 100 %, "Te pasaste por S/ X".
  - R6 Solo se edita o elimina un movimiento del mes en curso, y la fecha editada también queda en el mes en curso.
  - R7 El límite cumple R1.
  - R8 El límite se copia a los meses siguientes hasta que se cambie. Solo se edita en el mes en curso.
- "Hoy" y "mes en curso" se calculan en hora de Lima (UTC−5) con `js/utils/lima-date.js`, nunca con la zona de la PC.
- Contrato v1: snake_case, montos en céntimos enteros (`amount`, `limit`), fechas `YYYY-MM-DD`, enumeraciones en MAYÚSCULAS, edición con PATCH parcial, eliminación lógica (`deleted_at`) y errores `{ "error": { "code", "message", "fields" } }`.
- Textos en español de Perú, tratando de tú. Montos con el formato `S/ 25.50`.
- Vocabulario y nombres en código: @docs/glosario.md

## 5. Contexto operativo
- Antes de editar más de un archivo, presenta un plan y espera mi aprobación.
- Haz solo los cambios de la historia o la tarea pedida. Si un criterio choca con lo existente, detente y pregúntame.
- Al terminar, entrega una tabla con las columnas criterio · estado · evidencia.
- Git:
  - Trabaja en una rama por historia (`feat/hu-0X-...`) o por bloque (`chore/...`, `docs/...`), nunca directo en `master`.
  - Commits con Conventional Commits en español, `tipo(alcance): descripción`. Tipos: feat, fix, docs, test, refactor, style y chore. Alcances: ctx, ds, contratos, logica, api, estado, componentes, rutas, hu-01, hu-02 y hu-03.
  - Varios commits pequeños por rama. Al cerrarla, se hace `git merge --no-ff` a `master`.
  - Nunca hagas `git push`: lo hago yo.
- Cuando corrijo o rechazo algo tuyo, propón la entrada para `docs/bitacora-hitl.md`.
- Si una verificación falla 2 veces seguidas, detente y explícame por qué.
- Al compactar, conserva: la historia en curso, los archivos modificados y los criterios pendientes.
