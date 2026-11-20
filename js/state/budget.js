// @ts-check
/**
 * Acciones de la pantalla de presupuesto (HU-03). Hablan con la API y actualizan el store; no tocan el DOM.
 * Una sola tarjeta en edición a la vez (plan, riesgo "dos tarjetas en edición").
 */
import { createStore } from './store.js';
import { buildBudgetRows, budgetSummary, sortByUrgency } from '../logic/budget.js';
import { validateLimit } from '../logic/rules.js';
import { CATEGORY_LABELS } from '../models/types.js';
import { formatMoney } from '../utils/money.js';

/** @typedef {import('../logic/budget.js').BudgetRow} BudgetRow */
/** @typedef {import('../models/types.js').ExpenseCategory} ExpenseCategory */
/** @typedef {import('../api/cuentaclara-api.js').Api} Api */

/**
 * @typedef {Object} BudgetState
 * @property {'idle' | 'loading' | 'ready' | 'error'} status
 * @property {string | null} month  YYYY-MM
 * @property {BudgetRow[]} rows  ya ordenadas por urgencia
 * @property {{ attention: number, spent: number, limit: number, text: string } | null} summary
 * @property {ExpenseCategory | null} editing  tarjeta en edición
 * @property {ExpenseCategory | null} confirmingRemoval  tarjeta con la confirmación de quitar abierta
 * @property {ExpenseCategory | null} saving  tarjeta guardando o quitando
 * @property {{ category: ExpenseCategory, message: string } | null} error  error dentro de una tarjeta
 * @property {string} draft  lo escrito en el campo de límite (se conserva ante errores)
 * @property {string | null} notice  confirmación para anunciar
 * @property {ExpenseCategory | null} focusTarget  tarjeta que debe recibir el foco tras guardar o quitar
 */

/**
 * @param {Pick<Api, 'listBudgets' | 'listTransactions' | 'saveBudget' | 'removeBudget'>} api
 */
export function createBudgetActions(api) {
  const store = createStore(/** @type {BudgetState} */ ({
    status: 'idle',
    month: null,
    rows: [],
    summary: null,
    editing: null,
    confirmingRemoval: null,
    saving: null,
    error: null,
    draft: '',
    notice: null,
    focusTarget: null,
  }));
  let request = 0;

  /** @param {string} month */
  async function fetchRows(month) {
    const [budgets, transactions] = await Promise.all([api.listBudgets(month), api.listTransactions({ month })]);
    const rows = sortByUrgency(buildBudgetRows(budgets, transactions));
    return { rows, summary: budgetSummary(rows) };
  }

  /**
   * REQ-01, REQ-02, REQ-11: carga el mes. Nunca se queda en "loading".
   * @param {string} month
   */
  async function load(month) {
    const mine = ++request;
    store.update({ status: 'loading', month, editing: null, confirmingRemoval: null, error: null, notice: null, focusTarget: null });
    try {
      const data = await fetchRows(month);
      if (mine !== request) return;
      store.update({ status: 'ready', ...data });
    } catch {
      if (mine !== request) return;
      store.update({ status: 'error', rows: [], summary: null });
    }
  }

  function retry() {
    const { month } = store.get();
    return month ? load(month) : Promise.resolve();
  }

  /** @param {ExpenseCategory} category */
  const rowOf = (category) => store.get().rows.find((r) => r.category === category);

  /**
   * REQ-05: abre la edición en la tarjeta con el valor actual.
   * @param {ExpenseCategory} category
   */
  function startEdit(category) {
    const limit = rowOf(category)?.limit;
    store.update({
      editing: category,
      confirmingRemoval: null,
      error: null,
      notice: null,
      focusTarget: null,
      draft: limit == null ? '' : limit.toFixed(2),
    });
  }

  function cancelEdit() {
    const { editing } = store.get();
    store.update({ editing: null, confirmingRemoval: null, error: null, focusTarget: editing });
  }

  /**
   * REQ-06, REQ-07, REQ-08: valida (R7), guarda desde el mes en curso (R8) y avisa si ya se pasó.
   * @param {ExpenseCategory} category
   * @param {string} text
   */
  async function saveLimit(category, text) {
    const check = validateLimit(text);
    if (!check.ok) {
      store.update({ draft: text, error: { category, message: check.error } });
      return;
    }
    store.update({ draft: text, saving: category, error: null });
    try {
      await api.saveBudget(category, check.value);
      const data = await fetchRows(/** @type {string} */ (store.get().month));
      const row = data.rows.find((r) => r.category === category);
      let notice = `Límite de ${CATEGORY_LABELS[category]} guardado: ${formatMoney(check.value)}.`;
      if (row?.status === 'EXCEEDED' && row.remaining !== null) {
        notice += ` Ya te pasaste por ${formatMoney(-row.remaining)} este mes.`;
      }
      store.update({ ...data, saving: null, editing: null, confirmingRemoval: null, notice, focusTarget: category });
    } catch (e) {
      const fields = /** @type {{ fields?: Record<string, string> }} */ (e).fields;
      store.update({
        saving: null,
        error: { category, message: fields?.limit ?? 'No pudimos guardar el límite. Tu valor sigue aquí: intenta de nuevo.' },
      });
    }
  }

  /**
   * REQ-09: abre la confirmación en la página.
   * @param {ExpenseCategory} category
   */
  function askRemove(category) {
    store.update({ confirmingRemoval: category, error: null });
  }

  function cancelRemove() {
    store.update({ confirmingRemoval: null });
  }

  /**
   * REQ-09: quita el límite desde el mes en curso.
   * @param {ExpenseCategory} category
   */
  async function removeLimit(category) {
    store.update({ saving: category, error: null });
    try {
      await api.removeBudget(category);
      const data = await fetchRows(/** @type {string} */ (store.get().month));
      store.update({
        ...data,
        saving: null,
        editing: null,
        confirmingRemoval: null,
        notice: `Quitaste el límite de ${CATEGORY_LABELS[category]}.`,
        focusTarget: category,
      });
    } catch {
      store.update({ saving: null, error: { category, message: 'No pudimos quitar el límite. Intenta de nuevo.' } });
    }
  }

  return { store, load, retry, startEdit, cancelEdit, saveLimit, askRemove, cancelRemove, removeLimit };
}
