---
paths:
  - "styles/**/*.css"
  - "**/*.html"
---
# Reglas de estilos

- Antes de crear un estilo, busca una clase en `styles/components.css`. Si un estilo se repite en 2 páginas, pasa a ser componente.
- Tokens en 3 capas y cada capa solo usa la de abajo: primitivo (`--green-700`), semántico (`--color-action-primary`) y componente (`--button-height`). Los componentes nunca usan primitivos.
- Nombres por intención, no por color: `categoría-rol-variante-estado`, por ejemplo `--color-budget-exceeded-text`.
- Un token semántico nuevo se define también en `[data-theme="dark"]`. Junto al valor va comentado su contraste: texto ≥ 4.5:1, bordes y barras ≥ 3:1.
- Espacios siempre con tokens (`var(--space-4)`), en la grilla de 8 pt con medio paso de 4.
- Componentes con clases BEM (`field__error`) y tokens locales privados (`--_bg`, `--_fg`, `--_border`). Una variante solo reasigna los tokens locales.
- Las clases CSS y los tokens van en inglés.
- Los estados van como modificadores o atributos, nunca como estilos en línea: `.budget-bar--near`, `[aria-invalid="true"]`, `[aria-pressed="true"]`.
- Layouts con las primitivas `.stack`, `.cluster` y `.container`.
- Hay un solo breakpoint, `@media (min-width: 48rem)`, y se diseña mobile-first desde 360 px.
- Se escribe en `rem`. Los inputs llevan `font-size: 1rem` para evitar el zoom de iOS.
- Respeta `prefers-reduced-motion`.
- Estilos de una sola página: en su `<style>`, igual que todo lo demás, con tokens.
