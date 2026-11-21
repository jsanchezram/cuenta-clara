// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createApi, ApiError, shiftSeed } from '../../js/api/cuentaclara-api.js';

const seed = {
  transactions: JSON.parse(readFileSync(new URL('../../datos/movimientos.json', import.meta.url), 'utf8')).data,
  budgets: JSON.parse(readFileSync(new URL('../../datos/presupuestos.json', import.meta.url), 'utf8')).data,
};

/** Almacén en memoria con la misma interfaz que localStorage. */
function memoryStorage() {
  /** @type {Map<string, string>} */
  const map = new Map();
  return {
    getItem: (/** @type {string} */ k) => map.get(k) ?? null,
    setItem: (/** @type {string} */ k, /** @type {string} */ v) => void map.set(k, v),
    removeItem: (/** @type {string} */ k) => void map.delete(k),
    dump: () => map,
  };
}

/** @param {{ today?: string, failures?: string[] }} [opts] */
function makeApi({ today = '2026-11-20', failures = [] } = {}) {
  const storage = memoryStorage();
  const api = createApi({
    storage,
    loadSeed: async () => seed,
    today: () => today,
    nowIso: () => `${today}T12:00:00-05:00`,
    delayMs: 0,
    failures,
  });
  return { api, storage };
}

const NOVEMBER = { from: '2026-11-01', to: '2026-11-30' };

test('la API siembra los datos de ejemplo y lista el mes sin los eliminados', async () => {
  const { api } = makeApi();
  const list = await api.listTransactions(NOVEMBER);
  assert.equal(list.length, 16);
  assert.ok(list.every((t) => t.description !== 'Almuerzo duplicado'));
  assert.equal(list[0].description, 'Almuerzo menú'); // ordenado: más reciente primero
});

test('la API filtra por categoría y devuelve modelos en soles', async () => {
  const { api } = makeApi();
  const list = await api.listTransactions({ ...NOVEMBER, category: 'leisure' });
  assert.deepEqual(list.map((t) => t.amount).sort((a, b) => a - b), [45, 150]);
});

test('crear un movimiento válido lo guarda como DTO en céntimos y devuelve el modelo', async () => {
  const { api, storage } = makeApi();
  const created = await api.createTransaction({
    type: 'expense', category: 'food', amount: 12.5, date: '2026-11-20', description: 'Jugo',
  });
  assert.equal(created.amount, 12.5);
  const stored = JSON.parse(storage.dump().get('cuentaclara.v1.transactions') ?? '[]');
  const dto = stored.find((/** @type {any} */ d) => d.id === created.id);
  assert.equal(dto.amount, 1250);
  assert.equal(dto.category, 'FOOD');
  assert.equal(dto.deleted_at, null);
});

test('crear un movimiento inválido responde VALIDATION_ERROR con un error por campo', async () => {
  const { api } = makeApi();
  await assert.rejects(
    api.createTransaction({ type: 'expense', category: 'work', amount: 0, date: '2026-11-25', description: ' ' }),
    (/** @type {ApiError} */ e) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.code, 'VALIDATION_ERROR');
      assert.deepEqual(Object.keys(e.fields).sort(), ['amount', 'category', 'date', 'description']);
      return true;
    },
  );
});

test('PATCH actualiza solo los campos enviados y renueva updated_at', async () => {
  const { api } = makeApi();
  const original = await api.getTransaction('txn_0025'); // Almuerzo menú, 18 nov
  const updated = await api.updateTransaction(original, { ...original, amount: 18 });
  assert.equal(updated.amount, 18);
  assert.equal(updated.description, 'Almuerzo menú');
  assert.equal(updated.updatedAt, '2026-11-20T12:00:00-05:00');
});

test('R6: no se puede editar un movimiento de un mes anterior', async () => {
  const { api } = makeApi();
  const october = await api.getTransaction('txn_0002');
  await assert.rejects(api.updateTransaction(october, { ...october, amount: 1 }), { code: 'OUTSIDE_CURRENT_MONTH' });
});

