import test from 'node:test';
import assert from 'node:assert/strict';
import { canApprove, workingDays, calendarDates, validateLeave, assertPending, balanceAfterApproval } from '../core.js';
const employee = { id: 'employee', role: 'employee', department: 'Trade' };
const request = { leaveType: 'Annual Leave', startDate: '2026-09-17', endDate: '2026-09-18', isHalfDay: false, reason: 'Holiday' };
test('authority comes only from role, department and identity', () => {
  assert.equal(canApprove({ id: 'manager', role: 'manager', department: 'Trade' }, employee), true);
  assert.equal(canApprove({ id: 'manager', role: 'manager', department: 'Other' }, employee), false);
  assert.equal(canApprove({ ...employee, title: 'CEO', name: 'Vorapong' }, { ...employee, id: 'other' }), false);
  assert.equal(canApprove({ ...employee, role: 'ceo' }, employee), false);
  assert.equal(canApprove({ id: 'ceo', role: 'ceo' }, employee), true);
  assert.equal(canApprove({ id: 'ceo', role: 'ceo', active: false }, employee), false);
  assert.equal(canApprove({ id: 'manager', role: 'manager', department: 'Trade' }), false);
});
test('all-day calendar end includes the final day in all host time zones', () => {
  for (const TZ of ['UTC', 'Asia/Bangkok', 'America/Los_Angeles']) {
    process.env.TZ = TZ;
    assert.deepEqual(calendarDates(request), { start: { date: '2026-09-17' }, end: { date: '2026-09-19' } });
    assert.equal(calendarDates({ ...request, endDate: '2026-12-31' }).end.date, '2027-01-01');
  }
});
test('half-day events have Bangkok time ranges', () => {
  const morning = calendarDates({ ...request, isHalfDay: true, halfDayPeriod: 'Morning' });
  const afternoon = calendarDates({ ...request, isHalfDay: true, halfDayPeriod: 'Afternoon' });
  assert.equal(morning.start.dateTime, '2026-09-17T09:00:00+07:00');
  assert.equal(morning.end.dateTime, '2026-09-17T12:00:00+07:00');
  assert.equal(afternoon.start.dateTime, '2026-09-17T13:00:00+07:00');
  assert.equal(afternoon.end.dateTime, '2026-09-17T17:00:00+07:00');
});
test('validation rejects weekends, invalid dates, cross-year and malformed leave', () => {
  assert.equal(workingDays('2026-09-18', '2026-09-21'), 2);
  assert.equal(workingDays('2026-09-19', '2026-09-19', true), 0);
  assert.throws(() => validateLeave({ ...request, startDate: '2026-02-30' }));
  assert.throws(() => validateLeave({ ...request, startDate: '2026-12-31', endDate: '2027-01-01' }));
  assert.throws(() => validateLeave({ ...request, isHalfDay: true }));
  assert.throws(() => validateLeave({ ...request, leaveType: 'Other' }));
  assert.throws(() => validateLeave({ ...request, reason: '' }));
  assert.equal(validateLeave({ ...request, totalDays: 900 }).totalDays, 2);
});
test('only pending requests can be decided', () => {
  assert.doesNotThrow(() => assertPending({ status: 'Pending' }));
  for (const status of ['Approved', 'Rejected', 'Cancelled']) assert.throws(() => assertPending({ status }));
});
test('balances are year-specific, capped and never mutate input', () => {
  const profile = { balancesByYear: { '2026': { 'Annual Leave': { allocated: 14, used: 13 } } } };
  const leave = { ...request, totalDays: 1 };
  assert.equal(balanceAfterApproval(profile, leave)['2026']['Annual Leave'].used, 14);
  assert.equal(profile.balancesByYear['2026']['Annual Leave'].used, 13);
  assert.throws(() => balanceAfterApproval(profile, { ...leave, totalDays: 2 }));
  assert.equal(balanceAfterApproval(profile, { ...leave, startDate: '2027-01-01' })['2027']['Annual Leave'].used, 1);
});
