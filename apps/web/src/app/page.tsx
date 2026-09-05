'use client';

import { api } from '@/lib/api';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50 to-surface-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-300 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-200">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-surface-900">ReachInbox</h1>
          <p className="text-surface-500 mt-2">
            Email Campaign Scheduler
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-surface-800 text-center mb-2">
            Welcome back
          </h2>
          <p className="text-surface-500 text-center mb-8 text-sm">
            Sign in to manage your email campaigns
          </p>

          <a
            id="google-login-btn"
            href={api.googleAuthUrl}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 
                       bg-white border-2 border-surface-200 rounded-xl
                       text-surface-700 font-medium
                       hover:bg-surface-50 hover:border-surface-300
                       focus:outline-none focus:ring-2 focus:ring-primary-500 
                       transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </a>

          <div className="mt-6 pt-6 border-t border-surface-100">
            <p className="text-xs text-center text-surface-400">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-surface-400 text-xs mt-6">
          Powered by BullMQ • Ethereal SMTP • Elasticsearch
        </p>
      </div>
    </div>
  );
}
