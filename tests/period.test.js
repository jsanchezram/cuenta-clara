// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  currentMonth,
  monthPeriod,
  shiftMonth,
  periodFromShortcut,
  validateRange,
  addDays,
} from '../js/logic/period.js';
import { todayInLima } from '../js/utils/lima-date.js';

const TODAY = '2026-11-20'; // viernes

test('el mes en curso sale de la fecha de hoy', () => {
  assert.equal(currentMonth(TODAY), '2026-11');
});

test('monthPeriod cubre del día 1 al último día del mes', () => {
  assert.deepEqual(monthPeriod('2026-02'), { kind: 'month', from: '2026-02-01', to: '2026-02-28' });
  assert.deepEqual(monthPeriod('2026-11'), { kind: 'month', from: '2026-11-01', to: '2026-11-30' });
});

test('shiftMonth cruza el cambio de año', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
});

test('addDays resta días cruzando meses', () => {
  assert.equal(addDays('2026-11-20', -60), '2026-09-21');
});

test('atajo Hoy: solo el día de hoy', () => {
  assert.deepEqual(periodFromShortcut('TODAY', TODAY), { kind: 'day', from: TODAY, to: TODAY });
});

test('atajo Esta semana: del lunes a hoy', () => {
  assert.deepEqual(periodFromShortcut('WEEK', TODAY), { kind: 'range', from: '2026-11-16', to: TODAY });
  // un lunes: la semana es solo ese día
  assert.deepEqual(periodFromShortcut('WEEK', '2026-11-16'), { kind: 'range', from: '2026-11-16', to: '2026-11-16' });
  // un domingo: desde el lunes anterior
  assert.equal(periodFromShortcut('WEEK', '2026-11-22').from, '2026-11-16');
});

test('atajo Este mes: el mes en curso completo', () => {
  assert.deepEqual(periodFromShortcut('MONTH', TODAY), monthPeriod('2026-11'));
});

test('HU01-13: el rango se valida, desde ≤ hasta y hasta ≤ hoy', () => {
  assert.deepEqual(validateRange('2026-11-01', '2026-11-15', TODAY), {
    ok: true,
    value: { kind: 'range', from: '2026-11-01', to: '2026-11-15' },
    errors: {},
  });
  assert.deepEqual(validateRange('2026-11-15', '2026-11-01', TODAY).errors, {
    to: '"Hasta" no puede ser anterior a "Desde".',
  });
  assert.deepEqual(validateRange('2026-11-01', '2026-11-25', TODAY).errors, {
    to: '"Hasta" no puede ser una fecha futura.',
  });
  assert.equal(validateRange('', '2026-11-15', TODAY).errors.from, 'Elige la fecha "Desde".');
});

test('todayInLima usa la hora de Lima y no la de la PC', () => {
  // 2026-11-21 03:00 UTC son todavía las 22:00 del 20 en Lima
  assert.equal(todayInLima(new Date('2026-11-21T03:00:00Z')), '2026-11-20');
  assert.equal(todayInLima(new Date('2026-11-21T05:00:00Z')), '2026-11-21');
});
