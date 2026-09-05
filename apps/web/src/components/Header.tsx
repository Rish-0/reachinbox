'use client';

import Image from 'next/image';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
    slackConnected: boolean;
    slackTeamName: string | null;
  };
  onLogout: () => void;
  onSlackChange: () => void;
}

export default function Header({ user, onLogout, onSlackChange }: HeaderProps) {
  const handleLogout = async () => {
    try {
      await api.logout();
      window.location.href = '/';
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleSlackDisconnect = async () => {
    try {
      await api.disconnectSlack();
      toast.success('Slack disconnected');
      onSlackChange();
    } catch {
      toast.error('Failed to disconnect Slack');
    }
  };

  return (
    <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-surface-900">ReachInbox</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Slack Connection */}
            {user.slackConnected ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-500">
                  Slack: <span className="text-green-600 font-medium">{user.slackTeamName}</span>
                </span>
                <button
                  id="slack-disconnect-btn"
                  onClick={handleSlackDisconnect}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <a
                id="slack-connect-btn"
                href={api.slackAuthUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 
                           bg-[#4A154B] text-white text-xs font-medium rounded-lg
                           hover:bg-[#3a1139] transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.124 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.52 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.124a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.52v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.52 2.523h-6.313z" />
                </svg>
                Connect Slack
              </a>
            )}

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-4 border-l border-surface-200">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {user.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-surface-800">{user.name}</p>
                <p className="text-xs text-surface-500">{user.email}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="p-2 text-surface-400 hover:text-surface-600 
                         hover:bg-surface-100 rounded-lg transition-all"
              title="Logout"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
