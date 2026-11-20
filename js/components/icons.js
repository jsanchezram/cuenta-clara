// @ts-check
/**
 * Íconos SVG sólidos y monocromos: heredan el color del texto (currentColor).
 * Son decorativos y siempre llevan aria-hidden, porque el texto de al lado ya dice qué significan.
 * Reemplazan a los emojis de colores (revisión de la persona, bitácora #24).
 */

/** Trazos en una grilla de 24 × 24. */
const PATHS = Object.freeze(/** @type {Record<string, string>} */ ({
  // Categorías
  food: 'M3 11h18c0 4.97-4.03 9-9 9s-9-4.03-9-9zM6.5 4a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0zM11 3a1 1 0 0 1 2 0v5a1 1 0 0 1-2 0zM15.5 4a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0z',
  transport: 'M7 3h10a3 3 0 0 1 3 3v11a1 1 0 0 1-1 1h-1v1.5a1.5 1.5 0 0 1-3 0V18H9v1.5a1.5 1.5 0 0 1-3 0V18H5a1 1 0 0 1-1-1V6a3 3 0 0 1 3-3zM6 7v4h12V7zM7.5 13.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM16.5 13.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',
  housing: 'M12 3 2.5 11H5v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9h2.5z',
  utilities: 'M13.5 2 4.5 13.5H11L10 22l9.5-11.5H13z',
  leisure: 'M4 5h16a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5V7a2 2 0 0 1 2-2z',
  other: 'M5.5 4h3A1.5 1.5 0 0 1 10 5.5v3A1.5 1.5 0 0 1 8.5 10h-3A1.5 1.5 0 0 1 4 8.5v-3A1.5 1.5 0 0 1 5.5 4zM15.5 4h3A1.5 1.5 0 0 1 20 5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 14 8.5v-3A1.5 1.5 0 0 1 15.5 4zM5.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3A1.5 1.5 0 0 1 5.5 14zM15.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5z',
  work: 'M9 3h6a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2zM9 5v2h6V5z',
  other_income: 'M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  // Navegación y controles
  list: 'M4 5h16v2H4zM4 11h16v2H4zM4 17h16v2H4z',
  plus: 'M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z',
  pie: 'M11 4a9 9 0 1 0 9 9h-9zM13 2v9h9a9 9 0 0 0-9-9z',
  user: 'M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM4 20c0-3.87 3.58-6.5 8-6.5s8 2.63 8 6.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z',
  calendar: 'M8 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V3a1 1 0 0 1 1-1zM5 10v9h14v-9zM7 12h3v3H7z',
  'chevron-left': 'M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z',
  'chevron-right': 'M8.6 5.4 10 4l8 8-8 8-1.4-1.4 6.6-6.6z',
  'chevron-down': 'M5.4 8.6 4 10l8 8 8-8-1.4-1.4-6.6 6.6z',
  close: 'M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z',
}));

/** Nombres disponibles (la vitrina los muestra todos). */
export const ICON_NAMES = Object.freeze(Object.keys(PATHS));

/**
 * SVG decorativo listo para insertar en HTML.
 * @param {string} name  nombre del ícono (las categorías usan su clave del modelo, por ejemplo 'food')
 * @param {string} [className]
 * @returns {string}
 */
export function icon(name, className = 'icon') {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="${PATHS[name] ?? ''}"/></svg>`;
}
