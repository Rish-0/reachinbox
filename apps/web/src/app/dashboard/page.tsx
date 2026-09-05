'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import ComposeModal from '@/components/ComposeModal';
import EmailTable from '@/components/EmailTable';
import SearchBar from '@/components/SearchBar';
import toast from 'react-hot-toast';

type Tab = 'scheduled' | 'sent';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('scheduled');
  const [composeOpen, setComposeOpen] = useState(false);

  // Scheduled emails
  const [scheduledEmails, setScheduledEmails] = useState<any[]>([]);
  const [scheduledPagination, setScheduledPagination] = useState<any>(null);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [scheduledPage, setScheduledPage] = useState(1);

  // Sent emails
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [sentPagination, setSentPagination] = useState<any>(null);
  const [sentLoading, setSentLoading] = useState(false);
  const [sentPage, setSentPage] = useState(1);

  // Fetch user profile
  const fetchUser = useCallback(async () => {
    try {
      const res = await api.getMe();
      setUser(res.data);
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch scheduled emails
  const fetchScheduled = useCallback(async (page: number) => {
    setScheduledLoading(true);
    try {
      const res = await api.getScheduledEmails(page);
      setScheduledEmails(res.data);
      setScheduledPagination(res.pagination);
    } catch (err) {
      toast.error('Failed to load scheduled emails');
    } finally {
      setScheduledLoading(false);
    }
  }, []);

  // Fetch sent emails
  const fetchSent = useCallback(async (page: number) => {
    setSentLoading(true);
    try {
      const res = await api.getSentEmails(page);
      setSentEmails(res.data);
      setSentPagination(res.pagination);
    } catch (err) {
      toast.error('Failed to load sent emails');
    } finally {
      setSentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!user) return;
    if (tab === 'scheduled') {
      fetchScheduled(scheduledPage);
    } else {
      fetchSent(sentPage);
    }
  }, [user, tab, scheduledPage, sentPage, fetchScheduled, fetchSent]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (tab === 'scheduled') fetchScheduled(scheduledPage);
      else fetchSent(sentPage);
    }, 10000);
    return () => clearInterval(interval);
  }, [user, tab, scheduledPage, sentPage, fetchScheduled, fetchSent]);

  // Handle URL params (Slack connection feedback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('slack') === 'connected') {
      toast.success('Slack connected successfully!');
      window.history.replaceState({}, '', '/dashboard');
      fetchUser();
    }
    if (params.get('error') === 'slack_auth_failed') {
      toast.error('Slack connection failed');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-surface-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleCampaignSuccess = () => {
    fetchScheduled(1);
    setScheduledPage(1);
    setTab('scheduled');
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Header
        user={user}
        onLogout={() => router.push('/')}
        onSlackChange={fetchUser}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Bar: Search + Compose */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="w-full sm:w-96">
            <SearchBar />
          </div>
          <button
            id="compose-btn"
            onClick={() => setComposeOpen(true)}
            className="btn-primary whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Compose
          </button>
        </div>

        {/* Tabs */}
        <div className="card overflow-hidden">
          <div className="flex border-b border-surface-100">
            <button
              id="tab-scheduled"
              onClick={() => setTab('scheduled')}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                tab === 'scheduled'
                  ? 'text-primary-600 border-primary-600 bg-primary-50/50'
                  : 'text-surface-500 border-transparent hover:text-surface-700 hover:bg-surface-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Scheduled
              {scheduledPagination?.total != null && (
                <span className="ml-1 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {scheduledPagination.total}
                </span>
              )}
            </button>
            <button
              id="tab-sent"
              onClick={() => setTab('sent')}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                tab === 'sent'
                  ? 'text-primary-600 border-primary-600 bg-primary-50/50'
                  : 'text-surface-500 border-transparent hover:text-surface-700 hover:bg-surface-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sent
              {sentPagination?.total != null && (
                <span className="ml-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {sentPagination.total}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          {tab === 'scheduled' ? (
            <EmailTable
              emails={scheduledEmails}
              loading={scheduledLoading}
              type="scheduled"
              pagination={scheduledPagination}
              onPageChange={(p) => setScheduledPage(p)}
            />
          ) : (
            <EmailTable
              emails={sentEmails}
              loading={sentLoading}
              type="sent"
              pagination={sentPagination}
              onPageChange={(p) => setSentPage(p)}
            />
          )}
        </div>
      </main>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSuccess={handleCampaignSuccess}
      />
    </div>
  );
}
