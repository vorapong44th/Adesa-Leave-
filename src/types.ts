import { canApprove } from '../functions/core.js';
export type LeaveType =
  | 'Annual Leave'
  | 'Business Leave'
  | 'Sick Leave'
  | 'Parental Leave'
  | 'Unpaid Leave'
  | 'Personal Leave';

export const COMPANY_LEAVE_POLICY: Record<string, { allocated: number; label: string; description: string }> = {
  'Annual Leave': {
    allocated: 14,
    label: 'Annual Leave',
    description: '14 days per calendar year for vacation and recreation',
  },
  'Business Leave': {
    allocated: 3,
    label: 'Business Leave',
    description: '3 days per calendar year for private business, government affairs, or personal errands',
  },
  'Sick Leave': {
    allocated: 30,
    label: 'Sick Leave',
    description: '30 days per calendar year for illness recovery and medical appointments',
  },
  'Parental Leave': {
    allocated: 30,
    label: 'Parental Leave',
    description: 'Maternity, paternity, or adoption leave',
  },
  'Unpaid Leave': {
    allocated: 15,
    label: 'Unpaid Leave',
    description: 'Extended leave without salary pay',
  },
};

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type ThemeMode = 'light' | 'warm' | 'dark';

export type UserRole = 'ceo' | 'head_of_dept' | 'manager' | 'employee';

export interface LeaveBalance {
  allocated: number;
  used: number;
}

export interface UserProfile {
  id: string;
  active?: boolean;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  title: string;
  hierarchyLevel: number; // 100: CEO, 50: Head of Department, 30: BD Manager, 10: Executive
  avatar: string;
  balances: Record<LeaveType, LeaveBalance>;
}

export interface ApprovalPermission {
  canApprove: boolean;
  reason?: string;
  isSelf?: boolean;
}

// The server repeats this policy using trusted employee profiles.
export function checkApprovalPermission(approver: UserProfile, request: LeaveRequest, applicant?: UserProfile): ApprovalPermission {
  if (request.status !== 'Pending') return { canApprove: false, reason: 'This request is already decided or cancelled.' };
  if (approver.id === request.employeeId) return { canApprove: false, isSelf: true, reason: 'Self-approval is not allowed.' };
  const allowed = canApprove(approver, applicant);
  return { canApprove: allowed, reason: allowed ? 'Authorized approver.' : 'This request requires an authorized superior.' };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeDepartment: string;
  employeeTitle: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isHalfDay: boolean;
  halfDayPeriod?: 'Morning' | 'Afternoon';
  totalDays: number;
  reason: string;
  handoverPerson?: string;
  emergencyPhone?: string;
  submittedAt: string; // ISO string
  status: LeaveStatus;
  decisionAt?: string;
  decisionBy?: string;
  managerNote?: string;
  calendarEventId?: string;
  calendarEventLink?: string;
  sheetRowAppended?: boolean;
  sync?: { calendar: string; sheets: string };
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  requestId: string;
  type: 'leave_submitted' | 'leave_approved' | 'leave_rejected';
  targetRole: 'employee' | 'manager';
  employeeName: string;
}

export interface WorkspaceConfig {
  sheetId: string;
  sheetName: string;
  sheetUrl: string;
  calendarId: string;
  autoSyncCalendar: boolean;
  autoSyncSheets: boolean;
  lastSyncedAt?: string;
}
