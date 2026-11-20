// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAmount,
  validateDate,
  validateCategory,
  validateDescription,
  validateTransaction,
  canEdit,
} from '../js/logic/rules.js';

const TODAY = '2026-11-20';

// ---------- R1 · Monto ----------
test('R1: acepta un monto con 2 decimales y lo devuelve como número', () => {
  assert.deepEqual(validateAmount('25.50'), { ok: true, value: 25.5 });
});

test('R1: acepta coma como separador decimal', () => {
  assert.deepEqual(validateAmount('12,5'), { ok: true, value: 12.5 });
});

test('R1: rechaza 0 y montos negativos', () => {
  assert.equal(validateAmount('0').ok, false);
  assert.equal(validateAmount('-5').ok, false);
});

test('R1: acepta exactamente S/ 10 000 y rechaza S/ 10 000.01', () => {
  assert.equal(validateAmount('10000').ok, true);
  assert.deepEqual(validateAmount('10000.01'), { ok: false, error: 'El monto máximo es S/ 10 000.' });
});

test('R1: rechaza más de 2 decimales con un mensaje claro', () => {
  assert.deepEqual(validateAmount('12.345'), { ok: false, error: 'Usa como máximo 2 decimales.' });
});

test('R1: rechaza un monto vacío o que no es número', () => {
  assert.deepEqual(validateAmount(''), { ok: false, error: 'Escribe un monto.' });
  assert.equal(validateAmount('abc').ok, false);
});

// ---------- R2 · Fecha ----------
test('R2: acepta hoy y rechaza mañana', () => {
  assert.equal(validateDate('2026-11-20', TODAY).ok, true);
  assert.deepEqual(validateDate('2026-11-21', TODAY), { ok: false, error: 'La fecha no puede ser futura.' });
});

test('R2: acepta hace 60 días y rechaza hace 61', () => {
  assert.equal(validateDate('2026-09-21', TODAY).ok, true);
  assert.deepEqual(validateDate('2026-09-20', TODAY), {
    ok: false,
    error: 'La fecha debe estar dentro de los últimos 60 días.',
  });
});

test('R2: rechaza una fecha vacía o imposible', () => {
  assert.equal(validateDate('', TODAY).ok, false);
  assert.equal(validateDate('2026-02-30', TODAY).ok, false);
});

// ---------- R6 · Fecha al editar ----------
test('R6: al editar, la fecha debe quedar en el mes en curso', () => {
  assert.equal(validateDate('2026-11-01', TODAY, { editing: true }).ok, true);
  assert.deepEqual(validateDate('2026-10-31', TODAY, { editing: true }), {
    ok: false,
    error: 'Al editar, la fecha debe ser de este mes.',
  });
});

// ---------- R3 · Categoría ----------
test('R3: la categoría debe corresponder al tipo', () => {
  assert.equal(validateCategory('expense', 'food').ok, true);
  assert.equal(validateCategory('income', 'work').ok, true);
  assert.equal(validateCategory('expense', 'work').ok, false);
  assert.deepEqual(validateCategory('expense', ''), { ok: false, error: 'Elige una categoría.' });
});

// ---------- R4 · Descripción ----------
test('R4: la descripción es obligatoria y no cuenta los espacios de los extremos', () => {
  assert.deepEqual(validateDescription('   '), { ok: false, error: 'Escribe una descripción.' });
  assert.deepEqual(validateDescription('  Taxi  '), { ok: true, value: 'Taxi' });
});

test('R4: acepta 60 caracteres y rechaza 61', () => {
  assert.equal(validateDescription('a'.repeat(60)).ok, true);
  assert.deepEqual(validateDescription('a'.repeat(61)), { ok: false, error: 'Usa como máximo 60 caracteres.' });
});

// ---------- Formulario completo ----------
test('validateTransaction devuelve el movimiento limpio si todo es válido', () => {
  const result = validateTransaction(
    { type: 'expense', category: 'food', amount: '15', date: '2026-11-18', description: ' Almuerzo ' },
    TODAY,
  );
  assert.deepEqual(result, {
    ok: true,
    value: { type: 'expense', category: 'food', amount: 15, date: '2026-11-18', description: 'Almuerzo' },
    errors: {},
  });
});

test('validateTransaction junta un error por cada campo inválido', () => {
  const result = validateTransaction(
    { type: 'expense', category: '', amount: '12.345', date: '2026-11-18', description: '' },
    TODAY,
  );
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ['amount', 'category', 'description']);
});

// ---------- R6 · Editar o eliminar ----------
test('R6: solo se puede editar o eliminar un movimiento del mes en curso', () => {
  assert.equal(canEdit({ date: '2026-11-01' }, TODAY), true);
  assert.equal(canEdit({ date: '2026-10-31' }, TODAY), false);
});
