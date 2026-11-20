// @ts-check
/**
 * Vitrina del design system:
 * - alterna el tema claro u oscuro, para revisar que cada componente funcione en ambos sin tocar components.css;
 * - monta los componentes de negocio con datos de ejemplo y registra los eventos que emiten.
 */
import '../components/cc-movimiento.js';
import '../components/cc-barra-presupuesto.js';
import { buildBudgetRows } from '../logic/budget.js';
import { esc } from '../utils/html.js';

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

/** @type {import('../models/types.js').Transaction[]} */
const transactions = [
  { id: 'demo-1', type: 'expense', category: 'food', amount: 15, date: '2026-11-18', description: 'Almuerzo menú', createdAt: '', updatedAt: '' },
  { id: 'demo-2', type: 'income', category: 'work', amount: 1800, date: '2026-11-15', description: 'Pago proyecto logo', createdAt: '', updatedAt: '' },
  { id: 'demo-3', type: 'expense', category: 'utilities', amount: 96.4, date: '2026-10-28', description: 'Recibo de luz <mes anterior>', createdAt: '', updatedAt: '' },
];

const list = document.getElementById('demo-movimientos');
transactions.forEach((t, i) => {
  const li = document.createElement('li');
  const el = /** @type {import('../components/cc-movimiento.js').CcMovimiento} */ (document.createElement('cc-movimiento'));
  li.append(el);
  list?.append(li);
  el.transaction = t;
  el.editHref = i < 2 ? '#t-negocio' : null;
});

const rows = buildBudgetRows(
  [
    { category: 'utilities', limit: 300, effectiveFrom: '2026-10' },
    { category: 'food', limit: 600, effectiveFrom: '2026-10' },
    { category: 'transport', limit: 200, effectiveFrom: '2026-10' },
    { category: 'leisure', limit: 150, effectiveFrom: '2026-11' },
  ],
  [
    { type: 'expense', category: 'utilities', amount: 120 },
    { type: 'expense', category: 'food', amount: 510 },
    { type: 'expense', category: 'transport', amount: 200 },
    { type: 'expense', category: 'leisure', amount: 195 },
    { type: 'expense', category: 'housing', amount: 1200 },
  ],
).filter((r) => r.category !== 'other');

const budgets = document.getElementById('demo-presupuesto');
for (const row of rows) {
  const el = /** @type {import('../components/cc-barra-presupuesto.js').CcBarraPresupuesto} */ (document.createElement('cc-barra-presupuesto'));
  el.setAttribute('editable', '');
  el.setAttribute('heading-level', '3');
  budgets?.append(el);
  el.row = row;
}

const log = document.getElementById('demo-eventos');
/** @param {string} text */
function record(text) {
  if (!log) return;
  if (log.dataset.started !== 'true') {
    log.innerHTML = '';
    log.dataset.started = 'true';
  }
  log.insertAdjacentHTML('beforeend', `<li>${esc(text)}</li>`);
}
document.addEventListener('cc-editar', (e) => record(`cc-editar ${JSON.stringify(/** @type {CustomEvent} */ (e).detail)}`));
document.addEventListener('cc-editar-limite', (e) => record(`cc-editar-limite ${JSON.stringify(/** @type {CustomEvent} */ (e).detail)}`));
