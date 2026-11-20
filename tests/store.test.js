// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../js/state/store.js';
import { createTransactionsActions } from '../js/state/transactions.js';

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
