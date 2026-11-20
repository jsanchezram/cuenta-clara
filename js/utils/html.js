// @ts-check
/**
 * Escapa un valor para insertarlo en HTML.
 * Se usa con todo lo que escribe una persona, los datos de la API y los mensajes del servidor.
 * @param {unknown} value
 * @returns {string}
 */
export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
