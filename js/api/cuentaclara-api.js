// @ts-check
/**
 * API simulada de CuentaClara (docs/api/contrato-v1.md).
 * Es la única puerta a los datos. Hoy usa localStorage; mañana usaría fetch a /api/v1, y las pantallas no notarían el cambio.
 * Guarda DTO (claves cuentaclara.v1.*), devuelve modelos, aplica las reglas del servidor y lanza ApiError.
 */
import { toTransaction, toTransactionDTO, toTransactionList, toTransactionPatch, toBudget } from '../contracts/mappers.js';
import { EXPENSE_CATEGORIES } from '../models/types.js';
import { validateAmount, validateCategory, validateDate, validateDescription, validateLimit } from '../logic/rules.js';
import { currentMonth, monthPeriod, shiftMonth } from '../logic/period.js';
import { effectiveLimit } from '../logic/budget.js';
import { sortByDateDesc, inPeriod } from '../logic/summary.js';
import { daysInMonth, todayInLima, nowInLimaIso } from '../utils/lima-date.js';
import { toCents } from '../utils/money.js';

/** @typedef {import('../contracts/dto.js').TransactionDTO} TransactionDTO */
/** @typedef {import('../contracts/dto.js').BudgetDTO} BudgetDTO */
/** @typedef {import('../contracts/dto.js').ErrorCodeDTO} ErrorCode */
/** @typedef {import('../models/types.js').Transaction} Transaction */
/** @typedef {import('../models/types.js').TransactionInput} TransactionInput */
/** @typedef {import('../models/types.js').Budget} Budget */
/** @typedef {import('../models/types.js').Category} Category */
/** @typedef {import('../models/types.js').ExpenseCategory} ExpenseCategory */
/** @typedef {{ transactions: TransactionDTO[], budgets: BudgetDTO[] }} Seed */
/** @typedef {{ getItem(key: string): string | null, setItem(key: string, value: string): void, removeItem(key: string): void }} Storage */
/** @typedef {'movimientos' | 'guardar' | 'presupuesto'} Failure */

const KEY_TRANSACTIONS = 'cuentaclara.v1.transactions';
const KEY_BUDGETS = 'cuentaclara.v1.budgets';

const MESSAGES = /** @type {Record<ErrorCode, string>} */ ({
  VALIDATION_ERROR: 'Revisa los campos marcados.',
  NOT_FOUND: 'No encontramos ese movimiento.',
  OUTSIDE_CURRENT_MONTH: 'Solo puedes editar o eliminar movimientos de este mes.',
  SERVER_ERROR: 'Tuvimos un problema. Intenta de nuevo.',
});

/** Error con la forma del contrato: { error: { code, message, fields } }. */
export class ApiError extends Error {
  /**
   * @param {ErrorCode} code
   * @param {Record<string, string>} [fields]
   */
  constructor(code, fields = {}) {
    super(MESSAGES[code]);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields;
  }
}

// ---------- Datos de ejemplo: corrimiento de meses ----------

/** @param {string} month YYYY-MM */
const monthIndex = (month) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7));

/**
 * Corre una fecha `delta` meses, ajusta el día al largo del mes y nunca la deja después de hoy.
 * @param {string} date @param {number} delta @param {string} today
 */
function shiftDate(date, delta, today) {
  const month = shiftMonth(date.slice(0, 7), delta);
  const [y, m] = month.split('-').map(Number);
  const day = Math.min(Number(date.slice(8, 10)), daysInMonth(y, m));
  const shifted = `${month}-${String(day).padStart(2, '0')}`;
  return shifted > today ? today : shifted;
}

/** @param {string | null} iso @param {number} delta @param {string} today */
const shiftIso = (iso, delta, today) => (iso ? shiftDate(iso.slice(0, 10), delta, today) + iso.slice(10) : null);

/**
 * Corre los datos de ejemplo para que su último mes sea el mes en curso.
 * Si hoy ya está en ese mes, devuelve la semilla tal cual.
 * @param {Seed} seed
 * @param {string} today
 * @returns {Seed}
 */
export function shiftSeed(seed, today) {
  const lastMonth = seed.transactions.reduce((max, t) => (t.date.slice(0, 7) > max ? t.date.slice(0, 7) : max), '0000-00');
  const delta = monthIndex(currentMonth(today)) - monthIndex(lastMonth);
  if (delta === 0) return seed;
  return {
    transactions: seed.transactions.map((t) => ({
      ...t,
      date: shiftDate(t.date, delta, today),
      created_at: /** @type {string} */ (shiftIso(t.created_at, delta, today)),
      updated_at: /** @type {string} */ (shiftIso(t.updated_at, delta, today)),
      deleted_at: shiftIso(t.deleted_at, delta, today),
    })),
    budgets: seed.budgets.map((b) => ({
      ...b,
      effective_from: shiftMonth(b.effective_from, delta),
      created_at: /** @type {string} */ (shiftIso(b.created_at, delta, today)),
      updated_at: /** @type {string} */ (shiftIso(b.updated_at, delta, today)),
    })),
  };
}

