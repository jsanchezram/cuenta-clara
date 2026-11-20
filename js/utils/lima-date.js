// @ts-check
/**
 * Fechas de CuentaClara. Las fechas son textos YYYY-MM-DD, sin hora ni zona.
 * Con una sola excepción, todo es calendario puro sin Date, para no depender de la zona de la PC.
 * La excepción es todayInLima, el único punto que lee el reloj, y recibe "now" como parámetro.
 */

const LIMA_OFFSET_MS = -5 * 60 * 60 * 1000; // UTC−5 fijo, Perú no usa horario de verano

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Hoy en Lima, como YYYY-MM-DD.
 * @param {Date} now  instante actual; las pantallas pasan new Date()
 * @returns {string}
 */
export function todayInLima(now) {
  return new Date(now.getTime() + LIMA_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Instante actual en Lima como ISO 8601 con zona: "2026-11-20T12:00:00-05:00".
 * @param {Date} now
 */
export function nowInLimaIso(now) {
  return `${new Date(now.getTime() + LIMA_OFFSET_MS).toISOString().slice(0, 19)}-05:00`;
}

/** @param {number} n */
const pad = (n) => String(n).padStart(2, '0');

/**
 * Días desde 1970-01-01 (algoritmo days_from_civil de H. Hinnant).
 * @param {number} y @param {number} m @param {number} d
 */
function toDayNumber(y, m, d) {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** @param {number} z  días desde 1970-01-01 @returns {string} YYYY-MM-DD */
function fromDayNumber(z) {
  const zz = z + 719468;
  const era = Math.floor(zz / 146097);
  const doe = zz - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  const y = yoe + era * 400 + (m <= 2 ? 1 : 0);
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** @param {string} date @returns {[number, number, number]} */
function parts(date) {
  const [y, m, d] = date.split('-').map(Number);
  return [y, m, d];
}

/**
 * @param {number} year @param {number} month 1–12
 * @returns {number}
 */
export function daysInMonth(year, month) {
  const next = month === 12 ? toDayNumber(year + 1, 1, 1) : toDayNumber(year, month + 1, 1);
  return next - toDayNumber(year, month, 1);
}

/**
 * Comprueba que sea YYYY-MM-DD y que el día exista (rechaza 2026-02-30).
 * @param {string} date
 */
export function isValidDate(date) {
  const m = DATE_RE.exec(date);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);
}

/**
 * @param {string} date YYYY-MM-DD
 * @param {number} days  puede ser negativo
 */
export function addDays(date, days) {
  return fromDayNumber(toDayNumber(...parts(date)) + days);
}

/**
 * Día de la semana con 0 = lunes y 6 = domingo.
 * @param {string} date
 */
export function weekdayMondayFirst(date) {
  // 1970-01-01 fue jueves (índice 3 contando desde lunes)
  return (((toDayNumber(...parts(date)) + 3) % 7) + 7) % 7;
}

/** "18 nov" @param {string} date */
export function formatDayShort(date) {
  const [, m, d] = parts(date);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

/** "18 nov 2026" @param {string} date */
export function formatDayWithYear(date) {
  return `${formatDayShort(date)} ${date.slice(0, 4)}`;
}

/** "noviembre 2026" @param {string} month YYYY-MM */
export function formatMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
