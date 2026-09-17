export const POLICY = { 'Annual Leave': 14, 'Business Leave': 3, 'Sick Leave': 30, 'Parental Leave': 30, 'Unpaid Leave': 15 };
export function canApprove(approver, applicant) {
  if (!approver || !applicant || approver.active === false || applicant.active === false || approver.id === applicant.id) return false;
  if (approver.role === 'ceo') return true;
  if (approver.department !== applicant.department) return false;
  if (approver.role === 'head_of_dept') return ['manager', 'employee'].includes(applicant.role);
  return approver.role === 'manager' && applicant.role === 'employee';
}
export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid date.');
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Invalid date.');
  return date;
}
export function workingDays(start, end, halfDay = false) {
  const first = parseDate(start), last = parseDate(end);
  if (first > last) throw new Error('End date cannot precede start date.');
  if (last.getTime() - first.getTime() > 366 * 86400000) throw new Error('Leave period is too long.');
  if (halfDay && start !== end) throw new Error('Half-day leave must be on one date.');
  let days = 0;
  for (let d = first; d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    if (![0, 6].includes(d.getUTCDay())) days++;
  }
  return halfDay ? (days ? 0.5 : 0) : days;
}
export function validateLeave(input) {
  if (!input || !Object.hasOwn(POLICY, input.leaveType)) throw new Error('Invalid leave type.');
  if (typeof input.isHalfDay !== 'boolean') throw new Error('Invalid half-day selection.');
  const totalDays = workingDays(input.startDate, input.endDate, input.isHalfDay);
  if (!totalDays) throw new Error('Selected period does not contain a working day.');
  if (input.startDate.slice(0, 4) !== input.endDate.slice(0, 4)) throw new Error('Submit separate requests for each calendar year.');
  if (typeof input.reason !== 'string' || !input.reason.trim() || input.reason.length > 2000) throw new Error('Enter a reason of 1–2000 characters.');
  if (input.isHalfDay && !['Morning', 'Afternoon'].includes(input.halfDayPeriod)) throw new Error('Select morning or afternoon.');
  const clean = { leaveType: input.leaveType, startDate: input.startDate, endDate: input.endDate, isHalfDay: input.isHalfDay, totalDays, reason: input.reason.trim() };
  if (input.isHalfDay) clean.halfDayPeriod = input.halfDayPeriod;
  for (const key of ['handoverPerson', 'emergencyPhone']) {
    if (input[key] != null && (typeof input[key] !== 'string' || input[key].length > 200)) throw new Error('Contact details are too long.');
    if (input[key]?.trim()) clean[key] = input[key].trim();
  }
  return clean;
}
export function calendarDates(request) {
  if (request.isHalfDay) {
    const morning = request.halfDayPeriod === 'Morning';
    return {
      start: { dateTime: request.startDate + (morning ? 'T09:00:00+07:00' : 'T13:00:00+07:00'), timeZone: 'Asia/Bangkok' },
      end: { dateTime: request.startDate + (morning ? 'T12:00:00+07:00' : 'T17:00:00+07:00'), timeZone: 'Asia/Bangkok' }
    };
  }
  const end = parseDate(request.endDate);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: { date: request.startDate }, end: { date: end.toISOString().slice(0, 10) } };
}
export function assertPending(request) {
  if (!request || request.status !== 'Pending') throw new Error('This request has already been decided or cancelled. Refresh the record.');
}
export function balanceAfterApproval(profile, request) {
  const year = request.startDate.slice(0, 4);
  const balances = { ...(profile.balancesByYear?.[year] || {}) };
  const old = balances[request.leaveType] || { allocated: POLICY[request.leaveType], used: 0 };
  if (!Number.isFinite(old.allocated) || !Number.isFinite(old.used) || old.used + request.totalDays > old.allocated) throw new Error('Insufficient leave balance.');
  balances[request.leaveType] = { ...old, used: old.used + request.totalDays };
  return { ...(profile.balancesByYear || {}), [year]: balances };
}
