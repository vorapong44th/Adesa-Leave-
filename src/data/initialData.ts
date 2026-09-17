import { LeaveRequest, PushNotification, UserProfile, WorkspaceConfig } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-zorro',
    name: 'Zorro',
    email: 'zorro@adesaventures.com',
    role: 'ceo',
    department: 'Global Trade',
    title: 'CEO',
    hierarchyLevel: 100,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    balances: {
      'Annual Leave': { allocated: 14, used: 2 },
      'Business Leave': { allocated: 3, used: 2 },
      'Sick Leave': { allocated: 30, used: 0 },
      'Parental Leave': { allocated: 30, used: 0 },
      'Unpaid Leave': { allocated: 15, used: 0 },
      'Personal Leave': { allocated: 3, used: 0 },
    },
  },
  {
    id: 'user-james',
    name: 'James',
    email: 'james@adesaventures.com',
    role: 'ceo',
    department: 'Global Trade',
    title: 'CEO',
    hierarchyLevel: 100,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    balances: {
      'Annual Leave': { allocated: 14, used: 3 },
      'Business Leave': { allocated: 3, used: 0 },
      'Sick Leave': { allocated: 30, used: 0 },
      'Parental Leave': { allocated: 30, used: 0 },
      'Unpaid Leave': { allocated: 15, used: 0 },
      'Personal Leave': { allocated: 3, used: 0 },
    },
  },
  {
    id: 'user-vorapong',
    name: 'Vorapong',
    email: 'vorapong.a@adesaventures.com',
    role: 'head_of_dept',
    department: 'Global Trade',
    title: 'Head of Department',
    hierarchyLevel: 50,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    balances: {
      'Annual Leave': { allocated: 14, used: 4 },
      'Business Leave': { allocated: 3, used: 1 },
      'Sick Leave': { allocated: 30, used: 1 },
      'Parental Leave': { allocated: 30, used: 0 },
      'Unpaid Leave': { allocated: 15, used: 0 },
      'Personal Leave': { allocated: 3, used: 0 },
    },
  },
  {
    id: 'user-onuma',
    name: 'Onuma',
    email: 'onuma@adesaventures.com',
    role: 'manager',
    department: 'Global Trade',
    title: 'Sourcing BD Manager',
    hierarchyLevel: 30,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    balances: {
      'Annual Leave': { allocated: 14, used: 5 },
      'Business Leave': { allocated: 3, used: 1 },
      'Sick Leave': { allocated: 30, used: 2 },
      'Parental Leave': { allocated: 30, used: 0 },
      'Unpaid Leave': { allocated: 15, used: 0 },
      'Personal Leave': { allocated: 3, used: 0 },
    },
  },
  {
    id: 'user-cherngchao',
    name: 'Cherngchao',
    email: 'cherngchao@adesaventures.com',
    role: 'manager',
    department: 'Global Trade',
    title: 'Selling BD Manager',
    hierarchyLevel: 30,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    balances: {
      'Annual Leave': { allocated: 14, used: 3 },
      'Business Leave': { allocated: 3, used: 0 },
      'Sick Leave': { allocated: 30, used: 1 },
      'Parental Leave': { allocated: 30, used: 0 },
      'Unpaid Leave': { allocated: 15, used: 0 },
      'Personal Leave': { allocated: 3, used: 0 },
    },
  },
  {
    id: 'user-sasiwan',
    name: 'Sasiwan',
    email: 'sasiwan@adesaventures.com',
    role: 'employee',
    department: 'Global Trade',
    title: 'Sourcing Executive',
    hierarchyLevel: 10,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    balances: {
      'Annual Leave': { allocated: 14, used: 2 },
      'Business Leave': { allocated: 3, used: 1 },
      'Sick Leave': { allocated: 30, used: 3 },
      'Parental Leave': { allocated: 30, used: 0 },
      'Unpaid Leave': { allocated: 15, used: 0 },
      'Personal Leave': { allocated: 3, used: 0 },
    },
  },
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'LV-2026-101',
    employeeId: 'user-sasiwan',
    employeeName: 'Sasiwan',
    employeeEmail: 'sasiwan@adesaventures.com',
    employeeDepartment: 'Global Trade',
    employeeTitle: 'Sourcing Executive',
    leaveType: 'Business Leave',
    startDate: '2026-09-10',
    endDate: '2026-09-10',
    isHalfDay: false,
    totalDays: 1,
    reason: 'Customs clearance processing and official certificate submission at Bangkok Port.',
    handoverPerson: 'Onuma (Sourcing BD Manager)',
    emergencyPhone: '+66 81 234 5678',
    submittedAt: '2026-09-03T09:15:00Z',
    status: 'Pending',
  },
  {
    id: 'LV-2026-102',
    employeeId: 'user-onuma',
    employeeName: 'Onuma',
    employeeEmail: 'onuma@adesaventures.com',
    employeeDepartment: 'Global Trade',
    employeeTitle: 'Sourcing BD Manager',
    leaveType: 'Annual Leave',
    startDate: '2026-09-17',
    endDate: '2026-09-18',
    isHalfDay: false,
    totalDays: 2,
    reason: 'Annual family leave; supplier pipeline handover completed with Sasiwan.',
    handoverPerson: 'Sasiwan (Sourcing Executive)',
    emergencyPhone: '+66 82 345 6789',
    submittedAt: '2026-09-03T10:30:00Z',
    status: 'Pending',
  },
  {
    id: 'LV-2026-103',
    employeeId: 'user-vorapong',
    employeeName: 'Vorapong',
    employeeEmail: 'vorapong.a@adesaventures.com',
    employeeDepartment: 'Global Trade',
    employeeTitle: 'Head of Department',
    leaveType: 'Annual Leave',
    startDate: '2026-09-23',
    endDate: '2026-09-25',
    isHalfDay: false,
    totalDays: 3,
    reason: 'Annual family trip; department trade operations delegated to BD Managers Onuma & Cherngchao.',
    handoverPerson: 'Onuma & Cherngchao (BD Managers)',
    emergencyPhone: '+66 83 456 7890',
    submittedAt: '2026-09-03T11:00:00Z',
    status: 'Pending',
  },
  {
    id: 'LV-2026-104',
    employeeId: 'user-cherngchao',
    employeeName: 'Cherngchao',
    employeeEmail: 'cherngchao@adesaventures.com',
    employeeDepartment: 'Global Trade',
    employeeTitle: 'Selling BD Manager',
    leaveType: 'Sick Leave',
    startDate: '2026-09-04',
    endDate: '2026-09-04',
    isHalfDay: false,
    totalDays: 1,
    reason: 'Severe seasonal flu and high fever; medical certificate submitted.',
    handoverPerson: 'Vorapong (Head of Dept)',
    emergencyPhone: '+66 84 567 8901',
    submittedAt: '2026-09-02T08:00:00Z',
    status: 'Approved',
    decisionAt: '2026-09-02T08:30:00Z',
    decisionBy: 'Vorapong',
    managerNote: 'Approved. Rest well and recover quickly!',
    calendarEventId: 'mock-cal-104',
    calendarEventLink: 'https://calendar.google.com',
    sheetRowAppended: true,
  },
  {
    id: 'LV-2026-105',
    employeeId: 'user-zorro',
    employeeName: 'Zorro',
    employeeEmail: 'zorro@adesaventures.com',
    employeeDepartment: 'Global Trade',
    employeeTitle: 'CEO',
    leaveType: 'Business Leave',
    startDate: '2026-10-01',
    endDate: '2026-10-02',
    isHalfDay: false,
    totalDays: 2,
    reason: 'Adesa Ventures Regional Trade Summit in Singapore and investor meetings.',
    handoverPerson: 'James (CEO)',
    emergencyPhone: '+66 85 678 9012',
    submittedAt: '2026-09-01T09:00:00Z',
    status: 'Approved',
    decisionAt: '2026-09-01T09:45:00Z',
    decisionBy: 'James',
    managerNote: 'Approved. Safe travels for the summit!',
    calendarEventId: 'mock-cal-105',
    calendarEventLink: 'https://calendar.google.com',
    sheetRowAppended: true,
  },
  {
    id: 'LV-2026-106',
    employeeId: 'user-cherngchao',
    employeeName: 'Cherngchao',
    employeeEmail: 'cherngchao@adesaventures.com',
    employeeDepartment: 'Global Trade',
    employeeTitle: 'Selling BD Manager',
    leaveType: 'Business Leave',
    startDate: '2026-09-15',
    endDate: '2026-09-15',
    isHalfDay: false,
    totalDays: 1,
    reason: 'Official trade negotiation with overseas agricultural buyer delegation.',
    handoverPerson: 'Vorapong (Head of Dept)',
    emergencyPhone: '+66 84 567 8901',
    submittedAt: '2026-09-03T14:00:00Z',
    status: 'Pending',
  },
];

