// @ts-check
/**
 * Acciones de la lista de movimientos (HU-01). Una acción tiene nombre de negocio, habla con la API y actualiza el store.
 * Las acciones no tocan el DOM.
 */
import { createStore } from './store.js';

/** @typedef {import('../models/types.js').Transaction} Transaction */
/** @typedef {import('../models/types.js').Period} Period */
/** @typedef {import('../models/types.js').Category} Category */

/**
 * @typedef {Object} TransactionsState
 * @property {'idle' | 'loading' | 'ready' | 'error'} status
 * @property {Period | null} period
 * @property {Category | null} category
 * @property {Transaction[]} transactions
 * @property {string | null} error
 */

/**
 * @param {Pick<import('../api/cuentaclara-api.js').Api, 'listTransactions'>} api
 */
export function createTransactionsActions(api) {
  const store = createStore(/** @type {TransactionsState} */ ({
    status: 'idle',
    period: null,
    category: null,
    transactions: [],
    error: null,
  }));
  let request = 0;

  /**
   * Carga un período. Nunca se queda en "loading": termina en "ready" o en "error".
   * @param {Period} period
   * @param {Category | null} category
   */
  async function load(period, category) {
    const mine = ++request;
    store.update({ status: 'loading', period, category, error: null });
    try {
      const transactions = await api.listTransactions({ from: period.from, to: period.to, category });
      if (mine !== request) return; // llegó tarde: ya hay un pedido más reciente
      store.update({ status: 'ready', transactions });
    } catch (e) {
      if (mine !== request) return;
      store.update({ status: 'error', transactions: [], error: e instanceof Error ? e.message : 'Error desconocido' });
    }
  }

  /** Vuelve a pedir lo último que se intentó cargar. */
  function retry() {
    const { period, category } = store.get();
    return period ? load(period, category) : Promise.resolve();
  }

  return { store, load, retry };
}
