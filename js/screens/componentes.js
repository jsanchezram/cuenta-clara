// @ts-check
/**
 * Vitrina del design system: alterna el tema claro u oscuro para revisar
 * que cada componente funcione en ambos sin tocar components.css.
 */

const toggle = /** @type {HTMLButtonElement | null} */ (document.getElementById('tema'));

toggle?.addEventListener('click', () => {
  const isDark = document.documentElement.dataset.theme === 'dark';
  if (isDark) {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = 'dark';
  }
  toggle.setAttribute('aria-pressed', String(!isDark));
});
