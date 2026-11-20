// @ts-check
/**
 * Lista y totales de movimientos (HU01-2, HU01-5). Funciones puras: suman en céntimos para evitar errores de coma flotante.
 */
import { toCents, toSoles } from '../utils/money.js';

/** @typedef {import('../models/types.js').Transaction} Transaction */
/** @typedef {import('../models/types.js').Period} Period */
/** @typedef {import('../models/types.js').Category} Category */

/**
 * @param {{ date: string }} transaction
 * @param {{ from: string, to: string }} period  ambos extremos incluidos
 */
export function inPeriod(transaction, period) {
  return transaction.date >= period.from && transaction.date <= period.to;
}

/**
 * @template {{ date: string, category: Category }} T
 * @param {T[]} list
 * @param {{ period: { from: string, to: string }, category?: Category | null }} filter
 * @returns {T[]}
 */
export function filterTransactions(list, { period, category = null }) {
  return list.filter((t) => inPeriod(t, period) && (category === null || t.category === category));
}

/**
 * Gastos, ingresos y saldo (ingresos − gastos), en soles.
 * @param {{ type: 'expense' | 'income', amount: number }[]} list
 * @returns {{ expenses: number, income: number, balance: number }}
 */
export function totals(list) {
  let expenses = 0;
  let income = 0;
  for (const t of list) {
    if (t.type === 'income') income += toCents(t.amount);
    else expenses += toCents(t.amount);
  }
  return { expenses: toSoles(expenses), income: toSoles(income), balance: toSoles(income - expenses) };
}

/**
 * Más reciente primero; en el mismo día, el último registrado primero.
 * @template {{ date: string, createdAt: string }} T
 * @param {T[]} list
 * @returns {T[]}
 */
export function sortByDateDesc(list) {
  return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}
