// @ts-check
/**
 * Pantalla de Perfil (añadido, HU-04): datos de Diego, tema (Claro · Oscuro · Sistema) y restablecer los
 * datos de ejemplo. Solo conecta: las preferencias y los datos pasan por la API, el tema se aplica con
 * ui/theme.js y la confirmación es en la página, como al eliminar un movimiento.
 */
import { createBrowserApi } from '../api/cuentaclara-api.js';
import { THEME_LABELS } from '../models/types.js';
import { todayInLima } from '../utils/lima-date.js';
import { watchHeader } from '../components/ui/sticky-header.js';
import { applyTheme } from '../components/ui/theme.js';

/** @typedef {import('../models/types.js').ThemePreference} ThemePreference */

/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

export async function mountProfile() {
  const today = todayInLima(new Date());
  watchHeader({ today });
  const api = createBrowserApi();
  const announcer = $('announcer');

  /** Anuncia en la región viva (vaciarla primero hace que el mismo texto se vuelva a leer). */
  const announce = (/** @type {string} */ text) => {
    announcer.textContent = '';
    window.setTimeout(() => { announcer.textContent = text; }, 50);
  };

  // ---------- [HU04-2] Tema ----------

  const themeGroup = $('theme-group');
  /** @param {ThemePreference} theme */
  const checkTheme = (theme) => {
    const radio = /** @type {HTMLInputElement | null} */ (themeGroup.querySelector(`input[value="${theme}"]`));
    if (radio) radio.checked = true;
  };

  checkTheme((await api.getPreferences()).theme);

  themeGroup.addEventListener('change', async (e) => {
    const theme = /** @type {ThemePreference} */ (/** @type {HTMLInputElement} */ (e.target).value);
    try {
      await api.savePreferences({ theme });
      applyTheme(theme);
      announce(`Tema ${THEME_LABELS[theme].toLowerCase()} aplicado.`);
    } catch {
      announce('No pudimos guardar el tema. Intenta de nuevo.');
    }
  });

  // ---------- [HU04-3] Restablecer los datos de ejemplo ----------

  const resetButton = /** @type {HTMLButtonElement} */ ($('reset-button'));
  const confirmBox = $('reset-confirm');
  const confirmYes = /** @type {HTMLButtonElement} */ ($('reset-yes'));
  const notice = $('reset-notice');
  let working = false;

  /** Abre o cierra la confirmación: al abrir, el foco va a su título; al cerrar, vuelve al botón. */
  const setConfirm = (/** @type {boolean} */ open) => {
    confirmBox.hidden = !open;
    resetButton.setAttribute('aria-expanded', String(open));
    if (open) {
      notice.innerHTML = '';
      $('reset-confirm-title').focus();
    } else {
      resetButton.focus();
    }
  };

  resetButton.addEventListener('click', () => setConfirm(true));
  $('reset-no').addEventListener('click', () => setConfirm(false));
  confirmBox.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setConfirm(false);
  });

  confirmYes.addEventListener('click', () => {
    if (working) return;
    working = true;
    confirmYes.setAttribute('aria-disabled', 'true');
    confirmYes.textContent = 'Restableciendo…';
    let message;
    try {
      api.resetDemo();
      message = 'Listo: volvieron los movimientos y presupuestos de ejemplo.';
      notice.innerHTML = `<p class="alert alert--success">${message}</p>`;
    } catch {
      message = 'No pudimos restablecer los datos. Intenta de nuevo.';
      notice.innerHTML = `<p class="alert alert--error">${message}</p>`;
    }
    working = false;
    confirmYes.setAttribute('aria-disabled', 'false');
    confirmYes.textContent = 'Sí, restablecer';
    setConfirm(false);
    announce(message);
  });
}
