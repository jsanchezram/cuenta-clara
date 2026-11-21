// @ts-check
/**
 * Aplica el tema guardado ANTES de pintar la página, para que no se vea un instante el tema equivocado.
 * Es un script clásico y síncrono que cada página carga en su <head> (un módulo llegaría tarde).
 * Es parte de la capa de API: lee la misma clave que cuentaclara-api.js (KEY_PREFERENCES), así que
 * las páginas siguen sin tocar localStorage.
 * "Sistema" sigue a prefers-color-scheme, también si cambia con la página abierta.
 * La pantalla de Perfil aplica los cambios al momento con js/components/ui/theme.js (mismo criterio).
 */
(() => {
  const KEY = 'cuentaclara.v1.preferences';
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  /** @returns {string} light | dark | system */
  const savedTheme = () => {
    try {
      return JSON.parse(window.localStorage.getItem(KEY) ?? '{}').theme ?? 'system';
    } catch {
      return 'system';
    }
  };

  const apply = () => {
    const theme = savedTheme();
    const dark = theme === 'dark' || (theme !== 'light' && media.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  };

  apply();
  media.addEventListener('change', apply);
  // Si se cambia el tema en otra pestaña, esta también se actualiza
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) apply();
  });
})();
