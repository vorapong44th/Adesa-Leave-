import { collection, doc, getFirestore, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseAuth';
import { LeaveRequest, PushNotification, UserProfile, WorkspaceConfig, COMPANY_LEAVE_POLICY } from '../types';
export const db = getFirestore(app);
const functions = getFunctions(app, 'asia-southeast1');
export const defaultWorkspace: WorkspaceConfig = {
  sheetId: '', sheetName: 'Leave Records', sheetUrl: '', calendarId: 'primary',
  autoSyncCalendar: false, autoSyncSheets: false
};
function userProfile(id: string, data: any): UserProfile {
  const year = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Bangkok', year: 'numeric' }).format(new Date());
  const balances = Object.fromEntries(Object.entries(COMPANY_LEAVE_POLICY).map(([key, value]) =>
    [key, data.balancesByYear?.[year]?.[key] || { allocated: value.allocated, used: 0 }]));
  return { ...data, id, balances };
}
export function subscribeProfile(uid: string, next: (profile: UserProfile | null) => void, error: (e: Error) => void) {
  return onSnapshot(doc(db, 'users', uid), snap => next(snap.exists() && snap.data().active === true ? userProfile(snap.id, snap.data()) : null), error);
}
export function subscribeWorkspace(user: UserProfile, callbacks: {
  users: (users: UserProfile[]) => void; requests: (requests: LeaveRequest[]) => void;
  notifications: (notifications: PushNotification[]) => void; config: (config: WorkspaceConfig) => void;
  error: (error: Error) => void;
}) {
  const users = collection(db, 'users'), requests = collection(db, 'requests');
  const userQuery = user.role === 'ceo' ? query(users) : user.role === 'employee'
    ? query(users, where('id', '==', user.id)) : query(users, where('department', '==', user.department));
  const requestQuery = user.role === 'ceo' ? query(requests) : user.role === 'employee'
    ? query(requests, where('employeeId', '==', user.id)) : query(requests, where('employeeDepartment', '==', user.department));
  const stops = [
    onSnapshot(userQuery, snap => callbacks.users(snap.docs.map(d => userProfile(d.id, d.data()))), callbacks.error),
    onSnapshot(requestQuery, snap => callbacks.requests(snap.docs.map(d => ({ ...d.data(), id: d.id } as LeaveRequest)).sort((a,b) => b.submittedAt.localeCompare(a.submittedAt))), callbacks.error),
    onSnapshot(collection(db, 'users', user.id, 'notifications'), snap => callbacks.notifications(snap.docs.map(d => ({ ...d.data(), id: d.id } as PushNotification)).sort((a,b) => b.timestamp.localeCompare(a.timestamp))), callbacks.error),
    onSnapshot(doc(db, 'settings', 'workspace'), snap => callbacks.config({ ...defaultWorkspace, ...snap.data() }), callbacks.error),
  ];
  return () => stops.forEach(stop => stop());
}
export async function submitLeave(data: Omit<LeaveRequest, 'submittedAt' | 'status'>) {
  return (await httpsCallable(functions, 'submitLeaveRequest')(data)).data;
}
export async function decideLeave(id: string, status: string, managerNote = '', accessToken: string | null = null) {
  return (await httpsCallable(functions, 'decideLeaveRequest')({ id, status, managerNote, accessToken })).data as LeaveRequest;
}
export async function saveSharedWorkspace(config: WorkspaceConfig) {
  await httpsCallable(functions, 'saveWorkspace')(config);
}
export async function updateNotifications(uid: string, notifications: PushNotification[], clear = false) {
  for (let i = 0; i < notifications.length; i += 400) {
    const batch = writeBatch(db);
    notifications.slice(i, i + 400).forEach(n => {
      const ref = doc(db, 'users', uid, 'notifications', n.id);
      if (clear) batch.delete(ref); else batch.update(ref, { read: true });
    });
    await batch.commit();
  }
}
export async function registerPushToken(token: string, remove = false) {
  await httpsCallable(functions, 'registerPushToken')({ token, remove });
}
