import React, { useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import {
  COMPANY_LEAVE_POLICY,
  LeaveRequest,
  UserProfile,
  WorkspaceConfig,
  checkApprovalPermission,
} from '../types';
import { doDateRangesOverlap, formatDateDisplay, formatRelativeTime } from '../utils/dateUtils';
import { playNotificationChime } from '../services/notificationService';

interface ManagerDashboardProps {
  currentUser: UserProfile;
  requests: LeaveRequest[];
  allUsers: UserProfile[];
  workspaceConfig: WorkspaceConfig;
  onOpenWorkspaceSettings: () => void;
  onReviewRequest: (request: LeaveRequest) => void;
  onQuickApprove: (request: LeaveRequest) => void;
  onQuickReject: (request: LeaveRequest) => void;
  onOpenCalendarView: () => void;
  onTestPush: () => void;
  onOpenRequestModal?: () => void;
  onCancelRequest?: (requestId: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  currentUser,
  requests,
  allUsers,
  workspaceConfig,
  onOpenWorkspaceSettings,
  onReviewRequest,
  onQuickApprove,
  onQuickReject,
  onOpenCalendarView,
  onTestPush,
  onOpenRequestModal,
  onCancelRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'my_leave'>('approvals');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const isCeo = currentUser.role === 'ceo';
  const isHeadOfDept = currentUser.role === 'head_of_dept';
  const isBdManager = currentUser.role === 'manager';

  // Requests visible to the current manager/CEO:
  // CEO sees all requests in the organization
  // Vorapong sees Global Trade department requests
  const visibleRequests = requests.filter((r) => {
    if (isCeo) return true;
    if (isHeadOfDept) return r.employeeDepartment === 'Global Trade';
    return true;
  });

  const pendingRequests = visibleRequests.filter((r) => r.status === 'Pending');
  const approvedRequests = visibleRequests.filter((r) => r.status === 'Approved');

  // Requests submitted by this manager/CEO themselves
  const myRequests = requests.filter((r) => r.employeeId === currentUser.id);

  // Filter team records in table
  const filteredAllRequests = visibleRequests.filter((r) => {
    if (filterStatus !== 'all' && r.status.toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }
    if (filterDepartment !== 'all' && r.employeeDepartment !== filterDepartment) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.employeeName.toLowerCase().includes(q) ||
        r.leaveType.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const departments = Array.from(new Set(requests.map((r) => r.employeeDepartment)));

  // Current user's balances for the "My Leave" tab
  const myAnnual = currentUser.balances['Annual Leave'] || { allocated: 14, used: 0 };
  const myBiz = currentUser.balances['Business Leave'] || { allocated: 3, used: 0 };
  const mySick = currentUser.balances['Sick Leave'] || { allocated: 30, used: 0 };

  return (
    <div className="space-y-6">
      {/* Top Banner: Real-Time Push & Manager Overview */}
      <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {isCeo
                  ? 'Executive Command & Approval Center'
                  : isHeadOfDept
                  ? 'Department Head Approval Center'
                  : 'Management & Approval Portal'}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isCeo
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : isHeadOfDept
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                }`}
              >
                {currentUser.title}
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1">
              {isCeo ? (
                <span>
                  👑 <strong className="text-white">CEO Authority:</strong> View all records across
                  the organization and approve any personnel.
                </span>
              ) : isHeadOfDept ? (
                <span>
                  ⚡ <strong className="text-white">Department Head:</strong> Authority to approve
                  from BD downward (Onuma, Cherngchao, Sasiwan).
                </span>
              ) : (
                <span>
                  💼 <strong className="text-white">BD Manager:</strong> Sourcing / Selling BD
                  management in Global Trade.
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Request Own Leave */}
            {onOpenRequestModal && (
              <button
                onClick={onOpenRequestModal}
                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-lg shadow-teal-500/20"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Request My Leave</span>
              </button>
            )}

            {/* Test Push Simulation */}
            <button
              onClick={() => {
                playNotificationChime();
                onTestPush();
              }}
              className="px-3.5 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors backdrop-blur-md"
              title="Test instant push notification sound and visual alert"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Push</span>
            </button>

            {/* Team Calendar */}
            <button
              onClick={onOpenCalendarView}
              className="px-3.5 py-2 rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold text-stone-200 hover:bg-white/10 hover:text-white flex items-center space-x-1.5 transition-colors backdrop-blur-md"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-stone-300" />
              <span>Schedule</span>
            </button>

            {/* Workspace Sync Settings */}
            <button
              onClick={onOpenWorkspaceSettings}
              className="px-3.5 py-2 rounded-2xl bg-indigo-600/40 hover:bg-indigo-600/60 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all border border-indigo-500/30"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span>Google Sync</span>
            </button>
          </div>
        </div>

        {/* Sync Status & Metrics Bar */}
        <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-stone-400">Pending in Your Scope</p>
              <p className="font-bold text-white text-sm">
                {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-stone-400">Google Calendar Review</p>
              <p className="font-semibold text-stone-200 truncate">Primary Calendar (Auto-Sync)</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-stone-400">Adesa Ventures Sheet</p>
                <p className="font-semibold text-stone-200 truncate">
                  {workspaceConfig.sheetUrl ? workspaceConfig.sheetName : 'Setup Required'}
                </p>
              </div>
            </div>
            {workspaceConfig.sheetUrl && (
              <a
                href={workspaceConfig.sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 underline flex items-center gap-0.5 shrink-0 ml-2"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Navigation View Switcher (Approvals vs. Personal Leave) */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all flex items-center space-x-2 ${
            activeTab === 'approvals'
              ? 'bg-indigo-600/30 text-white border border-indigo-500/40 shadow-lg'
              : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Department Approvals & Records</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-bold">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my_leave')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all flex items-center space-x-2 ${
            activeTab === 'my_leave'
              ? 'bg-indigo-600/30 text-white border border-indigo-500/40 shadow-lg'
              : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
          }`}
        >
          <User className="w-4 h-4 text-teal-400" />
          <span>My Leave Balances & Requests ({currentUser.name.split(' ')[0]})</span>
        </button>
      </div>

      {/* TAB 1: Department Approvals & Team Overview */}
      {activeTab === 'approvals' && (
        <>
          {/* Statutory Leave Entitlements & Team Quota Overview */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-5 border border-white/10 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <h2 className="text-sm font-semibold text-white">
                  Adesa Ventures Leave Policy ({new Date().getFullYear()} Calendar Year)
                </h2>
              </div>
              <span className="text-[11px] text-stone-300 font-medium">
                Annual: 14 days • Business: 3 days • Sick: 30 days
              </span>
            </div>

            {/* Policy Quota Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 block font-medium">Annual Leave</span>
                  <span className="text-lg font-bold text-white">14 days</span>
                  <span className="text-[10px] text-stone-400 block">per calendar year</span>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                  Vacation
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 block font-medium">Business Leave</span>
                  <span className="text-lg font-bold text-white">3 days</span>
                  <span className="text-[10px] text-stone-400 block">per calendar year</span>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                  Official / Urgent
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 block font-medium">Sick Leave</span>
                  <span className="text-lg font-bold text-white">30 days</span>
                  <span className="text-[10px] text-stone-400 block">per calendar year</span>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
                  Medical
                </div>
              </div>
            </div>

            {/* Team Members Remaining Balances Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/10">
              {allUsers.map((user) => {
                const annualBal = user.balances['Annual Leave'] || { allocated: 14, used: 0 };
                const bizBal = user.balances['Business Leave'] || { allocated: 3, used: 0 };
                const sickBal = user.balances['Sick Leave'] || { allocated: 30, used: 0 };

                return (
                  <div
                    key={user.id}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                          {user.role === 'ceo' && (
                            <span className="text-[9px] font-bold px-1 bg-amber-500/20 text-amber-300 rounded">
                              CEO
                            </span>
                          )}
                          {user.role === 'head_of_dept' && (
                            <span className="text-[9px] font-bold px-1 bg-purple-500/20 text-purple-300 rounded">
                              Head
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 truncate">{user.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 text-[11px] shrink-0 font-mono">
                      <span
                        className="px-1.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        title={`Annual Leave: ${annualBal.allocated - annualBal.used}d remaining of ${annualBal.allocated}d`}
                      >
                        AL:{annualBal.allocated - annualBal.used}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        title={`Business Leave: ${bizBal.allocated - bizBal.used}d remaining of ${bizBal.allocated}d`}
                      >
                        BL:{bizBal.allocated - bizBal.used}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30"
                        title={`Sick Leave: ${sickBal.allocated - sickBal.used}d remaining of ${sickBal.allocated}d`}
                      >
                        SL:{sickBal.allocated - sickBal.used}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Approvals Section */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="text-sm font-semibold text-white">
                  Instant Push Queue: Pending Approvals
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingRequests.length}
                </span>
              </div>
              <span className="text-[11px] text-stone-400 hidden sm:block">
                Instant sync to Google Calendar & Google Sheets upon approval
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center px-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">All caught up!</p>
                <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                  There are no pending leave requests awaiting approval. When team members submit a
                  request, an instant push notification chime will alert you here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {pendingRequests.map((req) => {
                  const applicant = allUsers.find((u) => u.id === req.employeeId);
                  const perm = checkApprovalPermission(currentUser, req, applicant);

                  // Check overlap with other approved requests
                  const overlapping = approvedRequests.filter(
                    (r) =>
                      r.id !== req.id &&
                      doDateRangesOverlap(req.startDate, req.endDate, r.startDate, r.endDate)
                  );

                  return (
                    <div key={req.id} className="p-5 hover:bg-white/[0.04] transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Employee & Request Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                              {req.employeeName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-white">
                                  {req.employeeName}
                                </span>
                                <span className="text-xs text-stone-500">•</span>
                                <span className="text-xs text-stone-300 font-medium">
                                  {req.employeeTitle} ({req.employeeDepartment})
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-400">
                                Submitted {formatRelativeTime(req.submittedAt)} • Ref: {req.id}
                              </p>
                            </div>
                          </div>

                          {/* Request Specs */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                              {req.leaveType}
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-white/5 text-stone-200 border border-white/10 font-medium flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5 text-stone-400" />
                              {formatDateDisplay(req.startDate)}
                              {req.startDate !== req.endDate &&
                                ` – ${formatDateDisplay(req.endDate)}`}
                            </span>
                            <span className="px-2 py-1 rounded-xl bg-white/5 text-stone-300 border border-white/10 font-semibold">
                              {req.totalDays} day{req.totalDays !== 1 ? 's' : ''}
                              {req.isHalfDay && ` (${req.halfDayPeriod || 'Half Day'})`}
                            </span>

                            {/* Authority Status Badge */}
                            {perm.isSelf ? (
                              <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold">
                                🔒 Your Request (Awaiting CEO Approval)
                              </span>
                            ) : perm.canApprove ? (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
                                {isCeo ? (
                                  <>
                                    <Crown className="w-3 h-3" /> CEO Authority to Approve
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-3 h-3" /> Vorapong Approval
                                    Authorized
                                  </>
                                )}
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold"
                                title={perm.reason}
                              >
                                🔒 Requires Higher Authority
                              </span>
                            )}
                          </div>

                          {/* Reason */}
                          <p className="text-xs text-stone-300 italic bg-white/5 p-3 rounded-2xl border border-white/10 max-w-2xl">
                            &ldquo;{req.reason}&rdquo;
                          </p>

                          {/* Overlap alert */}
                          {overlapping.length > 0 && (
                            <div className="text-[11px] text-amber-300 flex items-center space-x-1.5 font-medium bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 max-w-2xl">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>
                                Overlap notice: {overlapping.map((o) => o.employeeName).join(', ')}{' '}
                                also away during this time.
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => onReviewRequest(req)}
                            className="px-3.5 py-2 rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold text-stone-200 hover:bg-white/10 hover:text-white transition-colors backdrop-blur-md"
                          >
                            Inspect Details
                          </button>

                          {perm.canApprove ? (
                            <>
                              <button
                                onClick={() => onQuickReject(req)}
                                className="px-3.5 py-2 rounded-2xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 border border-rose-500/30 transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => onQuickApprove(req)}
                                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve & Sync</span>
                              </button>
                            </>
                          ) : (
                            <div
                              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-stone-400"
                              title={perm.reason}
                            >
                              {perm.isSelf ? 'Self-Approval Forbidden' : 'Requires CEO Approval'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Yearly Team Leave Records Table */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-white">
                  Adesa Ventures Leave Records ({new Date().getFullYear()})
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-stone-200 border border-white/10">
                  {filteredAllRequests.length}
                </span>
                {isCeo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    👑 All Organization Records
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search staff, ref, reason..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                  />
                </div>

                {/* Department Filter */}
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-white/10 bg-[#0c0e14] text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-white/10 bg-[#0c0e14] text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                {/* Open Google Sheet button if active */}
                {workspaceConfig.sheetUrl && (
                  <a
                    href={workspaceConfig.sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center space-x-1 hover:bg-teal-500/25 transition-colors"
                    title="Open Yearly Google Spreadsheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
                    <span>Open Google Sheet</span>
                    <ExternalLink className="w-3 h-3 text-teal-400" />
                  </a>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] border-b border-white/10 text-stone-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Employee</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Dates & Days</th>
                    <th className="py-3 px-4 font-semibold">Reason</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Google Sync</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAllRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        No matching records found.
                      </td>
                    </tr>
                  ) : (
                    filteredAllRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-semibold text-white">{req.employeeName}</p>
                            <p className="text-[11px] text-stone-400">
                              {req.employeeDepartment} • {req.id}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-stone-200">{req.leaveType}</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-stone-200">
                            {formatDateDisplay(req.startDate)}
                            {req.startDate !== req.endDate &&
                              ` - ${formatDateDisplay(req.endDate)}`}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {req.totalDays} day{req.totalDays !== 1 ? 's' : ''}
                            {req.isHalfDay && ` (${req.halfDayPeriod || 'Half Day'})`}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-stone-300">
                          {req.reason}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              req.status === 'Approved'
                                ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                                : req.status === 'Pending'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {req.status === 'Approved' ? (
                            <div className="flex items-center space-x-1.5">
                              {req.calendarEventLink ? (
                                <a
                                  href={req.calendarEventLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors"
                                  title="Google Calendar Event Created"
                                >
                                  <CalendarIcon className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <span className="text-stone-500">•</span>
                              )}

                              {req.sheetRowAppended ? (
                                <span
                                  className="p-1 rounded-lg text-teal-400"
                                  title="Google Sheet Row Recorded"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="text-stone-500">•</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-500 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => onReviewRequest(req)}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs transition-colors"
                          >
                            {req.status === 'Pending' ? 'Review' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: My Personal Leave Balances & Requests (For Vorapong / CEO / BD Managers) */}
      {activeTab === 'my_leave' && (
        <div className="space-y-6">
          {/* Personal Quota Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 shadow-xl backdrop-blur-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-stone-300">Annual Leave</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  14 days / yr
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-white">
                  {myAnnual.allocated - myAnnual.used}
                </span>
                <span className="text-xs text-stone-400">days remaining</span>
              </div>
              <div className="mt-3 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (myAnnual.used / (myAnnual.allocated || 14)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-2">
                Used: {myAnnual.used} days • Quota: {myAnnual.allocated} days
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 shadow-xl backdrop-blur-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-stone-300">Business Leave</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  3 days / yr
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-white">{myBiz.allocated - myBiz.used}</span>
                <span className="text-xs text-stone-400">days remaining</span>
              </div>
              <div className="mt-3 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (myBiz.used / (myBiz.allocated || 3)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-2">
                Used: {myBiz.used} days • Quota: {myBiz.allocated} days
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 shadow-xl backdrop-blur-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-stone-300">Sick Leave</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  30 days / yr
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-white">{mySick.allocated - mySick.used}</span>
                <span className="text-xs text-stone-400">days remaining</span>
              </div>
              <div className="mt-3 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (mySick.used / (mySick.allocated || 30)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-2">
                Used: {mySick.used} days • Quota: {mySick.allocated} days
              </p>
            </div>
          </div>

          {/* My Submitted Requests Table */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  My Submitted Leave Requests ({currentUser.name})
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Track your personal time-off applications and supervisor/CEO approval status.
                </p>
              </div>
              {onOpenRequestModal && (
                <button
                  onClick={onOpenRequestModal}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-teal-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit Leave Request</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] border-b border-white/10 text-stone-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Ref & Type</th>
                    <th className="py-3 px-4 font-semibold">Dates & Duration</th>
                    <th className="py-3 px-4 font-semibold">Reason</th>
                    <th className="py-3 px-4 font-semibold">Status & Notes</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        You have not submitted any leave requests yet this year.
                      </td>
                    </tr>
                  ) : (
                    myRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-semibold text-white">{r.leaveType}</p>
                            <p className="text-[11px] text-stone-400">{r.id}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-stone-200">
                            {formatDateDisplay(r.startDate)}
                            {r.startDate !== r.endDate && ` – ${formatDateDisplay(r.endDate)}`}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {r.totalDays} day{r.totalDays !== 1 ? 's' : ''}
                            {r.isHalfDay && ` (${r.halfDayPeriod || 'Half Day'})`}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-stone-300 italic">
                          &ldquo;{r.reason}&rdquo;
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border w-fit ${
                                r.status === 'Approved'
                                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                                  : r.status === 'Pending'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {r.status}
                              {r.status === 'Pending' &&
                                (isHeadOfDept ? ' (Awaiting CEO)' : ' (Under Review)')}
                            </span>
                            {r.decisionBy && (
                              <span className="text-[10px] text-stone-400">
                                Decision by: {r.decisionBy}
                              </span>
                            )}
                            {r.managerNote && (
                              <span className="text-[10px] text-stone-300 italic max-w-xs truncate">
                                &ldquo;{r.managerNote}&rdquo;
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {r.status === 'Pending' && onCancelRequest ? (
                            <button
                              onClick={() => onCancelRequest(r.id)}
                              className="text-xs font-semibold text-stone-400 hover:text-rose-400 transition-colors"
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              onClick={() => onReviewRequest(r)}
                              className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs"
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
