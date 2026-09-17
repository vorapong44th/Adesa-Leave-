import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  HelpCircle,
  Loader2,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { WorkspaceConfig } from '../types';
import { createYearlyLeaveSheet, getSpreadsheetDetails } from '../services/workspaceService';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WorkspaceConfig;
  onSaveConfig: (newConfig: WorkspaceConfig) => void;
  googleUser: { displayName: string | null; email: string | null } | null;
  accessToken: string | null;
  onGoogleSignIn: () => void;
}

export const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  googleUser,
  accessToken,
  onGoogleSignIn,
}) => {
  const [sheetIdInput, setSheetIdInput] = useState(config.sheetId || '');
  const [sheetNameInput, setSheetNameInput] = useState(config.sheetName || 'Leave Records');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      setStatusMessage({
        type: 'error',
        text: 'Please connect your Google Account first to create a Google Sheet.',
      });
      return;
    }

    try {
      setIsCreatingSheet(true);
      setStatusMessage(null);
      const result = await createYearlyLeaveSheet(accessToken);
      const newConfig: WorkspaceConfig = {
        ...config,
        sheetId: result.spreadsheetId,
        sheetUrl: result.spreadsheetUrl,
        sheetName: result.sheetName,
      };
      setSheetIdInput(result.spreadsheetId);
      setSheetNameInput(result.sheetName);
      onSaveConfig(newConfig);
      setStatusMessage({
        type: 'success',
        text: `Created new spreadsheet: "Company Leave Tracker - ${new Date().getFullYear()}". Approved leaves will now log here!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to create spreadsheet.',
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleVerifyCustomSheet = async () => {
    if (!accessToken) {
      setStatusMessage({
        type: 'error',
        text: 'Please connect your Google Account first.',
      });
      return;
    }

    // Extract ID from full URL if pasted
    let cleanId = sheetIdInput.trim();
    const urlMatch = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      cleanId = urlMatch[1];
      setSheetIdInput(cleanId);
    }

    if (!cleanId) {
      setStatusMessage({ type: 'error', text: 'Please enter a Spreadsheet ID or URL.' });
      return;
    }

    try {
      setIsVerifying(true);
      setStatusMessage(null);
      const details = await getSpreadsheetDetails(cleanId, accessToken);
      const newConfig: WorkspaceConfig = {
        ...config,
        sheetId: cleanId,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
        sheetName: details.firstSheetName || sheetNameInput,
      };
      onSaveConfig(newConfig);
      setStatusMessage({
        type: 'success',
        text: `Verified access to "${details.title}" (Tab: ${details.firstSheetName})`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Could not verify spreadsheet. Ensure your Google account has edit access.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c0e14]/90 backdrop-blur-xl rounded-3xl max-w-xl w-full border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Google Workspace Integration
              </h2>
              <p className="text-xs text-stone-400">
                Automatic synchronization for Google Calendar and Google Sheets
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

        <div className="p-6 space-y-6">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start space-x-2 ${
                statusMessage.type === 'success'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              <span className="font-semibold mt-0.5">
                {statusMessage.type === 'success' ? 'Success:' : 'Notice:'}
              </span>
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* Google Account Section */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shadow-xs">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-4 h-4"
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
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {googleUser ? googleUser.email : 'Google Account Not Connected'}
                </p>
                <p className="text-[11px] text-stone-400">
                  {googleUser
                    ? 'Authorized for Google Calendar events and Google Sheets data'
                    : 'Sign in to allow saving events and yearly records'}
                </p>
              </div>
            </div>

            {!googleUser && (
              <button
                onClick={onGoogleSignIn}
                className="gsi-material-button text-xs py-1.5 px-3"
              >
                <span className="gsi-material-button-contents">Sign in with Google</span>
              </button>
            )}
          </div>

          {/* Google Calendar Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold text-white">1. Google Calendar Sync</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoSyncCalendar}
                  onChange={(e) =>
                    onSaveConfig({ ...config, autoSyncCalendar: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-500 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed bg-white/5 p-3.5 rounded-2xl border border-white/10">
              When a manager approves a leave request, an all-day event is automatically created on
              the manager&apos;s primary Google Calendar with employee details, out-of-office block, and
              direct review links.
            </p>
          </div>

          {/* Google Sheets Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs font-semibold text-white">
                  2. Google Sheets Yearly Record
                </h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoSyncSheets}
                  onChange={(e) =>
                    onSaveConfig({ ...config, autoSyncSheets: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-500 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            <p className="text-xs text-stone-300">
              Every approved leave request is automatically appended to a designated yearly spreadsheet
              for HR and audit records.
            </p>

            {/* Configured Sheet Card or Setup */}
            {config.sheetUrl ? (
              <div className="p-3.5 rounded-2xl border border-teal-500/30 bg-teal-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-semibold text-teal-200">
                      Active Yearly Spreadsheet
                    </span>
                  </div>
                  <a
                    href={config.sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-teal-300 hover:text-teal-200 flex items-center gap-1 underline underline-offset-2"
                  >
                    Open Sheet <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-teal-400 break-all font-mono">
                  ID: {config.sheetId}
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-teal-500/20 text-[11px]">
                  <span className="text-stone-400">Tab name: {config.sheetName}</span>
                  <button
                    onClick={() => {
                      onSaveConfig({ ...config, sheetId: '', sheetUrl: '' });
                      setSheetIdInput('');
                    }}
                    className="text-stone-400 hover:text-rose-400 text-[11px] transition-colors"
                  >
                    Change Spreadsheet
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {/* One-click automatic creation */}
                <button
                  onClick={handleCreateNewSheet}
                  disabled={isCreatingSheet || !googleUser}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-lg shadow-teal-500/20"
                >
                  {isCreatingSheet ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlusCircle className="w-4 h-4" />
                  )}
                  <span>
                    {isCreatingSheet
                      ? 'Creating Google Spreadsheet...'
                      : `Create New "Company Leave Tracker - ${new Date().getFullYear()}" Sheet`}
                  </span>
                </button>

                {/* Or connect existing */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-3 text-stone-500 text-[11px]">or link existing sheet</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sheetIdInput}
                    onChange={(e) => setSheetIdInput(e.target.value)}
                    placeholder="Enter Google Spreadsheet ID or URL"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/5 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={handleVerifyCustomSheet}
                    disabled={isVerifying || !sheetIdInput.trim() || !googleUser}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center space-x-1.5 border border-white/10 transition-colors disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Link</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center text-[11px] text-stone-400 gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
            <span>Tokens are kept strictly in memory for safety</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
