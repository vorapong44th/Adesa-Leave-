import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { LeaveRequest, PushNotification, ThemeMode, UserProfile, WorkspaceConfig } from './types';
import { getAccessToken, googleSignIn, initAuth, logout } from './services/firebaseAuth';
import { defaultWorkspace, subscribeProfile, subscribeWorkspace, submitLeave, decideLeave, saveSharedWorkspace, updateNotifications } from './services/leaveService';
import { playNotificationChime, disablePushNotifications, requestPushPermission } from './services/notificationService';
import { Header } from './components/Header';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { LeaveRequestModal } from './components/LeaveRequestModal';
import { ManagerApprovalModal } from './components/ManagerApprovalModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { WorkspaceSettingsModal } from './components/WorkspaceSettingsModal';
import { TeamCalendarView } from './components/TeamCalendarView';
import { ToastContainer, ToastMessage } from './components/Toast';


export default function App() {
  const [identity, setIdentity] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => initAuth(user => { setIdentity(user); setLoading(false); }, () => {
    setIdentity(null); setProfile(null); setLoading(false);
  }), []);
  useEffect(() => {
    setProfile(null); setError('');
    if (!identity) return;
    let active = true;
    const stop = subscribeProfile(identity.uid, value => {
      if (!active) return;
      setProfile(value);
      setError(value ? '' : 'Your account is not enabled. Ask your administrator to add your employee profile.');
    }, () => { if (active) { setProfile(null); setError('Unable to load your employee profile. Check your connection and contact your administrator.'); } });
    return () => { active = false; stop(); };
  }, [identity?.uid]);
  const signIn = async () => {
    try { setError(''); await googleSignIn(); }
    catch (e: any) { setError(e.message || 'Google sign-in failed.'); }
  };
  if (!identity || !profile || !identity.emailVerified) return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
      <section className="max-w-md rounded-2xl border border-white/20 p-8 space-y-4">
        <h1 className="text-2xl font-bold">Adesa Leave</h1>
        <p>{loading ? 'Loading…' : identity ? 'Waiting for an enabled, verified employee account.' : 'Sign in with your company Google account.'}</p>
        {error && <p role="alert" className="text-amber-300">{error}</p>}
        <button className="rounded-xl bg-indigo-600 px-5 py-3" onClick={signIn}>Sign in with Google</button>
        {identity && <button className="ml-3 underline" onClick={() => logout()}>Sign out</button>}
      </section>
    </main>
  );
  return <LeaveApp key={identity.uid + profile.role + profile.department} identity={identity} profile={profile} />;
}

