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
import { todayInLima, formatDayWithYear } from '../utils/lima-date.js';
import '../components/cc-calendario-rango.js';
import { formatMoney } from '../utils/money.js';
import { esc } from '../utils/html.js';
import { watchHeader } from '../components/sticky-header.js';
import { icon } from '../components/icons.js';

/** @typedef {import('../models/types.js').Transaction} Transaction */
/** @typedef {import('../models/types.js').TransactionType} TransactionType */
/** @typedef {import('../components/cc-calendario-rango.js').CcCalendarioRango} CcCalendarioRango */

/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

/** Orden de los campos en la página: el foco va al primero con error. */
const FIELD_ORDER = ['type', 'amount', 'category', 'date', 'description'];

export function mountRegister() {
  const today = todayInLima(new Date());
  watchHeader({ today });
  const api = createBrowserApi();
  const actions = createFormActions(api, today);
  const id = new URLSearchParams(location.search).get('id');

  const form = /** @type {HTMLFormElement} */ ($('form'));
  const amount = /** @type {HTMLInputElement} */ ($('amount'));
  const date = /** @type {HTMLInputElement} */ ($('date')); // valor oculto YYYY-MM-DD
  const dateTrigger = /** @type {HTMLButtonElement} */ ($('date-trigger'));
  const dateSheet = /** @type {HTMLDialogElement} */ ($('date-sheet'));
  const dateCalendar = /** @type {CcCalendarioRango} */ ($('date-calendar'));
  let minDate = addDays(today, -60);
  const categoryOptions = $('category-options');
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

  /** @returns {HTMLInputElement[]} */
  const categoryRadios = () => [...form.querySelectorAll('input[name="category"]')].map((el) => /** @type {HTMLInputElement} */ (el));
  const selectedCategory = () => categoryRadios().find((r) => r.checked)?.value ?? '';

  /**
   * [HU02-1] las categorías cambian según el tipo (R3).
   * Mosaico de radios nativos con ícono: un toque, sin desplegable que se salga de la pantalla a 360 px.
   */
  function fillCategories() {
    const previous = selectedCategory();
    categoryOptions.innerHTML = categoriesFor(currentType())
      .map((c) => `<input class="tile__input" type="radio" name="category" id="category-${c}" value="${c}" aria-describedby="category-error"${c === previous ? ' checked' : ''}>
        <label class="tile" for="category-${c}">${icon(c)}<span>${esc(CATEGORY_LABELS[c])}</span></label>`)
      .join('');
  }

  function updateCounter() {
    $('description-counter').textContent = `${description.value.trim().length}/60`;
  }

  /** @param {'create' | 'edit'} mode */
  function setDateLimits(mode) {
    // [HU02-5] al editar, solo fechas del mes en curso (R6); al registrar, hasta 60 días atrás (R2)
    const sixtyDaysAgo = addDays(today, -60);
    minDate = mode === 'edit' ? monthPeriod(currentMonth(today)).from : sixtyDaysAgo;
    dateCalendar.today = today;
    dateCalendar.min = minDate;
    $('date-hint').textContent = mode === 'edit' ? 'Al editar, la fecha debe ser de este mes.' : 'Hoy o hasta 60 días atrás.';
  }

  /** @param {Transaction} t */
  function fillForm(t) {
    /** @type {HTMLInputElement} */ ($(`type-${t.type}`)).checked = true;
    fillCategories();
    const radio = /** @type {HTMLInputElement | null} */ (document.getElementById(`category-${t.category}`));
    if (radio) radio.checked = true;
    amount.value = t.amount.toFixed(2);
    setDate(t.date);
    description.value = t.description;
    updateCounter();
  }

  function readForm() {
    return {
      type: currentType(),
      category: selectedCategory(),
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
      // En los grupos de radios (Tipo y Categoría), aria-invalid va en cada radio (no aplica a un fieldset)
      const group = field === 'type' || field === 'category';
      const controls = group ? [...form.querySelectorAll(`input[name="${field}"]`)] : [field === 'date' ? dateTrigger : $(field)];
      for (const control of controls) {
        if (message) control.setAttribute('aria-invalid', 'true');
        else control.removeAttribute('aria-invalid');
      }
    }
  }

  /** @param {Record<string, string>} errors */
  function focusFirstError(errors) {
    const first = FIELD_ORDER.find((f) => errors[f]);
    if (!first) return;
    const target = first === 'type' || first === 'category'
      ? /** @type {HTMLElement | null} */ (form.querySelector(`input[name="${first}"]:checked`) ?? form.querySelector(`input[name="${first}"]`))
      : first === 'date' ? dateTrigger : $(first);
    target?.focus();
  }

  // ---------- Fecha: botón que abre la hoja con atajos y calendario (misma línea que Movimientos) ----------

  /** @param {string} value YYYY-MM-DD */
  function setDate(value) {
    date.value = value;
    const day = formatDayWithYear(value);
    $('date-value').textContent = value === today ? `Hoy · ${day}` : value === addDays(today, -1) ? `Ayer · ${day}` : day;
  }

  function openDateSheet() {
    dateCalendar.value = { from: date.value, to: date.value };
    dateSheet.querySelectorAll('[data-day]').forEach((b) => {
      const day = addDays(today, Number(b.getAttribute('data-day')));
      b.setAttribute('aria-pressed', String(day === date.value));
      /** @type {HTMLButtonElement} */ (b).disabled = day < minDate; // al editar el día 1, "Ayer" ya es otro mes (R6)
    });
    dateSheet.showModal();
    dateTrigger.setAttribute('aria-expanded', 'true');
    /** @type {HTMLElement | null} */ (dateSheet.querySelector('[data-day][aria-pressed="true"]') ?? dateSheet.querySelector('[data-day]'))?.focus();
  }

  /** Cierra la hoja de fecha y devuelve el foco al campo (sin depender del evento "close"). */
  function closeDateSheet() {
    if (dateSheet.open) dateSheet.close();
    dateTrigger.setAttribute('aria-expanded', 'false');
    dateTrigger.focus();
  }

  dateTrigger.addEventListener('click', openDateSheet);
  dateSheet.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeDateSheet();
  });
  dateSheet.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target === dateSheet || target.closest('[data-close]')) {
      closeDateSheet();
      return;
    }
    const option = /** @type {HTMLButtonElement | null} */ (target.closest('[data-day]'));
    if (option && !option.disabled) {
      setDate(addDays(today, Number(option.getAttribute('data-day'))));
      closeDateSheet();
    }
  });
  dateCalendar.addEventListener('cc-elegir-fecha', (e) => {
    setDate(/** @type {CustomEvent<{ date: string }>} */ (e).detail.date);
    closeDateSheet();
  });

  /**
   * Título: al crear sigue al tipo ("Nuevo gasto" / "Nuevo ingreso"); al editar es fijo, "Editar movimiento"
   * (HU02-5), para que no cambie cuando termina de cargar.
   */
  function paintTitle() {
    const editing = actions.store.get().mode === 'edit';
    const [verb, noun] = editing ? ['Editar', 'movimiento'] : ['Nuevo', currentType() === 'income' ? 'ingreso' : 'gasto'];
    // La palabra clave va resaltada en el color de la marca (textos fijos, sin datos de la persona)
    $('page-title').innerHTML = `${verb} <span class="page-header__accent">${noun}</span>`;
    document.title = `${verb} ${noun} · CuentaClara`;
  }

  // ---------- Pintar desde el estado ----------

  let submitted = false;
  /** Si el siguiente cambio de estado viene de una acción de la persona, el foco se mueve a un lugar estable. */
  let moveFocus = false;
  /** @type {string | null} */
  let lastStatus = null;
  const announcer = $('announcer');

  /** @param {Readonly<import('../state/transaction-form.js').FormState>} state */
  function paint(state) {
    const editing = state.mode === 'edit';
    paintTitle();

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
          <p class="state__title" tabindex="-1">No encontramos ese movimiento</p>
          <p>Puede que se haya eliminado.</p>
          <div class="cluster"><a class="btn btn--primary" href="${routes.transactions(monthPeriod(currentMonth(today)))}">Ver movimientos</a>
          <a class="btn btn--secondary" href="${routes.register()}">Registrar uno nuevo</a></div>
        </div>`;
    } else if (state.status === 'locked') {
      // [HU02-6] R6: de un mes anterior no se edita ni elimina
      const t = state.original;
      notice.removeAttribute('aria-busy');
      notice.innerHTML = `<div class="state">
          <p class="state__title" tabindex="-1">Este movimiento ya no se puede cambiar</p>
          <p>${t ? `${esc(t.description)} · ${esc(formatMoney(t.amount))}. ` : ''}Solo puedes editar o eliminar movimientos de este mes.</p>
          <a class="btn btn--primary" href="${routes.transactions(monthPeriod(currentMonth(today)))}">Ver movimientos</a>
        </div>`;
    } else if (state.status === 'loadError') {
      notice.removeAttribute('aria-busy');
      notice.innerHTML = `<div class="state">
          <p class="alert alert--error state__title" role="alert" tabindex="-1">No pudimos cargar el movimiento.</p>
          <button class="btn btn--primary" type="button" data-action="retry-load">Reintentar</button>
        </div>`;
    } else if (state.status === 'saved' && state.saved) {
      // [HU02-4] confirmación y opciones para seguir
      const s = state.saved;
      notice.removeAttribute('aria-busy');
      const text = `${s.type === 'income' ? 'Ingreso' : 'Gasto'} registrado: ${formatMoney(s.amount)} en ${CATEGORY_LABELS[s.category]}`;
      notice.innerHTML = `<div class="alert alert--success stack stack--sm">
          <p id="saved-message">${esc(text)}</p>
          <div class="cluster">
            <button class="btn btn--primary" type="button" data-action="another" aria-describedby="saved-message">Registrar otro</button>
            <a class="btn btn--secondary" href="${routes.transactions(monthPeriod(currentMonth(today)))}">Ver movimientos</a>
          </div>
        </div>`;
    } else if (state.status !== 'saving') {
      notice.removeAttribute('aria-busy');
      if (lastStatus !== 'saving') notice.innerHTML = '';
    }

    // Botón Guardar: aria-disabled (no disabled) para que el foco no se pierda y se lea "Guardando…"
    const saving = state.status === 'saving';
    saveButton.setAttribute('aria-disabled', String(saving || state.status === 'saved'));
    saveButton.setAttribute('aria-busy', String(saving));
    saveButton.textContent = saving ? 'Guardando…' : 'Guardar';
    if (saving && lastStatus !== 'saving') announcer.textContent = 'Guardando…';
    if (state.status === 'saved' && lastStatus !== 'saved' && state.saved) {
      announcer.textContent = /** @type {HTMLElement} */ (notice.querySelector('#saved-message')).textContent ?? '';
    }

    deleteButton.setAttribute('aria-disabled', String(state.status === 'deleting'));
    /** @type {HTMLButtonElement} */ ($('confirm-yes')).textContent = state.status === 'deleting' ? 'Eliminando…' : 'Sí, eliminar';

    $('form-failure').textContent = state.failure ?? '';
    paintErrors(state.errors);
    // Tras Reintentar, guardar o eliminar: si el formulario desaparece, el foco va al mensaje; si vuelve, al título
    if (moveFocus && !['loading', 'saving', 'deleting'].includes(state.status)) {
      moveFocus = false;
      if (['notFound', 'locked', 'loadError'].includes(state.status)) {
        /** @type {HTMLElement | null} */ (notice.querySelector('.state__title'))?.focus();
      } else if (state.status === 'ready' && !submitted) {
        $('page-title').focus();
      }
    }
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
      setDate(today);
      updateCounter();
      /** @type {HTMLElement | null} */ (notice.querySelector('[data-action="another"]'))?.focus();
    }
    lastStatus = state.status;
  }

  // ---------- Eventos ----------

  form.addEventListener('change', (e) => {
    if (/** @type {HTMLInputElement} */ (e.target).name === 'type') {
      fillCategories();
      paintTitle();
    }
  });
  description.addEventListener('input', updateCounter);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (['saving', 'saved'].includes(actions.store.get().status)) return; // aria-disabled no bloquea el envío por sí solo
    submitted = true;
    moveFocus = true;
    actions.save(readForm());
  });

  notice.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target).closest('[data-action]');
    if (!target) return;
    if (target.getAttribute('data-action') === 'another') {
      actions.startAnother();
      amount.focus();
    }
    if (target.getAttribute('data-action') === 'retry-load') {
      moveFocus = true;
      actions.init(id);
    }
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
  $('confirm-yes').addEventListener('click', () => {
    if (actions.store.get().status === 'deleting') return;
    moveFocus = true;
    actions.remove();
  });

  // ---------- Arranque ----------

  // La página llega con <main data-pending> (oculto): se muestra cuando ya pinta su estado real.
  // Así, al editar no se ve un instante "Nuevo gasto" vacío antes de "Editar movimiento" con sus datos.
  const main = $('contenido');
  const reveal = () => main.removeAttribute('data-pending');

  setDateLimits(id ? 'edit' : 'create');
  setDate(today);
  fillCategories();
  actions.store.subscribe((state) => {
    if (state.status === 'ready' && state.original && lastStatus === 'loading') fillForm(state.original);
    paint(state);
    if (state.status !== 'loading') reveal();
  });
  paint(actions.store.get());
  actions.init(id);
  if (!id) reveal();
  // Si la carga tarda más de lo normal, se muestra el esqueleto de "Cargando movimiento…"
  else setTimeout(reveal, 600);
}
