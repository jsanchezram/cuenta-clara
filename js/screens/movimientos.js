// @ts-check
/**
 * Pantalla HU-01 · Movimientos del mes.
 * Es el único módulo que conoce ruta, API, store y componentes. Solo conecta: no tiene reglas de negocio ni estilos.
 * La URL manda: cada acción de la persona cambia location.hash, y hashchange carga y pinta.
 */
import '../components/business/cc-movimiento.js';
import '../components/ui/cc-calendario-rango.js';
import { createBrowserApi } from '../api/cuentaclara-api.js';
import { createTransactionsActions } from '../state/transactions.js';
import { parseTransactionsRoute, routes } from '../rutas.js';
import { CATEGORIES, CATEGORY_LABELS } from '../models/types.js';
import { totals } from '../logic/summary.js';
import { canEdit } from '../logic/rules.js';
import { periodFromShortcut, periodUnit, shortcutOf, validateRange } from '../logic/period.js';
import { addDays, todayInLima, formatMonth, formatDayShort, formatDayWithYear, isValidDate } from '../utils/lima-date.js';
import { formatMoney } from '../utils/money.js';
import { esc } from '../utils/html.js';
import { watchHeader } from '../components/ui/sticky-header.js';

/** @typedef {import('../models/types.js').Period} Period */
/** @typedef {import('../models/types.js').Category} Category */
/** @typedef {import('../models/types.js').Transaction} Transaction */
/** @typedef {import('../components/business/cc-movimiento.js').CcMovimiento} CcMovimiento */
/** @typedef {import('../components/ui/cc-calendario-rango.js').CcCalendarioRango} CcCalendarioRango */

/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
/** @param {string} text */
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** Movimientos por tanda: la lista no crece sin fin ("Cargar más"). */
const PAGE_SIZE = 8;

/** @type {Record<string, string>} */
const SHORTCUT_LABELS = { TODAY: 'Hoy', WEEK: 'Esta semana', MONTH: 'Este mes', PREV_MONTH: 'Mes anterior' };

