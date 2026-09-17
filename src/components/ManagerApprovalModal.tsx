import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { COMPANY_LEAVE_POLICY, LeaveRequest, UserProfile, checkApprovalPermission } from '../types';
import { doDateRangesOverlap, formatDateDisplay } from '../utils/dateUtils';

interface ManagerApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LeaveRequest | null;
  allRequests: LeaveRequest[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onApprove: (request: LeaveRequest, managerNote: string) => Promise<void>;
  onReject: (request: LeaveRequest, managerNote: string) => Promise<void>;
  isSyncing: boolean;
  syncProgress: string | null;
}

export const ManagerApprovalModal: React.FC<ManagerApprovalModalProps> = ({
  isOpen,
  onClose,
  request,
  allRequests,
  currentUser,
  allUsers,
  onApprove,
  onReject,
  isSyncing,
  syncProgress,
}) => {
  const [managerNote, setManagerNote] = useState('');
  const [rejectMode, setRejectMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const applicant = allUsers.find((u) => u.id === request.employeeId);
  const perm = checkApprovalPermission(currentUser, request, applicant);

  // Check overlapping teammate leaves
  const overlappingApproved = allRequests.filter(
    (r) =>
      r.id !== request.id &&
      r.status === 'Approved' &&
      doDateRangesOverlap(request.startDate, request.endDate, r.startDate, r.endDate)
  );

  const handleApproveClick = async () => {
    if (!perm.canApprove) {
      setErrorMsg(perm.reason || 'You do not have permission to approve this leave request.');
      return;
    }
    try {
      setErrorMsg(null);
      await onApprove(request, managerNote);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve and sync leave.');
    }
  };

  const handleRejectClick = async () => {
    if (!perm.canApprove) {
      setErrorMsg(perm.reason || 'You do not have permission to reject this leave request.');
      return;
    }
    if (!managerNote.trim()) {
      setErrorMsg('Please enter a reason or note explaining why the leave was declined.');
      return;
    }
    try {
      setErrorMsg(null);
      await onReject(request, managerNote);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject leave.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c0e14]/90 backdrop-blur-xl rounded-3xl max-w-xl w-full border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              currentUser.role === 'ceo'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
            }`}>
              {currentUser.role === 'ceo' ? <Crown className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-white">Review Leave Request</h2>
                {currentUser.role === 'ceo' && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    CEO Authority
                  </span>
                )}
                {currentUser.role === 'head_of_dept' && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Head of Dept
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">ID: {request.id} • Adesa Ventures (Global Trade)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Authority notice */}
          {!perm.canApprove ? (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Approval Authority Notice</p>
                <p className="text-[11px] text-rose-200 mt-0.5">{perm.reason}</p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px]">
                <strong>Approval Authorized:</strong>{' '}
                {currentUser.role === 'ceo'
                  ? 'CEO Executive Authority (Can approve all personnel)'
                  : 'Department Head Authority (Vorapong can approve BD downward)'}
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sync in-progress banner */}
          {isSyncing && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
              <span className="font-semibold">
                {syncProgress || 'Syncing with Google Calendar and Google Sheets...'}
              </span>
            </div>
          )}

          {/* Employee Card */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                {request.employeeName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{request.employeeName}</p>
                <p className="text-xs text-stone-300">
                  {request.employeeTitle} • {request.employeeDepartment}
                </p>
                <p className="text-[11px] text-stone-400">{request.employeeEmail}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 inline-block">
                {request.leaveType}
              </span>
              {COMPANY_LEAVE_POLICY[request.leaveType] && (
                <p className="text-[10px] text-stone-400 mt-1 font-mono">
                  Quota: {COMPANY_LEAVE_POLICY[request.leaveType].allocated}d / yr
                </p>
              )}
            </div>
          </div>

          {/* Dates & Duration Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl border border-white/10 bg-white/5">
              <span className="text-stone-400 block text-[11px]">Requested Period</span>
              <span className="font-semibold text-white mt-0.5 block">
                {formatDateDisplay(request.startDate)}
                {request.startDate !== request.endDate && ` – ${formatDateDisplay(request.endDate)}`}
              </span>
              {request.isHalfDay && (
                <span className="text-[10px] text-amber-400 font-medium mt-0.5 block">
                  Half-day ({request.halfDayPeriod || 'Morning'})
                </span>
              )}
            </div>

            <div className="p-3 rounded-2xl border border-white/10 bg-white/5">
              <span className="text-stone-400 block text-[11px]">Total Duration</span>
              <span className="font-bold text-white text-sm mt-0.5 block">
                {request.totalDays} working day{request.totalDays !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] text-stone-500">Excludes standard weekends</span>
            </div>
          </div>

          {/* Reason */}
          <div className="p-3.5 rounded-2xl border border-white/10 bg-white/5 text-xs">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
              Employee Statement / Reason:
            </span>
            <p className="text-stone-200 leading-relaxed italic">&ldquo;{request.reason}&rdquo;</p>
          </div>

          {/* Handover & Emergency */}
          {(request.handoverPerson || request.emergencyPhone) && (
            <div className="flex flex-wrap gap-4 text-xs text-stone-300 bg-white/5 p-3.5 rounded-2xl border border-white/10">
              {request.handoverPerson && (
                <div>
                  <span className="text-[11px] text-stone-400 block">Handover Colleague:</span>
                  <span className="font-medium text-white">{request.handoverPerson}</span>
                </div>
              )}
              {request.emergencyPhone && (
                <div>
                  <span className="text-[11px] text-stone-400 block">Emergency Contact:</span>
                  <span className="font-medium text-white">{request.emergencyPhone}</span>
                </div>
              )}
            </div>
          )}

          {/* Team Overlap Check */}
          <div>
            {overlappingApproved.length > 0 ? (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Team Overlap Warning:</span>{' '}
                  {overlappingApproved.map((r) => `${r.employeeName} (${r.leaveType})`).join(', ')}{' '}
                  will be off during these dates.
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Team coverage clear: No other teammates off during these dates.</span>
              </div>
            )}
          </div>

          {/* Manager Feedback Note */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              {rejectMode ? 'Reason for Rejection *' : 'Manager Notes / Feedback (Optional)'}
            </label>
            <textarea
              value={managerNote}
              onChange={(e) => setManagerNote(e.target.value)}
              placeholder={
                rejectMode
                  ? 'Please state why this request cannot be approved at this time...'
                  : 'e.g., Approved. Handover coverage with David Kim looks solid!'
              }
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Google Workspace Notice */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px] text-stone-300">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
              <span>
                {request.status === 'Pending' ? 'Approval saves the decision and attempts enabled Google integrations.' : 'This decision is final. Approval controls are disabled.'}
                {request.sync && <span className="block mt-2">Calendar: {request.sync.calendar.replaceAll('_', ' ')} · Sheets: {request.sync.sheets.replaceAll('_', ' ')}</span>}
                {request.sync && Object.values(request.sync).some(s => !['synced', 'disabled'].includes(s)) && <span className="block mt-2">Ask your administrator to reconcile the Google record using this request ID. Do not approve again to retry synchronization.</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            {!rejectMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setRejectMode(true)}
                  disabled={isSyncing || !perm.canApprove}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/15 border border-rose-500/20 rounded-2xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={handleApproveClick}
                  disabled={isSyncing || !perm.canApprove}
                  className={`px-5 py-2 rounded-2xl text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg transition-all ${
                    !perm.canApprove
                      ? 'bg-stone-700/50 text-stone-400 border border-stone-600/30 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20'
                  }`}
                  title={!perm.canApprove ? perm.reason : 'Approve and sync to Google Workspace'}
                >
                  {isSyncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isSyncing
                      ? 'Approving & Syncing...'
                      : !perm.canApprove
                      ? 'Approval Restricted'
                      : 'Approve & Sync'}
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setRejectMode(false)}
                  className="px-3 py-2 text-xs font-semibold text-stone-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleRejectClick}
                  disabled={isSyncing || !perm.canApprove}
                  className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-rose-600/20 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirm Rejection</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
