// @ts-check
/**
 * Aplica un tema a la página al momento: "light", "dark" o "system" (sigue a prefers-color-scheme).
 * Mismo criterio que js/api/theme-boot.js, que aplica el tema guardado antes de pintar.
 * No conoce la API: la pantalla guarda la preferencia y luego llama a applyTheme().
 * @param {import('../../models/types.js').ThemePreference} theme
 */
export function applyTheme(theme) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
