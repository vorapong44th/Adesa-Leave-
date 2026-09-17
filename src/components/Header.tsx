import React, { useState } from 'react';
import {
  Bell,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  LogOut,
  Moon,
  Palette,
  Sparkles,
  Sun,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ThemeMode, UserProfile, WorkspaceConfig } from '../types';
import { playNotificationChime, requestPushPermission } from '../services/notificationService';

interface HeaderProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  googleUser: { displayName: string | null; email: string | null; photoURL: string | null } | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  workspaceConfig: WorkspaceConfig;
  onOpenWorkspaceSettings: () => void;
  theme: ThemeMode;
  onToggleTheme: (newTheme: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  unreadCount,
  onOpenNotifications,
  workspaceConfig,
  onOpenWorkspaceSettings,
  theme,
  onToggleTheme,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleRequestPush = async () => {
    const perm = await requestPushPermission();
    setNotificationPerm(perm);
    if (perm === 'granted') {
      playNotificationChime();
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playNotificationChime();
  };

  const themeOptions: { id: ThemeMode; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      label: 'Executive Light',
      sub: 'Crisp slate & bright white, high contrast',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'warm',
      label: 'Warm Sand',
      sub: 'Soft linen paper, gentle & calm',
      icon: <Palette className="w-4 h-4 text-amber-600" />,
    },
    {
      id: 'dark',
      label: 'Obsidian Dark',
      sub: 'Deep night glass & vibrant glows',
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
    },
  ];

  const currentThemeObj = themeOptions.find((t) => t.id === theme) || themeOptions[0];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 via-indigo-600 to-teal-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-stone-900 dark:text-white">
                  Adesa Ventures
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                  Global Trade
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
                Leave Management System • Instant Approvals & Google Workspace Sync
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setThemeMenuOpen(!themeMenuOpen);
                  setUserMenuOpen(false);
                }}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs font-medium backdrop-blur-md"
                title="Change theme (Light / Warm / Dark)"
              >
                {currentThemeObj.icon}
                <span className="hidden md:inline font-semibold text-xs">
                  {currentThemeObj.label.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400 ml-0.5" />
              </button>

              {themeMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-3xl shadow-2xl p-2 z-50 border backdrop-blur-2xl"
                  style={{
                    backgroundColor: 'var(--dropdown-bg)',
                    borderColor: 'var(--border-card)',
                    color: 'var(--text-main)',
                  }}
                  onMouseLeave={() => setThemeMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b mb-1.5" style={{ borderColor: 'var(--border-card)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Visual Appearance
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Select your preferred contrast and atmosphere.
                    </p>
                  </div>
                  <div className="space-y-1">
                    {themeOptions.map((opt) => {
                      const isSelected = theme === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            onToggleTheme(opt.id);
                            setThemeMenuOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-500/15 border border-indigo-500/30'
                              : 'hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5">
                              {opt.icon}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{opt.label}</p>
                              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                                {opt.sub}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Google Sync Status Pill */}
            <button
              onClick={onOpenWorkspaceSettings}
              className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md transition-colors ${
                googleUser
                  ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30 hover:bg-teal-500/25'
                  : 'bg-white/5 text-stone-600 dark:text-stone-300 border-white/10 hover:bg-white/10'
              }`}
              title="Configure Google Calendar & Sheets Sync"
            >
              <div className="flex items-center space-x-1">
                <CalendarIcon className={`w-3.5 h-3.5 ${googleUser ? 'text-teal-500 dark:text-teal-400' : 'text-stone-400'}`} />
                <FileSpreadsheet className={`w-3.5 h-3.5 ${googleUser ? 'text-teal-500 dark:text-teal-400' : 'text-stone-400'}`} />
              </div>
              <span>
                {googleUser ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                    Google Connected
                  </span>
                ) : (
                  'Connect Google'
                )}
              </span>
            </button>

            {/* Browser Push Permission CTA (if not granted) */}
            {notificationPerm !== 'granted' && (
              <button
                onClick={handleRequestPush}
                className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 backdrop-blur-md transition-colors"
                title="Enable browser system push alerts"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Enable Push</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0c0e14]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Sound Mute/Unmute */}
            <button
              onClick={handleToggleSound}
              className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors hidden sm:inline-flex"
              title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-stone-600 dark:text-stone-300" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-400" />
              )}
            </button>

            <div className="h-5 w-[1px] bg-stone-300 dark:bg-white/10 mx-1 hidden sm:block" />

            {/* Active Persona / Role Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setThemeMenuOpen(false);
                }}
                className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left backdrop-blur-md"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-stone-300 dark:ring-white/20"
                />
                <div className="hidden sm:block leading-none">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold">
                      {currentUser.name}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        currentUser.role === 'ceo'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                          : currentUser.role === 'head_of_dept'
                          ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30'
                          : currentUser.role === 'manager'
                          ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border-teal-500/30'
                          : 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {currentUser.role === 'ceo'
                        ? 'CEO'
                        : currentUser.role === 'head_of_dept'
                        ? 'Head of Dept'
                        : currentUser.role === 'manager'
                        ? 'BD Manager'
                        : 'Executive'}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-normal">
                    {currentUser.title}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-1 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-3xl shadow-2xl p-2 z-50 border backdrop-blur-2xl"
                  style={{
                    backgroundColor: 'var(--dropdown-bg)',
                    borderColor: 'var(--border-card)',
                    color: 'var(--text-main)',
                  }}
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'var(--border-card)' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Adesa Ventures Roster
                      </p>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded font-medium">
                        Global Trade
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                      👑 <strong>CEO:</strong> Approves everyone & sees all records
                      <br />
                      ⚡ <strong>Vorapong:</strong> Approves from BD downward
                    </p>
                  </div>
                  <div className="space-y-1">
                    {allUsers.map((u) => {
                      const isCeo = u.role === 'ceo';
                      const isHead = u.role === 'head_of_dept';
                      const isBd = u.role === 'manager';

                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u);
                            setUserMenuOpen(false);
                          }}
                          className={`w-full p-2 rounded-2xl flex items-center justify-between transition-colors text-left ${
                            u.id === currentUser.id
                              ? 'bg-indigo-500/15 border border-indigo-500/30'
                              : 'hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                            />
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold">
                                  {u.name}
                                </span>
                                {isCeo && (
                                  <span className="text-[9px] font-bold px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">
                                    CEO
                                  </span>
                                )}
                                {isHead && (
                                  <span className="text-[9px] font-bold px-1 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300">
                                    HEAD
                                  </span>
                                )}
                                {isBd && (
                                  <span className="text-[9px] font-bold px-1 rounded bg-teal-500/20 text-teal-600 dark:text-teal-300">
                                    BD
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                                {u.title}
                              </p>
                            </div>
                          </div>
                          {u.id === currentUser.id && (
                            <span className="text-[10px] font-semibold text-indigo-500">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Connected Google Profile info */}
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-card)' }}>
                    {googleUser ? (
                      <div className="p-2 rounded-2xl bg-black/5 dark:bg-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {googleUser.photoURL ? (
                              <img
                                src={googleUser.photoURL}
                                alt={googleUser.displayName || 'Google'}
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <Users className="w-4 h-4 text-stone-400" />
                            )}
                            <span className="text-xs font-semibold">
                              {googleUser.displayName || 'Google Account'}
                            </span>
                          </div>
                          <button
                            onClick={onGoogleSignOut}
                            className="text-stone-400 hover:text-rose-500 p-1"
                            title="Disconnect Google"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-stone-400 truncate">{googleUser.email}</p>
                      </div>
                    ) : (
                      <div className="p-1">
                        <button
                          onClick={() => {
                            onGoogleSignIn();
                            setUserMenuOpen(false);
                          }}
                          className="w-full gsi-material-button text-xs justify-center"
                        >
                          <div className="gsi-material-button-content-wrapper">
                            <div className="gsi-material-button-icon">
                              <svg
                                version="1.1"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 48 48"
                                style={{ display: 'block' }}
                              >
                                <path
                                  fill="#EA4335"
                                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                />
                                <path
                                  fill="#4285F4"
                                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                                />
                                <path
                                  fill="#FBBC05"
                                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                                />
                                <path
                                  fill="#34A853"
                                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                />
                                <path fill="none" d="M0 0h48v48H0z" />
                              </svg>
                            </div>
                            <span className="gsi-material-button-contents">Sign in with Google</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
