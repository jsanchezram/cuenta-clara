// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterTransactions, totals, sortByDateDesc } from '../../js/logic/summary.js';

/** @type {import('../../js/models/types.js').Transaction[]} */
const list = [
  { id: 'a', type: 'expense', category: 'food', amount: 0.1, date: '2026-11-18', description: 'Chicle', createdAt: '2026-11-18T09:00:00-05:00', updatedAt: '' },
  { id: 'b', type: 'expense', category: 'food', amount: 0.2, date: '2026-11-18', description: 'Caramelo', createdAt: '2026-11-18T10:00:00-05:00', updatedAt: '' },
  { id: 'c', type: 'income', category: 'work', amount: 1800, date: '2026-11-15', description: 'Pago logo', createdAt: '2026-11-15T10:00:00-05:00', updatedAt: '' },
  { id: 'd', type: 'expense', category: 'leisure', amount: 45, date: '2026-11-07', description: 'Cine', createdAt: '2026-11-07T21:00:00-05:00', updatedAt: '' },
  { id: 'e', type: 'expense', category: 'housing', amount: 1200, date: '2026-10-01', description: 'Alquiler', createdAt: '2026-10-01T09:00:00-05:00', updatedAt: '' },
];

const NOVEMBER = /** @type {const} */ ({ kind: 'month', from: '2026-11-01', to: '2026-11-30' });

test('HU01-5: total del mes con gastos, ingresos y saldo', () => {
  const t = totals(filterTransactions(list, { period: NOVEMBER }));
  assert.deepEqual(t, { expenses: 45.3, income: 1800, balance: 1754.7 });
});

test('HU01-5: los totales suman en céntimos, sin error de coma flotante', () => {
  const t = totals(list.filter((x) => x.id === 'a' || x.id === 'b'));
  assert.equal(t.expenses, 0.3);
});

test('HU01-5: el total respeta el filtro por categoría', () => {
  const t = totals(filterTransactions(list, { period: NOVEMBER, category: 'food' }));
  assert.deepEqual(t, { expenses: 0.3, income: 0, balance: -0.3 });
});

test('el filtro por período incluye ambos extremos', () => {
  const range = /** @type {const} */ ({ kind: 'range', from: '2026-11-07', to: '2026-11-15' });
  assert.deepEqual(filterTransactions(list, { period: range }).map((x) => x.id).sort(), ['c', 'd']);
});

test('HU01-2: ordena por fecha descendente y, en el mismo día, por hora de registro', () => {
  assert.deepEqual(sortByDateDesc(list).map((x) => x.id), ['b', 'a', 'c', 'd', 'e']);
});

test('una lista vacía da totales en cero', () => {
  assert.deepEqual(totals([]), { expenses: 0, income: 0, balance: 0 });
});
