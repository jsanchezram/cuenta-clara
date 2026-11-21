// @ts-check
/**
 * <cc-calendario-rango>: calendario de un mes para marcar un rango de fechas (HU01-12, HU01-13).
 * Componente de UI sin Shadow DOM ni CSS propio. No conoce rutas, API ni store:
 * recibe `today` y `value`, y avisa con `cc-cambiar-rango`.
 *
 * Uso: el primer toque marca el inicio y el segundo el fin (si es anterior, se invierten).
 * Con el atributo `single` elige un solo día (campo Fecha de Registrar).
 * Teclado: solo un día está en el orden de tabulación (tabindex itinerante). Las flechas mueven
 * el día, Re Pág / Av Pág cambian de mes, Inicio / Fin van al lunes / domingo y Enter o Espacio eligen.
 * Los días posteriores a hoy, o anteriores a `min`, están deshabilitados.
 *
 * Propiedades: today (YYYY-MM-DD) · min (YYYY-MM-DD | '') · value ({ from, to } | null)
 * Atributos: single
 * Eventos: cc-cambiar-rango { from, to } · en modo single, cc-elegir-fecha { date }
 */
import { calendarWeeks, shiftMonth } from '../../logic/period.js';
import { addDays, daysInMonth, formatDayLong, formatMonth, weekdayMondayFirst } from '../../utils/lima-date.js';
import { icon } from './icons.js';

const WEEKDAYS = [['Lu', 'lunes'], ['Ma', 'martes'], ['Mi', 'miércoles'], ['Ju', 'jueves'], ['Vi', 'viernes'], ['Sá', 'sábado'], ['Do', 'domingo']];

/**
 * Mismo día del mes en otro mes, ajustado al largo del mes.
 * @param {string} month YYYY-MM
 * @param {string} date YYYY-MM-DD
 */
function sameDayIn(month, date) {
  const [y, m] = month.split('-').map(Number);
  const day = Math.min(Number(date.slice(8, 10)), daysInMonth(y, m));
  return `${month}-${String(day).padStart(2, '0')}`;
}

export class CcCalendarioRango extends HTMLElement {
  constructor() {
    super();
    this._today = '';
    /** @type {{ from: string, to: string } | null} */
    this._value = null;
    /** Primer extremo elegido, a la espera del segundo. @type {string | null} */
    this._anchor = null;
    this._month = '';
    this._focusDate = '';
    this._min = '';
  }

  /** @param {string} value YYYY-MM-DD o '' */
  set min(value) {
    this._min = value;
    this.render();
  }

  /** @param {string} value YYYY-MM-DD */
  set today(value) {
    this._today = value;
    if (!this._month) this._month = value.slice(0, 7);
    if (!this._focusDate) this._focusDate = value;
    this.render();
  }

  /** @param {{ from: string, to: string } | null} value */
  set value(value) {
    this._value = value;
    this._anchor = null;
    if (value) {
      this._month = value.to.slice(0, 7);
      this._focusDate = value.to;
    }
    this.render();
  }

  get value() {
    return this._value;
  }

  connectedCallback() {
    this.render();
  }

  /** @param {string} date */
  _clamp(date) {
    if (date > this._today) return this._today;
    if (this._min && date < this._min) return this._min;
    return date;
  }

  /** @param {string} date */
  _isDisabled(date) {
    return date > this._today || (this._min !== '' && date < this._min);
  }

  /** @param {string} date */
  _choose(date) {
    if (this.hasAttribute('single')) {
      this._value = { from: date, to: date };
      this._focusDate = date;
      this.render();
      this._focusDay();
      this.dispatchEvent(new CustomEvent('cc-elegir-fecha', { bubbles: true, detail: { date } }));
      return;
    }
    if (this._anchor === null) {
      this._anchor = date;
      this._value = { from: date, to: date };
    } else {
      const [from, to] = this._anchor <= date ? [this._anchor, date] : [date, this._anchor];
      this._value = { from, to };
      this._anchor = null;
    }
    this._focusDate = date;
    this.render();
    this._focusDay();
    this.dispatchEvent(new CustomEvent('cc-cambiar-rango', { bubbles: true, detail: { ...this._value } }));
  }

  _focusDay() {
    /** @type {HTMLElement | null} */ (this.querySelector(`[data-date="${this._focusDate}"]`))?.focus();
  }

  /** @param {string} date */
  _moveFocus(date) {
    const target = this._clamp(date);
    this._focusDate = target;
    this._month = target.slice(0, 7);
    this.render();
    this._focusDay();
  }

