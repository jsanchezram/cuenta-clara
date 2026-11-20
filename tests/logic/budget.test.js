// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  budgetStatus,
  percentUsed,
  budgetMessage,
  effectiveLimit,
  buildBudgetRows,
} from '../../js/logic/budget.js';

// ---------- R5 · Estados (en céntimos) ----------
test('R5: menos de 80 % es NORMAL', () => {
  assert.equal(budgetStatus(47_999, 60_000), 'NORMAL');
});

test('R5: exactamente 80 % ya es NEAR', () => {
  assert.equal(budgetStatus(48_000, 60_000), 'NEAR');
});

test('R5: 99.99 % sigue siendo NEAR', () => {
  assert.equal(budgetStatus(59_999, 60_000), 'NEAR');
});

test('R5: exactamente 100 % es REACHED', () => {
  assert.equal(budgetStatus(20_000, 20_000), 'REACHED');
});

test('R5: un céntimo sobre el límite es EXCEEDED', () => {
  assert.equal(budgetStatus(20_001, 20_000), 'EXCEEDED');
});

test('R5: el aviso se lee en texto para cada estado', () => {
  assert.equal(budgetMessage('NORMAL', 180), 'Te quedan S/ 180.00');
  assert.equal(budgetMessage('NEAR', 90), 'Cerca del límite');
  assert.equal(budgetMessage('REACHED', 0), 'Alcanzaste tu límite');
  assert.equal(budgetMessage('EXCEEDED', -45), 'Te pasaste por S/ 45.00');
});

test('porcentaje usado redondeado al entero', () => {
  assert.equal(percentUsed(19_500, 15_000), 130);
  assert.equal(percentUsed(51_000, 60_000), 85);
});

// ---------- R8 · Límite vigente ----------
const history = [
  { category: /** @type {const} */ ('leisure'), limit: 200, effectiveFrom: '2026-10' },
  { category: /** @type {const} */ ('leisure'), limit: 150, effectiveFrom: '2026-11' },
  { category: /** @type {const} */ ('food'), limit: 600, effectiveFrom: '2026-10' },
];

test('R8: el límite se copia a los meses siguientes hasta que cambia', () => {
  assert.equal(effectiveLimit(history, 'food', '2026-12')?.limit, 600);
});

test('R8: un cambio en noviembre no altera el límite de octubre', () => {
  assert.equal(effectiveLimit(history, 'leisure', '2026-10')?.limit, 200);
  assert.equal(effectiveLimit(history, 'leisure', '2026-11')?.limit, 150);
});

test('R8: antes de definirse no hay límite', () => {
  assert.equal(effectiveLimit(history, 'food', '2026-09'), null);
});

// ---------- Filas de la pantalla de presupuesto ----------
test('buildBudgetRows suma solo gastos del mes por categoría y marca las que no tienen límite', () => {
  const transactions = [
    { type: /** @type {const} */ ('expense'), category: /** @type {const} */ ('leisure'), amount: 45, date: '2026-11-07' },
    { type: /** @type {const} */ ('expense'), category: /** @type {const} */ ('leisure'), amount: 150, date: '2026-11-15' },
    { type: /** @type {const} */ ('income'), category: /** @type {const} */ ('work'), amount: 1800, date: '2026-11-15' },
    { type: /** @type {const} */ ('expense'), category: /** @type {const} */ ('housing'), amount: 1200, date: '2026-11-01' },
  ];
  const rows = buildBudgetRows([{ category: 'leisure', limit: 150, effectiveFrom: '2026-11' }], transactions);
  const leisure = rows.find((r) => r.category === 'leisure');
  const housing = rows.find((r) => r.category === 'housing');
  assert.equal(rows.length, 6);
  assert.deepEqual(
    { spent: leisure?.spent, remaining: leisure?.remaining, status: leisure?.status, message: leisure?.message },
    { spent: 195, remaining: -45, status: 'EXCEEDED', message: 'Te pasaste por S/ 45.00' },
  );
  assert.equal(housing?.limit, null);
  assert.equal(housing?.spent, 1200);
});

// ---------- HU-03 · orden, resumen y límites quitados ----------
import { sortByUrgency, budgetSummary } from '../../js/logic/budget.js';

/** @param {string} category @param {any} status @param {number | null} percent @param {number | null} [limit] @param {number} [spent] */
const row = (category, status, percent, limit = 100, spent = 0) =>
  /** @type {any} */ ({ category, status, percent, limit: status ? limit : null, spent, remaining: null, message: '' });

test('REQ-03: ordena por urgencia y, en el mismo estado, por mayor porcentaje', () => {
  const sorted = sortByUrgency([
    row('utilities', 'NORMAL', 40),
    row('housing', null, null),
    row('food', 'NEAR', 85),
    row('other', null, null),
    row('leisure', 'EXCEEDED', 130),
    row('transport', 'REACHED', 100),
    row('x', 'NEAR', 95),
  ]);
  assert.deepEqual(sorted.map((r) => r.category), ['leisure', 'transport', 'x', 'food', 'utilities', 'housing', 'other']);
});

test('REQ-04: el resumen cuenta categorías que necesitan atención y suma solo las que tienen límite', () => {
  const s = budgetSummary([
    row('leisure', 'EXCEEDED', 130, 150, 195),
    row('transport', 'REACHED', 100, 200, 200),
    row('food', 'NEAR', 85, 600, 510),
    row('utilities', 'NORMAL', 40, 300, 120),
    row('housing', null, null, 0, 1200),
  ]);
  assert.equal(s.attention, 3);
  assert.equal(s.spent, 1025);
  assert.equal(s.limit, 1250);
  assert.equal(s.text, '3 categorías necesitan atención · Gastaste S/ 1 025.00 de S/ 1 250.00 presupuestados');
});

test('REQ-04: textos del resumen con 1, 0 y ninguna categoría con límite', () => {
  assert.match(budgetSummary([row('food', 'NEAR', 85, 600, 510)]).text, /^1 categoría necesita atención · /);
  assert.match(budgetSummary([row('food', 'NORMAL', 10, 600, 60)]).text, /^Todo bajo control · Gastaste S\/ 60\.00 de S\/ 600\.00/);
  assert.equal(budgetSummary([row('housing', null, null)]).text, 'Aún no defines límites este mes. Define uno para recibir avisos.');
});

test('REQ-09: un límite quitado deja sin límite desde ese mes y conserva los anteriores', () => {
  const records = [
    { category: /** @type {const} */ ('food'), limit: 600, effectiveFrom: '2026-10', removed: false },
    { category: /** @type {const} */ ('food'), limit: 600, effectiveFrom: '2026-11', removed: true },
  ];
  assert.equal(effectiveLimit(records, 'food', '2026-10')?.removed, false);
  assert.equal(effectiveLimit(records, 'food', '2026-11')?.removed, true);
  assert.equal(effectiveLimit(records, 'food', '2027-02')?.removed, true);
});

test('REQ-04: el resumen da el porcentaje usado del total presupuestado (barra del resumen)', () => {
  const s = budgetSummary([
    row('leisure', 'EXCEEDED', 130, 150, 195),
    row('transport', 'REACHED', 100, 200, 200),
    row('food', 'NEAR', 85, 600, 510),
    row('utilities', 'NORMAL', 40, 300, 120),
    row('housing', null, null, 0, 1200),
  ]);
  assert.equal(s.percent, 82); // S/ 1 025.00 de S/ 1 250.00
  assert.equal(budgetSummary([row('housing', null, null)]).percent, 0);
});
