// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../js/state/store.js';
import { createTransactionsActions } from '../../js/state/transactions.js';

test('el store es inmutable y avisa a sus suscriptores', () => {
  const store = createStore({ count: 0, name: 'a' });
  /** @type {number[]} */
  const seen = [];
  const off = store.subscribe((s) => seen.push(s.count));
  store.update({ count: 1 });
  off();
  store.update({ count: 2 });
  assert.deepEqual(seen, [1]);
  assert.equal(store.get().name, 'a');
  assert.ok(Object.isFrozen(store.get()));
});

test('la carga pasa de loading a ready y nunca se queda en cargando si falla', async () => {
  const ok = { listTransactions: async () => [] };
  const fail = { listTransactions: async () => { throw new Error('caída'); } };
  const a = createTransactionsActions(/** @type {any} */ (ok));
  await a.load({ kind: 'month', from: '2026-11-01', to: '2026-11-30' }, null);
  assert.equal(a.store.get().status, 'ready');
  const b = createTransactionsActions(/** @type {any} */ (fail));
  await b.load({ kind: 'month', from: '2026-11-01', to: '2026-11-30' }, null);
  assert.equal(b.store.get().status, 'error');
});

test('una respuesta que llega tarde no pisa a la más reciente', async () => {
  /** @type {((v: any[]) => void)[]} */
  const pending = [];
  const api = { listTransactions: () => new Promise((resolve) => pending.push(resolve)) };
  const actions = createTransactionsActions(/** @type {any} */ (api));
  const first = actions.load({ kind: 'month', from: '2026-10-01', to: '2026-10-31' }, null);
  const second = actions.load({ kind: 'month', from: '2026-11-01', to: '2026-11-30' }, null);
  pending[1]([{ id: 'nov' }]);
  await second;
  pending[0]([{ id: 'oct' }]);
  await first;
  assert.deepEqual(actions.store.get().transactions.map((t) => t.id), ['nov']);
});

// ---------- HU-03 · acciones de presupuesto ----------
import { createBudgetActions } from '../../js/state/budget.js';

function fakeBudgetApi() {
  /** @type {any[]} */
  let budgets = [{ category: 'leisure', limit: 150, effectiveFrom: '2026-11' }, { category: 'food', limit: 600, effectiveFrom: '2026-10' }];
  const calls = { save: 0 };
  return {
    calls,
    listBudgets: async () => budgets,
    listTransactions: async () => [
      { type: 'expense', category: 'leisure', amount: 195 },
      { type: 'expense', category: 'food', amount: 100 },
    ],
    saveBudget: async (/** @type {string} */ category, /** @type {number} */ limit) => {
      calls.save++;
      budgets = budgets.filter((b) => b.category !== category).concat({ category, limit, effectiveFrom: '2026-11' });
    },
    removeBudget: async (/** @type {string} */ category) => { budgets = budgets.filter((b) => b.category !== category); },
  };
}

test('REQ-02/03/04: la carga arma filas ordenadas por urgencia y el resumen', async () => {
  const actions = createBudgetActions(/** @type {any} */ (fakeBudgetApi()));
  await actions.load('2026-11');
  const s = actions.store.get();
  assert.equal(s.status, 'ready');
  assert.equal(s.rows[0].category, 'leisure');
  assert.equal(s.summary?.attention, 1);
});

test('REQ-06: un límite inválido muestra el error en la tarjeta, conserva lo escrito y no llama a la API', async () => {
  const api = fakeBudgetApi();
  const actions = createBudgetActions(/** @type {any} */ (api));
  await actions.load('2026-11');
  actions.startEdit('food');
  await actions.saveLimit('food', '12.345');
  assert.deepEqual(actions.store.get().error, { category: 'food', message: 'Usa como máximo 2 decimales.' });
  assert.equal(actions.store.get().draft, '12.345');
  assert.equal(api.calls.save, 0);
});

test('REQ-08: un límite menor que lo gastado se guarda y avisa que ya se pasó', async () => {
  const actions = createBudgetActions(/** @type {any} */ (fakeBudgetApi()));
  await actions.load('2026-11');
  actions.startEdit('leisure');
  await actions.saveLimit('leisure', '100');
  const s = actions.store.get();
  assert.equal(s.notice, 'Límite de Ocio guardado: S/ 100.00. Ya te pasaste por S/ 95.00 este mes.');
  assert.equal(s.editing, null);
  assert.equal(s.focusTarget, 'leisure');
});

test('REQ-09: quitar un límite deja la categoría sin límite y lo anuncia', async () => {
  const actions = createBudgetActions(/** @type {any} */ (fakeBudgetApi()));
  await actions.load('2026-11');
  actions.askRemove('food');
  await actions.removeLimit('food');
  const s = actions.store.get();
  assert.equal(s.rows.find((r) => r.category === 'food')?.limit, null);
  assert.equal(s.notice, 'Quitaste el límite de Comida.');
});