  render() {
    if (!this.isConnected || !this._today) return;
    const month = this._month;
    const title = formatMonth(month);
    const atCurrentMonth = month >= this._today.slice(0, 7);
    const atMinMonth = this._min !== '' && month <= this._min.slice(0, 7);
    // El día que recibe el tabindex 0 siempre está en el mes visible y no es futuro
    if (this._focusDate.slice(0, 7) !== month) this._focusDate = this._clamp(`${month}-01`);
    const from = this._value?.from ?? '';
    const to = this._value?.to ?? '';

    const rows = calendarWeeks(month).map((week) => `<tr>${week.map((date) => {
      if (!date) return '<td></td>';
      const isStart = date === from;
      const isEnd = date === to;
      const inside = from !== '' && date > from && date < to;
      const classes = [inside && 'is-in-range', isStart && from !== to && 'is-start', isEnd && from !== to && 'is-end'].filter(Boolean).join(' ');
      let state = '';
      if (isStart && isEnd) state = ', elegido';
      else if (isStart) state = ', inicio del rango';
      else if (isEnd) state = ', fin del rango';
      else if (inside) state = ', dentro del rango';
      const isToday = date === this._today;
      return `<td${classes ? ` class="${classes}"` : ''}><button type="button" class="calendar__day" data-date="${date}" tabindex="${date === this._focusDate ? 0 : -1}" aria-pressed="${isStart || isEnd}"${isToday ? ' aria-current="date"' : ''}${this._isDisabled(date) ? ' disabled' : ''} aria-label="${formatDayLong(date)}${isToday ? ', hoy' : ''}${state}">${Number(date.slice(8, 10))}</button></td>`;
    }).join('')}</tr>`).join('');

    // La cabecera se crea una sola vez: su título es una región viva estable, así ‹ › anuncia el mes nuevo
    // (una región viva recreada en cada render puede no anunciarse). Solo cambian sus textos y los días.
    if (!this.querySelector('.calendar')) {
      this.innerHTML = `
        <div class="calendar">
          <div class="calendar__header">
            <button type="button" class="icon-btn" data-nav="-1">${icon('chevron-left')}<span class="visually-hidden">Ver mes anterior</span></button>
            <p class="calendar__title" aria-live="polite"></p>
            <button type="button" class="icon-btn" data-nav="1">${icon('chevron-right')}<span class="visually-hidden">Ver mes siguiente</span></button>
          </div>
          <table class="calendar__grid">
            <caption class="visually-hidden"></caption>
            <thead><tr>${WEEKDAYS.map(([short, long]) => `<th scope="col" abbr="${long}">${short}</th>`).join('')}</tr></thead>
            <tbody></tbody>
          </table>
        </div>`;
      this._wireNav();
    }
    const label = `${title.charAt(0).toUpperCase()}${title.slice(1)}`;
    const titleEl = /** @type {HTMLElement} */ (this.querySelector('.calendar__title'));
    if (titleEl.textContent !== label) titleEl.textContent = label;
    /** @type {HTMLElement} */ (this.querySelector('.calendar__grid caption')).textContent = `Calendario de ${title}`;
    /** @type {HTMLButtonElement} */ (this.querySelector('[data-nav="-1"]')).disabled = atMinMonth;
    /** @type {HTMLButtonElement} */ (this.querySelector('[data-nav="1"]')).disabled = atCurrentMonth;
    /** @type {HTMLElement} */ (this.querySelector('.calendar__grid tbody')).innerHTML = rows;
    this._wireDays();
  }

  /** Flechas ‹ ›: se conectan una sola vez, porque la cabecera no se vuelve a crear. */
  _wireNav() {
    this.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => {
      const dir = Number(button.getAttribute('data-nav'));
      this._month = shiftMonth(this._month, dir);
      this._focusDate = '';
      this.render();
      const again = /** @type {HTMLButtonElement | null} */ (this.querySelector(`[data-nav="${dir}"]`));
      const other = /** @type {HTMLButtonElement | null} */ (this.querySelector(`[data-nav="${-dir}"]`));
      (again && !again.disabled ? again : other)?.focus();
    }));
  }

  /** Días: se vuelven a crear en cada render, así que se conectan cada vez. */
  _wireDays() {
    this.querySelectorAll('.calendar__day').forEach((button) => {
      const date = /** @type {string} */ (button.getAttribute('data-date'));
      button.addEventListener('click', () => this._choose(date));
      button.addEventListener('keydown', (e) => {
        /** @type {Record<string, () => string>} */
        const moves = {
          ArrowLeft: () => addDays(date, -1),
          ArrowRight: () => addDays(date, 1),
          ArrowUp: () => addDays(date, -7),
          ArrowDown: () => addDays(date, 7),
          Home: () => addDays(date, -weekdayMondayFirst(date)),
          End: () => addDays(date, 6 - weekdayMondayFirst(date)),
          PageUp: () => sameDayIn(shiftMonth(date.slice(0, 7), -1), date),
          PageDown: () => sameDayIn(shiftMonth(date.slice(0, 7), 1), date),
        };
        const move = moves[/** @type {KeyboardEvent} */ (e).key];
        if (!move) return;
        e.preventDefault();
        this._moveFocus(move());
      });
    });
  }
}

if (!customElements.get('cc-calendario-rango')) customElements.define('cc-calendario-rango', CcCalendarioRango);
