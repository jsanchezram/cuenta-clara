// @ts-check
/**
 * Mapeadores DTO ⇄ modelo. Es el único lugar que conoce las dos formas (docs/api/mapeo-v1.md).
 * JSDoc revisa mientras escribes, pero no los datos que llegan por la red: por eso cada DTO se valida aquí.
 */
import { EXPENSE_CATEGORIES, categoriesFor } from '../models/types.js';
import { toCents, toSoles } from '../utils/money.js';

/** @typedef {import('./dto.js').TransactionDTO} TransactionDTO */
/** @typedef {import('./dto.js').TransactionCreateDTO} TransactionCreateDTO */
/** @typedef {import('./dto.js').TransactionPatchDTO} TransactionPatchDTO */
/** @typedef {import('./dto.js').BudgetDTO} BudgetDTO */
/** @typedef {import('../models/types.js').Transaction} Transaction */
/** @typedef {import('../models/types.js').TransactionInput} TransactionInput */
/** @typedef {import('../models/types.js').Budget} Budget */

const MAX_CENTS = 1_000_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

/** Un DTO que no cumple el contrato v1. Es un error de programación o del servidor, no de Diego. */
export class ContractError extends Error {
  /**
   * @param {string} dto
   * @param {string} field
   * @param {unknown} value
   */
  constructor(dto, field, value) {
    super(`${dto}.${field} no cumple el contrato v1 (llegó ${JSON.stringify(value)})`);
    this.name = 'ContractError';
  }
}

/**
 * @param {boolean} condition
 * @param {string} dto
 * @param {string} field
 * @param {unknown} value
 * @returns {asserts condition}
 */
function require(condition, dto, field, value) {
  if (!condition) throw new ContractError(dto, field, value);
}

/** @param {unknown} v */
const isValidCents = (v) => Number.isInteger(v) && /** @type {number} */ (v) >= 1 && /** @type {number} */ (v) <= MAX_CENTS;

/**
 * @param {TransactionDTO} dto
 * @returns {Transaction}
 */
export function toTransaction(dto) {
  const name = 'TransactionDTO';
  require(typeof dto.id === 'string' && dto.id.length > 0, name, 'id', dto.id);
  require(dto.type === 'EXPENSE' || dto.type === 'INCOME', name, 'type', dto.type);
  const type = /** @type {import('../models/types.js').TransactionType} */ (dto.type.toLowerCase());
  const category = /** @type {import('../models/types.js').Category} */ (String(dto.category).toLowerCase());
  require(categoriesFor(type).includes(category), name, 'category', dto.category);
  require(isValidCents(dto.amount), name, 'amount', dto.amount);
  require(typeof dto.date === 'string' && DATE_RE.test(dto.date), name, 'date', dto.date);
  require(typeof dto.description === 'string', name, 'description', dto.description);

  return {
    id: dto.id,
    type,
    category,
    amount: toSoles(dto.amount),
    date: dto.date,
    description: dto.description,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

/**
 * Mapea una lista y descarta los eliminados lógicamente.
 * @param {TransactionDTO[]} dtos
 * @returns {Transaction[]}
 */
export function toTransactionList(dtos) {
  return dtos.filter((d) => d.deleted_at == null).map(toTransaction);
}

/**
 * Cuerpo de POST a partir del formulario.
 * @param {TransactionInput} input
 * @returns {TransactionCreateDTO}
 */
export function toTransactionDTO(input) {
  return {
    type: /** @type {import('./dto.js').TransactionTypeDTO} */ (input.type.toUpperCase()),
    category: /** @type {import('./dto.js').CategoryDTO} */ (input.category.toUpperCase()),
    amount: toCents(input.amount),
    date: input.date,
    description: input.description.trim(),
  };
}

/**
 * Cuerpo de PATCH: solo los campos que cambiaron respecto del original.
 * @param {Transaction} original
 * @param {TransactionInput} edited
 * @returns {TransactionPatchDTO}
 */
export function toTransactionPatch(original, edited) {
  const before = toTransactionDTO(original);
  const after = toTransactionDTO(edited);
  /** @type {TransactionPatchDTO} */
  const patch = {};
  for (const key of /** @type {(keyof TransactionCreateDTO)[]} */ (Object.keys(after))) {
    if (after[key] !== before[key]) {
      /** @type {Record<string, unknown>} */ (patch)[key] = after[key];
    }
  }
  return patch;
}

/**
 * @param {BudgetDTO} dto
 * @returns {Budget}
 */
export function toBudget(dto) {
  const name = 'BudgetDTO';
  const category = /** @type {import('../models/types.js').ExpenseCategory} */ (String(dto.category).toLowerCase());
  require(EXPENSE_CATEGORIES.includes(category), name, 'category', dto.category);
  require(isValidCents(dto.limit), name, 'limit', dto.limit);
  require(typeof dto.effective_from === 'string' && MONTH_RE.test(dto.effective_from), name, 'effective_from', dto.effective_from);
  return { category, limit: toSoles(dto.limit), effectiveFrom: dto.effective_from };
}

/**
 * Registro del historial de límites, incluidos los quitados (HU-03, REQ-09).
 * Solo lo usa la API para calcular el límite vigente; la UI recibe Budget.
 * @param {BudgetDTO} dto
 * @returns {import('../logic/budget.js').BudgetRecord}
 */
export function toBudgetRecord(dto) {
  return { ...toBudget(dto), removed: dto.deleted_at != null };
}
