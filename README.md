# CuentaClara

App web para registrar gastos personales y controlar un presupuesto mensual por categoría. Diego, diseñador freelance, registra cada gasto en el celular en segundos y revisa el resumen del mes en la laptop.

Trabajo final del módulo **AI Frontend Engineering**, construido con **Claude Code**. HU-01 y HU-02 se hicieron en AI-Augmented y HU-03 en AI-First. Es HTML, CSS y JavaScript con módulos ES, sin frameworks, sin npm y sin build.

Repositorio: https://github.com/jsanchezram/cuenta-clara

## Cómo abrirlo

1. Abre la carpeta del proyecto en VS Code.
2. Haz clic derecho en `index.html` → **Open with Live Server**. Los módulos ES no funcionan con `file://`. `index.html` lleva directo a Movimientos.
3. Los datos de ejemplo se cargan solos la primera vez. Sus fechas se corren para que el último mes de los datos sea el mes en curso, así la demo funciona en cualquier fecha. "Hoy" se calcula en hora de Lima (UTC−5).

Para ver los estados de error, agrega `?fallo=movimientos`, `?fallo=guardar` o `?fallo=presupuesto` a la URL. Para empezar de nuevo, entra a **Perfil → Restablecer datos de ejemplo**.

Las rutas se pueden compartir, por ejemplo `movimientos.html#/2026-11/comida` (mes y categoría), `#/2026-11-20` (un día) o `#/2026-11-01..2026-11-15/ocio` (un rango).

## Cómo ejecutar las pruebas

Con Node LTS, desde la carpeta del proyecto:

```bash
node --test                       # 113 pruebas en tests/, ordenadas por capa
node scripts/verificar-hu03.mjs   # 14 verificaciones de la HU-03
```

## Estado de cada historia

| Historia | Pantalla | Enfoque | Estado |
|---|---|---|---|
| HU-01 · Movimientos del mes | `movimientos.html` | AI-Augmented | ✅ Terminada: lista del período, filtro por categoría, totales, selector de período con atajos y calendario, "Cargar más", estados de carga, vacío y error |
| HU-02 · Registrar, editar y eliminar | `registrar.html` | AI-Augmented | ✅ Terminada: validaciones R1–R4 junto a cada campo, confirmación con `role="status"`, edición solo en el mes en curso (R6) y eliminar con confirmación en la página |
| HU-03 · Presupuesto por categoría | `presupuesto.html` | AI-First (`specs/hu-03/`) | ✅ Terminada: límite, usado, restante y barra con %, 4 estados de R5 en texto, edición en la tarjeta, límite que se copia a los meses siguientes (R8) y meses anteriores en solo lectura |
| HU-04 · Perfil (añadido) | `perfil.html` | — | ✅ Terminada: tema Claro · Oscuro · Sistema y restablecer los datos de ejemplo |
| Vitrina del design system | `componentes.html` | — | ✅ Cada componente en cada estado, incluidos los 4 estados del presupuesto |

Reglas del negocio: R1–R6 del enunciado, más R7 (el límite cumple R1) y R8 (el límite se copia a los meses siguientes). El detalle está en `docs/historias-de-usuario.md`.

## Documentación

