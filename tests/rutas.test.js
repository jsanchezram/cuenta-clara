// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTransactionsRoute, routes, CATEGORY_SLUGS, slugToCategory } from '../js/rutas.js';

const TODAY = '2026-11-20';
const NOVEMBER = { kind: 'month', from: '2026-11-01', to: '2026-11-30' };

test('HU01-1: sin ruta muestra el mes en curso y pide corregir la URL', () => {
  const r = parseTransactionsRoute('', TODAY);
  assert.deepEqual(r, { period: NOVEMBER, category: null, hash: '#/2026-11', corrected: true });
});

test('HU01-4: la ruta compartible del enunciado abre el mes y la categoría', () => {
  const r = parseTransactionsRoute('#/2026-11/comida', TODAY);
  assert.deepEqual(r, { period: NOVEMBER, category: 'food', hash: '#/2026-11/comida', corrected: false });
});

test('HU01-4: ruta de un día', () => {
  const r = parseTransactionsRoute('#/2026-11-18', TODAY);
  assert.deepEqual(r.period, { kind: 'day', from: '2026-11-18', to: '2026-11-18' });
  assert.equal(r.corrected, false);
});

test('HU01-4: ruta de un rango con categoría', () => {
  const r = parseTransactionsRoute('#/2026-11-01..2026-11-15/ocio', TODAY);
  assert.deepEqual(r.period, { kind: 'range', from: '2026-11-01', to: '2026-11-15' });
  assert.equal(r.category, 'leisure');
  assert.equal(r.hash, '#/2026-11-01..2026-11-15/ocio');
});

test('HU01-10: una URL rota se corrige al mes en curso y a "Todas"', () => {
  const r = parseTransactionsRoute('#/2026-13/xyz', TODAY);
  assert.deepEqual(r, { period: NOVEMBER, category: null, hash: '#/2026-11', corrected: true });
});

test('HU01-10: un rango invertido o con fecha futura se corrige', () => {
  assert.equal(parseTransactionsRoute('#/2026-11-15..2026-11-01', TODAY).hash, '#/2026-11');
  assert.equal(parseTransactionsRoute('#/2026-11-01..2026-11-25', TODAY).hash, '#/2026-11');
});

test('HU01-6: un mes futuro se corrige al mes en curso', () => {
  assert.equal(parseTransactionsRoute('#/2026-12/comida', TODAY).hash, '#/2026-11/comida');
});

test('HU01-10: un período válido con categoría inválida conserva el período', () => {
  const r = parseTransactionsRoute('#/2026-10/pizza', TODAY);
  assert.equal(r.hash, '#/2026-10');
  assert.equal(r.category, null);
  assert.equal(r.corrected, true);
});

test('las rutas se arman con el slug en español y el id escapado', () => {
  assert.equal(routes.transactions(NOVEMBER, 'food'), 'movimientos.html#/2026-11/comida');
  assert.equal(routes.transactions({ kind: 'day', from: '2026-11-18', to: '2026-11-18' }, null), 'movimientos.html#/2026-11-18');
  assert.equal(routes.edit('txn_0025'), 'registrar.html?id=txn_0025');
  assert.equal(routes.edit('a b'), 'registrar.html?id=a%20b');
});

test('cada categoría tiene un slug y el slug vuelve a la misma categoría', () => {
  for (const [category, slug] of Object.entries(CATEGORY_SLUGS)) {
    assert.equal(slugToCategory(slug), category);
  }
  assert.equal(slugToCategory('otros-ingresos'), 'other_income');
});
