// @ts-check
/**
 * <cc-barra-presupuesto>: tarjeta del presupuesto de una categoría (HU03-1, HU03-2, HU03-4, R5)
 * con edición dentro de la tarjeta y confirmación para quitar el límite (HU-03 REQ-05..09).
 * El estado se lee en texto; la barra tiene un patrón distinto por estado y el ícono refuerza.
 * Usa clases de components.css, sin Shadow DOM ni CSS propio. No importa la API ni el store:
 * la pantalla decide y le pasa el estado con setState().
 *
 * Propiedades:
 *   row: BudgetRow                         (obligatoria) resultado de buildBudgetRows
 *   setState({ editing, confirmingRemoval, saving, error, draft })
 * Atributos:
 *   editable                               muestra las acciones (solo en el mes en curso, R8)
 *   heading-level="2|3"                    nivel del título; por defecto 2
 * Eventos (bubbles):
 *   cc-editar-limite    { category }
 *   cc-cancelar-limite  { category }
 *   cc-guardar-limite   { category, value }  value = texto escrito
 *   cc-quitar-limite    { category }         abre la confirmación
 *   cc-confirmar-quitar { category }
 *   cc-cancelar-quitar  { category }
 * Métodos de foco:
 *   focusAction() · focusField() · focusConfirm() · focusRemove()
 */
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../models/types.js';
import { formatMoney } from '../utils/money.js';
import { esc } from '../utils/html.js';

/** @typedef {import('../logic/budget.js').BudgetRow} BudgetRow */
/** @typedef {{ editing: boolean, confirmingRemoval: boolean, saving: boolean, error: string, draft: string }} CardState */

const ICONS = /** @type {const} */ ({ NORMAL: '✓', NEAR: '⚠', REACHED: '●', EXCEEDED: '✕' });
const MODIFIER = /** @type {const} */ ({ NORMAL: '', NEAR: 'near', REACHED: 'reached', EXCEEDED: 'exceeded' });

export class CcBarraPresupuesto extends HTMLElement {
  static observedAttributes = ['editable', 'heading-level'];

  constructor() {
    super();
    /** @type {BudgetRow | null} */
    this._row = null;
    /** @type {CardState} */
    this._state = { editing: false, confirmingRemoval: false, saving: false, error: '', draft: '' };
  }

  /** @param {BudgetRow} value */
  set row(value) {
    if (value === this._row) return; // misma fila: no repintar (evita perder el foco)
    this._row = value;
    this.render();
  }

  get row() {
    return /** @type {BudgetRow} */ (this._row);
  }

  /** @param {Partial<CardState>} partial */
  setState(partial) {
    const before = this._state;
    this._state = { ...before, ...partial };
    const s = this._state;
    const same = (/** @type {keyof CardState} */ k) => before[k] === s[k];
    // draft solo llena el campo al abrir la edición o al mostrar un error: no obliga a repintar
    if (['editing', 'confirmingRemoval', 'error'].every((k) => same(/** @type {keyof CardState} */ (k)))) {
      // Solo cambió "saving" (o nada): actualizar el botón en su lugar para no perder el foco ni el anuncio
      if (!same('saving')) this._paintSaving();
      return;
    }
    this.render();
  }

