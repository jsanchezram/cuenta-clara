// @ts-check
/**
 * <cc-barra-presupuesto>: tarjeta del presupuesto de una categoría (HU03-1, HU03-2, HU03-4, R5)
 * con edición dentro de la tarjeta y confirmación para quitar el límite (HU-03 REQ-05..09).
 * Fila compacta, con la misma estructura que la de un movimiento: ícono · nombre con "S/ usado de S/ límite"
 * debajo · porcentaje · ›. Abajo, la barra sólida y el estado en texto con un puntito.
 * Toda la fila es el botón de editar. El texto dice el estado; el color refuerza.
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
import { CATEGORY_LABELS } from '../../models/types.js';
import { formatMoney } from '../../utils/money.js';
import { esc } from '../../utils/html.js';
import { icon } from '../ui/icons.js';

/** @typedef {import('../../logic/budget.js').BudgetRow} BudgetRow */
/** @typedef {{ editing: boolean, confirmingRemoval: boolean, saving: boolean, error: string, draft: string }} CardState */

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

    const showAction = editable && !s.editing && !s.confirmingRemoval;
    // Toda la fila es el botón de editar ("enlace estirado"): objetivo grande y sin texto subrayado
    const action = showAction
      ? `<button class="budget-row__action" type="button" data-action="edit-limit" aria-describedby="${titleId}-status"><span class="visually-hidden">${hasLimit ? 'Editar límite' : 'Definir límite'} de ${esc(label)}</span></button>`
      : '';
    const chevron = showAction ? icon('chevron-right', 'icon budget-row__chevron') : '';

    let figures;
    let bar = '';
    let status;
    let percentText = '';
    if (!hasLimit) {
      figures = `<span class="budget-row__money budget-row__spent">${esc(formatMoney(r.spent))}</span> usados`;
      status = `<p class="budget-status budget-status--none" id="${titleId}-status"><span class="budget-status__dot" aria-hidden="true"></span>Sin límite definido</p>`;
    } else {
      const st = /** @type {import('../../models/types.js').BudgetStatus} */ (r.status);
      const mod = MODIFIER[st];
      const percent = /** @type {number} */ (r.percent);
      const remaining = /** @type {number} */ (r.remaining);
      // "Lo que queda" siempre visible (HU03-1): en NEAR y REACHED el mensaje de R5 no lo dice
      const detail = st === 'NEAR' || st === 'REACHED' ? ` · Quedan ${formatMoney(remaining)}` : '';
      figures = `<span class="budget-row__money budget-row__spent">${esc(formatMoney(r.spent))}</span> de <span class="budget-row__money">${esc(formatMoney(/** @type {number} */ (r.limit)))}</span>`;
      bar = `<div class="budget-bar${mod ? ` budget-bar--${mod}` : ''}" role="progressbar" aria-label="Uso del presupuesto de ${esc(label)}"
             aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(percent, 100)}" aria-valuetext="${percent} % usado. ${esc(r.message)}">
          <span class="budget-bar__fill" style="--budget-value: ${percent}%"></span>
        </div>`;
      status = `<p class="budget-status${mod ? ` budget-status--${mod}` : ''}" id="${titleId}-status"><span class="budget-status__dot" aria-hidden="true"></span>${esc(r.message + detail)}</p>`;
      percentText = `<span class="budget-row__percent">${percent} %</span>`;
    }

    // REQ-05..08: edición dentro de la tarjeta
    let editor = '';
    if (editable && s.editing && !s.confirmingRemoval) {
      const fieldId = `limit-${r.category}`;
      const errorId = `${fieldId}-error`;
      editor = `
        <form class="stack stack--sm" data-form novalidate aria-label="Límite de ${esc(label)}">
          <div class="field">
            <label class="field__label" for="${fieldId}">Límite mensual de ${esc(label)} (S/)</label>
            <input class="field__control" type="text" id="${fieldId}" data-field="limit" inputmode="decimal" autocomplete="off"
                   enterkeyhint="done" placeholder="0.00" value="${esc(s.draft)}" aria-describedby="${errorId}"${s.error ? ' aria-invalid="true"' : ''}>
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
      <article class="budget-row" aria-labelledby="${titleId}" data-category="${r.category}">
        <span class="cat-icon">${icon(r.category)}</span>
        <div class="budget-row__main">
          <div class="budget-row__head">
            <div class="budget-row__text">
              <${level} class="budget-row__title" id="${titleId}">${esc(label)}</${level}>
              <p class="budget-row__figures">${figures}</p>
            </div>
            ${percentText}
            ${chevron}
          </div>
          ${bar}
          ${status}
          ${editor}
        </div>
        ${action}
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
