// @ts-check
/**
 * Pantalla HU-02 · Registrar, editar y eliminar un movimiento.
 * Solo conecta formulario, acciones y rutas. Las reglas viven en js/logic y la API vuelve a validarlas.
 */
import { createBrowserApi } from '../api/cuentaclara-api.js';
import { createFormActions } from '../state/transaction-form.js';
import { routes } from '../rutas.js';
import { CATEGORY_LABELS, categoriesFor } from '../models/types.js';
import { addDays, monthPeriod, currentMonth } from '../logic/period.js';
import { todayInLima } from '../utils/lima-date.js';
import { formatMoney } from '../utils/money.js';
import { esc } from '../utils/html.js';

/** @typedef {import('../models/types.js').Transaction} Transaction */
/** @typedef {import('../models/types.js').TransactionType} TransactionType */

/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

/** Orden de los campos en la página: el foco va al primero con error. */
const FIELD_ORDER = ['type', 'amount', 'date', 'category', 'description'];

export function mountRegister() {
  const today = todayInLima(new Date());
  const api = createBrowserApi();
  const actions = createFormActions(api, today);
  const id = new URLSearchParams(location.search).get('id');

  const form = /** @type {HTMLFormElement} */ ($('form'));
  const amount = /** @type {HTMLInputElement} */ ($('amount'));
  const date = /** @type {HTMLInputElement} */ ($('date'));
  const category = /** @type {HTMLSelectElement} */ ($('category'));
  const description = /** @type {HTMLTextAreaElement} */ ($('description'));
  const saveButton = /** @type {HTMLButtonElement} */ ($('save-button'));
  const notice = $('notice');
  const deleteZone = $('delete-zone');
  const deleteButton = /** @type {HTMLButtonElement} */ ($('delete-button'));
  const confirmBox = $('confirm');

  /** @returns {TransactionType} */
  const currentType = () => /** @type {TransactionType} */ (
    /** @type {HTMLInputElement | null} */ (form.querySelector('input[name="type"]:checked'))?.value ?? 'expense'
  );

  // ---------- Campos ----------

  /** [HU02-1] las categorías cambian según el tipo (R3) */
  function fillCategories() {
    const previous = category.value;
    const options = categoriesFor(currentType());
    category.innerHTML = `<option value="">Selecciona una categoría</option>${options
      .map((c) => `<option value="${c}">${esc(CATEGORY_LABELS[c])}</option>`)
      .join('')}`;
    category.value = options.includes(/** @type {any} */ (previous)) ? previous : '';
  }

  function updateCounter() {
    $('description-counter').textContent = `${description.value.trim().length}/60`;
  }

  /** @param {'create' | 'edit'} mode */
  function setDateLimits(mode) {
    date.max = today;
    // [HU02-5] al editar, solo fechas del mes en curso (R6); al registrar, hasta 60 días atrás (R2)
    const sixtyDaysAgo = addDays(today, -60);
    date.min = mode === 'edit' ? monthPeriod(currentMonth(today)).from : sixtyDaysAgo;
    $('date-hint').textContent = mode === 'edit' ? 'Al editar, la fecha debe ser de este mes.' : 'Hoy o hasta 60 días atrás.';
  }

  /** @param {Transaction} t */
  function fillForm(t) {
    /** @type {HTMLInputElement} */ ($(`type-${t.type}`)).checked = true;
    fillCategories();
    category.value = t.category;
    amount.value = t.amount.toFixed(2);
    date.value = t.date;
    description.value = t.description;
    updateCounter();
  }

  function readForm() {
    return {
      type: currentType(),
      category: category.value,
      amount: amount.value,
      date: date.value,
      description: description.value,
    };
  }

  /** [HU02-3] error junto a cada campo con aria-invalid; nunca se borra lo escrito */
  /** @param {Record<string, string>} errors */
  function paintErrors(errors) {
    for (const field of FIELD_ORDER) {
      const message = errors[field] ?? '';
      $(`${field}-error`).textContent = message;
      const control = field === 'type' ? $('type-group') : $(field);
      if (message) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');
    }
  }

  /** @param {Record<string, string>} errors */
  function focusFirstError(errors) {
    const first = FIELD_ORDER.find((f) => errors[f]);
    if (!first) return;
    const target = first === 'type' ? /** @type {HTMLElement} */ (form.querySelector('input[name="type"]')) : $(first);
    target.focus();
  }

  // ---------- Pintar desde el estado ----------

  let submitted = false;
  /** @type {string | null} */
  let lastStatus = null;

  /** @param {Readonly<import('../state/transaction-form.js').FormState>} state */
  function paint(state) {
    const editing = state.mode === 'edit';
    $('eyebrow').textContent = editing ? 'Corregir movimiento' : 'Nuevo movimiento';
    $('page-title').textContent = editing ? 'Editar movimiento' : 'Registrar';
    document.title = `${editing ? 'Editar movimiento' : 'Registrar'} · CuentaClara`;

    const blocked = ['loading', 'notFound', 'locked', 'loadError'].includes(state.status);
    form.hidden = blocked;
    deleteZone.hidden = blocked || !editing || state.status === 'deleted';

    // Mensajes que reemplazan al formulario
    if (state.status === 'loading') {
      notice.setAttribute('aria-busy', 'true');
      notice.innerHTML = '<span class="skeleton" aria-hidden="true"></span><p class="field__hint">Cargando movimiento…</p>';
    } else if (state.status === 'notFound') {
      notice.removeAttribute('aria-busy');
      notice.innerHTML = `<div class="state">
          <p class="state__title">No encontramos ese movimiento</p>
          <p>Puede que se haya eliminado.</p>
          <div class="cluster"><a class="btn btn--primary" href="${routes.transactions(monthPeriod(currentMonth(today)))}">Ver movimientos</a>
          <a class="btn btn--secondary" href="${routes.register()}">Registrar uno nuevo</a></div>
        </div>`;
    } else if (state.status === 'locked') {
      // [HU02-6] R6: de un mes anterior no se edita ni elimina
      const t = state.original;
      notice.removeAttribute('aria-busy');
      notice.innerHTML = `<div class="state">
          <p class="state__title">Este movimiento ya no se puede cambiar</p>
          <p>${t ? `${esc(t.description)} · ${esc(formatMoney(t.amount))}. ` : ''}Solo puedes editar o eliminar movimientos de este mes.</p>
          <a class="btn btn--primary" href="${routes.transactions(monthPeriod(currentMonth(today)))}">Ver movimientos</a>
        </div>`;
    } else if (state.status === 'loadError') {
      notice.removeAttribute('aria-busy');
      notice.innerHTML = `<div class="state">
          <p class="alert alert--error" role="alert">No pudimos cargar el movimiento.</p>
          <button class="btn btn--primary" type="button" data-action="retry-load">Reintentar</button>
        </div>`;
    } else if (state.status === 'saved' && state.saved) {
      // [HU02-4] confirmación y opciones para seguir
      const s = state.saved;
      notice.removeAttribute('aria-busy');
      notice.innerHTML = `<div class="alert alert--success stack stack--sm" role="status">
          <p><strong>${s.type === 'income' ? 'Ingreso' : 'Gasto'} registrado:</strong> ${esc(formatMoney(s.amount))} en ${esc(CATEGORY_LABELS[s.category])}</p>
          <div class="cluster">
            <button class="btn btn--primary" type="button" data-action="another">Registrar otro</button>
            <a class="btn btn--secondary" href="${routes.transactions(monthPeriod(currentMonth(today)))}">Ver movimientos</a>
          </div>
        </div>`;
    } else if (state.status !== 'saving') {
      notice.removeAttribute('aria-busy');
      if (lastStatus !== 'saving') notice.innerHTML = '';
    }

    // Botón Guardar
    const saving = state.status === 'saving';
    saveButton.disabled = saving || state.status === 'saved';
    saveButton.setAttribute('aria-busy', String(saving));
    saveButton.textContent = saving ? 'Guardando…' : 'Guardar';

    deleteButton.disabled = state.status === 'deleting';
    /** @type {HTMLButtonElement} */ ($('confirm-yes')).textContent = state.status === 'deleting' ? 'Eliminando…' : 'Sí, eliminar';

    $('form-failure').textContent = state.failure ?? '';
    paintErrors(state.errors);
    if (submitted && state.status === 'ready') {
      if (Object.keys(state.errors).length) focusFirstError(state.errors);
      else if (state.failure) saveButton.focus();
      submitted = false;
    }

    // Edición o eliminación terminadas: volver a la lista con aviso
    if (state.status === 'updated' && state.saved) {
      location.href = `movimientos.html?aviso=actualizado${routes.transactionsHash(monthPeriod(state.saved.date.slice(0, 7)))}`;
    }
    if (state.status === 'deleted') {
      location.href = `movimientos.html?aviso=eliminado${routes.transactionsHash(monthPeriod(currentMonth(today)))}`;
    }

    // Después de registrar: se conservan tipo y categoría; la fecha vuelve a hoy (bitácora #14)
    if (state.status === 'saved' && lastStatus !== 'saved') {
      amount.value = '';
      description.value = '';
      date.value = today;
      updateCounter();
      /** @type {HTMLElement | null} */ (notice.querySelector('[data-action="another"]'))?.focus();
    }
    lastStatus = state.status;
  }

  // ---------- Eventos ----------

  form.addEventListener('change', (e) => {
    if (/** @type {HTMLInputElement} */ (e.target).name === 'type') fillCategories();
  });
  description.addEventListener('input', updateCounter);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (actions.store.get().status === 'saving') return;
    submitted = true;
    actions.save(readForm());
  });

  notice.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target).closest('[data-action]');
    if (!target) return;
    if (target.getAttribute('data-action') === 'another') {
      actions.startAnother();
      amount.focus();
    }
    if (target.getAttribute('data-action') === 'retry-load') actions.init(id);
  });

  // [HU02-7] confirmación en la página, con gestión de foco
  /** @param {boolean} open */
  function setConfirm(open) {
    confirmBox.hidden = !open;
    deleteButton.setAttribute('aria-expanded', String(open));
    if (open) {
      const t = actions.store.get().original;
      $('confirm-detail').textContent = t ? `${t.description} · ${formatMoney(t.amount)}. Esta acción no se puede deshacer.` : '';
      $('confirm-title').focus();
    } else {
      deleteButton.focus();
    }
  }
  deleteButton.setAttribute('aria-controls', 'confirm');
  deleteButton.setAttribute('aria-expanded', 'false');
  deleteButton.addEventListener('click', () => setConfirm(true));
  $('confirm-no').addEventListener('click', () => setConfirm(false));
  confirmBox.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setConfirm(false);
  });
  $('confirm-yes').addEventListener('click', () => actions.remove());

  // ---------- Arranque ----------

  setDateLimits(id ? 'edit' : 'create');
  date.value = today;
  fillCategories();
  actions.store.subscribe((state) => {
    if (state.status === 'ready' && state.original && lastStatus === 'loading') fillForm(state.original);
    paint(state);
  });
  paint(actions.store.get());
  actions.init(id);
}
