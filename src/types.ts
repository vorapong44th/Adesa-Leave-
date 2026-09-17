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

/**
 * Validates whether the logged-in user has organizational authority to approve a leave request:
 * - CEO (Zorro, James): Can view all records and approve everyone.
 * - Vorapong (Head of Department): Can approve from BD downward (Onuma, Cherngchao, Sasiwan).
 * - BD Managers (Onuma, Cherngchao): Can review their team requests (e.g., Sasiwan).
 * - Self-approval is strictly forbidden (e.g., Vorapong cannot approve his own leave; requires CEO).
 */
export function checkApprovalPermission(
  approver: UserProfile,
  request: LeaveRequest,
  applicant?: UserProfile
): ApprovalPermission {
  if (approver.id === request.employeeId) {
    return {
      canApprove: false,
      reason: 'Self-approval is not allowed. Your leave request must be approved by your superior or CEO.',
      isSelf: true,
    };
  }

  // CEO rule: "CEO shall be able to see all the record and approval every one"
  if (approver.role === 'ceo' || approver.title.toUpperCase().includes('CEO')) {
    return {
      canApprove: true,
      reason: 'CEO Executive Authority: Can approve any team member.',
    };
  }

  // Vorapong rule: "while Vorapong can approve from BD downward"
  if (approver.role === 'head_of_dept' || approver.name.toLowerCase().includes('vorapong')) {
    const isApplicantCeo =
      applicant?.role === 'ceo' ||
      applicant?.hierarchyLevel === 100 ||
      request.employeeTitle.toUpperCase().includes('CEO');

    if (isApplicantCeo) {
      return {
        canApprove: false,
        reason: 'Requires CEO approval. Head of Department has authority from BD downward.',
      };
    }

    // BD downward includes BD Managers (level 30) and Executives (level 10)
    return {
      canApprove: true,
      reason: 'Head of Department Authority: Can approve from BD downward.',
    };
  }

  // BD Managers (Onuma, Cherngchao)
  if (approver.role === 'manager') {
    const applicantLevel = applicant ? applicant.hierarchyLevel : 10;
    if (applicantLevel < approver.hierarchyLevel) {
      return {
        canApprove: true,
        reason: 'BD Manager Authority: Approving team executive.',
      };
    }
    return {
      canApprove: false,
      reason: 'Requires Head of Department (Vorapong) or CEO approval.',
    };
  }

  return {
    canApprove: false,
    reason: 'Only Department Supervisors and CEOs have approval permissions.',
  };
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
