import React from 'react';
import { Bell, Check, Clock, ExternalLink, Play, Trash2, X } from 'lucide-react';
import { PushNotification } from '../types';
import { formatRelativeTime } from '../utils/dateUtils';
import { playNotificationChime } from '../services/notificationService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PushNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onSelectNotification: (requestId: string) => void;
  onTestPush: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onSelectNotification,
  onTestPush,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0c0e14]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Push Notifications</h2>
                <p className="text-xs text-stone-400">
                  {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="px-4 py-2.5 bg-white/[0.01] border-b border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={onMarkAllRead}
                disabled={unreadCount === 0}
                className="flex items-center space-x-1 text-stone-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
              <span className="text-stone-600">|</span>
              <button
                onClick={onClearAll}
                disabled={notifications.length === 0}
                className="flex items-center space-x-1 text-stone-400 hover:text-rose-400 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <button
              onClick={() => {
                playNotificationChime();
                onTestPush();
              }}
              className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 font-medium transition-colors backdrop-blur-sm"
              title="Trigger a simulated instant push notification with chime"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Test Push Chime</span>
            </button>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-stone-400 mb-3">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-white">No notifications yet</p>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                  Managers receive instant push alerts with chime when employees submit leave
                  requests.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    onSelectNotification(notif.requestId);
                    onClose();
                  }}
                  className={`p-4 transition-colors cursor-pointer hover:bg-white/[0.04] ${
                    !notif.read ? 'bg-amber-500/10 border-l-4 border-amber-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-xs ${
                        !notif.read ? 'font-semibold text-white' : 'font-medium text-stone-300'
                      }`}
                    >
                      {notif.title}
                    </h3>
                    <span className="flex items-center text-[10px] text-stone-400 whitespace-nowrap">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatRelativeTime(notif.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">{notif.message}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium border ${
                        notif.type === 'leave_submitted'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : notif.type === 'leave_approved'
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {notif.type === 'leave_submitted'
                        ? 'Needs Approval'
                        : notif.type === 'leave_approved'
                        ? 'Approved'
                        : 'Rejected'}
                    </span>
                    <span className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                      Review Request <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
