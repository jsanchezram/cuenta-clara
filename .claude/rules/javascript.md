---
paths:
  - "js/**/*.js"
  - "tests/**/*.js"
---
# Reglas de JavaScript

- `// @ts-check` en la primera línea. Los tipos van con JSDoc, importando los typedef de `js/models/types.js` y `js/contracts/dto.js`.
- Módulos ES con import relativo y extensión `.js`. Sin npm ni dependencias.
- `js/models`, `js/contracts`, `js/utils` y `js/logic` no usan DOM: nada de `document`, `window` ni `localStorage`.
- Solo `js/contracts/mappers.js` conoce el DTO y el modelo. La UI trabaja con modelos (soles, minúsculas, camelCase).
- Los DTO copian `docs/api/contrato-v1.md`. Si un cambio exige tocar el DTO, detente y pregúntame.
- Reglas del negocio: funciones puras. `today` llega como parámetro, nunca `new Date()` ni `Date.now()` en `js/logic/`.
- Dinero:
  - Se compara en céntimos (`toCents`).
  - Se muestra con `formatMoney` de `js/utils/money.js`.
- `localStorage` solo en `js/api/`, con claves `cuentaclara.v1.*`.
- Componentes (`js/components/`):
  - Custom elements sin Shadow DOM y sin CSS propio.
  - No importan la API ni el store: reciben los datos por propiedad y avisan con `CustomEvent('cc-…', { bubbles: true })`.
- Antes de `innerHTML`, escapa todo dato de personas con `esc()`.
- Pruebas:
  - Van en `tests/*.test.js` con `node:test` y `node:assert/strict`.
  - Los nombres de las pruebas son frases en español.
  - No borres ni debilites una prueba para que pase.
  - Después de cada archivo, ejecuta `node --test`. Si falla 2 veces seguidas, detente.