export function mountTransactions() {
  const today = todayInLima(new Date());
  watchHeader({ today });
  const api = createBrowserApi();
  const actions = createTransactionsActions(api);

  const trigger = /** @type {HTMLButtonElement} */ ($('period-trigger'));
  const sheet = /** @type {HTMLDialogElement} */ ($('period-sheet'));
  const rangeForm = /** @type {HTMLFormElement} */ ($('range-form'));
  const rangeFrom = /** @type {HTMLInputElement} */ ($('range-from'));
  const rangeTo = /** @type {HTMLInputElement} */ ($('range-to'));
  const calendar = /** @type {CcCalendarioRango} */ ($('range-calendar'));
  const listRegion = $('list-region');
  const announcer = $('announcer');
  /**
   * Aviso al volver de editar o eliminar. Se anuncia junto con el primer resultado de la lista, por la región
   * viva que existe desde la carga: un role="status" creado ya con su texto puede no leerse.
   */
  let pendingNotice = '';
  /** @param {string} text */
  const withNotice = (text) => {
    const full = pendingNotice ? `${pendingNotice} ${text}` : text;
    pendingNotice = '';
    return full;
  };

  /** Ruta vigente, leída de la URL. */
  let route = parseTransactionsRoute(location.hash, today);
  /** Movimientos del período (todos) y cuántos se muestran. */
  /** @type {Transaction[]} */
  let currentList = [];
  let visibleCount = PAGE_SIZE;

  // ---------- Navegación: la URL es la fuente de verdad ----------

  /** @param {Period} period @param {Category | null} category */
  const go = (period, category) => {
    location.hash = routes.transactionsHash(period, category);
  };

  function onRouteChange() {
    route = parseTransactionsRoute(location.hash, today);
    if (route.corrected) history.replaceState(null, '', route.hash); // [HU01-1] [HU01-10] sin ensuciar el historial
    visibleCount = PAGE_SIZE;
    paintFilters();
    actions.load(route.period, route.category);
  }

  // ---------- Textos del período ----------

  /** @param {Period} p */
  function periodLabel(p) {
    const shortcut = shortcutOf(p, today);
    if (shortcut) return SHORTCUT_LABELS[shortcut];
    const unit = periodUnit(p);
    if (unit === 'month') return capitalize(formatMonth(p.from.slice(0, 7)));
    if (unit === 'day') return p.from === addDays(today, -1) ? 'Ayer' : capitalize(formatDayWithYear(p.from));
    if (unit === 'week') return `Semana del ${formatDayShort(p.from)}`;
    return 'Rango personalizado';
  }

  /** "1 – 30 nov 2026", "18 nov 2026" o "28 oct – 5 nov 2026" @param {Period} p */
  function periodRange(p) {
    if (p.from === p.to) return formatDayWithYear(p.from);
    const sameMonth = p.from.slice(0, 7) === p.to.slice(0, 7);
    return `${sameMonth ? Number(p.from.slice(8, 10)) : formatDayShort(p.from)} – ${formatDayWithYear(p.to)}`;
  }

  // ---------- Pintar filtros (dependen solo de la ruta) ----------

  function paintFilters() {
    const { period, category } = route;
    $('period-value').textContent = periodLabel(period);
    $('period-range').textContent = periodRange(period);
    document.title = `Movimientos · ${periodLabel(period)} · CuentaClara`;

    // [HU01-12] atajo activo con aria-pressed (relleno sólido y texto más grueso en CSS)
    const active = shortcutOf(period, today);
    sheet.querySelectorAll('[data-shortcut]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-shortcut') === active));
    });

    // [HU01-3] los chips se crean una vez; aquí solo cambia aria-pressed para no perder el foco
    $('category-chips').querySelectorAll('[data-category]').forEach((chip) => {
      chip.setAttribute('aria-pressed', String((chip.getAttribute('data-category') || null) === category));
    });
  }

  function buildChips() {
    /** @type {(Category | null)[]} */
    const options = [null, ...CATEGORIES];
    $('category-chips').innerHTML = options
      .map((c) => `<button class="chip" type="button" data-category="${c ?? ''}" aria-pressed="false">${esc(c ? CATEGORY_LABELS[c] : 'Todas')}</button>`)
      .join('');
  }

  /** Tras reemplazar la región de la lista, el foco vuelve a un lugar estable en vez de perderse. */
  let focusAfterLoad = false;
  function restoreFocus() {
    if (!focusAfterLoad) return;
    focusAfterLoad = false;
    $('list-title').focus();
  }

  // ---------- Pintar datos (dependen del store) ----------

  /**
   * Agrega una fila al final de la lista. Las propiedades se asignan después de conectar la fila.
   * @param {HTMLUListElement} ul
   * @param {Transaction} t
   */
  function appendRow(ul, t) {
    const li = document.createElement('li');
    const row = /** @type {CcMovimiento} */ (document.createElement('cc-movimiento'));
    li.append(row);
    ul.append(li);
    row.transaction = t;
    row.editHref = canEdit(t, today) ? routes.edit(t.id) : null; // [HU01-11] R6
    return li;
  }

  /** Contador y botón "Cargar más" debajo de la lista. */
  function paintMore() {
    const more = $('list-more');
    const total = currentList.length;
    const shown = Math.min(visibleCount, total);
    if (shown < total) {
      more.innerHTML = `<p class="list-more__count">Mostrando ${shown} de ${total}</p>
        <button class="btn btn--tonal btn--block" type="button" data-action="more">Cargar más</button>`;
    } else {
      more.innerHTML = total > PAGE_SIZE ? `<p class="list-more__count">Mostrando los ${total} movimientos</p>` : '';
    }
  }

  /** @param {Readonly<import('../state/transactions.js').TransactionsState>} state */
  function paintData(state) {
    listRegion.setAttribute('aria-busy', String(state.status === 'loading'));

    if (state.status === 'loading' || state.status === 'idle') {
      // [HU01-7] carga; se vacía el anuncio para que el siguiente se lea aunque repita el texto
      announcer.textContent = '';
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
      restoreFocus();
      return;
    }

    const list = state.transactions;
    currentList = list;
    paintTotals(list); // los totales siempre son del período completo, no solo de lo visible

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
      announcer.textContent = withNotice('No hay movimientos para mostrar.');
      restoreFocus();
      return;
    }

    // [HU01-2] lista ordenada (la API ya ordena) con <cc-movimiento>, por tandas
    const ul = document.createElement('ul');
    ul.className = 'list';
    const more = document.createElement('div');
    more.className = 'list-more';
    more.id = 'list-more';
    listRegion.replaceChildren(ul, more);
    for (const t of list.slice(0, visibleCount)) appendRow(ul, t);
    paintMore();
    announcer.textContent = withNotice(`${list.length} ${list.length === 1 ? 'movimiento' : 'movimientos'} en ${periodLabel(route.period).toLowerCase()}.`);
    restoreFocus();
  }

  /** Muestra la siguiente tanda y lleva el foco a la primera fila nueva. */
  function loadMore() {
    const ul = /** @type {HTMLUListElement | null} */ (listRegion.querySelector('ul.list'));
    if (!ul) return;
    const start = visibleCount;
    visibleCount += PAGE_SIZE;
    const added = currentList.slice(start, visibleCount).map((t) => appendRow(ul, t));
    paintMore();
    announcer.textContent = `Mostrando ${Math.min(visibleCount, currentList.length)} de ${currentList.length} movimientos.`;
    const first = added[0];
    if (!first) return;
    const link = /** @type {HTMLElement | null} */ (first.querySelector('a'));
    if (link) {
      link.focus();
    } else {
      first.tabIndex = -1;
      first.focus();
    }
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

  // ---------- Hoja del período (diálogo modal sobre la pantalla) ----------

  /** @param {HTMLInputElement} input @param {string} [message] */
  function setFieldError(input, message) {
    $(`${input.id}-error`).textContent = message ?? '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function clearRangeErrors() {
    setFieldError(rangeFrom);
    setFieldError(rangeTo);
  }

  function openSheet() {
    const { period } = route;
    rangeFrom.max = today;
    rangeTo.max = today;
    rangeFrom.value = period.from;
    rangeTo.value = period.to > today ? today : period.to;
    calendar.today = today;
    calendar.value = { from: rangeFrom.value, to: rangeTo.value };
    clearRangeErrors();
    sheet.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    /** @type {HTMLElement | null} */ (
      sheet.querySelector('[data-shortcut][aria-pressed="true"]') ?? sheet.querySelector('[data-shortcut]')
    )?.focus();
  }

  trigger.addEventListener('click', openSheet);

  /**
   * Cerrar (Cancelar, ✕, Escape, tocar el fondo, elegir un atajo o aplicar) siempre pasa por aquí:
   * actualiza aria-expanded, limpia errores y devuelve el foco al botón. No depende del evento
   * "close" del diálogo, que no siempre llega a tiempo.
   */
  function closeSheet() {
    if (sheet.open) sheet.close();
    trigger.setAttribute('aria-expanded', 'false');
    clearRangeErrors();
    trigger.focus();
  }

  // Escape: el diálogo dispara "cancel"; se cierra con la misma función
  sheet.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeSheet();
  });

  sheet.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target === sheet || target.closest('[data-close]')) {
      closeSheet();
      return;
    }
    const button = target.closest('[data-shortcut]');
    if (button) {
      const shortcut = /** @type {import('../logic/period.js').PeriodShortcut} */ (button.getAttribute('data-shortcut'));
      go(periodFromShortcut(shortcut, today), route.category);
      closeSheet();
    }
  });

  // El calendario llena Desde/Hasta; escribir una fecha válida actualiza el calendario
  calendar.addEventListener('cc-cambiar-rango', (e) => {
    const { from, to } = /** @type {CustomEvent<{ from: string, to: string }>} */ (e).detail;
    rangeFrom.value = from;
    rangeTo.value = to;
    clearRangeErrors();
  });

  for (const input of [rangeFrom, rangeTo]) {
    input.addEventListener('change', () => {
      const [from, to] = [rangeFrom.value, rangeTo.value];
      if (isValidDate(from) && isValidDate(to) && from <= to && to <= today) calendar.value = { from, to };
    });
  }

  // [HU01-13] el error aparece junto al campo y la hoja sigue abierta
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
    go(result.value, route.category);
    closeSheet();
  });

  // ---------- Filtro, reintentar, vacío y "Cargar más" ----------

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
    if (action === 'retry') {
      focusAfterLoad = true; // el botón desaparece al recargar
      actions.retry();
    }
    if (action === 'all') {
      go(route.period, null);
      /** @type {HTMLElement | null} */ ($('category-chips').querySelector('[data-category=""]'))?.focus();
    }
    if (action === 'more') loadMore();
  });

  // ---------- Aviso al volver de registrar.html (?aviso=actualizado|eliminado) ----------

  const NOTICES = /** @type {Record<string, string>} */ ({ actualizado: 'Movimiento actualizado.', eliminado: 'Movimiento eliminado.' });
  const flash = NOTICES[new URLSearchParams(location.search).get('aviso') ?? ''];
  if (flash) {
    // Visible aquí; el lector de pantalla lo oye con el primer anuncio de la lista (withNotice)
    $('flash').innerHTML = `<p class="alert alert--success">${esc(flash)}</p>`;
    pendingNotice = flash;
    history.replaceState(null, '', location.pathname + location.hash); // el aviso no se repite al recargar
  }

  // ---------- Arranque ----------

  buildChips();
  actions.store.subscribe(paintData);
  window.addEventListener('hashchange', onRouteChange);
  paintData(actions.store.get());
  onRouteChange();
}
