import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  HelpCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { LeaveRequest, LeaveType, UserProfile } from '../types';
import { formatDateDisplay, formatRelativeTime } from '../utils/dateUtils';

interface EmployeeDashboardProps {
  currentUser: UserProfile;
  requests: LeaveRequest[];
  onOpenRequestModal: () => void;
  onCancelRequest: (requestId: string) => void;
  onOpenCalendarView: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  requests,
  onOpenRequestModal,
  onCancelRequest,
  onOpenCalendarView,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter requests belonging to this employee
  const myRequests = requests.filter((r) => r.employeeId === currentUser.id);

  const filteredRequests = myRequests.filter((r) => {
    if (filterStatus !== 'all' && r.status.toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.leaveType.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.startDate.includes(q) ||
        r.endDate.includes(q)
      );
    }
    return true;
  });

  const leaveTypes: LeaveType[] = ['Annual Leave', 'Business Leave', 'Sick Leave', 'Parental Leave'];

  const policyBadges: Record<string, string> = {
    'Annual Leave': '14d / yr',
    'Business Leave': '3d / yr',
    'Sick Leave': '30d / yr',
    'Parental Leave': '30d / yr',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Welcome back, {currentUser.name.split(' ')[0]}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Active Entitlement
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            Statutory policy: <strong className="text-white font-medium">14 days Annual Leave</strong>,{' '}
            <strong className="text-white font-medium">3 days Business Leave</strong>, and{' '}
            <strong className="text-white font-medium">30 days Sick Leave</strong> per calendar year.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenCalendarView}
            className="px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold text-stone-200 hover:bg-white/10 hover:text-white flex items-center space-x-1.5 transition-colors backdrop-blur-md"
          >
            <CalendarIcon className="w-4 h-4 text-stone-300" />
            <span>Team Calendar</span>
          </button>
          <button
            onClick={onOpenRequestModal}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Request Time Off</span>
          </button>
        </div>
      </div>

      {/* Leave Entitlement & Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveTypes.map((type) => {
          const bal = currentUser.balances[type] || { allocated: 0, used: 0 };
          const remaining = Math.max(0, bal.allocated - bal.used);
          const percentUsed = bal.allocated > 0 ? Math.min(100, (bal.used / bal.allocated) * 100) : 0;

          return (
            <div
              key={type}
              className="bg-white/5 backdrop-blur-lg rounded-3xl p-5 border border-white/10 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-200">{type}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-stone-300 border border-white/10">
                    {policyBadges[type] || 'Standard'}
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">{remaining}</span>
                  <span className="text-xs text-stone-400">/ {bal.allocated} days left</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-stone-400 mb-1.5">
                  <span>Used: {bal.used}d</span>
                  <span>{percentUsed.toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      percentUsed > 80
                        ? 'bg-rose-400 shadow-sm shadow-rose-400/50'
                        : percentUsed > 50
                        ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                        : 'bg-teal-400 shadow-sm shadow-teal-400/50'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* My Requests Section */}
      <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-semibold text-white">My Leave Requests</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-stone-200 border border-white/10">
              {myRequests.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requests..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
              />
            </div>

            {/* Status Filter */}
            <div className="flex rounded-xl border border-white/10 p-0.5 bg-white/5 text-xs backdrop-blur-md">
              {['all', 'pending', 'approved', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                    filterStatus === st
                      ? 'bg-white/20 font-semibold text-white shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-stone-400 mb-3">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-white">No leave requests found</p>
            <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
              {filterStatus !== 'all'
                ? `There are no ${filterStatus} requests matching your query.`
                : 'You have not submitted any time-off requests yet.'}
            </p>
            {filterStatus === 'all' && (
              <button
                onClick={onOpenRequestModal}
                className="mt-4 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white text-xs font-semibold inline-flex items-center space-x-1.5 shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Submit First Request</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredRequests.map((req) => {
              const isPending = req.status === 'Pending';
              const isApproved = req.status === 'Approved';
              const isRejected = req.status === 'Rejected';

              return (
                <div key={req.id} className="p-4 sm:p-5 hover:bg-white/[0.04] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left Info */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white">
                          {req.leaveType}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isApproved
                              ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                              : isPending
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : isRejected
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-white/10 text-stone-300 border-white/10'
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-[11px] text-stone-400 font-mono">#{req.id}</span>
                      </div>

                      <p className="text-xs font-medium text-stone-200 flex items-center space-x-1.5">
                        <span>
                          {formatDateDisplay(req.startDate)}
                          {req.startDate !== req.endDate && ` – ${formatDateDisplay(req.endDate)}`}
                        </span>
                        <span className="text-stone-500">•</span>
                        <span className="text-stone-400 font-normal">
                          {req.totalDays} day{req.totalDays !== 1 ? 's' : ''}
                          {req.isHalfDay && ` (${req.halfDayPeriod || 'Half Day'})`}
                        </span>
                      </p>

                      <p className="text-xs text-stone-400 line-clamp-1 italic">
                        &ldquo;{req.reason}&rdquo;
                      </p>
                    </div>

                    {/* Right Metadata & Integrations */}
                    <div className="flex flex-wrap items-center sm:justify-end gap-2 text-xs">
                      {/* Google Calendar Link if approved */}
                      {isApproved && req.calendarEventLink && (
                        <a
                          href={req.calendarEventLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 font-medium flex items-center space-x-1 transition-colors"
                          title="View on Google Calendar"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>Google Calendar</span>
                          <ExternalLink className="w-2.5 h-2.5 text-amber-400" />
                        </a>
                      )}

                      {/* Google Sheets Sync indicator if approved */}
                      {isApproved && req.sheetRowAppended && (
                        <span
                          className="px-2.5 py-1 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30 font-medium flex items-center space-x-1 text-[11px]"
                          title="Logged in Yearly Google Sheet"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
                          <span>Recorded in Sheet</span>
                        </span>
                      )}

                      {/* Manager Note badge if reviewed */}
                      {req.managerNote && (
                        <div
                          className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-stone-300 text-[11px] max-w-xs truncate"
                          title={`Manager Note: ${req.managerNote}`}
                        >
                          <span className="font-semibold text-stone-200">Note:</span> {req.managerNote}
                        </div>
                      )}

                      {/* Cancel button if still pending */}
                      {isPending && (
                        <button
                          onClick={() => onCancelRequest(req.id)}
                          className="px-2.5 py-1 rounded-xl text-rose-400 hover:bg-rose-500/15 text-xs font-medium flex items-center space-x-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