// ---------- API ----------

/**
 * @param {Object} options
 * @param {Storage} options.storage
 * @param {() => Promise<Seed>} options.loadSeed
 * @param {() => string} options.today  YYYY-MM-DD en Lima
 * @param {() => string} options.nowIso  ISO con -05:00
 * @param {number} [options.delayMs]  latencia simulada
 * @param {string[]} [options.failures]  fallos que se simulan una sola vez
 */
export function createApi({ storage, loadSeed, today, nowIso, delayMs = 400, failures = [] }) {
  const pendingFailures = new Set(failures);

  /** @param {Failure} kind */
  function maybeFail(kind) {
    if (pendingFailures.delete(kind)) throw new ApiError('SERVER_ERROR');
  }

  async function wait() {
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  async function ensureSeeded() {
    if (storage.getItem(KEY_TRANSACTIONS) !== null) return;
    const seed = shiftSeed(await loadSeed(), today());
    storage.setItem(KEY_TRANSACTIONS, JSON.stringify(seed.transactions));
    storage.setItem(KEY_BUDGETS, JSON.stringify(seed.budgets));
  }

  /** @returns {TransactionDTO[]} */
  const readTransactions = () => JSON.parse(storage.getItem(KEY_TRANSACTIONS) ?? '[]');
  /** @param {TransactionDTO[]} list */
  const writeTransactions = (list) => storage.setItem(KEY_TRANSACTIONS, JSON.stringify(list));
  /** @returns {BudgetDTO[]} */
  const readBudgets = () => JSON.parse(storage.getItem(KEY_BUDGETS) ?? '[]');
  /** @param {BudgetDTO[]} list */
  const writeBudgets = (list) => storage.setItem(KEY_BUDGETS, JSON.stringify(list));

  /**
   * Reglas del servidor sobre un DTO completo (R1–R4 y la fecha de R6 al editar).
   * @param {Pick<TransactionDTO, 'type' | 'category' | 'amount' | 'date' | 'description'>} dto
   * @param {boolean} editing
   */
  function validateDTO(dto, editing) {
    /** @type {Record<string, string>} */
    const fields = {};
    const amount = Number.isInteger(dto.amount)
      ? validateAmount(String(dto.amount / 100))
      : { ok: false, error: 'Escribe un monto válido, por ejemplo 25.50.' };
    if (!amount.ok) fields.amount = /** @type {{ error: string }} */ (amount).error;
    const category = validateCategory(String(dto.type).toLowerCase(), String(dto.category).toLowerCase());
    if (!category.ok) fields.category = category.error;
    const date = validateDate(dto.date, today(), { editing });
    if (!date.ok) fields.date = date.error;
    const description = validateDescription(dto.description);
    if (!description.ok) fields.description = description.error;
    if (Object.keys(fields).length > 0) throw new ApiError('VALIDATION_ERROR', fields);
  }

  /** @param {string} id */
  function findActive(id) {
    const list = readTransactions();
    const index = list.findIndex((t) => t.id === id && t.deleted_at == null);
    if (index === -1) throw new ApiError('NOT_FOUND');
    return { list, index };
  }

  /** @param {TransactionDTO} dto */
  function requireCurrentMonth(dto) {
    if (dto.date.slice(0, 7) !== currentMonth(today())) throw new ApiError('OUTSIDE_CURRENT_MONTH');
  }

  /** @param {TransactionDTO[]} list */
  function nextId(list) {
    const max = list.reduce((m, t) => Math.max(m, Number(t.id.replace('txn_', '')) || 0), 0);
    return `txn_${String(max + 1).padStart(4, '0')}`;
  }

  return {
    /**
     * GET /transactions: por mes o por rango, y opcionalmente por categoría.
     * @param {{ month?: string, from?: string, to?: string, category?: Category | null }} query
     * @returns {Promise<Transaction[]>}
     */
    async listTransactions({ month, from, to, category = null }) {
      await wait();
      maybeFail('movimientos');
      await ensureSeeded();
      const period = month ? monthPeriod(month) : { from: /** @type {string} */ (from), to: /** @type {string} */ (to) };
      if (!period.from || !period.to || period.from > period.to) throw new ApiError('VALIDATION_ERROR');
      const wanted = category ? category.toUpperCase() : null;
      const dtos = readTransactions().filter((t) => inPeriod(t, period) && (wanted === null || t.category === wanted));
      return sortByDateDesc(toTransactionList(dtos));
    },

    /**
     * GET /transactions/{id}
     * @param {string} id
     * @returns {Promise<Transaction>}
     */
    async getTransaction(id) {
      await wait();
      await ensureSeeded();
      const { list, index } = findActive(id);
      return toTransaction(list[index]);
    },

    /**
     * POST /transactions
     * @param {TransactionInput} input
     * @returns {Promise<Transaction>}
     */
    async createTransaction(input) {
      await wait();
      maybeFail('guardar');
      await ensureSeeded();
      const body = toTransactionDTO(input);
      validateDTO(body, false);
      const list = readTransactions();
      const now = nowIso();
      /** @type {TransactionDTO} */
      const dto = { id: nextId(list), ...body, created_at: now, updated_at: now, deleted_at: null };
      writeTransactions([...list, dto]);
      return toTransaction(dto);
    },

    /**
     * PATCH /transactions/{id}: envía solo lo que cambió y el servidor valida el resultado combinado.
     * @param {Transaction} original
     * @param {TransactionInput} edited
     * @returns {Promise<Transaction>}
     */
    async updateTransaction(original, edited) {
      await wait();
      maybeFail('guardar');
      await ensureSeeded();
      const patch = toTransactionPatch(original, edited);
      const { list, index } = findActive(original.id);
      const stored = list[index];
      requireCurrentMonth(stored);
      if (Object.keys(patch).length === 0) return toTransaction(stored);
      const merged = { ...stored, ...patch };
      validateDTO(merged, true);
      const updated = { ...merged, updated_at: nowIso() };
      writeTransactions(list.map((t, i) => (i === index ? updated : t)));
      return toTransaction(updated);
    },

    /**
     * DELETE /transactions/{id}: eliminación lógica.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteTransaction(id) {
      await wait();
      maybeFail('guardar');
      await ensureSeeded();
      const { list, index } = findActive(id);
      requireCurrentMonth(list[index]);
      const now = nowIso();
      writeTransactions(list.map((t, i) => (i === index ? { ...t, deleted_at: now, updated_at: now } : t)));
    },

    /**
     * GET /budgets?month=: límite vigente de cada categoría que tenga uno (R8).
     * @param {string} month YYYY-MM
     * @returns {Promise<Budget[]>}
     */
    async listBudgets(month) {
      await wait();
      maybeFail('presupuesto');
      await ensureSeeded();
      const history = readBudgets().map(toBudget);
      return EXPENSE_CATEGORIES.map((c) => effectiveLimit(history, c, month)).filter((b) => b !== null);
    },

    /**
     * PUT /budgets/{category}: vale desde el mes en curso (R7, R8).
     * @param {ExpenseCategory} category
     * @param {number} limit  soles
     * @returns {Promise<Budget>}
     */
    async saveBudget(category, limit) {
      await wait();
      maybeFail('guardar');
      await ensureSeeded();
      const check = validateLimit(String(limit));
      if (!check.ok) throw new ApiError('VALIDATION_ERROR', { limit: check.error });
      if (!EXPENSE_CATEGORIES.includes(category)) throw new ApiError('VALIDATION_ERROR', { category: 'Solo los gastos tienen presupuesto.' });
      const month = currentMonth(today());
      const now = nowIso();
      const list = readBudgets();
      const cat = /** @type {import('../contracts/dto.js').ExpenseCategoryDTO} */ (category.toUpperCase());
      const existing = list.find((b) => b.category === cat && b.effective_from === month);
      /** @type {BudgetDTO} */
      const dto = existing
        ? { ...existing, limit: toCents(limit), updated_at: now }
        : { category: cat, limit: toCents(limit), effective_from: month, created_at: now, updated_at: now };
      writeBudgets(existing ? list.map((b) => (b === existing ? dto : b)) : [...list, dto]);
      return toBudget(dto);
    },

    /** Borra los datos guardados; el próximo pedido vuelve a sembrar la demo. */
    resetDemo() {
      storage.removeItem(KEY_TRANSACTIONS);
      storage.removeItem(KEY_BUDGETS);
    },
  };
}

/** @typedef {ReturnType<typeof createApi>} Api */

/**
 * API para el navegador: localStorage, datos de ejemplo de datos/*.json y fallos con ?fallo=.
 * @returns {Api}
 */
export function createBrowserApi() {
  const failures = new URLSearchParams(window.location.search).getAll('fallo').flatMap((f) => f.split(','));
  return createApi({
    storage: window.localStorage,
    loadSeed: async () => {
      const [t, b] = await Promise.all([
        fetch('datos/movimientos.json').then((r) => r.json()),
        fetch('datos/presupuestos.json').then((r) => r.json()),
      ]);
      return { transactions: t.data, budgets: b.data };
    },
    today: () => todayInLima(new Date()),
    nowIso: () => nowInLimaIso(new Date()),
    failures,
  });
}