export const INITIAL_NOTIFICATIONS: PushNotification[] = [
  {
    id: 'notif-1',
    title: 'New Leave Request: Sasiwan (Sourcing Executive)',
    message: 'Sasiwan requested 1 day Business Leave on Sep 10 (Customs clearance processing).',
    timestamp: '2026-09-03T09:15:00Z',
    read: false,
    requestId: 'LV-2026-101',
    type: 'leave_submitted',
    targetRole: 'manager',
    employeeName: 'Sasiwan',
  },
  {
    id: 'notif-2',
    title: 'New Leave Request: Onuma (Sourcing BD Manager)',
    message: 'Onuma requested 2 days Annual Leave (Sep 17 - Sep 18).',
    timestamp: '2026-09-03T10:30:00Z',
    read: false,
    requestId: 'LV-2026-102',
    type: 'leave_submitted',
    targetRole: 'manager',
    employeeName: 'Onuma',
  },
  {
    id: 'notif-3',
    title: 'Executive Approval Needed: Vorapong (Head of Department)',
    message: 'Vorapong requested 3 days Annual Leave (Sep 23 - Sep 25). Requires CEO approval (Zorro or James).',
    timestamp: '2026-09-03T11:00:00Z',
    read: false,
    requestId: 'LV-2026-103',
    type: 'leave_submitted',
    targetRole: 'manager',
    employeeName: 'Vorapong',
  },
];

