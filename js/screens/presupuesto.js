// @ts-check
/**
 * Pantalla HU-03 · Presupuesto por categoría (specs/hu-03).
 * Solo conecta ruta, acciones, store y componente; las reglas viven en js/logic.
 * La URL manda el mes (#/AAAA-MM); solo el mes en curso es editable (R8).
 */
import '../components/cc-barra-presupuesto.js';
import { createBrowserApi } from '../api/cuentaclara-api.js';
import { createBudgetActions } from '../state/budget.js';
import { parseBudgetRoute } from '../rutas.js';
import { currentMonth, shiftMonth } from '../logic/period.js';
import { todayInLima, formatMonth } from '../utils/lima-date.js';
import { esc } from '../utils/html.js';
import { formatMoney } from '../utils/money.js';

/** @typedef {import('../components/cc-barra-presupuesto.js').CcBarraPresupuesto} Card */
/** @typedef {import('../state/budget.js').BudgetState} BudgetState */
/** @typedef {import('../models/types.js').ExpenseCategory} ExpenseCategory */

/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
/** @param {string} text */
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export function mountBudget() {
  const today = todayInLima(new Date());
  const thisMonth = currentMonth(today);
  const actions = createBudgetActions(createBrowserApi());
  const cardsRegion = $('cards');
  const announcer = $('announcer');

  /** Tarjetas creadas para el mes actual, por categoría (se reutilizan para no perder el foco). */
  /** @type {Map<ExpenseCategory, Card>} */
  let cards = new Map();
  /** @type {Readonly<BudgetState> | null} */
  let previous = null;
  let focusTitleAfterLoad = false;
  /** Primero se ven las categorías más urgentes; el resto con "Ver más". */
  const CARD_PAGE = 4;
  let showAll = false;
  /** @type {ExpenseCategory[]} */
  let currentOrder = [];

  // ---------- Ruta (REQ-01, REQ-10) ----------

  function onRouteChange() {
    const route = parseBudgetRoute(location.hash, today);
    if (route.corrected) history.replaceState(null, '', route.hash);
    showAll = false;
    paintMonth(route.month);
    actions.load(route.month);
  }

  /**
   * Barra ‹ mes › compacta. Los enlaces se actualizan en su lugar (no se recrean) para no perder el foco.
   * @param {string} month
   */
  function paintMonth(month) {
    const label = capitalize(formatMonth(month));
    $('month-label').textContent = label;
    document.title = `Presupuesto · ${label} · CuentaClara`;
    $('readonly-note').hidden = month === thisMonth;
    const prev = /** @type {HTMLAnchorElement} */ ($('prev-month'));
    const next = /** @type {HTMLAnchorElement} */ ($('next-month'));
    prev.href = `#/${shiftMonth(month, -1)}`;
    const atCurrent = month >= thisMonth;
    if (atCurrent && document.activeElement === next) prev.focus();
    next.hidden = atCurrent;
    $('next-month-off').hidden = !atCurrent;
    if (!atCurrent) next.href = `#/${shiftMonth(month, 1)}`;
  }

  // ---------- Pintar desde el estado ----------

  /** @param {Readonly<BudgetState>} state */
  function paint(state) {
    cardsRegion.setAttribute('aria-busy', String(state.status === 'loading'));

    if (state.status === 'loading' || state.status === 'idle') {
      // REQ-11: carga
      announcer.textContent = '';
      cards = new Map();
      cardsRegion.innerHTML = `
        <span class="skeleton" aria-hidden="true"></span>
        <span class="skeleton" aria-hidden="true"></span>
        <span class="skeleton" aria-hidden="true"></span>
        <p class="field__hint">Cargando presupuesto…</p>`;
      paintSummary(null);
      $('cards-more').innerHTML = '';
      previous = state;
      return;
    }

    if (state.status === 'error') {
      // REQ-11: error con Reintentar
      cards = new Map();
      cardsRegion.innerHTML = `
        <div class="state">
          <p class="alert alert--error" role="alert">No pudimos cargar tu presupuesto.</p>
          <button class="btn btn--primary" type="button" data-action="retry">Reintentar</button>
        </div>`;
      paintSummary(null);
      $('cards-more').innerHTML = '';
      if (focusTitleAfterLoad) { focusTitleAfterLoad = false; $('cards-title').focus(); }
      previous = state;
      return;
    }

    // REQ-04: resumen
    paintSummary(state.summary);

    // REQ-02, REQ-03: una tarjeta por categoría, en el orden por urgencia del store
    const editable = state.month === thisMonth;
    if (cards.size === 0) cardsRegion.innerHTML = '';
    const order = state.rows.map((r) => r.category);
    const currentOrder = [...cardsRegion.children].map((el) => /** @type {Card} */ (el).row?.category);
    for (const row of state.rows) {
      let card = cards.get(row.category);
      if (!card) {
        card = /** @type {Card} */ (document.createElement('cc-barra-presupuesto'));
        card.setAttribute('heading-level', '3');
        cards.set(row.category, card);
      }
      card.toggleAttribute('editable', editable);
      card.row = row;
      card.setState({
        editing: state.editing === row.category,
        confirmingRemoval: state.confirmingRemoval === row.category,
        saving: state.saving === row.category,
        error: state.error?.category === row.category ? state.error.message : '',
        draft: state.editing === row.category ? state.draft : '',
      });
    }
    if (order.join() !== currentOrder.join()) cardsRegion.append(...order.map((c) => /** @type {Card} */ (cards.get(c))));
    paintMore(state, order);

    announce(state);
    manageFocus(state);
    previous = state;
  }

  /**
   * REQ-04: número principal (gastado de lo presupuestado) y el aviso debajo.
   * El texto completo de budgetSummary se anuncia en la región viva.
   * @param {BudgetState['summary']} summary
   */
  function paintSummary(summary) {
    const amount = $('summary-amount');
    const attention = $('summary-attention');
    if (!summary) {
      amount.textContent = '—';
      attention.textContent = '';
      return;
    }
    if (summary.limit === 0) {
      $('summary-label').textContent = 'Aún no defines límites este mes';
      amount.textContent = 'Define uno para recibir avisos.';
      attention.textContent = '';
      return;
    }
    $('summary-label').textContent = 'Gastaste en categorías con límite';
    amount.innerHTML = `<span class="budget-summary__spent">${esc(formatMoney(summary.spent))}</span> de ${esc(formatMoney(summary.limit))}`;
    attention.className = `budget-summary__attention${summary.attention === 0 ? ' budget-summary__attention--ok' : ''}`;
    attention.textContent = summary.attention === 0
      ? '✓ Todo bajo control'
      : `⚠ ${summary.attention} ${summary.attention === 1 ? 'categoría necesita' : 'categorías necesitan'} atención`;
  }

  /**
   * Muestra las CARD_PAGE más urgentes y el botón "Ver más". Si hay que editar o enfocar
   * una tarjeta escondida, se muestran todas para no perder el foco.
   * @param {Readonly<BudgetState>} state
   * @param {ExpenseCategory[]} order
   */
  function paintMore(state, order) {
    currentOrder = order;
    const index = (/** @type {ExpenseCategory | null} */ c) => (c ? order.indexOf(c) : -1);
    if ([state.editing, state.confirmingRemoval, state.focusTarget].some((c) => index(c) >= CARD_PAGE)) showAll = true;
    order.forEach((c, i) => { /** @type {Card} */ (cards.get(c)).hidden = !showAll && i >= CARD_PAGE; });
    const hiddenCount = showAll ? 0 : Math.max(0, order.length - CARD_PAGE);
    $('cards-more').innerHTML = hiddenCount
      ? `<button class="btn btn--secondary" type="button" data-action="more">Ver ${hiddenCount} ${hiddenCount === 1 ? 'categoría' : 'categorías'} más</button>`
      : '';
  }

  $('cards-more').addEventListener('click', (e) => {
    if (!/** @type {HTMLElement} */ (e.target).closest('[data-action="more"]')) return;
    showAll = true;
    const firstHidden = currentOrder[CARD_PAGE];
    currentOrder.forEach((c) => { /** @type {Card} */ (cards.get(c)).hidden = false; });
    $('cards-more').innerHTML = '';
    const card = firstHidden ? cards.get(firstHidden) : undefined;
    if (card) {
      card.tabIndex = -1;
      card.focus();
    }
  });

  /** @param {Readonly<BudgetState>} state */
  function announce(state) {
    if (previous?.status === 'loading' && state.summary) announcer.textContent = state.summary.text;
    if (state.notice && state.notice !== previous?.notice) announcer.textContent = state.notice;
  }

  /** REQ-05, REQ-07, REQ-09, D6: el foco sigue a la tarjeta aunque cambie de lugar. */
  /** @param {Readonly<BudgetState>} state */
  function manageFocus(state) {
    const card = (/** @type {ExpenseCategory | null} */ c) => (c ? cards.get(c) : undefined);
    if (focusTitleAfterLoad && previous?.status === 'loading') {
      focusTitleAfterLoad = false;
      $('cards-title').focus();
      return;
    }
    if (!previous) return;
    if (state.confirmingRemoval && state.confirmingRemoval !== previous.confirmingRemoval) return card(state.confirmingRemoval)?.focusConfirm();
    if (!state.confirmingRemoval && previous.confirmingRemoval && state.editing === previous.confirmingRemoval) return card(state.editing)?.focusRemove();
    if (state.editing && state.editing !== previous.editing) return card(state.editing)?.focusField();
    if (state.error && state.error !== previous.error) {
      return state.confirmingRemoval ? card(state.error.category)?.focusConfirm() : card(state.error.category)?.focusField();
    }
    if (state.focusTarget && state.focusTarget !== previous.focusTarget) return card(state.focusTarget)?.focusAction();
  }

  // ---------- Eventos de las tarjetas (datos abajo, eventos arriba) ----------

  /** @param {Event} e */
  const categoryOf = (e) => /** @type {ExpenseCategory} */ (/** @type {CustomEvent} */ (e).detail.category);
  cardsRegion.addEventListener('cc-editar-limite', (e) => actions.startEdit(categoryOf(e)));
  cardsRegion.addEventListener('cc-cancelar-limite', () => actions.cancelEdit());
  cardsRegion.addEventListener('cc-guardar-limite', (e) => actions.saveLimit(categoryOf(e), /** @type {CustomEvent} */ (e).detail.value));
  cardsRegion.addEventListener('cc-quitar-limite', (e) => actions.askRemove(categoryOf(e)));
  cardsRegion.addEventListener('cc-cancelar-quitar', () => actions.cancelRemove());
  cardsRegion.addEventListener('cc-confirmar-quitar', (e) => actions.removeLimit(categoryOf(e)));
  cardsRegion.addEventListener('click', (e) => {
    if (/** @type {HTMLElement} */ (e.target).closest('[data-action="retry"]')) {
      focusTitleAfterLoad = true; // el botón desaparece al recargar
      actions.retry();
    }
  });

  // ---------- Arranque ----------

  actions.store.subscribe(paint);
  window.addEventListener('hashchange', onRouteChange);
  paint(actions.store.get());
  onRouteChange();
}
