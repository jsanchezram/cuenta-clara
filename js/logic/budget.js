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
 * R8: el límite vigente en un mes es el de mayor effectiveFrom ≤ mes.
 * @param {Budget[]} history
 * @param {ExpenseCategory} category
 * @param {string} month YYYY-MM
 * @returns {Budget | null}
 */
export function effectiveLimit(history, category, month) {
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