| Tema del módulo | Evidencia |
|---|---|
| UX y accesibilidad | [`docs/ux.md`](docs/ux.md): Ley de Fitts, H1 y H5 + H9, con la pantalla donde se ven |
| Figma AI y wireframes | [`docs/wireframes/`](docs/wireframes/): wireframes a 360 px y el prompt usado. Qué cambió después: [`docs/evolucion-del-diseno.md`](docs/evolucion-del-diseno.md) |
| Human-in-the-loop | [`docs/bitacora-hitl.md`](docs/bitacora-hitl.md): 52 decisiones con su porqué |
| CLAUDE.md y capas de contexto | [`CLAUDE.md`](CLAUDE.md) en 5 contextos · reglas con `paths` en [`.claude/rules/`](.claude/rules/) · skill [`/nueva-pantalla`](.claude/skills/nueva-pantalla/SKILL.md) · hook [`guardian-tokens.mjs`](.claude/hooks/guardian-tokens.mjs) · subagente [`revisor-a11y`](.claude/agents/revisor-a11y.md) |
| Prompting agéntico | [`docs/prompts.md`](docs/prompts.md): 3 prompts con los 6 bloques, todos con 12/12 |
| AI-Augmented vs AI-First | HU-01 y HU-02 en AI-Augmented. HU-03 en AI-First con [`specs/hu-03/`](specs/hu-03/): spec, plan, tasks y decisiones |
| Design system | [`docs/design-system.md`](docs/design-system.md) · `styles/tokens.css` en 3 capas, con tema oscuro · vitrina `componentes.html` |
| Modelos y contratos | [`docs/api/contrato-v1.md`](docs/api/contrato-v1.md) · [`docs/api/mapeo-v1.md`](docs/api/mapeo-v1.md) · `datos/*.json` · `js/models/` y `js/contracts/`, con JSDoc, DTO y mapeadores con validación |
| Estado y lógica | `js/logic/` (reglas puras), `js/api/` (API simulada) y `js/state/` (store y acciones) |
| Componentes de negocio | `<cc-movimiento>` y `<cc-barra-presupuesto>` en `js/components/business/` · [`docs/componentes-negocio.md`](docs/componentes-negocio.md) |
| Pages, routes y screens | `js/rutas.js` · `js/screens/` · ruta compartible `movimientos.html#/2026-11/comida` |
| Arquitectura | [`docs/arquitectura.md`](docs/arquitectura.md): las 5 capas con su diagrama de dependencias |
| Verificación | [`docs/evidencias/`](docs/evidencias/): Lighthouse, axe (0 violaciones en 28 revisiones), teclado, 360 px, contraste, hook y pantallas finales |
| Vocabulario | [`docs/glosario.md`](docs/glosario.md): términos de la UI, del código y del contrato |

## Rúbrica (100 puntos) y su evidencia

| Criterio | Puntos | Evidencia |
|---|---|---|
| Funcionalidad de HU-01, HU-02 y HU-03 | 20 | Las 3 pantallas con todos sus criterios. Reglas R1–R8 como funciones puras en `js/logic/`, con pruebas |
| Diseño y UX | 10 | Wireframes y prompt, `docs/ux.md` (3 heurísticas o leyes), estados de carga, vacío y error en cada pantalla y la evolución del diseño |
| Contexto para Claude | 15 | `CLAUDE.md` en 5 contextos. Regla con `paths`, skill, hook y subagente usados de verdad: la skill en los prompts P-1 y P-2, el subagente en la bitácora (#13, #17 y #19) y el hook probado en `docs/evidencias/` |
| Prompts y human-in-the-loop | 15 | 3 prompts con 12/12. La bitácora tiene 52 decisiones reales, y en la mayoría se corrigió o rechazó lo que propuso la IA |
| Arquitectura por capas | 20 | Design system, modelos y contratos, lógica pura, componentes y rutas separados. Las dependencias solo bajan (`docs/arquitectura.md`) |
| Pruebas y verificación | 10 | 113 pruebas en verde con `node --test`: monto, fecha, edición del mes en curso, total del mes, porcentaje y avisos del presupuesto, mapeadores, API y store |
| Accesibilidad y responsive | 10 | WCAG 2.2 AA. axe da 0 violaciones en 28 revisiones. Teclado completo, sin scroll horizontal a 360 px. Las capturas de Lighthouse van en `docs/evidencias/` |

Requisitos técnicos:
- `// @ts-check` en cada archivo de `js/`.
- 0 colores hex fuera de `styles/tokens.css` (el hook lo verifica).
- Las páginas no usan `localStorage` directo.
- Sin frameworks, sin npm y sin build.

## Cómo se trabajó

- **Git:** una rama por historia o por bloque (`feat/hu-01-movimientos`, `feat/hu-03-presupuesto`, `docs/cierre`…). Cada una tiene varios commits con Conventional Commits en español (`feat(hu-03): …`) y entra a `master` con `git merge --no-ff`, así cada historia queda agrupada en el historial.
- **Idioma:** el código va en inglés y la UI, los textos, los docs y los commits en español. Las excepciones que fija el enunciado están en `docs/glosario.md`.
- **Uso de Claude Code:** está declarado en `docs/prompts.md` y en `docs/bitacora-hitl.md`.
