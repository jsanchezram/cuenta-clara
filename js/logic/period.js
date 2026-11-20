// @ts-check
/**
 * Períodos de la lista: mes, día o rango (HU01-4, HU01-12, HU01-13). Son funciones puras: "today" llega como parámetro.
 */
import { addDays, daysBetween, daysInMonth, isValidDate, weekdayMondayFirst } from '../utils/lima-date.js';

export { addDays };

/** @typedef {import('../models/types.js').Period} Period */
/** @typedef {'TODAY' | 'WEEK' | 'MONTH' | 'PREV_MONTH'} PeriodShortcut */

/** @param {string} today YYYY-MM-DD @returns {string} YYYY-MM */
export function currentMonth(today) {
  return today.slice(0, 7);
}

/** @param {string} month YYYY-MM @returns {Period} */
export function monthPeriod(month) {
  const [y, m] = month.split('-').map(Number);
  return { kind: 'month', from: `${month}-01`, to: `${month}-${String(daysInMonth(y, m)).padStart(2, '0')}` };
}

/**
 * @param {string} month YYYY-MM
 * @param {number} delta  meses a sumar (puede ser negativo)
 */
export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/**
 * @param {PeriodShortcut} shortcut
 * @param {string} today
 * @returns {Period}
 */
export function periodFromShortcut(shortcut, today) {
  switch (shortcut) {
    case 'TODAY':
      return { kind: 'day', from: today, to: today };
    case 'WEEK':
      return { kind: 'range', from: addDays(today, -weekdayMondayFirst(today)), to: today };
    case 'MONTH':
      return monthPeriod(currentMonth(today));
    case 'PREV_MONTH':
      return monthPeriod(shiftMonth(currentMonth(today), -1));
  }
}

/**
 * Unidad de un período, para moverse con ‹ › (HU01-6): un rango que empieza en lunes
 * y dura hasta 7 días es una semana.
 * @param {Period} period
 * @returns {'month' | 'day' | 'week' | 'range'}
 */
export function periodUnit(period) {
  if (period.kind === 'month' || period.kind === 'day') return period.kind;
  return weekdayMondayFirst(period.from) === 0 && daysBetween(period.from, period.to) < 7 ? 'week' : 'range';
}

/**
 * Semanas de un mes para pintar un calendario que empieza en lunes (HU01-12).
 * Cada semana tiene 7 posiciones: una fecha YYYY-MM-DD o null fuera del mes.
 * @param {string} month YYYY-MM
 * @returns {(string | null)[][]}
 */
export function calendarWeeks(month) {
  const [y, m] = month.split('-').map(Number);
  /** @type {(string | null)[]} */
  const cells = Array(weekdayMondayFirst(`${month}-01`)).fill(null);
  for (let day = 1; day <= daysInMonth(y, m); day++) cells.push(`${month}-${String(day).padStart(2, '0')}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * Qué atajo corresponde a un período, si alguno (para marcarlo con ✓).
 * @param {Period} period
 * @param {string} today
 * @returns {PeriodShortcut | null}
 */
export function shortcutOf(period, today) {
  /** @type {PeriodShortcut[]} */
  const all = ['TODAY', 'WEEK', 'MONTH', 'PREV_MONTH'];
  return all.find((s) => {
    const p = periodFromShortcut(s, today);
    return p.from === period.from && p.to === period.to && p.kind === period.kind;
  }) ?? null;
}

/**
 * Valida un rango personalizado (HU01-13).
 * @param {string} from
 * @param {string} to
 * @param {string} today
 * @returns {{ ok: true, value: Period, errors: {} } | { ok: false, errors: { from?: string, to?: string } }}
 */
export function validateRange(from, to, today) {
  /** @type {{ from?: string, to?: string }} */
  const errors = {};
  if (!from) errors.from = 'Elige la fecha "Desde".';
  else if (!isValidDate(from)) errors.from = 'Elige una fecha "Desde" válida.';
  else if (from > today) errors.from = '"Desde" no puede ser una fecha futura.';

  if (!to) errors.to = 'Elige la fecha "Hasta".';
  else if (!isValidDate(to)) errors.to = 'Elige una fecha "Hasta" válida.';
  else if (to > today) errors.to = '"Hasta" no puede ser una fecha futura.';
  else if (!errors.from && from > to) errors.to = '"Hasta" no puede ser anterior a "Desde".';

  if (errors.from || errors.to) return { ok: false, errors };
  return { ok: true, value: { kind: 'range', from, to }, errors: {} };
}
