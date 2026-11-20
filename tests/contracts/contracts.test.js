// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ContractError,
  toTransaction,
  toTransactionList,
  toTransactionDTO,
  toTransactionPatch,
  toBudget,
} from '../../js/contracts/mappers.js';
import { toCents, formatMoney } from '../../js/utils/money.js';

/** @type {import('../../js/contracts/dto.js').TransactionDTO} */
const lunchDTO = {
  id: 'txn_0025',
  type: 'EXPENSE',
  category: 'FOOD',
  amount: 1550,
  date: '2026-11-18',
  description: 'Almuerzo menú',
  created_at: '2026-11-18T13:05:00-05:00',
  updated_at: '2026-11-18T13:05:00-05:00',
  deleted_at: null,
};

test('toTransaction convierte céntimos a soles y enumeraciones a minúsculas', () => {
  const t = toTransaction(lunchDTO);
  assert.equal(t.amount, 15.5);
  assert.equal(t.type, 'expense');
  assert.equal(t.category, 'food');
  assert.equal(t.date, '2026-11-18');
  assert.equal(t.createdAt, '2026-11-18T13:05:00-05:00');
});

test('toTransaction lanza ContractError si el monto no es un entero en céntimos', () => {
  assert.throws(() => toTransaction({ ...lunchDTO, amount: 15.5 }), ContractError);
});

test('toTransaction lanza ContractError si el monto pasa de S/ 10 000', () => {
  assert.throws(() => toTransaction({ ...lunchDTO, amount: 1_000_001 }), ContractError);
});

test('toTransaction lanza ContractError si la categoría no corresponde al tipo', () => {
  assert.throws(() => toTransaction({ ...lunchDTO, category: 'WORK' }), ContractError);
});

test('toTransaction lanza ContractError si la fecha no es YYYY-MM-DD', () => {
  assert.throws(() => toTransaction({ ...lunchDTO, date: '18/11/2026' }), ContractError);
});

test('el mensaje de ContractError nombra el DTO, el campo y el valor recibido', () => {
  assert.throws(
    () => toTransaction({ ...lunchDTO, amount: 15.5 }),
    /TransactionDTO\.amount no cumple el contrato v1 \(llegó 15\.5\)/,
  );
});

test('toTransactionList descarta los movimientos con deleted_at', () => {
  const deleted = { ...lunchDTO, id: 'txn_0026', deleted_at: '2026-11-18T14:00:00-05:00' };
  const list = toTransactionList([lunchDTO, deleted]);
  assert.deepEqual(list.map((t) => t.id), ['txn_0025']);
});

test('toTransactionDTO convierte soles a céntimos sin error de coma flotante', () => {
  const body = toTransactionDTO({
    type: 'expense',
    category: 'food',
    amount: 0.29,
    date: '2026-11-18',
    description: '  Chicle  ',
  });
  assert.equal(body.amount, 29);
  assert.equal(body.type, 'EXPENSE');
  assert.equal(body.category, 'FOOD');
  assert.equal(body.description, 'Chicle');
});

test('toTransactionPatch envía solo los campos que cambiaron, en forma de contrato', () => {
  const original = toTransaction(lunchDTO);
  const patch = toTransactionPatch(original, { ...original, amount: 18, description: 'Almuerzo + postre' });
  assert.deepEqual(patch, { amount: 1800, description: 'Almuerzo + postre' });
});

test('toTransactionPatch devuelve un objeto vacío si nada cambió', () => {
  const original = toTransaction(lunchDTO);
  assert.deepEqual(toTransactionPatch(original, { ...original }), {});
});

test('toBudget convierte el límite a soles y conserva el mes de vigencia', () => {
  const b = toBudget({
    category: 'LEISURE',
    limit: 15000,
    effective_from: '2026-11',
    created_at: '2026-11-01T09:00:00-05:00',
    updated_at: '2026-11-01T09:00:00-05:00',
  });
  assert.deepEqual(b, { category: 'leisure', limit: 150, effectiveFrom: '2026-11' });
});

test('toBudget rechaza una categoría de ingreso', () => {
  assert.throws(
    () => toBudget({ category: 'WORK', limit: 100, effective_from: '2026-11', created_at: '', updated_at: '' }),
    ContractError,
  );
});

test('toCents redondea al céntimo más cercano', () => {
  assert.equal(toCents(19.99), 1999);
  assert.equal(toCents(10000), 1_000_000);
});

test('formatMoney usa S/, separador de miles con espacio y 2 decimales', () => {
  assert.equal(formatMoney(1800), 'S/ 1 800.00');
  assert.equal(formatMoney(15.5), 'S/ 15.50');
  assert.equal(formatMoney(-45), 'S/ 45.00');
});

// ---------- HU-03 · registros de presupuesto (REQ-09) ----------
import { toBudgetRecord } from '../../js/contracts/mappers.js';

test('toBudgetRecord marca como quitado un registro con deleted_at', () => {
  const base = { category: /** @type {const} */ ('LEISURE'), limit: 15000, effective_from: '2026-11', created_at: '', updated_at: '' };
  assert.deepEqual(toBudgetRecord(base), { category: 'leisure', limit: 150, effectiveFrom: '2026-11', removed: false });
  assert.deepEqual(toBudgetRecord({ ...base, deleted_at: '2026-11-20T12:00:00-05:00' }), {
    category: 'leisure', limit: 150, effectiveFrom: '2026-11', removed: true,
  });
});

test('toBudgetRecord valida el límite igual que toBudget', () => {
  assert.throws(
    () => toBudgetRecord({ category: 'FOOD', limit: 0, effective_from: '2026-11', created_at: '', updated_at: '', deleted_at: null }),
    ContractError,
  );
});
