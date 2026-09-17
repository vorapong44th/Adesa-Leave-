import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { submitLeave, decideLeave } from '../leaveStore.js';

test('shared transactions prevent duplicate decisions, overdrafts and unauthorized writes', { skip: !process.env.FIRESTORE_EMULATOR_HOST }, async () => {
  const db = getFirestore(initializeApp({ projectId: 'demo-adesa-leave' }, 'integration'));
  const suffix = Date.now().toString();
  const employeeId = 'employee-' + suffix, managerId = 'manager-' + suffix, otherId = 'other-' + suffix;
  const profile = id => ({ id, active: true, role: 'employee', name: id, email: id + '@example.test', department: 'Trade', title: 'Executive', balancesByYear: {} });
  await db.doc('users/' + employeeId).set(profile(employeeId));
  await db.doc('users/' + managerId).set({ ...profile(managerId), role: 'manager' });
  await db.doc('users/' + otherId).set({ ...profile(otherId), role: 'manager', department: 'Other' });
  const data = { id: 'request-' + suffix + '-first', leaveType: 'Annual Leave', startDate: '2026-09-17', endDate: '2026-09-18', isHalfDay: false, reason: 'Holiday', employeeId: 'forged', totalDays: 500 };
  const created = await submitLeave(db, employeeId, data);
  assert.equal(created.employeeId, employeeId);
  assert.equal(created.totalDays, 2);
  assert.equal((await submitLeave(db, employeeId, data)).id, created.id);
  await assert.rejects(() => decideLeave(db, employeeId, { id: created.id, status: 'Approved' }), /authority/);
  await assert.rejects(() => decideLeave(db, otherId, { id: created.id, status: 'Approved' }), /authority/);
  const decisions = await Promise.allSettled([
    decideLeave(db, managerId, { id: created.id, status: 'Approved' }),
    decideLeave(db, managerId, { id: created.id, status: 'Approved' }),
  ]);
  assert.equal(decisions.filter(d => d.status === 'fulfilled').length, 1);
  assert.equal((await db.doc('users/' + employeeId).get()).data().balancesByYear['2026']['Annual Leave'].used, 2);
  assert.equal((await db.doc('requests/' + created.id).get()).data().status, 'Approved');
  assert.equal((await db.collection('users/' + employeeId + '/notifications').get()).size, 1);
  assert.equal((await db.collection('users/' + managerId + '/notifications').get()).size, 1);
  await assert.rejects(() => decideLeave(db, managerId, { id: created.id, status: 'Rejected', managerNote: 'No' }), /already/);
  await assert.rejects(() => decideLeave(db, employeeId, { id: created.id, status: 'Cancelled' }), /already/);
  const second = { ...data, id: 'request-' + suffix + '-second', startDate: '2026-09-21', endDate: '2026-09-22' };
  await submitLeave(db, employeeId, second);
  await db.doc('users/' + employeeId).update({ balancesByYear: { '2026': { 'Annual Leave': { allocated: 14, used: 13 } } } });
  await assert.rejects(() => decideLeave(db, managerId, { id: second.id, status: 'Approved' }), /Insufficient/);
  assert.equal((await db.doc('requests/' + second.id).get()).data().status, 'Pending');
  await db.doc('users/' + managerId).update({ active: false });
  await assert.rejects(() => decideLeave(db, managerId, { id: second.id, status: 'Rejected', managerNote: 'No' }), /enabled/);
  await db.terminate();
});
