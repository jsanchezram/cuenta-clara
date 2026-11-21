// @ts-check
/**
 * Modelos de la UI. Es la forma en que la app trabaja con los datos:
 * montos en soles, enumeraciones en minúsculas y campos en camelCase.
 * La UI nunca usa los DTO del contrato: para eso existe js/contracts/mappers.js.
 */

/** @typedef {'expense' | 'income'} TransactionType */

/** @typedef {'food' | 'transport' | 'housing' | 'utilities' | 'leisure' | 'other'} ExpenseCategory */

/** @typedef {'work' | 'other_income'} IncomeCategory */

/** @typedef {ExpenseCategory | IncomeCategory} Category */

/**
 * Movimiento: un gasto o un ingreso.
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {TransactionType} type
 * @property {Category} category
 * @property {number} amount  en soles, por ejemplo 15.5
 * @property {string} date  YYYY-MM-DD
 * @property {string} description
 * @property {string} createdAt  ISO 8601 con -05:00
 * @property {string} updatedAt  ISO 8601 con -05:00
 */

/**
 * Datos que escribe Diego en el formulario, ya convertidos a número.
 * @typedef {Object} TransactionInput
 * @property {TransactionType} type
 * @property {Category} category
 * @property {number} amount  en soles
 * @property {string} date  YYYY-MM-DD
 * @property {string} description
 */

/**
 * Límite vigente de una categoría de gasto.
 * @typedef {Object} Budget
 * @property {ExpenseCategory} category
 * @property {number} limit  en soles
 * @property {string} effectiveFrom  YYYY-MM desde el que vale (R8)
 */

/** @typedef {'NORMAL' | 'NEAR' | 'REACHED' | 'EXCEEDED'} BudgetStatus */

/**
 * Período que muestra la lista: un mes, un día o un rango (ambos extremos incluidos).
 * @typedef {Object} Period
 * @property {'month' | 'day' | 'range'} kind
 * @property {string} from  YYYY-MM-DD
 * @property {string} to  YYYY-MM-DD
 */

/** @type {readonly ExpenseCategory[]} */
export const EXPENSE_CATEGORIES = Object.freeze(['food', 'transport', 'housing', 'utilities', 'leisure', 'other']);

/** @type {readonly IncomeCategory[]} */
export const INCOME_CATEGORIES = Object.freeze(['work', 'other_income']);

/** @type {readonly Category[]} */
export const CATEGORIES = Object.freeze([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]);

/** Nombre visible de cada categoría (UI en español). */
export const CATEGORY_LABELS = Object.freeze(
  /** @type {Record<Category, string>} */ ({
    food: 'Comida',
    transport: 'Transporte',
    housing: 'Vivienda',
    utilities: 'Servicios',
    leisure: 'Ocio',
    other: 'Otros',
    work: 'Trabajo',
    other_income: 'Otros ingresos',
  }),
);

/**
 * Categorías válidas para un tipo (R3).
 * @param {TransactionType} type
 * @returns {readonly Category[]}
 */
export function categoriesFor(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

// ---------- Preferencias del dispositivo (añadido: vista de Perfil) ----------
// No son parte del contrato v1: viven solo en el navegador de Diego.

/** @typedef {'light' | 'dark' | 'system'} ThemePreference */

/** Temas que se pueden elegir; "system" sigue al modo claro u oscuro del equipo. */
export const THEMES = Object.freeze(/** @type {ThemePreference[]} */ (['light', 'dark', 'system']));

/** Nombre de cada tema en la UI. */
export const THEME_LABELS = Object.freeze(/** @type {Record<ThemePreference, string>} */ ({ light: 'Claro', dark: 'Oscuro', system: 'Sistema' }));

/** @typedef {{ theme: ThemePreference }} Preferences */
