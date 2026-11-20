// @ts-check
/**
 * <cc-movimiento>: una fila compacta de la lista de movimientos (HU01-2, HU01-11).
 * Ícono de la categoría · descripción con categoría y fecha · monto con signo · ›.
 * Si se puede editar (R6), toda la fila es el enlace a la edición: un objetivo grande para el pulgar,
 * sin un "Editar" aparte. Se arma con clases de components.css, sin Shadow DOM ni CSS propio.
 * Los datos entran por propiedad y los avisos salen por evento. No importa la API ni el store.
 *
 * Propiedades:
 *   transaction: Transaction  (obligatoria)
 *   editHref: string | null   enlace de edición; si es null, la fila no es un enlace (R6)
 * Eventos:
 *   cc-editar { id }          al activar la fila, antes de navegar
 */
import { CATEGORY_LABELS } from '../../models/types.js';
import { icon } from '../ui/icons.js';
import { formatDayShort } from '../../utils/lima-date.js';
import { formatMoney } from '../../utils/money.js';
import { esc } from '../../utils/html.js';

/** @typedef {import('../../models/types.js').Transaction} Transaction */

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
    this.render();
  }

  render() {
    const t = this._transaction;
    if (!t || !this.isConnected) return;
    const isIncome = t.type === 'income';
    const typeLabel = isIncome ? 'Ingreso' : 'Gasto';
    const sign = isIncome ? '+' : '−';
    const amountClass = isIncome ? 'amount--income' : 'amount--expense';
    const content = `
      <span class="cat-icon">${icon(t.category)}</span>
      <span class="list-row__text">
        <span class="list-row__title">${esc(t.description)}</span>
        <span class="list-row__meta">${esc(CATEGORY_LABELS[t.category])} · ${esc(formatDayShort(t.date))}</span>
      </span>
      <span class="amount ${amountClass}"><span aria-hidden="true">${sign} </span><span class="visually-hidden">, ${typeLabel} de </span>${esc(formatMoney(t.amount))}</span>`;

    this.innerHTML = this._editHref
      ? `<a class="list-row list-row--link" href="${esc(this._editHref)}" data-action="edit"><span class="visually-hidden">Editar: </span>${content}${icon('chevron-right', 'icon list-row__chevron')}</a>`
      : `<div class="list-row">${content}</div>`;

    this.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('cc-editar', { bubbles: true, detail: { id: t.id } }));
    });
  }
}

if (!customElements.get('cc-movimiento')) customElements.define('cc-movimiento', CcMovimiento);
