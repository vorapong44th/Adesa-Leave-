import { createHash } from 'node:crypto';
import { calendarDates } from './core.js';

async function google(url, token, body) {
  const response = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Google returned ' + response.status + '. Reconnect or check access to the configured resource.');
  return result;
}
export async function syncApproval(request, config, token) {
  const sync = { calendar: 'disabled', sheets: 'disabled' };
  const result = { sync, sheetRowAppended: false };
  for (const [key, enabled] of [['calendar', config.autoSyncCalendar], ['sheets', config.autoSyncSheets]]) {
    if (!enabled) continue;
    if (!token) { sync[key] = 'needs_connection'; continue; }
    try {
      if (key === 'calendar') {
        // Stable event ID protects against duplicate events if a response is lost.
        const id = createHash('sha256').update(request.id).digest('hex');
        const event = await google('https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(config.calendarId || 'primary') + '/events', token, {
          id, summary: 'Leave: ' + request.employeeName + ' (' + request.leaveType + ')',
          description: 'Approved by ' + request.decisionBy + '. Request: ' + request.id,
          ...calendarDates(request), transparency: 'opaque'
        });
        result.calendarEventId = event.id;
        result.calendarEventLink = event.htmlLink || '';
      } else {
        if (!config.sheetId || !config.sheetName) { sync.sheets = 'needs_configuration'; continue; }
        const range = "'" + config.sheetName.replaceAll("'", "''") + "'!A:L";
        await google('https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(config.sheetId) + '/values/' + encodeURIComponent(range) + ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS', token, {
          values: [[request.id, request.employeeName, request.employeeEmail, request.employeeDepartment,
            request.leaveType, request.startDate, request.endDate, request.totalDays, request.reason,
            'Approved', request.decisionBy, result.calendarEventLink || '']]
        });
        result.sheetRowAppended = true;
      }
      sync[key] = 'synced';
    } catch {
      // An ambiguous network failure may have committed remotely: do not auto-retry an append.
      sync[key] = 'needs_review';
    }
  }
  return result;
}
