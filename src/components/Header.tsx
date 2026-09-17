import React, { useState } from 'react';
import { ThemeMode, UserProfile, WorkspaceConfig } from '../types';
import { requestPushPermission } from '../services/notificationService';
interface HeaderProps {
  currentUser: UserProfile;
  googleUser: { displayName: string | null; email: string | null; photoURL: string | null } | null;
  onGoogleSignIn: () => void; onGoogleSignOut: () => void;
  unreadCount: number; onOpenNotifications: () => void;
  workspaceConfig: WorkspaceConfig; onOpenWorkspaceSettings: () => void;
  theme: ThemeMode; onToggleTheme: (theme: ThemeMode) => void;
}
export const Header: React.FC<HeaderProps> = (props) => {
  const [pushMessage, setPushMessage] = useState('');
  const enablePush = async () => {
    try { await requestPushPermission(); setPushMessage('Notifications enabled on this device.'); }
    catch (e: any) { setPushMessage(e.message); }
  };
  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-xl" style={{ background: 'var(--bg-header)', borderColor: 'var(--border-card)' }}>
      <div className="max-w-7xl mx-auto p-4 flex flex-wrap gap-4 items-center justify-between">
        <div><h1 className="font-bold text-lg">Adesa Leave</h1><p className="text-xs">{props.currentUser.name} · {props.currentUser.title}</p></div>
        <nav className="flex flex-wrap items-center gap-3 text-sm" aria-label="Main navigation">
          <button onClick={props.onOpenNotifications}>Notifications ({props.unreadCount})</button>
          <button onClick={enablePush}>Enable device notifications</button>
          {['ceo', 'head_of_dept'].includes(props.currentUser.role) && <button onClick={props.onOpenWorkspaceSettings}>Workspace settings</button>}
          <select aria-label="Color theme" value={props.theme} onChange={e => props.onToggleTheme(e.target.value as ThemeMode)} className="bg-transparent">
            <option value="light">Light</option><option value="warm">Warm</option><option value="dark">Dark</option>
          </select>
          <button onClick={props.onGoogleSignIn}>Reconnect Google</button>
          <button onClick={props.onGoogleSignOut}>Sign out</button>
        </nav>
        {pushMessage && <p role="status" className="w-full text-xs">{pushMessage}</p>}
      </div>
    </header>
  );
};