test('R6: al editar no se puede mover la fecha al mes anterior', async () => {
  const { api } = makeApi();
  const original = await api.getTransaction('txn_0025');
  await assert.rejects(api.updateTransaction(original, { ...original, date: '2026-10-30' }), (/** @type {ApiError} */ e) => {
    assert.equal(e.code, 'VALIDATION_ERROR');
    assert.equal(e.fields.date, 'Al editar, la fecha debe ser de este mes.');
    return true;
  });
});

test('eliminar es lógico: deja de listarse pero queda guardado con deleted_at', async () => {
  const { api, storage } = makeApi();
  await api.deleteTransaction('txn_0025');
  const list = await api.listTransactions(NOVEMBER);
  assert.ok(!list.some((t) => t.id === 'txn_0025'));
  const stored = JSON.parse(storage.dump().get('cuentaclara.v1.transactions') ?? '[]');
  assert.equal(stored.find((/** @type {any} */ d) => d.id === 'txn_0025').deleted_at, '2026-11-20T12:00:00-05:00');
  await assert.rejects(api.getTransaction('txn_0025'), { code: 'NOT_FOUND' });
});

test('R6: no se puede eliminar un movimiento de un mes anterior', async () => {
  const { api } = makeApi();
  await assert.rejects(api.deleteTransaction('txn_0002'), { code: 'OUTSIDE_CURRENT_MONTH' });
});

test('R8: la API devuelve el límite vigente de cada mes', async () => {
  const { api } = makeApi();
  const nov = await api.listBudgets('2026-11');
  const oct = await api.listBudgets('2026-10');
  assert.equal(nov.find((b) => b.category === 'leisure')?.limit, 150);
  assert.equal(oct.find((b) => b.category === 'leisure')?.limit, 200);
  assert.equal(nov.find((b) => b.category === 'food')?.limit, 600);
});

test('R8: cambiar un límite vale desde el mes en curso y no toca los meses anteriores', async () => {
  const { api } = makeApi();
  await api.saveBudget('food', 700);
  assert.equal((await api.listBudgets('2026-11')).find((b) => b.category === 'food')?.limit, 700);
  assert.equal((await api.listBudgets('2026-10')).find((b) => b.category === 'food')?.limit, 600);
  assert.equal((await api.listBudgets('2027-01')).find((b) => b.category === 'food')?.limit, 700);
});

test('R7: un límite inválido responde VALIDATION_ERROR', async () => {
  const { api } = makeApi();
  await assert.rejects(api.saveBudget('food', 10_000.01), { code: 'VALIDATION_ERROR' });
});

test('?fallo=movimientos falla solo el primer pedido, así Reintentar funciona', async () => {
  const { api } = makeApi({ failures: ['movimientos'] });
  await assert.rejects(api.listTransactions(NOVEMBER), { code: 'SERVER_ERROR' });
  assert.equal((await api.listTransactions(NOVEMBER)).length, 16);
});

test('shiftSeed corre los datos al mes en curso y ajusta a hoy lo que quedaría en el futuro', () => {
  const shifted = shiftSeed(seed, '2026-12-05');
  const dates = shifted.transactions.map((t) => t.date);
  assert.ok(dates.every((d) => d <= '2026-12-05'));
  assert.ok(dates.some((d) => d.startsWith('2026-11')));
  assert.equal(shifted.budgets.find((b) => b.category === 'LEISURE' && b.limit === 15000)?.effective_from, '2026-12');
  // sin cambio cuando hoy ya está en el último mes de los datos
  assert.deepEqual(shiftSeed(seed, '2026-11-20'), seed);
});

// ---------- HU-03 · quitar un límite (REQ-07, REQ-09) ----------

test('REQ-09: quitar un límite lo saca desde el mes en curso y conserva los meses anteriores', async () => {
  const { api } = makeApi();
  await api.removeBudget('utilities');
  assert.equal((await api.listBudgets('2026-11')).some((b) => b.category === 'utilities'), false);
  assert.equal((await api.listBudgets('2027-03')).some((b) => b.category === 'utilities'), false);
  assert.equal((await api.listBudgets('2026-10')).find((b) => b.category === 'utilities')?.limit, 300);
});

