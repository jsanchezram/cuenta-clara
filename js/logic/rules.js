// @ts-check
/**
 * Reglas del negocio R1–R4 y R6 (docs/historias-de-usuario.md).
 * Son funciones puras: "today" llega como parámetro y no tocan el DOM.
 * Los mensajes están en español porque se muestran junto al campo.
 */
import { categoriesFor } from '../models/types.js';
import { addDays, isValidDate } from '../utils/lima-date.js';
import { toCents } from '../utils/money.js';
import { currentMonth } from './period.js';

/** @typedef {import('../models/types.js').TransactionInput} TransactionInput */
/** @typedef {import('../models/types.js').TransactionType} TransactionType */
/** @template T @typedef {{ ok: true, value: T } | { ok: false, error: string }} Check */

const MAX_CENTS = 1_000_000; // S/ 10 000
const MAX_DESCRIPTION = 60;
const MAX_DAYS_BACK = 60;

/**
 * R1 · R7: monto o límite escrito por la persona. Acepta punto o coma decimal.
 * @param {string} text
 * @returns {Check<number>}
 */
export function validateAmount(text) {
  const clean = String(text ?? '').trim().replace(',', '.');
  if (clean === '') return { ok: false, error: 'Escribe un monto.' };
  if (!/^-?\d+(\.\d+)?$/.test(clean)) return { ok: false, error: 'Escribe un monto válido, por ejemplo 25.50.' };
  const decimals = clean.split('.')[1] ?? '';
  if (decimals.length > 2) return { ok: false, error: 'Usa como máximo 2 decimales.' };
  const value = Number(clean);
  if (value <= 0) return { ok: false, error: 'El monto debe ser mayor que 0.' };
  if (toCents(value) > MAX_CENTS) return { ok: false, error: 'El monto máximo es S/ 10 000.' };
  return { ok: true, value };
}

/** R7: el límite del presupuesto cumple la misma regla que el monto. */
export const validateLimit = validateAmount;

/**
 * R2 (y R6 al editar).
 * @param {string} date YYYY-MM-DD
 * @param {string} today YYYY-MM-DD
 * @param {{ editing?: boolean }} [options]
 * @returns {Check<string>}
 */
export function validateDate(date, today, { editing = false } = {}) {
  if (!date) return { ok: false, error: 'Elige una fecha.' };
  if (!isValidDate(date)) return { ok: false, error: 'Elige una fecha válida.' };
  if (date > today) return { ok: false, error: 'La fecha no puede ser futura.' };
  if (date < addDays(today, -MAX_DAYS_BACK)) {
    return { ok: false, error: 'La fecha debe estar dentro de los últimos 60 días.' };
  }
  if (editing && date.slice(0, 7) !== currentMonth(today)) {
    return { ok: false, error: 'Al editar, la fecha debe ser de este mes.' };
  }
  return { ok: true, value: date };
}

/**
 * R3.
 * @param {string} type
 * @param {string} category
 * @returns {Check<string>}
 */
export function validateCategory(type, category) {
  if (type !== 'expense' && type !== 'income') return { ok: false, error: 'Elige si es un gasto o un ingreso.' };
  if (!category) return { ok: false, error: 'Elige una categoría.' };
  if (!categoriesFor(type).includes(/** @type {any} */ (category))) {
    return { ok: false, error: 'Esa categoría no corresponde al tipo de movimiento.' };
  }
  return { ok: true, value: category };
}

/**
 * R4.
 * @param {string} text
 * @returns {Check<string>}
 */
export function validateDescription(text) {
  const clean = String(text ?? '').trim();
  if (clean === '') return { ok: false, error: 'Escribe una descripción.' };
  if (clean.length > MAX_DESCRIPTION) return { ok: false, error: 'Usa como máximo 60 caracteres.' };
  return { ok: true, value: clean };
}

/**
 * Valida el formulario completo y junta un error por campo.
 * @param {{ type: string, category: string, amount: string, date: string, description: string }} raw
 * @param {string} today
 * @param {{ editing?: boolean }} [options]
 * @returns {{ ok: true, value: TransactionInput, errors: {} } | { ok: false, errors: Partial<Record<keyof TransactionInput, string>> }}
 */
export function validateTransaction(raw, today, options = {}) {
  const amount = validateAmount(raw.amount);
  const date = validateDate(raw.date, today, options);
  const category = validateCategory(raw.type, raw.category);
  const description = validateDescription(raw.description);

  /** @type {Partial<Record<keyof TransactionInput, string>>} */
  const errors = {};
  if (!category.ok) errors[raw.type === 'expense' || raw.type === 'income' ? 'category' : 'type'] = category.error;
  if (!amount.ok) errors.amount = amount.error;
  if (!date.ok) errors.date = date.error;
  if (!description.ok) errors.description = description.error;

  if (!amount.ok || !date.ok || !category.ok || !description.ok) return { ok: false, errors };
  return {
    ok: true,
    value: {
      type: /** @type {TransactionType} */ (raw.type),
      category: /** @type {import('../models/types.js').Category} */ (category.value),
      amount: amount.value,
      date: date.value,
      description: description.value,
    },
    errors: {},
  };
}

/**
 * R6: solo se edita o elimina un movimiento del mes en curso.
 * @param {{ date: string }} transaction
 * @param {string} today
 */
export function canEdit(transaction, today) {
  return transaction.date.slice(0, 7) === currentMonth(today);
}
