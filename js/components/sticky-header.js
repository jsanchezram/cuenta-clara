// @ts-check
/**
 * Encabezado de la vista (mejora progresiva: la barra de marca y .sticky-bar ya son fijas solo con CSS).
 * - Si el encabezado tiene una línea [data-today], escribe la fecha de hoy ("viernes 20 de noviembre").
 * - Cuando el título grande de la vista sale de la pantalla, agrega .is-condensed al <body>:
 *   la barra de marca muestra el título en pequeño y la barra de controles gana sombra.
 * - Mide lo que queda fijo arriba y lo publica en --sticky-offset, que usa scroll-padding-top
 *   para que un elemento enfocado nunca quede tapado por las barras (WCAG 2.4.11).
 * No conoce rutas, API ni store: la pantalla le pasa "hoy" (hora de Lima).
 */
import { formatDayLong } from '../utils/lima-date.js';

/** @param {{ today?: string }} [options]  today en YYYY-MM-DD */
export function watchHeader({ today } = {}) {
  const dateline = document.querySelector('.page-header [data-today]');
  if (dateline && today) dateline.textContent = formatDayLong(today, false);

  const title = /** @type {HTMLElement | null} */ (document.querySelector('.page-header__title'));
  const bar = /** @type {HTMLElement | null} */ (document.querySelector('.brand-bar'));
  if (!title || !bar) return;
  const mini = /** @type {HTMLElement | null} */ (document.querySelector('.brand-bar__title'));
  const sticky = /** @type {HTMLElement | null} */ (document.querySelector('.sticky-bar'));

  // El título pequeño copia al grande, también cuando cambia (por ejemplo "Nuevo gasto" → "Nuevo ingreso")
  const syncTitle = () => {
    if (mini) mini.textContent = title.textContent ?? '';
  };
  syncTitle();
  new MutationObserver(syncTitle).observe(title, { childList: true, characterData: true, subtree: true });

  // Solo cuenta lo que de verdad queda fijo arriba: en laptop los controles van en el panel lateral
  const measure = () => {
    const stickyHeight = sticky && getComputedStyle(sticky).position === 'sticky' ? sticky.offsetHeight : 0;
    document.documentElement.style.setProperty('--sticky-offset', `${bar.offsetHeight + stickyHeight + 8}px`);
  };
  measure();
  window.addEventListener('resize', measure);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    if (sticky) observer.observe(sticky);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => document.body.classList.toggle('is-condensed', !entry.isIntersecting),
      { rootMargin: `-${bar.offsetHeight}px 0px 0px 0px` },
    ).observe(title);
  }
}
