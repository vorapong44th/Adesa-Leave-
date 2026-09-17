import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
  X,
} from 'lucide-react';
import { LeaveRequest } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';

interface TeamCalendarViewProps {
  isOpen: boolean;
  onClose: () => void;
  requests: LeaveRequest[];
}

export const TeamCalendarView: React.FC<TeamCalendarViewProps> = ({
  isOpen,
  onClose,
  requests,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Sep 2026
  const [selectedDayLeaves, setSelectedDayLeaves] = useState<{
    dateStr: string;
    leaves: LeaveRequest[];
  } | null>(null);

  const approvedLeaves = useMemo(() => {
    return requests.filter((r) => r.status === 'Approved');
  }, [requests]);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // First day of month & total days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayLeaves(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayLeaves(null);
  };

  // Build calendar matrix
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Helper to check leaves on day
  const getLeavesOnDate = (dayNumber: number) => {
    const formattedDay = dayNumber < 10 ? `0${dayNumber}` : `${dayNumber}`;
    const formattedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    return {
      dateStr,
      leaves: approvedLeaves.filter((l) => l.startDate <= dateStr && l.endDate >= dateStr),
    };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c0e14]/90 backdrop-blur-xl rounded-3xl max-w-4xl w-full border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Team Leave Schedule</h2>
              <p className="text-xs text-stone-400">
                Visual overview of approved staff time-off and coverage
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

        {/* Month Navigator */}
        <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
          <h3 className="text-sm font-bold text-white">{monthName}</h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(2026, 8, 1))}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl text-stone-200 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-20 bg-white/[0.02] rounded-2xl border border-white/5" />;
              }

              const { dateStr, leaves } = getLeavesOnDate(day);
              const isSelected = selectedDayLeaves?.dateStr === dateStr;
              const hasLeaves = leaves.length > 0;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDayLeaves(hasLeaves ? { dateStr, leaves } : null)}
                  className={`h-20 p-2 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer backdrop-blur-sm ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/20 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/10'
                      : hasLeaves
                      ? 'border-indigo-500/30 bg-white/5 hover:border-indigo-500/60 hover:bg-white/10'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        hasLeaves ? 'text-white' : 'text-stone-500'
                      }`}
                    >
                      {day}
                    </span>
                    {hasLeaves && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {leaves.slice(0, 2).map((l) => {
                      const isBusiness = l.leaveType === 'Business Leave';
                      const isSick = l.leaveType === 'Sick Leave';
                      const isAnnual = l.leaveType === 'Annual Leave';
                      const badgeStyle = isAnnual
                        ? 'bg-indigo-500/25 text-indigo-200 border-indigo-500/30'
                        : isBusiness
                        ? 'bg-amber-500/25 text-amber-200 border-amber-500/30'
                        : isSick
                        ? 'bg-teal-500/25 text-teal-200 border-teal-500/30'
                        : 'bg-purple-500/25 text-purple-200 border-purple-500/30';

                      return (
                        <div
                          key={l.id}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-lg border truncate ${badgeStyle}`}
                          title={`${l.employeeName} (${l.leaveType})`}
                        >
                          {l.employeeName.split(' ')[0]} • {l.leaveType.replace(' Leave', '')}
                        </div>
                      );
                    })}
                    {leaves.length > 2 && (
                      <div className="text-[9px] text-stone-400 font-semibold px-1">
                        +{leaves.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Policy Legend */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-300">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] text-stone-400 font-semibold">Policy Quotas:</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-[11px]">Annual (14d/yr)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[11px]">Business (3d/yr)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span className="text-[11px]">Sick (30d/yr)</span>
              </div>
            </div>
            <span className="text-[11px] text-stone-400">Click any date to see scheduled leaves</span>
          </div>

          {/* Selected Day Details Card */}
          {selectedDayLeaves && (
            <div className="mt-4 p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">
                  Scheduled Leaves for {formatDateDisplay(selectedDayLeaves.dateStr)}
                </span>
                <button
                  onClick={() => setSelectedDayLeaves(null)}
                  className="text-stone-400 hover:text-stone-200 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                {selectedDayLeaves.leaves.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {l.employeeName} ({l.employeeTitle})
                      </p>
                      <p className="text-[11px] text-stone-300">
                        {l.leaveType} • {formatDateDisplay(l.startDate)} to{' '}
                        {formatDateDisplay(l.endDate)} ({l.totalDays}d)
                      </p>
                    </div>
                    {l.calendarEventLink && (
                      <a
                        href={l.calendarEventLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                      >
                        Calendar <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