function LeaveApp({ identity, profile }: { identity: User; profile: UserProfile }) {
  const [users, setUsers] = useState<UserProfile[]>([profile]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>(defaultWorkspace);
  const [dataError, setDataError] = useState('');
  const currentUser = users.find(u => u.id === identity.uid) || profile;
  const googleUser = { displayName: identity.displayName, email: identity.email, photoURL: identity.photoURL };
  const [accessToken, setAccessToken] = useState(getAccessToken());
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try { return (localStorage.getItem('adesa_leave_theme') as ThemeMode) || 'light'; } catch { return 'light'; }
  });
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState<LeaveRequest | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isCalendarViewOpen, setIsCalendarViewOpen] = useState(false);
  const [isSyncingApproval, setIsSyncingApproval] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const pendingDecisions = useRef(new Set<string>());
  const seenNotifications = useRef<Set<string> | null>(null);
  const addToast = (type: ToastMessage['type'], title: string, message: string) =>
    setToasts(prev => [...prev, { id: crypto.randomUUID(), type, title, message }]);
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    try { localStorage.setItem('adesa_leave_theme', theme); } catch {}
  }, [theme]);
  useEffect(() => subscribeWorkspace(profile, {
    users: setUsers, requests: setRequests, config: setWorkspaceConfig,
    notifications: incoming => {
      if (seenNotifications.current) for (const n of incoming) {
        if (!n.read && !seenNotifications.current.has(n.id)) {
          addToast('push', n.title, n.message);
          playNotificationChime();
        }
      }
      seenNotifications.current = new Set(incoming.map(n => n.id));
      setNotifications(incoming);
    },
    error: () => {
      setRequests([]); setNotifications([]); setUsers([]);
      setDataError('Shared records could not be loaded. Check your connection and account permissions, then reload.');
    }
  }), [profile.id, profile.role, profile.department]);
  const handleGoogleSignIn = async () => {
    try { const result = await googleSignIn(); setAccessToken(result.accessToken); addToast('success', 'Google connected', 'Ready to sync approved leave.'); }
    catch (e: any) { addToast('error', 'Sign-in failed', e.message); }
  };
  const handleGoogleSignOut = async () => {
    try { await disablePushNotifications(); await logout(); }
    catch (e: any) { addToast('error', 'Sign-out failed', e.message); }
  };
  const openSettings = () => {
    if (['ceo', 'head_of_dept'].includes(currentUser.role)) setIsWorkspaceModalOpen(true);
    else addToast('info', 'Workspace settings', 'A CEO or department head manages the shared integrations.');
  };
  const handleSaveWorkspaceConfig = async (config: WorkspaceConfig) => {
    try { await saveSharedWorkspace(config); addToast('success', 'Settings saved', 'The shared workspace configuration has been updated.'); }
    catch (e: any) { addToast('error', 'Settings not saved', e.message); throw e; }
  };
  const handleSubmitLeaveRequest = async (data: Omit<LeaveRequest, 'id' | 'submittedAt' | 'status'>, id: string) => {
    await submitLeave({ ...data, id });
    addToast('success', 'Request submitted', 'Your request is saved and your authorized approvers have been notified.');
  };
  const handleCancelRequest = async (id: string) => {
    try { await decideLeave(id, 'Cancelled'); addToast('info', 'Request cancelled', 'Your pending request was cancelled.'); }
    catch (e: any) { addToast('error', 'Cancellation failed', e.message); }
  };
  const decide = async (request: LeaveRequest, status: 'Approved' | 'Rejected', note: string) => {
    if (pendingDecisions.current.has(request.id)) throw new Error('This request is already being processed.');
    pendingDecisions.current.add(request.id);
    setIsSyncingApproval(true); setSyncProgress('Saving decision and checking Google sync…');
    try {
      const result = await decideLeave(request.id, status, note, getAccessToken());
      const states = result.sync ? Object.values(result.sync) : [];
      const incomplete = states.some(s => !['synced', 'disabled'].includes(s));
      addToast(incomplete ? 'info' : 'success', status === 'Approved' ? 'Leave approved' : 'Leave declined',
        incomplete ? 'Decision saved. Google sync needs attention; open this record to view its status.' :
        states.includes('synced') ? 'Decision saved and enabled Google integrations synced.' : 'Decision saved.');
    } catch (e: any) {
      addToast('error', 'Check request status', e.message + ' Shared records show the saved decision; do not reapprove to retry sync.');
      throw e;
    } finally { pendingDecisions.current.delete(request.id); setIsSyncingApproval(pendingDecisions.current.size > 0); setSyncProgress(null); }
  };
  const handleApproveRequest = (request: LeaveRequest, note: string) => decide(request, 'Approved', note);
  const handleRejectRequest = (request: LeaveRequest, note: string) => decide(request, 'Rejected', note);
  const handleOpenReview = (request: LeaveRequest) => { setReviewingRequest(request); setIsApprovalModalOpen(true); };
  const handleQuickApprove = (request: LeaveRequest) => { void handleApproveRequest(request, 'Approved via Quick Review.').catch(() => {}); };
  const handleQuickReject = handleOpenReview;
  const handleMarkAllNotificationsRead = () => {
    void updateNotifications(identity.uid, notifications).catch(e => addToast('error', 'Unable to update notifications', e.message));
  };
  const handleClearNotifications = () => {
    void updateNotifications(identity.uid, notifications, true).catch(e => addToast('error', 'Unable to clear notifications', e.message));
  };
  const handleSelectNotification = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (request) handleOpenReview(request);
  };
  const handleTestPushSimulation = () => {
    void requestPushPermission().then(() => addToast('info', 'Notifications enabled', 'This device is registered for leave updates.'))
      .catch(e => addToast('error', 'Notifications unavailable', e.message));
  };
  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  if (dataError) return <main className="p-8"><p role="alert">{dataError}</p><button onClick={() => window.location.reload()}>Reload</button></main>;
  return (
    <div
      data-theme={theme}
      className="min-h-screen flex flex-col font-sans relative selection:bg-indigo-500/30 overflow-x-hidden transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
    >
      {/* Frosted Glass Ambient Chromatic Orbs */}
      <div
        className="fixed top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full blur-[110px] pointer-events-none -z-10 transition-colors duration-500"
        style={{ backgroundColor: 'var(--orb-1)' }}
      />
      <div
        className="fixed bottom-[-10%] right-[-5%] w-[550px] h-[550px] rounded-full blur-[130px] pointer-events-none -z-10 transition-colors duration-500"
        style={{ backgroundColor: 'var(--orb-2)' }}
      />
      <div
        className="fixed top-[25%] right-[10%] w-[380px] h-[380px] rounded-full blur-[90px] pointer-events-none -z-10 transition-colors duration-500"
        style={{ backgroundColor: 'var(--orb-3)' }}
      />
      <div
        className="fixed top-[65%] left-[8%] w-[320px] h-[320px] rounded-full blur-[80px] pointer-events-none -z-10 transition-colors duration-500"
        style={{ backgroundColor: 'var(--orb-4)' }}
      />

      {/* App Navigation Header */}
      <Header
        currentUser={currentUser}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        unreadCount={unreadNotificationCount}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        workspaceConfig={workspaceConfig}
        onOpenWorkspaceSettings={openSettings}
        theme={theme}
        onToggleTheme={setTheme}
      />

      {/* Main Content View based on Role */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 z-10 relative">
        {currentUser.role === 'employee' ? (
          <EmployeeDashboard
            currentUser={currentUser}
            requests={requests}
            onOpenRequestModal={() => setIsRequestModalOpen(true)}
            onCancelRequest={handleCancelRequest}
            onOpenCalendarView={() => setIsCalendarViewOpen(true)}
          />
        ) : (
          <ManagerDashboard
            currentUser={currentUser}
            requests={requests}
            allUsers={users}
            workspaceConfig={workspaceConfig}
            onOpenWorkspaceSettings={openSettings}
            onReviewRequest={handleOpenReview}
            onQuickApprove={handleQuickApprove}
            onQuickReject={handleQuickReject}
            onOpenCalendarView={() => setIsCalendarViewOpen(true)}
            onTestPush={handleTestPushSimulation}
            onOpenRequestModal={() => setIsRequestModalOpen(true)}
            onCancelRequest={handleCancelRequest}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        className="border-t backdrop-blur-xl py-4 mt-auto z-10 transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-card)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 dark:text-stone-400 gap-2">
          <p>
            Leave Management with Google Calendar &amp; Google Sheets integration.
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={openSettings}
              className="text-stone-600 dark:text-stone-300 hover:text-indigo-600 dark:hover:text-white underline underline-offset-2 transition-colors"
            >
              Workspace Settings
            </button>
            <span>•</span>
            <button
              onClick={() => setIsCalendarViewOpen(true)}
              className="text-stone-600 dark:text-stone-300 hover:text-indigo-600 dark:hover:text-white underline underline-offset-2 transition-colors"
            >
              Team Calendar
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <LeaveRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        currentUser={currentUser}
        allRequests={requests}
        onSubmitRequest={handleSubmitLeaveRequest}
      />

      <ManagerApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setReviewingRequest(null);
        }}
        request={requests.find(r => r.id === reviewingRequest?.id) || null}
        allRequests={requests}
        currentUser={currentUser}
        allUsers={users}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        isSyncing={isSyncingApproval}
        syncProgress={syncProgress}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onClearAll={handleClearNotifications}
        onSelectNotification={handleSelectNotification}
        onTestPush={handleTestPushSimulation}
      />

      <WorkspaceSettingsModal
        isOpen={isWorkspaceModalOpen && ['ceo', 'head_of_dept'].includes(currentUser.role)}
        onClose={() => setIsWorkspaceModalOpen(false)}
        config={workspaceConfig}
        onSaveConfig={handleSaveWorkspaceConfig}
        googleUser={googleUser}
        accessToken={accessToken}
        onGoogleSignIn={handleGoogleSignIn}
      />

      <TeamCalendarView
        isOpen={isCalendarViewOpen}
        onClose={() => setIsCalendarViewOpen(false)}
        requests={requests}
      />

      {/* Toast Notification Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
        onToastClick={(t) => {
          if (t.type === 'push') {
            setIsNotificationDrawerOpen(true);
          }
        }}
      />
    </div>
  );
}
