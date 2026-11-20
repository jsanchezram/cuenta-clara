// @ts-check
/**
 * <cc-movimiento>: una fila de la lista de movimientos (HU01-2, HU01-11).
 * Se arma con clases de components.css (.list-row, .amount, .btn--link), sin Shadow DOM ni CSS propio.
 * Los datos entran por propiedad y los avisos salen por evento. No importa la API ni el store.
 *
 * Propiedades:
 *   transaction: Transaction  (obligatoria)
 *   editHref: string | null   enlace de edición; si es null, no se muestra "Editar" (R6)
 * Eventos:
 *   cc-editar { id }          al activar "Editar", antes de navegar
 */
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../models/types.js';
import { formatDayShort } from '../utils/lima-date.js';
import { formatMoney } from '../utils/money.js';
import { esc } from '../utils/html.js';

/** @typedef {import('../models/types.js').Transaction} Transaction */

export class CcMovimiento extends HTMLElement {
  constructor() {
    super();
    /** @type {Transaction | null} */
    this._transaction = null;
    /** @type {string | null} */
    this._editHref = null;
  }

  /** @param {Transaction} value */
  set transaction(value) {
    this._transaction = value;
    this.render();
  }

  get transaction() {
    return /** @type {Transaction} */ (this._transaction);
  }

  /** @param {string | null} value */
  set editHref(value) {
    this._editHref = value;
    this.render();
  }

  connectedCallback() {
    this.classList.add('list-row', 'list-row--icon');
    this.render();
  }

  render() {
    const t = this._transaction;
    if (!t || !this.isConnected) return;
    const isIncome = t.type === 'income';
    const typeLabel = isIncome ? 'Ingreso' : 'Gasto';
    const sign = isIncome ? '+' : '−';
    const amountClass = isIncome ? 'amount--income' : 'amount--expense';
    const edit = this._editHref
      ? `<a class="btn btn--link" href="${esc(this._editHref)}" data-action="edit">Editar<span class="visually-hidden"> ${esc(t.description)}</span></a>`
      : '';

    this.innerHTML = `
      <span class="cat-icon cat-icon--${t.category}" aria-hidden="true">${CATEGORY_ICONS[t.category]}</span>
      <div>
        <p class="list-row__title">${esc(t.description)}</p>
        <p class="list-row__meta">${esc(CATEGORY_LABELS[t.category])} · ${esc(formatDayShort(t.date))} · ${typeLabel}</p>
      </div>
      <div class="list-row__aside">
        <span class="amount ${amountClass}"><span aria-hidden="true">${sign} </span><span class="visually-hidden">${typeLabel} de </span>${esc(formatMoney(t.amount))}</span>
        ${edit}
      </div>`;

    this.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('cc-editar', { bubbles: true, detail: { id: t.id } }));
    });
  }
}

if (!customElements.get('cc-movimiento')) customElements.define('cc-movimiento', CcMovimiento);
