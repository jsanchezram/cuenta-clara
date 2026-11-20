// @ts-check
/**
 * Rutas de CuentaClara. La URL es la fuente de verdad del período y del filtro (HU01-4).
 * Es el único lugar que traduce los slugs en español de la URL (#/2026-11/comida) a las categorías del modelo.
 */
import { isValidDate } from './utils/lima-date.js';
import { currentMonth, monthPeriod } from './logic/period.js';

/** @typedef {import('./models/types.js').Category} Category */
/** @typedef {import('./models/types.js').Period} Period */

/** Slug visible en la URL para cada categoría. */
export const CATEGORY_SLUGS = Object.freeze(
  /** @type {Record<Category, string>} */ ({
    food: 'comida',
    transport: 'transporte',
    housing: 'vivienda',
    utilities: 'servicios',
    leisure: 'ocio',
    other: 'otros',
    work: 'trabajo',
    other_income: 'otros-ingresos',
  }),
);

/**
 * @param {string} slug
 * @returns {Category | null}
 */
export function slugToCategory(slug) {
  const entry = Object.entries(CATEGORY_SLUGS).find(([, s]) => s === slug);
  return entry ? /** @type {Category} */ (entry[0]) : null;
}

/** @param {Period} period */
function periodSegment(period) {
  if (period.kind === 'month') return period.from.slice(0, 7);
  if (period.kind === 'day') return period.from;
  return `${period.from}..${period.to}`;
}

/**
 * @param {Period} period
 * @param {Category | null} category
 */
function transactionsHash(period, category) {
  return `#/${periodSegment(period)}${category ? `/${CATEGORY_SLUGS[category]}` : ''}`;
}

export const routes = Object.freeze({
  /** @param {Period} period @param {Category | null} [category] */
  transactions: (period, category = null) => `movimientos.html${transactionsHash(period, category)}`,
  register: () => 'registrar.html',
  /** @param {string} id */
  edit: (id) => `registrar.html?id=${encodeURIComponent(id)}`,
  budget: () => 'presupuesto.html',
  /** Hash para location.hash en movimientos.html. */
  transactionsHash,
});

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Lee el segmento del período. Devuelve null si no es válido para hoy.
 * @param {string} segment
 * @param {string} today
 * @returns {Period | null}
 */
function parsePeriod(segment, today) {
  if (MONTH_RE.test(segment)) {
    return segment <= currentMonth(today) ? monthPeriod(segment) : null;
  }
  if (isValidDate(segment)) {
    return segment <= today ? { kind: 'day', from: segment, to: segment } : null;
  }
  const [from, to, ...rest] = segment.split('..');
  if (rest.length === 0 && from && to && isValidDate(from) && isValidDate(to) && from <= to && to <= today) {
    return { kind: 'range', from, to };
  }
  return null;
}

/**
 * Lee la ruta de movimientos.html y la corrige si hace falta (HU01-1, HU01-10).
 * Si `corrected` es true, la pantalla debe usar history.replaceState con `hash`, sin ensuciar el historial.
 * @param {string} hash  location.hash, por ejemplo "#/2026-11/comida"
 * @param {string} today  YYYY-MM-DD
 * @returns {{ period: Period, category: Category | null, hash: string, corrected: boolean }}
 */
export function parseTransactionsRoute(hash, today) {
  const raw = hash.replace(/^#\/?/, '');
  const [periodPart = '', categoryPart, ...extra] = raw.split('/');
  const parsed = parsePeriod(periodPart, today);
  const period = parsed ?? monthPeriod(currentMonth(today));
  // Una categoría válida se conserva aunque el período se corrija.
  const category = categoryPart ? slugToCategory(categoryPart) : null;
  const canonical = transactionsHash(period, category);
  return { period, category, hash: canonical, corrected: canonical !== `#/${raw}` || extra.length > 0 };
}
