// @ts-check
/**
 * Presupuesto: estados R5 y límite vigente R8. Funciones puras; el estado se compara en céntimos.
 */
import { EXPENSE_CATEGORIES } from '../models/types.js';
import { formatMoney, toCents, toSoles } from '../utils/money.js';

/** @typedef {import('../models/types.js').Budget} Budget */
/** @typedef {import('../models/types.js').BudgetStatus} BudgetStatus */
/** @typedef {import('../models/types.js').ExpenseCategory} ExpenseCategory */
/** @typedef {import('../models/types.js').Category} Category */

/**
 * R5. Compara en céntimos enteros, sin porcentajes en coma flotante.
 * @param {number} spentCents
 * @param {number} limitCents  mayor que 0
 * @returns {BudgetStatus}
 */
export function budgetStatus(spentCents, limitCents) {
  if (spentCents > limitCents) return 'EXCEEDED';
  if (spentCents === limitCents) return 'REACHED';
  if (spentCents * 100 >= limitCents * 80) return 'NEAR';
  return 'NORMAL';
}

/**
 * Porcentaje usado, redondeado al entero. Puede pasar de 100.
 * @param {number} spent
 * @param {number} limit  en la misma unidad que spent
 */
export function percentUsed(spent, limit) {
  return Math.round((spent * 100) / limit);
}

/**
 * Texto visible del estado (el aviso no depende del color).
 * @param {BudgetStatus} status
 * @param {number} remaining  soles; negativo si se excedió
 */
export function budgetMessage(status, remaining) {
  switch (status) {
    case 'NORMAL':
      return `Te quedan ${formatMoney(remaining)}`;
    case 'NEAR':
      return 'Cerca del límite';
    case 'REACHED':
      return 'Alcanzaste tu límite';
    case 'EXCEEDED':
      return `Te pasaste por ${formatMoney(-remaining)}`;
  }
}

/**
 * Registro del historial de límites. `removed` indica que el límite se quitó desde ese mes (HU-03, REQ-09).
 * @typedef {Budget & { removed: boolean }} BudgetRecord
 */

/**
 * R8: el límite vigente en un mes es el registro de mayor effectiveFrom ≤ mes.
 * Si ese registro está quitado (`removed`), la categoría no tiene límite ese mes.
 * @template {Budget & { removed?: boolean }} T
 * @param {T[]} history
 * @param {ExpenseCategory} category
 * @param {string} month YYYY-MM
 * @returns {T | null}
 */
export function effectiveLimit(history, category, month) {
  /** @type {T | null} */
  let best = null;
  for (const b of history) {
    if (b.category === category && b.effectiveFrom <= month && (!best || b.effectiveFrom > best.effectiveFrom)) best = b;
  }
  return best;
}

/**
 * @typedef {Object} BudgetRow
 * @property {ExpenseCategory} category
 * @property {number | null} limit  soles; null si no hay límite
 * @property {number} spent  soles
 * @property {number | null} remaining  soles; negativo si se excedió
 * @property {number | null} percent
 * @property {BudgetStatus | null} status
 * @property {string} message
 */

/**
 * Una fila por categoría de gasto con su uso del mes (HU03-1, HU03-2, HU03-4).
 * @param {Budget[]} budgets  límites vigentes del mes
 * @param {{ type: 'expense' | 'income', category: Category, amount: number }[]} transactions  movimientos del mes
 * @returns {BudgetRow[]}
 */
export function buildBudgetRows(budgets, transactions) {
  return EXPENSE_CATEGORIES.map((category) => {
    const spentCents = transactions
      .filter((t) => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + toCents(t.amount), 0);
    const budget = budgets.find((b) => b.category === category);
    if (!budget) {
      return { category, limit: null, spent: toSoles(spentCents), remaining: null, percent: null, status: null, message: 'Sin límite definido' };
    }
    const limitCents = toCents(budget.limit);
    const status = budgetStatus(spentCents, limitCents);
    const remaining = toSoles(limitCents - spentCents);
    return {
      category,
      limit: budget.limit,
      spent: toSoles(spentCents),
      remaining,
      percent: percentUsed(spentCents, limitCents),
      status,
      message: budgetMessage(status, remaining),
    };
  });
}

const URGENCY = /** @type {Record<BudgetStatus, number>} */ ({ EXCEEDED: 0, REACHED: 1, NEAR: 2, NORMAL: 3 });

/**
 * REQ-03: excedido, alcanzado, cerca, normal y al final sin límite.
 * Dentro de un mismo estado, mayor porcentaje primero; sin límite conserva el orden recibido.
 * @param {BudgetRow[]} rows
 * @returns {BudgetRow[]}
 */
export function sortByUrgency(rows) {
  const rank = (/** @type {BudgetRow} */ r) => (r.status === null ? 4 : URGENCY[r.status]);
  return rows
    .map((r, index) => ({ r, index }))
    .sort((a, b) => rank(a.r) - rank(b.r) || (b.r.percent ?? 0) - (a.r.percent ?? 0) || a.index - b.index)
    .map(({ r }) => r);
}

/**
 * REQ-04: resumen del mes. Solo suma las categorías que tienen límite.
 * percent es lo usado del total presupuestado (en céntimos, como cada fila): llena la barra del resumen.
 * @param {BudgetRow[]} rows
 * @returns {{ attention: number, spent: number, limit: number, percent: number, text: string }}
 */
export function budgetSummary(rows) {
  const limited = rows.filter((r) => r.limit !== null && r.status !== null);
  if (limited.length === 0) {
    return { attention: 0, spent: 0, limit: 0, percent: 0, text: 'Aún no defines límites este mes. Define uno para recibir avisos.' };
  }
  const attention = limited.filter((r) => r.status !== 'NORMAL').length;
  const spentCents = limited.reduce((sum, r) => sum + toCents(r.spent), 0);
  const limitCents = limited.reduce((sum, r) => sum + toCents(/** @type {number} */ (r.limit)), 0);
  const spent = toSoles(spentCents);
  const limit = toSoles(limitCents);
  const head = attention === 0
    ? 'Todo bajo control'
    : `${attention} ${attention === 1 ? 'categoría necesita' : 'categorías necesitan'} atención`;
  return {
    attention,
    spent,
    limit,
    percent: percentUsed(spentCents, limitCents),
    text: `${head} · Gastaste ${formatMoney(spent)} de ${formatMoney(limit)} presupuestados`,
  };
}
