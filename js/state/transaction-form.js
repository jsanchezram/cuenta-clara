// @ts-check
/**
 * Acciones del formulario de movimiento (HU-02): cargar para editar, guardar y eliminar.
 * Hablan con la API y actualizan el store. No tocan el DOM.
 */
import { createStore } from './store.js';
import { validateTransaction, canEdit } from '../logic/rules.js';

/** @typedef {import('../models/types.js').Transaction} Transaction */
/** @typedef {import('../api/cuentaclara-api.js').Api} Api */

/**
 * @typedef {Object} FormState
 * @property {'loading' | 'ready' | 'notFound' | 'locked' | 'loadError' | 'saving' | 'saved' | 'updated' | 'deleting' | 'deleted'} status
 * @property {'create' | 'edit'} mode
 * @property {Transaction | null} original  movimiento que se edita
 * @property {Transaction | null} saved  último movimiento guardado
 * @property {Record<string, string>} errors  campo → mensaje
 * @property {string | null} failure  error general al guardar o eliminar (los datos escritos se conservan)
 */

/**
 * @param {Pick<Api, 'getTransaction' | 'createTransaction' | 'updateTransaction' | 'deleteTransaction'>} api
 * @param {string} today  YYYY-MM-DD
 */
export function createFormActions(api, today) {
  const store = createStore(/** @type {FormState} */ ({
    status: 'ready',
    mode: 'create',
    original: null,
    saved: null,
    errors: {},
    failure: null,
  }));

  /** @param {unknown} e */
  const codeOf = (e) => /** @type {{ code?: string }} */ (e)?.code;

  /**
   * Prepara el formulario: vacío para registrar o con el movimiento para editar (HU02-5, HU02-6).
   * @param {string | null} id
   */
  async function init(id) {
    if (!id) {
      store.update({ status: 'ready', mode: 'create', original: null });
      return;
    }
    store.update({ status: 'loading', mode: 'edit' });
    try {
      const original = await api.getTransaction(id);
      store.update({ original, status: canEdit(original, today) ? 'ready' : 'locked' });
    } catch (e) {
      store.update({ status: codeOf(e) === 'NOT_FOUND' ? 'notFound' : 'loadError' });
    }
  }

  /**
   * Valida en el cliente y luego guarda. La API vuelve a validar (reglas del servidor).
   * @param {{ type: string, category: string, amount: string, date: string, description: string }} raw
   */
  async function save(raw) {
    const { mode, original } = store.get();
    const result = validateTransaction(raw, today, { editing: mode === 'edit' });
    if (!result.ok) {
      store.update({ status: 'ready', errors: /** @type {Record<string, string>} */ (result.errors), failure: null });
      return;
    }
    store.update({ status: 'saving', errors: {}, failure: null });
    try {
      if (mode === 'edit' && original) {
        const saved = await api.updateTransaction(original, result.value);
        store.update({ status: 'updated', saved });
      } else {
        const saved = await api.createTransaction(result.value);
        store.update({ status: 'saved', saved });
      }
    } catch (e) {
      const code = codeOf(e);
      if (code === 'VALIDATION_ERROR') {
        store.update({ status: 'ready', errors: /** @type {{ fields: Record<string, string> }} */ (/** @type {unknown} */ (e)).fields });
      } else if (code === 'OUTSIDE_CURRENT_MONTH') {
        store.update({ status: 'locked' });
      } else {
        store.update({ status: 'ready', failure: 'No pudimos guardar el movimiento. Tus datos siguen aquí: intenta de nuevo.' });
      }
    }
  }

  /** Eliminación lógica, después de la confirmación en la página (HU02-7). */
  async function remove() {
    const { original } = store.get();
    if (!original) return;
    store.update({ status: 'deleting', failure: null });
    try {
      await api.deleteTransaction(original.id);
      store.update({ status: 'deleted' });
    } catch (e) {
      if (codeOf(e) === 'OUTSIDE_CURRENT_MONTH') store.update({ status: 'locked' });
      else store.update({ status: 'ready', failure: 'No pudimos eliminar el movimiento. Intenta de nuevo.' });
    }
  }

  /** Vuelve al estado listo para registrar otro movimiento. */
  function startAnother() {
    store.update({ status: 'ready', mode: 'create', original: null, errors: {}, failure: null });
  }

  return { store, init, save, remove, startAnother };
}