const STORAGE_KEYS = {
  REQUESTS: 'leave_mgmt_requests_v3',
  NOTIFICATIONS: 'leave_mgmt_notifications_v3',
  USERS: 'leave_mgmt_users_v3',
  WORKSPACE: 'leave_mgmt_workspace_v2',
  ACTIVE_USER_ID: 'leave_mgmt_active_user_v3',
};

export function normalizeUserBalances(user: UserProfile): UserProfile {
  const currentBalances = user.balances || {};
  return {
    ...user,
    balances: {
      ...currentBalances,
      'Annual Leave': {
        allocated: 14,
        used: Math.min(14, currentBalances['Annual Leave']?.used ?? 5),
      },
      'Business Leave': {
        allocated: 3,
        used: Math.min(3, currentBalances['Business Leave']?.used ?? currentBalances['Personal Leave']?.used ?? 0),
      },
      'Sick Leave': {
        allocated: 30,
        used: Math.min(30, currentBalances['Sick Leave']?.used ?? 1),
      },
      'Parental Leave': {
        allocated: 30,
        used: currentBalances['Parental Leave']?.used ?? 0,
      },
      'Unpaid Leave': {
        allocated: 15,
        used: currentBalances['Unpaid Leave']?.used ?? 0,
      },
      'Personal Leave': {
        allocated: 3,
        used: currentBalances['Personal Leave']?.used ?? 0,
      },
    },
  };
}

export function loadSavedRequests(): LeaveRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REQUESTS) || localStorage.getItem('leave_mgmt_requests_v1');
    if (raw) {
      const parsed: LeaveRequest[] = JSON.parse(raw);
      return parsed.map((r) => ({
        ...r,
        leaveType: (r.leaveType as string) === 'Personal Leave' ? 'Business Leave' : r.leaveType,
      }));
    }
  } catch (e) {
    console.warn('Failed loading requests from storage', e);
  }
  return INITIAL_LEAVE_REQUESTS;
}

export function saveRequests(requests: LeaveRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  } catch (e) {
    console.warn('Failed saving requests', e);
  }
}

export function loadSavedNotifications(): PushNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || localStorage.getItem('leave_mgmt_notifications_v1');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed loading notifications', e);
  }
  return INITIAL_NOTIFICATIONS;
}

export function saveNotifications(notifs: PushNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  } catch (e) {
    console.warn('Failed saving notifications', e);
  }
}

export function loadSavedUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS) || localStorage.getItem('leave_mgmt_users_v1');
    if (raw) {
      const parsed: UserProfile[] = JSON.parse(raw);
      return parsed.map(normalizeUserBalances);
    }
  } catch (e) {
    console.warn('Failed loading users', e);
  }
  return INITIAL_USERS.map(normalizeUserBalances);
}

export function saveUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed saving users', e);
  }
}

export function loadWorkspaceConfig(): WorkspaceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKSPACE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed loading workspace config', e);
  }
  return {
    sheetId: '',
    sheetName: 'Adesa Ventures - Global Trade Leave',
    sheetUrl: '',
    calendarId: 'primary',
    autoSyncCalendar: true,
    autoSyncSheets: true,
  };
}

export function saveWorkspaceConfig(config: WorkspaceConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKSPACE, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed saving workspace config', e);
  }
}

export function loadActiveUserId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    if (id) return id;
  } catch {
    // ignore
  }
  return 'user-vorapong'; // Default to Vorapong (Head of Department)
}

export function saveActiveUserId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, id);
  } catch {
    // ignore
  }
}
