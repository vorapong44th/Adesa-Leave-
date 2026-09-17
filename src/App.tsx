import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  COMPANY_LEAVE_POLICY,
  LeaveRequest,
  PushNotification,
  ThemeMode,
  UserProfile,
  WorkspaceConfig,
  checkApprovalPermission,
} from './types';
import {
  INITIAL_USERS,
  loadActiveUserId,
  loadSavedNotifications,
  loadSavedRequests,
  loadSavedUsers,
  loadWorkspaceConfig,
  saveActiveUserId,
  saveNotifications,
  saveRequests,
  saveUsers,
  saveWorkspaceConfig,
} from './data/initialData';
import {
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from './services/firebaseAuth';
import {
  appendLeaveToSheet,
  createGoogleCalendarEvent,
  createYearlyLeaveSheet,
} from './services/workspaceService';
import {
  broadcastPushNotification,
  playNotificationChime,
  subscribeToPushNotifications,
} from './services/notificationService';
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
  const [users, setUsers] = useState<UserProfile[]>(loadSavedUsers);
  const [activeUserId, setActiveUserId] = useState<string>(loadActiveUserId);
  const [requests, setRequests] = useState<LeaveRequest[]>(loadSavedRequests);
  const [notifications, setNotifications] = useState<PushNotification[]>(loadSavedNotifications);
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>(loadWorkspaceConfig);

  // Theme Mode: defaults to 'light' (Executive Light), with 'warm' (Warm Sand) and 'dark' (Obsidian Dark) options
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('adesa_leave_theme') as ThemeMode) || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('adesa_leave_theme', theme);
  }, [theme]);

  // Google Workspace Auth State
  const [googleUser, setGoogleUser] = useState<{
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getAccessToken());

  // Modals & Drawers
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState<LeaveRequest | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isCalendarViewOpen, setIsCalendarViewOpen] = useState(false);

  // Sync state during approval
  const [isSyncingApproval, setIsSyncingApproval] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'info' | 'error' | 'push', title: string, message: string) => {
    const id = 't-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Find current active user
  const currentUser = users.find((u) => u.id === activeUserId) || users[0];

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user: User, token: string) => {
        setGoogleUser({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen to real-time push notifications across tabs/components
  useEffect(() => {
    const unsubscribe = subscribeToPushNotifications((incoming) => {
      setNotifications((prev) => {
        // Prevent duplicate
        if (prev.some((n) => n.id === incoming.id)) return prev;
        const updated = [incoming, ...prev];
        saveNotifications(updated);
        return updated;
      });

      // Show toast if relevant to current user role
      if (incoming.targetRole === currentUser.role || incoming.employeeName === currentUser.name) {
        addToast('push', incoming.title, incoming.message);
      }
    });

    return () => unsubscribe();
  }, [currentUser.role, currentUser.name]);

  // Handle switching persona/role
  const handleSwitchUser = (user: UserProfile) => {
    setActiveUserId(user.id);
    saveActiveUserId(user.id);
    addToast('info', 'Active Persona Switched', `Viewing as ${user.name} (${user.role.toUpperCase()})`);
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser({
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        });
        setAccessToken(result.accessToken);
        addToast(
          'success',
          'Google Account Connected',
          'Ready to sync leaves with Google Calendar and Google Sheets.'
        );
      }
    } catch (err: any) {
      addToast('error', 'Google Sign-in Failed', err.message || 'Check popup blocker.');
    }
  };

  // Google Sign Out
  const handleGoogleSignOut = async () => {
    await logout();
    setGoogleUser(null);
    setAccessToken(null);
    addToast('info', 'Disconnected', 'Google Account disconnected.');
  };

  // Save workspace config changes
  const handleSaveWorkspaceConfig = (newConfig: WorkspaceConfig) => {
    setWorkspaceConfig(newConfig);
    saveWorkspaceConfig(newConfig);
  };

  // Submit Leave Request (Employee action)
  const handleSubmitLeaveRequest = (
    newReqData: Omit<LeaveRequest, 'id' | 'submittedAt' | 'status'>
  ) => {
    const newId = `LV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newRequest: LeaveRequest = {
      ...newReqData,
      id: newId,
      submittedAt: new Date().toISOString(),
      status: 'Pending',
    };

    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);
    saveRequests(updatedRequests);

    // Instant push notification to manager
    const pushNotification: PushNotification = {
      id: `notif-${Date.now()}`,
      title: `New Leave Request: ${newRequest.employeeName}`,
      message: `${newRequest.employeeName} requested ${newRequest.totalDays} day(s) of ${newRequest.leaveType} (${newRequest.startDate} to ${newRequest.endDate}).`,
      timestamp: new Date().toISOString(),
      read: false,
      requestId: newRequest.id,
      type: 'leave_submitted',
      targetRole: 'manager',
      employeeName: newRequest.employeeName,
    };

    setNotifications((prev) => {
      const updated = [pushNotification, ...prev];
      saveNotifications(updated);
      return updated;
    });

    broadcastPushNotification(pushNotification);

    addToast(
      'success',
      'Leave Request Submitted',
      `Your request for ${newRequest.totalDays} day(s) was sent to managers for instant review.`
    );
  };

  // Cancel Leave Request (Employee action)
  const handleCancelRequest = (requestId: string) => {
    const updated = requests.map((r) => (r.id === requestId ? { ...r, status: 'Cancelled' as const } : r));
    setRequests(updated);
    saveRequests(updated);
    addToast('info', 'Request Cancelled', `Leave request #${requestId} was cancelled.`);
  };

  // Approve Leave Request (Manager action -> Calendar + Sheets sync)
  const handleApproveRequest = async (request: LeaveRequest, managerNote: string) => {
    const applicant = users.find((u) => u.id === request.employeeId);
    const perm = checkApprovalPermission(currentUser, request, applicant);
    if (!perm.canApprove) {
      addToast('error', 'Approval Restricted', perm.reason || 'You are not authorized to approve this request.');
      return;
    }

    setIsSyncingApproval(true);
    setSyncProgress('Authorizing approval and preparing Google Workspace sync...');

    let calEventId: string | undefined = undefined;
    let calEventLink: string | undefined = undefined;
    let sheetRowAppended = false;
    let currentConfig = { ...workspaceConfig };

    try {
      const currentToken = accessToken || getAccessToken();

      // 1. Google Calendar Sync
      if (currentConfig.autoSyncCalendar && currentToken) {
        setSyncProgress('Creating event on Google Calendar...');
        try {
          const calResult = await createGoogleCalendarEvent(request, currentUser.name, currentToken);
          calEventId = calResult.eventId;
          calEventLink = calResult.htmlLink;
        } catch (calErr: any) {
          console.warn('Google Calendar sync failed:', calErr);
          addToast('error', 'Calendar Sync Warning', calErr.message || 'Could not post to Google Calendar.');
        }
      }

      // 2. Google Sheets Yearly Record Sync
      if (currentConfig.autoSyncSheets && currentToken) {
        setSyncProgress('Recording leave row in yearly Google Sheet...');
        try {
          let sheetId = currentConfig.sheetId;
          let sheetName = currentConfig.sheetName || 'Leave Records';

          // If no sheet created yet, create one on the fly!
          if (!sheetId) {
            setSyncProgress('Initializing yearly Google Sheet "Company Leave Tracker"...');
            const newSheet = await createYearlyLeaveSheet(currentToken);
            sheetId = newSheet.spreadsheetId;
            sheetName = newSheet.sheetName;
            currentConfig = {
              ...currentConfig,
              sheetId: newSheet.spreadsheetId,
              sheetUrl: newSheet.spreadsheetUrl,
              sheetName: newSheet.sheetName,
            };
            setWorkspaceConfig(currentConfig);
            saveWorkspaceConfig(currentConfig);
          }

          await appendLeaveToSheet(
            sheetId,
            sheetName,
            request,
            currentUser.name,
            calEventLink || 'N/A',
            currentToken
          );
          sheetRowAppended = true;
        } catch (sheetErr: any) {
          console.warn('Google Sheets append failed:', sheetErr);
          addToast('error', 'Google Sheets Warning', sheetErr.message || 'Could not append to Google Sheet.');
        }
      }

      // Update Request status
      const updatedRequests = requests.map((r) => {
        if (r.id === request.id) {
          return {
            ...r,
            status: 'Approved' as const,
            decisionAt: new Date().toISOString(),
            decisionBy: currentUser.name,
            managerNote: managerNote.trim() || undefined,
            calendarEventId: calEventId,
            calendarEventLink: calEventLink,
            sheetRowAppended,
          };
        }
        return r;
      });

      setRequests(updatedRequests);
      saveRequests(updatedRequests);

      // Deduct employee leave balance
      setUsers((prevUsers) => {
        const nextUsers = prevUsers.map((u) => {
          if (u.id === request.employeeId) {
            const defaultAllocated = COMPANY_LEAVE_POLICY[request.leaveType]?.allocated ?? 0;
            const currentBal = u.balances[request.leaveType] || { allocated: defaultAllocated, used: 0 };
            return {
              ...u,
              balances: {
                ...u.balances,
                [request.leaveType]: {
                  ...currentBal,
                  allocated: currentBal.allocated || defaultAllocated,
                  used: currentBal.used + request.totalDays,
                },
              },
            };
          }
          return u;
        });
        saveUsers(nextUsers);
        return nextUsers;
      });

      // Broadcast push notification to employee
      const pushNotification: PushNotification = {
        id: `notif-${Date.now()}`,
        title: `Leave Request Approved!`,
        message: `Your ${request.leaveType} (${request.startDate} to ${request.endDate}) was approved by ${currentUser.name}.${
          calEventLink ? ' Recorded in Google Calendar.' : ''
        }`,
        timestamp: new Date().toISOString(),
        read: false,
        requestId: request.id,
        type: 'leave_approved',
        targetRole: 'employee',
        employeeName: request.employeeName,
      };

      setNotifications((prev) => {
        const updated = [pushNotification, ...prev];
        saveNotifications(updated);
        return updated;
      });

      broadcastPushNotification(pushNotification);

      addToast(
        'success',
        'Leave Approved & Synced',
        `Approved ${request.employeeName}'s leave.${
          calEventLink ? ' Google Calendar event created.' : ''
        }${sheetRowAppended ? ' Google Sheet row logged.' : ''}`
      );
    } finally {
      setIsSyncingApproval(false);
      setSyncProgress(null);
    }
  };

  // Reject Leave Request (Manager action)
  const handleRejectRequest = async (request: LeaveRequest, managerNote: string) => {
    const applicant = users.find((u) => u.id === request.employeeId);
    const perm = checkApprovalPermission(currentUser, request, applicant);
    if (!perm.canApprove) {
      addToast('error', 'Action Restricted', perm.reason || 'You are not authorized to decline this request.');
      return;
    }

    const updatedRequests = requests.map((r) => {
      if (r.id === request.id) {
        return {
          ...r,
          status: 'Rejected' as const,
          decisionAt: new Date().toISOString(),
          decisionBy: currentUser.name,
          managerNote: managerNote.trim(),
        };
      }
      return r;
    });

    setRequests(updatedRequests);
    saveRequests(updatedRequests);

    // Broadcast push notification to employee
    const pushNotification: PushNotification = {
      id: `notif-${Date.now()}`,
      title: `Leave Request Declined`,
      message: `Your ${request.leaveType} (${request.startDate} to ${request.endDate}) was declined by ${currentUser.name}: "${managerNote}".`,
      timestamp: new Date().toISOString(),
      read: false,
      requestId: request.id,
      type: 'leave_rejected',
      targetRole: 'employee',
      employeeName: request.employeeName,
    };

    setNotifications((prev) => {
      const updated = [pushNotification, ...prev];
      saveNotifications(updated);
      return updated;
    });

    broadcastPushNotification(pushNotification);

    addToast('info', 'Request Declined', `Leave request #${request.id} was rejected.`);
  };

  // Quick review modal trigger
  const handleOpenReview = (request: LeaveRequest) => {
    setReviewingRequest(request);
    setIsApprovalModalOpen(true);
  };

  // Quick Approve directly from table/card
  const handleQuickApprove = (request: LeaveRequest) => {
    handleApproveRequest(request, 'Approved via Quick Review.');
  };

  // Quick Reject directly from table/card
  const handleQuickReject = (request: LeaveRequest) => {
    handleOpenReview(request);
  };

  // Notification actions
  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    saveNotifications([]);
  };

  const handleSelectNotification = (requestId: string) => {
    const target = requests.find((r) => r.id === requestId);
    if (target) {
      if (currentUser.role === 'manager' && target.status === 'Pending') {
        handleOpenReview(target);
      }
    }
  };

  // Test push simulation
  const handleTestPushSimulation = () => {
    playNotificationChime();
    const testNotif: PushNotification = {
      id: `notif-test-${Date.now()}`,
      title: 'Simulated Push Alert: Urgent Time-Off',
      message: 'Alex Rivera requested 2 days of Personal Leave (Next Tuesday - Wednesday).',
      timestamp: new Date().toISOString(),
      read: false,
      requestId: requests[0]?.id || 'LV-2026-089',
      type: 'leave_submitted',
      targetRole: 'manager',
      employeeName: 'Alex Rivera',
    };
    broadcastPushNotification(testNotif);
    addToast('push', testNotif.title, testNotif.message);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

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
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        unreadCount={unreadNotificationCount}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        workspaceConfig={workspaceConfig}
        onOpenWorkspaceSettings={() => setIsWorkspaceModalOpen(true)}
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
            onOpenWorkspaceSettings={() => setIsWorkspaceModalOpen(true)}
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
              onClick={() => setIsWorkspaceModalOpen(true)}
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
        request={reviewingRequest}
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
        isOpen={isWorkspaceModalOpen}
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
