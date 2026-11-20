// @ts-check
/**
 * Pantalla HU-01 · Movimientos del mes.
 * Es el único módulo que conoce ruta, API, store y componentes. Solo conecta: no tiene reglas de negocio ni estilos.
 * La URL manda: cada acción de la persona cambia location.hash, y hashchange carga y pinta.
 */
import '../components/cc-movimiento.js';
import { createBrowserApi } from '../api/cuentaclara-api.js';
import { createTransactionsActions } from '../state/transactions.js';
import { parseTransactionsRoute, routes } from '../rutas.js';
import { CATEGORIES, CATEGORY_LABELS } from '../models/types.js';
import { totals } from '../logic/summary.js';
import { canEdit } from '../logic/rules.js';
import { currentMonth, monthPeriod, shiftMonth, periodFromShortcut, shortcutOf, validateRange } from '../logic/period.js';
import { todayInLima, formatMonth, formatDayShort, formatDayWithYear } from '../utils/lima-date.js';
import { formatMoney } from '../utils/money.js';
import { esc } from '../utils/html.js';

/** @typedef {import('../models/types.js').Period} Period */
/** @typedef {import('../models/types.js').Category} Category */
/** @typedef {import('../components/cc-movimiento.js').CcMovimiento} CcMovimiento */

/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
/** @param {string} text */
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export function mountTransactions() {
  const today = todayInLima(new Date());
  const api = createBrowserApi();
  const actions = createTransactionsActions(api);

  const trigger = /** @type {HTMLButtonElement} */ ($('period-trigger'));
  const panel = $('period-panel');
  const rangeForm = /** @type {HTMLFormElement} */ ($('range-form'));
  const rangeFrom = /** @type {HTMLInputElement} */ ($('range-from'));
  const rangeTo = /** @type {HTMLInputElement} */ ($('range-to'));
  const listRegion = $('list-region');
  const announcer = $('announcer');

  /** Ruta vigente, leída de la URL. */
  let route = parseTransactionsRoute(location.hash, today);

  // ---------- Navegación: la URL es la fuente de verdad ----------

  /** @param {Period} period @param {Category | null} category */
  const go = (period, category) => {
    location.hash = routes.transactionsHash(period, category);
  };

  function onRouteChange() {
    route = parseTransactionsRoute(location.hash, today);
    if (route.corrected) history.replaceState(null, '', route.hash); // [HU01-1] [HU01-10] sin ensuciar el historial
    paintFilters();
    actions.load(route.period, route.category);
  }

  // ---------- Textos del período ----------

  /** @param {Period} p */
  function periodLabel(p) {
    const shortcut = shortcutOf(p, today);
    if (shortcut === 'TODAY') return 'Hoy';
    if (shortcut === 'WEEK') return 'Esta semana';
    if (shortcut === 'MONTH') return 'Este mes';
    if (p.kind === 'month') return capitalize(formatMonth(p.from.slice(0, 7)));
    if (p.kind === 'day') return formatDayWithYear(p.from);
    return `${formatDayShort(p.from)} – ${formatDayWithYear(p.to)}`;
  }

  /** @param {Period} p */
  function periodHeading(p) {
    if (p.kind === 'month') return capitalize(formatMonth(p.from.slice(0, 7)));
    if (p.kind === 'day') return formatDayWithYear(p.from);
    return `${formatDayShort(p.from)} – ${formatDayWithYear(p.to)}`;
  }

  // ---------- Pintar filtros (dependen solo de la ruta) ----------

  function paintFilters() {
    const { period, category } = route;
    $('period-eyebrow').textContent = periodHeading(period);
    $('period-value').textContent = periodLabel(period);
    document.title = `Movimientos · ${periodLabel(period)} · CuentaClara`;

    // [HU01-12] atajo activo con ✓ (CSS) y aria-pressed
    const active = shortcutOf(period, today);
    panel.querySelectorAll('[data-shortcut]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-shortcut') === active));
    });
    rangeFrom.value = period.from;
    rangeTo.value = period.to > today ? today : period.to;
    rangeFrom.max = today;
    rangeTo.max = today;

    // [HU01-6] mes anterior / siguiente; no se pasa del mes en curso
    const nav = $('month-nav');
    nav.hidden = period.kind !== 'month';
    if (period.kind === 'month') {
      const month = period.from.slice(0, 7);
      const prev = /** @type {HTMLAnchorElement} */ ($('prev-month'));
      const next = /** @type {HTMLAnchorElement} */ ($('next-month'));
      prev.href = routes.transactionsHash(monthPeriod(shiftMonth(month, -1)), category);
      if (month >= currentMonth(today)) {
        next.removeAttribute('href');
        next.setAttribute('aria-disabled', 'true');
        next.innerHTML = 'Mes siguiente →<span class="visually-hidden"> (no hay meses futuros)</span>';
      } else {
        next.href = routes.transactionsHash(monthPeriod(shiftMonth(month, 1)), category);
        next.removeAttribute('aria-disabled');
        next.textContent = 'Mes siguiente →';
      }
    }

    // [HU01-3] chips de categoría con aria-pressed
    const chips = $('category-chips');
    /** @type {(Category | null)[]} */
    const options = [null, ...CATEGORIES];
    chips.innerHTML = options
      .map((c) => `<button class="chip" type="button" data-category="${c ?? ''}" aria-pressed="${c === category}">${esc(c ? CATEGORY_LABELS[c] : 'Todas')}</button>`)
      .join('');
  }

  // ---------- Pintar datos (dependen del store) ----------

  /** @param {Readonly<import('../state/transactions.js').TransactionsState>} state */
  function paintData(state) {
    listRegion.setAttribute('aria-busy', String(state.status === 'loading'));

    if (state.status === 'loading' || state.status === 'idle') {
      // [HU01-7] carga
      listRegion.innerHTML = `
        <span class="skeleton" aria-hidden="true"></span>
        <span class="skeleton" aria-hidden="true"></span>
        <span class="skeleton" aria-hidden="true"></span>
        <p class="field__hint">Cargando movimientos…</p>`;
      paintTotals(null);
      return;
    }

    if (state.status === 'error') {
      // [HU01-9] error con Reintentar
      listRegion.innerHTML = `
        <div class="state">
          <p class="alert alert--error" role="alert">No pudimos cargar tus movimientos.</p>
          <button class="btn btn--primary" type="button" data-action="retry">Reintentar</button>
        </div>`;
      paintTotals(null);
      return;
    }

    const list = state.transactions;
    paintTotals(list);

    if (list.length === 0) {
      // [HU01-8] vacío por filtro o por período
      listRegion.innerHTML = route.category
        ? `<div class="state">
             <p class="state__title">No hay movimientos en ${esc(CATEGORY_LABELS[route.category])}</p>
             <p>Prueba con otra categoría o con otro período.</p>
             <button class="btn btn--secondary" type="button" data-action="all">Ver todas las categorías</button>
           </div>`
        : `<div class="state">
             <p class="state__title">No hay movimientos en este período</p>
             <p>Registra tu primer gasto o ingreso.</p>
             <a class="btn btn--primary" href="${routes.register()}">Registrar un movimiento</a>
           </div>`;
      announcer.textContent = 'No hay movimientos para mostrar.';
      return;
    }

    // [HU01-2] lista ordenada (la API ya ordena) con <cc-movimiento>
    const ul = document.createElement('ul');
    ul.className = 'list';
    for (const t of list) {
      const li = document.createElement('li');
      const row = /** @type {CcMovimiento} */ (document.createElement('cc-movimiento'));
      li.append(row);
      ul.append(li);
      row.transaction = t;
      row.editHref = canEdit(t, today) ? routes.edit(t.id) : null; // [HU01-11] R6
    }
    listRegion.replaceChildren(ul);
    announcer.textContent = `${list.length} ${list.length === 1 ? 'movimiento' : 'movimientos'} en ${periodLabel(route.period).toLowerCase()}.`;
  }

  /** @param {{ type: 'expense' | 'income', amount: number }[] | null} list */
  function paintTotals(list) {
    if (!list) {
      $('total-expenses').textContent = '—';
      $('total-income').textContent = '—';
      $('total-balance').textContent = '—';
      return;
    }
    const t = totals(list);
    $('total-expenses').textContent = `− ${formatMoney(t.expenses)}`;
    $('total-income').textContent = `+ ${formatMoney(t.income)}`;
    $('total-balance').textContent = `${t.balance < 0 ? '− ' : ''}${formatMoney(t.balance)}`;
  }

  // ---------- Selector de período ----------

  /** @param {boolean} open */
  function setPanel(open) {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (!open) clearRangeErrors();
  }

  /** @param {HTMLInputElement} input @param {string} [message] */
  function setFieldError(input, message) {
    const error = $(`${input.id}-error`);
    error.textContent = message ?? '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function clearRangeErrors() {
    setFieldError(rangeFrom);
    setFieldError(rangeTo);
  }

  trigger.addEventListener('click', () => setPanel(panel.hidden));

  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setPanel(false);
      trigger.focus();
    }
  });

  panel.addEventListener('click', (e) => {
    const button = /** @type {HTMLElement} */ (e.target).closest('[data-shortcut]');
    if (!button) return;
    const shortcut = /** @type {'TODAY' | 'WEEK' | 'MONTH'} */ (button.getAttribute('data-shortcut'));
    setPanel(false);
    trigger.focus();
    go(periodFromShortcut(shortcut, today), route.category);
  });

  // [HU01-13] el error aparece junto al campo y el panel sigue abierto
  rangeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const result = validateRange(rangeFrom.value, rangeTo.value, today);
    clearRangeErrors();
    if (!result.ok) {
      setFieldError(rangeFrom, result.errors.from);
      setFieldError(rangeTo, result.errors.to);
      (result.errors.from ? rangeFrom : rangeTo).focus();
      return;
    }
    setPanel(false);
    trigger.focus();
    go(result.value, route.category);
  });

  // ---------- Filtro, reintentar y vacío ----------

  $('category-chips').addEventListener('click', (e) => {
    const chip = /** @type {HTMLElement} */ (e.target).closest('[data-category]');
    if (!chip) return;
    const value = chip.getAttribute('data-category');
    go(route.period, value ? /** @type {Category} */ (value) : null);
  });

  listRegion.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target).closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    if (action === 'retry') actions.retry();
    if (action === 'all') go(route.period, null);
  });

  // ---------- Arranque ----------

  actions.store.subscribe(paintData);
  window.addEventListener('hashchange', onRouteChange);
  paintData(actions.store.get());
  onRouteChange();
}
