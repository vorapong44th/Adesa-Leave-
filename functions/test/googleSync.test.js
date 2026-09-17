import test from 'node:test';
import assert from 'node:assert/strict';
import { syncApproval } from '../googleSync.js';
const request = { id: 'request-one', employeeName: 'Employee', employeeEmail: 'person@example.test', employeeDepartment: 'Trade', leaveType: 'Annual Leave', startDate: '2026-09-17', endDate: '2026-09-18', totalDays: 2, reason: '=1+1', decisionBy: 'Manager' };
test('no token never reports successful synchronization', async () => {
  const result = await syncApproval(request, { autoSyncCalendar: true, autoSyncSheets: true }, null);
  assert.deepEqual(result.sync, { calendar: 'needs_connection', sheets: 'needs_connection' });
});
test('disabled integrations do not claim sync', async () => {
  assert.deepEqual((await syncApproval(request, {}, null)).sync, { calendar: 'disabled', sheets: 'disabled' });
});
test('calendar uses selected calendar and Sheets uses literal input', async () => {
  const original = global.fetch, calls = [];
  global.fetch = async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return { ok: true, json: async () => ({ id: 'event', htmlLink: 'https://calendar.google.com/event' }) }; };
  try {
    const result = await syncApproval(request, { autoSyncCalendar: true, calendarId: 'team@example.test', autoSyncSheets: true, sheetId: 'sheet', sheetName: "Team's Leave" }, 'token');
    assert.deepEqual(result.sync, { calendar: 'synced', sheets: 'synced' });
    assert.match(calls[0].url, /team%40example.test/);
    assert.equal(calls[0].body.end.date, '2026-09-19');
    assert.match(calls[1].url, /valueInputOption=RAW/);
    assert.equal(calls[1].body.values[0][8], '=1+1');
  } finally { global.fetch = original; }
});
test('partial failure is visible and not retried', async () => {
  const original = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls++; throw new Error('Timeout'); };
  try {
    const result = await syncApproval(request, { autoSyncCalendar: true, autoSyncSheets: true, sheetId: 'sheet', sheetName: 'Leave' }, 'token');
    assert.deepEqual(result.sync, { calendar: 'needs_review', sheets: 'needs_review' });
    assert.equal(result.sheetRowAppended, false);
    assert.equal(calls, 2);
  } finally { global.fetch = original; }
});
