// @ts-check
/**
 * <cc-barra-presupuesto>: tarjeta del presupuesto de una categoría (HU03-1, HU03-2, HU03-4, R5).
 * El estado se lee en texto; la barra tiene un patrón distinto por estado y el ícono refuerza.
 * Usa clases de components.css (.card, .budget-*), sin Shadow DOM ni CSS propio. No importa la API ni el store.
 *
 * Propiedades:
 *   row: BudgetRow           (obligatoria) resultado de buildBudgetRows
 * Atributos:
 *   editable                 muestra "Editar límite" o "Definir límite" (solo en el mes en curso, R8)
 *   heading-level="2|3"      nivel del título; por defecto 2
 * Eventos:
 *   cc-editar-limite { category }
 * Métodos:
 *   focusAction()            devuelve el foco al botón de editar
 */
import { CATEGORY_LABELS } from '../models/types.js';
import { formatMoney } from '../utils/money.js';
import { esc } from '../utils/html.js';

/** @typedef {import('../logic/budget.js').BudgetRow} BudgetRow */

const ICONS = /** @type {const} */ ({ NORMAL: '✓', NEAR: '⚠', REACHED: '●', EXCEEDED: '✕' });
const MODIFIER = /** @type {const} */ ({ NORMAL: '', NEAR: 'near', REACHED: 'reached', EXCEEDED: 'exceeded' });

export class CcBarraPresupuesto extends HTMLElement {
  static observedAttributes = ['editable', 'heading-level'];

  constructor() {
    super();
    /** @type {BudgetRow | null} */
    this._row = null;
  }

  /** @param {BudgetRow} value */
  set row(value) {
    this._row = value;
    this.render();
  }

  get row() {
    return /** @type {BudgetRow} */ (this._row);
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  focusAction() {
    /** @type {HTMLButtonElement | null} */ (this.querySelector('[data-action="edit-limit"]'))?.focus();
  }

  render() {
    const r = this._row;
    if (!r || !this.isConnected) return;
    const label = CATEGORY_LABELS[r.category];
    const level = this.getAttribute('heading-level') === '3' ? 'h3' : 'h2';
    const titleId = `budget-${r.category}`;
    const action = this.hasAttribute('editable')
      ? `<button class="btn btn--link" type="button" data-action="edit-limit">${r.limit === null ? 'Definir límite' : 'Editar límite'}<span class="visually-hidden"> de ${esc(label)}</span></button>`
      : '';

    let body;
    if (r.limit === null || r.status === null) {
      body = `
        <p class="budget-status budget-status--none"><span class="budget-status__icon" aria-hidden="true">○</span>Sin límite definido</p>
        <p class="field__hint">Usado este mes: ${esc(formatMoney(r.spent))}</p>`;
    } else {
      const mod = MODIFIER[r.status];
      const exceeded = r.status === 'EXCEEDED';
      const percent = /** @type {number} */ (r.percent);
      body = `
        <dl class="budget-figures">
          <div><dt class="budget-figures__label">Usado</dt><dd class="budget-figures__value">${esc(formatMoney(r.spent))}</dd></div>
          <div><dt class="budget-figures__label">Límite</dt><dd class="budget-figures__value">${esc(formatMoney(r.limit))}</dd></div>
          <div><dt class="budget-figures__label">${exceeded ? 'Excedido' : 'Restante'}</dt><dd class="budget-figures__value">${esc(formatMoney(/** @type {number} */ (r.remaining)))}</dd></div>
        </dl>
        <div class="budget-bar${mod ? ` budget-bar--${mod}` : ''}" role="progressbar" aria-label="Uso del presupuesto de ${esc(label)}"
             aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(percent, 100)}" aria-valuetext="${percent} % usado. ${esc(r.message)}">
          <span class="budget-bar__fill" style="--budget-value: ${percent}%"></span>
        </div>
        <div class="budget-meta">
          <p class="budget-status${mod ? ` budget-status--${mod}` : ''}"><span class="budget-status__icon" aria-hidden="true">${ICONS[r.status]}</span>${esc(r.message)}</p>
          <p class="budget-meta__percent">${percent} % usado</p>
        </div>`;
    }

    this.innerHTML = `
      <article class="card" aria-labelledby="${titleId}">
        <div class="card__header">
          <${level} class="card__title" id="${titleId}">${esc(label)}</${level}>
          ${action}
        </div>
        ${body}
      </article>`;

    this.querySelector('[data-action="edit-limit"]')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('cc-editar-limite', { bubbles: true, detail: { category: r.category } }));
    });
  }
}

if (!customElements.get('cc-barra-presupuesto')) customElements.define('cc-barra-presupuesto', CcBarraPresupuesto);