test('REQ-09: quitar un límite definido este mes marca ese registro con deleted_at', async () => {
  const { api, storage } = makeApi();
  await api.removeBudget('leisure'); // Ocio tiene un registro de noviembre
  const stored = JSON.parse(storage.dump().get('cuentaclara.v1.budgets') ?? '[]');
  const nov = stored.filter((/** @type {any} */ b) => b.category === 'LEISURE' && b.effective_from === '2026-11');
  assert.equal(nov.length, 1);
  assert.equal(nov[0].deleted_at, '2026-11-20T12:00:00-05:00');
  assert.equal((await api.listBudgets('2026-10')).find((b) => b.category === 'leisure')?.limit, 200);
});

test('REQ-07: volver a definir un límite quitado en el mismo mes lo reactiva', async () => {
  const { api } = makeApi();
  await api.removeBudget('food');
  await api.saveBudget('food', 450);
  assert.equal((await api.listBudgets('2026-11')).find((b) => b.category === 'food')?.limit, 450);
});

test('REQ-09: quitar una categoría sin límite responde NOT_FOUND', async () => {
  const { api } = makeApi();
  await assert.rejects(api.removeBudget('housing'), { code: 'NOT_FOUND' });
});

test('shiftSeed también corre deleted_at de un límite quitado', () => {
  const withRemoved = {
    transactions: seed.transactions,
    budgets: [{ category: 'FOOD', limit: 60000, effective_from: '2026-11', created_at: '2026-11-01T09:00:00-05:00', updated_at: '2026-11-01T09:00:00-05:00', deleted_at: '2026-11-02T09:00:00-05:00' }],
  };
  const shifted = shiftSeed(/** @type {any} */ (withRemoved), '2026-12-05');
  assert.equal(shifted.budgets[0].effective_from, '2026-12');
  assert.equal(shifted.budgets[0].deleted_at, '2026-12-02T09:00:00-05:00');
});

// ---------- Perfil (añadido): preferencias del dispositivo y datos de ejemplo ----------

test('Perfil: el tema empieza en "Sistema" y se guarda en cuentaclara.v1.preferences', async () => {
  const { api, storage } = makeApi();
  assert.deepEqual(await api.getPreferences(), { theme: 'system' });
  assert.deepEqual(await api.savePreferences({ theme: 'dark' }), { theme: 'dark' });
  assert.deepEqual(await api.getPreferences(), { theme: 'dark' });
  assert.equal(storage.getItem('cuentaclara.v1.preferences'), '{"theme":"dark"}');
});

test('Perfil: un tema desconocido se rechaza al guardar y vuelve a "Sistema" al leer', async () => {
  const { api, storage } = makeApi();
  await assert.rejects(
    api.savePreferences(/** @type {any} */ ({ theme: 'sepia' })),
    (/** @type {ApiError} */ e) => e instanceof ApiError && e.code === 'VALIDATION_ERROR' && 'theme' in e.fields,
  );
  storage.setItem('cuentaclara.v1.preferences', '{"theme":"sepia"}');
  assert.deepEqual(await api.getPreferences(), { theme: 'system' });
  storage.setItem('cuentaclara.v1.preferences', 'no es json');
  assert.deepEqual(await api.getPreferences(), { theme: 'system' });
});

test('Perfil: restablecer vuelve a los datos de ejemplo y conserva el tema', async () => {
  const { api } = makeApi();
  const before = (await api.listTransactions(NOVEMBER)).length;
  await api.createTransaction({ type: 'expense', category: 'food', amount: 12.5, date: '2026-11-20', description: 'Menú de prueba' });
  await api.savePreferences({ theme: 'dark' });
  assert.equal((await api.listTransactions(NOVEMBER)).length, before + 1);
  api.resetDemo();
  assert.equal((await api.listTransactions(NOVEMBER)).length, before);
  assert.deepEqual(await api.getPreferences(), { theme: 'dark' });
});
