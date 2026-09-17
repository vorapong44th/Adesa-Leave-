import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Info,
  Send,
  Users,
  X,
} from 'lucide-react';
import { LeaveRequest, LeaveType, UserProfile } from '../types';
import { calculateWorkingDays, doDateRangesOverlap, formatDateDisplay } from '../utils/dateUtils';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allRequests: LeaveRequest[];
  onSubmitRequest: (newRequest: Omit<LeaveRequest, 'id' | 'submittedAt' | 'status'>, id: string) => Promise<void>;
}

const LEAVE_TYPES: { type: LeaveType; description: string; quota: string }[] = [
  {
    type: 'Annual Leave',
    description: 'Paid vacation and recreational time off',
    quota: '14 days/year',
  },
  {
    type: 'Business Leave',
    description: 'Urgent private business, official duties, or administrative paperwork',
    quota: '3 days/year',
  },
  {
    type: 'Sick Leave',
    description: 'Medical recovery, illness, or doctor appointments',
    quota: '30 days/year',
  },
  {
    type: 'Parental Leave',
    description: 'Maternity, paternity, or adoption leave',
    quota: '30 days/year',
  },
  {
    type: 'Unpaid Leave',
    description: 'Extended leave without salary pay',
    quota: '15 days/year',
  },
];

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allRequests,
  onSubmitRequest,
}) => {
  // Tomorrow as initial start date
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'Morning' | 'Afternoon'>('Morning');
  const [reason, setReason] = useState('');
  const [handoverPerson, setHandoverPerson] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto calculate total working days
  const totalDays = useMemo(() => {
    return calculateWorkingDays(startDate, endDate, isHalfDay);
  }, [startDate, endDate, isHalfDay]);

  // Balance for currently selected type
  const balance = currentUser.balances[leaveType] || { allocated: 0, used: 0 };
  const remainingDays = balance.allocated - balance.used;

  // Check team member overlap
  const overlappingTeamRequests = useMemo(() => {
    if (!startDate || !endDate) return [];
    return allRequests.filter(
      (r) =>
        r.status === 'Approved' &&
        r.employeeId !== currentUser.id &&
        doDateRangesOverlap(startDate, endDate, r.startDate, r.endDate)
    );
  }, [allRequests, startDate, endDate, currentUser.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    if (isSubmitting) { e.preventDefault(); return; }
    e.preventDefault();
    setErrorMsg(null);

    if (!startDate || !endDate) {
      setErrorMsg('Please select valid start and end dates.');
      return;
    }

    if (startDate > endDate) {
      setErrorMsg('End date cannot precede start date.');
      return;
    }

    if (totalDays <= 0) {
      setErrorMsg('Selected period does not contain any working days.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please provide a brief reason or notes for your request.');
      return;
    }

    setIsSubmitting(true);
    try {
    await onSubmitRequest({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeEmail: currentUser.email,
      employeeDepartment: currentUser.department,
      employeeTitle: currentUser.title,
      leaveType,
      startDate,
      endDate: isHalfDay ? startDate : endDate,
      isHalfDay,
      halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
      totalDays,
      reason: reason.trim(),
      handoverPerson: handoverPerson.trim() || undefined,
      emergencyPhone: emergencyPhone.trim() || undefined,
    }, submissionId);
    setSubmissionId(crypto.randomUUID());
    setReason('');
    onClose();
    } catch (e: any) { setErrorMsg(e.message || 'Request could not be saved. Try again.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c0e14]/90 backdrop-blur-xl rounded-3xl max-w-xl w-full border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Request Time Off</h2>
              <p className="text-xs text-stone-400">
                Submitting as {currentUser.name} ({currentUser.department})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Leave Type & Balance
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LEAVE_TYPES.map((lt) => {
                const bal = currentUser.balances[lt.type];
                const rem = bal ? bal.allocated - bal.used : 0;
                const isSelected = leaveType === lt.type;
                return (
                  <button
                    type="button"
                    key={lt.type}
                    onClick={() => setLeaveType(lt.type)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/20 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-semibold text-white">{lt.type}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-stone-300 border border-white/10 font-mono">
                          {lt.quota}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border ${
                          rem > 3
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                            : rem > 0
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {rem}d left
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1 line-clamp-1">{lt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                disabled={isHalfDay}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-white/[0.02] disabled:text-stone-600"
                required
              />
            </div>
          </div>

          {/* Half-day toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-stone-400" />
              <div>
                <span className="font-semibold text-stone-200">Half-Day Request</span>
                <p className="text-[11px] text-stone-400">Apply for 0.5 working day only</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isHalfDay && (
                <div className="flex rounded-xl border border-white/10 p-0.5 bg-[#0c0e14]/80 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setHalfDayPeriod('Morning')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      halfDayPeriod === 'Morning' ? 'bg-indigo-600 text-white font-medium' : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Morning
                  </button>
                  <button
                    type="button"
                    onClick={() => setHalfDayPeriod('Afternoon')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      halfDayPeriod === 'Afternoon' ? 'bg-indigo-600 text-white font-medium' : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Afternoon
                  </button>
                </div>
              )}
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => {
                  setIsHalfDay(e.target.checked);
                  if (e.target.checked) {
                    setEndDate(startDate);
                  }
                }}
                className="w-4 h-4 accent-indigo-600 rounded border-white/20"
              />
            </div>
          </div>

          {/* Days summary & Overlap Check banner */}
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-stone-400">Calculated working duration:</span>
              <span className="font-bold text-white">
                {totalDays} working day{totalDays !== 1 ? 's' : ''} (excl. weekends)
              </span>
            </div>

            {overlappingTeamRequests.length > 0 ? (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start space-x-2 text-amber-300">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Team Schedule Note:</span>{' '}
                  {overlappingTeamRequests.map((r) => r.employeeName).join(', ')}{' '}
                  has approved leave during this period.
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs flex items-center space-x-2 text-teal-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>No teammates currently scheduled off during these dates.</span>
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Reason / Notes <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Annual family reunion; all current pull requests reviewed."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Handover & Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Handover Colleague (Optional)
              </label>
              <input
                type="text"
                value={handoverPerson}
                onChange={(e) => setHandoverPerson(e.target.value)}
                placeholder="e.g. David Kim"
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Emergency Contact (Optional)
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving…' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
