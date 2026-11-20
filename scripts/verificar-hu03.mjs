// Verificación estática de HU-03 (specs/hu-03). Uso: node scripts/verificar-hu03.mjs
// Revisa que los archivos tengan lo pedido. No ejecuta la app: eso lo hacen node --test y la prueba manual.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => (existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : '');
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/;

const page = read('presupuesto.html');
const screen = read('js/screens/presupuesto.js');
const state = read('js/state/budget.js');
const component = read('js/components/cc-barra-presupuesto.js');
const contract = read('docs/api/contrato-v1.md');
const rutas = read('js/rutas.js');

/** @type {[string, string, boolean][]} */
const checks = [
  ['HU03-1', 'presupuesto.html existe con lang="es-PE" y un solo <h1>', /lang="es-PE"/.test(page) && (page.match(/<h1\b/g) ?? []).length === 1],
  ['HU03-2', 'presupuesto.html tiene "Saltar al contenido" y marca Presupuesto con aria-current', /class="skip-link"/.test(page) && /href="presupuesto\.html"[^>]*aria-current="page"/.test(page)],
  ['HU03-3', 'presupuesto.html tiene región role="status" y aria-busy para la carga', /role="status"/.test(page) && /aria-busy/.test(page + screen)],
  ['HU03-4', 'La página usa solo tokens.css y components.css (sin hex)', /tokens\.css/.test(page) && /components\.css/.test(page) && !HEX.test(page.replace(/href="#[^"]*"/g, ''))],
  ['HU03-5', 'La pantalla existe, usa // @ts-check y no usa localStorage', screen.startsWith('// @ts-check') && !/localStorage/.test(screen)],
  ['HU03-6', 'Las acciones del presupuesto no tocan el DOM', state.length > 0 && !/\b(document|window)\b/.test(state)],
  ['HU03-7', 'El componente emite los 5 eventos de la spec',
    ['cc-editar-limite', 'cc-cancelar-limite', 'cc-guardar-limite', 'cc-quitar-limite', 'cc-confirmar-quitar'].every((e) => component.includes(`'${e}'`))],
  ['HU03-8', 'El componente no usa Shadow DOM, escapa con esc() y expone focusAction()', !/attachShadow/.test(component) && /esc\(/.test(component) && /focusAction\(\)/.test(component)],
  ['HU03-9', 'El componente no importa la API ni el store', !/from '\.\.\/(api|state)\//.test(component)],
  ['HU03-10', 'Sin colores hex en pantalla, estado y componente', ![screen, state, component].some((s) => HEX.test(s))],
  ['HU03-11', 'El contrato documenta DELETE /api/v1/budgets/{category} y deleted_at', /DELETE \/api\/v1\/budgets\/\{category\}/.test(contract) && /deleted_at/.test(contract)],
  ['HU03-12', 'rutas.js exporta parseBudgetRoute', /export function parseBudgetRoute/.test(rutas)],
  ['HU03-13', 'La pantalla usa el orden por urgencia vía el store y el texto de solo lectura', /createBudgetActions/.test(screen) && /solo lectura/.test(screen + page)],
];

// Todos los archivos de js/ con // @ts-check en la primera línea
const jsFiles = [];
const walk = (dir) => readdirSync(join(root, dir)).forEach((f) => {
  const rel = `${dir}/${f}`;
  if (statSync(join(root, rel)).isDirectory()) walk(rel);
  else if (f.endsWith('.js')) jsFiles.push(rel);
});
walk('js');
const missing = jsFiles.filter((f) => !read(f).startsWith('// @ts-check'));
checks.push(['HU03-14', `// @ts-check en los ${jsFiles.length} archivos de js/${missing.length ? ` (faltan: ${missing.join(', ')})` : ''}`, missing.length === 0]);

let passed = 0;
for (const [id, text, ok] of checks) {
  if (ok) passed++;
  console.log(`${ok ? '✔' : '✖'} [${id}] ${text}`);
}
console.log(`\n${passed}/${checks.length} verificaciones pasan.`);
process.exit(passed === checks.length ? 0 : 1);