  /** Actualiza "Guardando…" / "Quitando…" sin rehacer la tarjeta. */
  _paintSaving() {
    const saving = this._state.saving;
    const submit = this.querySelector('[data-form] [type="submit"]');
    if (submit) {
      submit.setAttribute('aria-disabled', String(saving));
      submit.toggleAttribute('aria-busy', saving);
      submit.textContent = saving ? 'Guardando…' : 'Guardar';
    }
    const confirm = this.querySelector('[data-action="confirm-remove"]');
    if (confirm) {
      confirm.setAttribute('aria-disabled', String(saving));
      confirm.textContent = saving ? 'Quitando…' : 'Sí, quitar';
    }
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  /** @param {string} selector */
  _focus(selector) {
    /** @type {HTMLElement | null} */ (this.querySelector(selector))?.focus();
  }

  focusAction() { this._focus('[data-action="edit-limit"]'); }
  focusField() { this._focus('[data-field="limit"]'); }
  focusConfirm() { this._focus('[data-confirm-title]'); }
  focusRemove() { this._focus('[data-action="remove"]'); }

  /**
   * @param {string} name
   * @param {Record<string, unknown>} [extra]
   */
  _emit(name, extra = {}) {
    const category = this._row?.category;
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { category, ...extra } }));
  }

  render() {
    const r = this._row;
    if (!r || !this.isConnected) return;
    const s = this._state;
    const label = CATEGORY_LABELS[r.category];
    const level = this.getAttribute('heading-level') === '3' ? 'h3' : 'h2';
    const subLevel = level === 'h3' ? 'h4' : 'h3';
    const titleId = `budget-${r.category}`;
    const editable = this.hasAttribute('editable');
    const hasLimit = r.limit !== null && r.status !== null;

    const action = editable && !s.editing
      ? `<button class="btn btn--link" type="button" data-action="edit-limit">${hasLimit ? 'Editar límite' : 'Definir límite'}<span class="visually-hidden"> de ${esc(label)}</span></button>`
      : '';

    let body;
    if (!hasLimit) {
      body = `
        <p class="budget-status budget-status--none"><span class="budget-status__icon" aria-hidden="true">○</span>Sin límite definido</p>
        <p class="field__hint">Usado en el mes: ${esc(formatMoney(r.spent))}</p>`;
    } else {
      const status = /** @type {import('../models/types.js').BudgetStatus} */ (r.status);
      const mod = MODIFIER[status];
      const exceeded = status === 'EXCEEDED';
      const percent = /** @type {number} */ (r.percent);
      body = `
        <dl class="budget-figures">
          <div><dt class="budget-figures__label">Usado</dt><dd class="budget-figures__value">${esc(formatMoney(r.spent))}</dd></div>
          <div><dt class="budget-figures__label">Límite</dt><dd class="budget-figures__value">${esc(formatMoney(/** @type {number} */ (r.limit)))}</dd></div>
          <div><dt class="budget-figures__label">${exceeded ? 'Excedido' : 'Restante'}</dt><dd class="budget-figures__value">${esc(formatMoney(/** @type {number} */ (r.remaining)))}</dd></div>
        </dl>
        <div class="budget-bar${mod ? ` budget-bar--${mod}` : ''}" role="progressbar" aria-label="Uso del presupuesto de ${esc(label)}"
             aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(percent, 100)}" aria-valuetext="${percent} % usado. ${esc(r.message)}">
          <span class="budget-bar__fill" style="--budget-value: ${percent}%"></span>
        </div>
        <div class="budget-meta">
          <p class="budget-status${mod ? ` budget-status--${mod}` : ''}"><span class="budget-status__icon" aria-hidden="true">${ICONS[status]}</span>${esc(r.message)}</p>
          <p class="budget-meta__percent">${percent} % usado</p>
        </div>`;
    }

    // REQ-05..08: edición dentro de la tarjeta
    let editor = '';
    if (editable && s.editing && !s.confirmingRemoval) {
      const fieldId = `limit-${r.category}`;
      const errorId = `${fieldId}-error`;
      editor = `
        <form class="stack stack--sm" data-form novalidate aria-label="Límite de ${esc(label)}">
          <div class="field">
            <label class="field__label" for="${fieldId}">Límite mensual de ${esc(label)}</label>
            <div class="field__money">
              <span class="field__prefix" aria-hidden="true">S/</span>
              <input class="field__control" type="text" id="${fieldId}" data-field="limit" inputmode="decimal" autocomplete="off"
                     enterkeyhint="done" value="${esc(s.draft)}" aria-describedby="${errorId}"${s.error ? ' aria-invalid="true"' : ''}>
            </div>
            <p class="field__error" id="${errorId}">${esc(s.error)}</p>
          </div>
          <div class="cluster">
            <button class="btn btn--primary" type="submit" aria-disabled="${s.saving}"${s.saving ? ' aria-busy="true"' : ''}>${s.saving ? 'Guardando…' : 'Guardar'}</button>
            <button class="btn btn--secondary" type="button" data-action="cancel">Cancelar</button>
            ${hasLimit ? `<button class="btn btn--danger" type="button" data-action="remove">Quitar límite</button>` : ''}
          </div>
        </form>`;
    }

    // REQ-09: confirmación en la página
    if (editable && s.confirmingRemoval) {
      editor = `
        <div class="confirm stack stack--sm" role="group" aria-labelledby="${titleId}-confirm">
          <${subLevel} class="confirm__title" id="${titleId}-confirm" tabindex="-1" data-confirm-title>¿Quitar el límite de ${esc(label)}?</${subLevel}>
          <p>Desde este mes ya no recibirás avisos de esta categoría.</p>
          ${s.error ? `<p class="field__error" role="alert">${esc(s.error)}</p>` : ''}
          <div class="cluster">
            <button class="btn btn--danger-solid" type="button" data-action="confirm-remove" aria-disabled="${s.saving}">${s.saving ? 'Quitando…' : 'Sí, quitar'}</button>
            <button class="btn btn--secondary" type="button" data-action="cancel-remove">Cancelar</button>
          </div>
        </div>`;
    }

    this.innerHTML = `
      <article class="card stack stack--sm" aria-labelledby="${titleId}" data-category="${r.category}">
        <div class="card__header">
          <div class="card__title-group">
            <span class="cat-icon cat-icon--${r.category}" aria-hidden="true">${CATEGORY_ICONS[r.category]}</span>
            <${level} class="card__title" id="${titleId}">${esc(label)}</${level}>
          </div>
          ${action}
        </div>
        ${body}
        ${editor}
      </article>`;

    this._wire();
  }

  _wire() {
    const on = (/** @type {string} */ sel, /** @type {() => void} */ fn) => this.querySelector(sel)?.addEventListener('click', fn);
    on('[data-action="edit-limit"]', () => this._emit('cc-editar-limite'));
    on('[data-action="cancel"]', () => this._emit('cc-cancelar-limite'));
    on('[data-action="remove"]', () => this._emit('cc-quitar-limite'));
    on('[data-action="confirm-remove"]', () => { if (!this._state.saving) this._emit('cc-confirmar-quitar'); });
    on('[data-action="cancel-remove"]', () => this._emit('cc-cancelar-quitar'));

    const form = /** @type {HTMLFormElement | null} */ (this.querySelector('[data-form]'));
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this._state.saving) return;
      const input = /** @type {HTMLInputElement} */ (form.querySelector('[data-field="limit"]'));
      this._emit('cc-guardar-limite', { value: input.value });
    });
    form?.addEventListener('keydown', (e) => { if (e.key === 'Escape') this._emit('cc-cancelar-limite'); });
    this.querySelector('.confirm')?.addEventListener('keydown', (e) => {
      if (/** @type {KeyboardEvent} */ (e).key === 'Escape') this._emit('cc-cancelar-quitar');
    });
  }
}

if (!customElements.get('cc-barra-presupuesto')) customElements.define('cc-barra-presupuesto', CcBarraPresupuesto);
