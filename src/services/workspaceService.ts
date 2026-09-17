import { calendarDates } from '../../functions/core.js';
import { LeaveRequest } from '../types';

/**
 * Creates an event on the user's primary Google Calendar for an approved leave.
 */
export async function createGoogleCalendarEvent(
  request: LeaveRequest,
  managerName: string,
  accessToken: string
): Promise<{ eventId: string; htmlLink: string }> {


  const eventPayload = {
    summary: `🌴 Leave: ${request.employeeName} (${request.leaveType})`,
    description: [
      `Leave Request Approved:`,
      `• Employee: ${request.employeeName} (${request.employeeEmail})`,
      `• Department: ${request.employeeDepartment}`,
      `• Leave Type: ${request.leaveType}`,
      `• Duration: ${request.startDate} to ${request.endDate} (${request.totalDays} day${request.totalDays > 1 ? 's' : ''}${request.isHalfDay ? ' - ' + (request.halfDayPeriod || 'Half Day') : ''})`,
      `• Reason: ${request.reason}`,
      `• Approved By: ${managerName}`,
      `• Request ID: ${request.id}`,
    ].join('\n'),
    ...calendarDates(request),
    transparency: 'opaque', // Blocks out time on calendar
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 24 * 60 }], // 1 day before
    },
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || response.statusText;
    throw new Error(`Google Calendar API Error (${response.status}): ${message}`);
  }

  const data = await response.json();
  return {
    eventId: data.id,
    htmlLink: data.htmlLink || `https://calendar.google.com/calendar/r/eventedit/${data.id}`,
  };
}

/**
 * Creates a new Google Spreadsheet for yearly leave records.
 */
export async function createYearlyLeaveSheet(
  accessToken: string,
  year = new Date().getFullYear()
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; sheetName: string }> {
  const title = `Company Leave Tracker - ${year}`;
  const sheetName = 'Leave Records';

  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: sheetName,
          gridProperties: {
            frozenRowCount: 1,
            columnCount: 12,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Request ID' } },
                  { userEnteredValue: { stringValue: 'Employee Name' } },
                  { userEnteredValue: { stringValue: 'Employee Email' } },
                  { userEnteredValue: { stringValue: 'Department' } },
                  { userEnteredValue: { stringValue: 'Leave Type' } },
                  { userEnteredValue: { stringValue: 'Start Date' } },
                  { userEnteredValue: { stringValue: 'End Date' } },
                  { userEnteredValue: { stringValue: 'Days' } },
                  { userEnteredValue: { stringValue: 'Reason' } },
                  { userEnteredValue: { stringValue: 'Status' } },
                  { userEnteredValue: { stringValue: 'Approver' } },
                  { userEnteredValue: { stringValue: 'Google Calendar Event' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || response.statusText;
    throw new Error(`Google Sheets API Error (${response.status}): ${message}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl =
    data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { spreadsheetId, spreadsheetUrl, sheetName };
}

/**
 * Appends an approved leave row to the Google Sheet.
 */
export async function appendLeaveToSheet(
  spreadsheetId: string,
  sheetName: string,
  request: LeaveRequest,
  managerName: string,
  calendarLink: string,
  accessToken: string
): Promise<{ updatedRange: string }> {
  const rowValues = [
    request.id,
    request.employeeName,
    request.employeeEmail,
    request.employeeDepartment,
    request.leaveType,
    request.startDate,
    request.endDate,
    request.totalDays,
    request.reason,
    'Approved',
    managerName,
    calendarLink || 'N/A',
  ];

  const range = `'${sheetName.replaceAll("'", "''")}'!A:L`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || response.statusText;
    throw new Error(`Google Sheets API Error (${response.status}): ${message}`);
  }

  const result = await response.json();
  return { updatedRange: result.updates?.updatedRange || range };
}

/**
 * Verifies if a given spreadsheet ID is readable with the current access token.
 */
export async function getSpreadsheetDetails(
  spreadsheetId: string,
  accessToken: string
): Promise<{ title: string; firstSheetName: string }> {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Spreadsheet not found or access denied.');
  }

  const data = await response.json();
  const title = data.properties?.title || 'Spreadsheet';
  const firstSheetName = data.sheets?.[0]?.properties?.title || 'Sheet1';
  return { title, firstSheetName };
}
