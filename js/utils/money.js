// @ts-check
/** Dinero: conversión soles ⇄ céntimos y formato visible (CC-6). Sin DOM. */

/**
 * @param {number} soles
 * @returns {number} céntimos enteros
 */
export function toCents(soles) {
  return Math.round(soles * 100);
}

/**
 * @param {number} cents
 * @returns {number} soles
 */
export function toSoles(cents) {
  return cents / 100;
}

/**
 * "S/ 1 800.00": separador de miles con espacio y 2 decimales.
 * No incluye signo: el signo − o + lo pone quien pinta el monto.
 * @param {number} soles
 * @returns {string}
 */
export function formatMoney(soles) {
  const [int, dec] = Math.abs(soles).toFixed(2).split('.');
  return `S/ ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${dec}`;
}
