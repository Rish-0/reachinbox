'use client';

import { formatDateTime, getStatusBadgeClass } from '@/lib/utils';

interface EmailTableProps {
  emails: any[];
  loading: boolean;
  type: 'scheduled' | 'sent';
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  } | null;
  onPageChange: (page: number) => void;
}

export default function EmailTable({
  emails,
  loading,
  type,
  pagination,
  onPageChange,
}: EmailTableProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-surface-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-surface-400">
        <svg
          className="w-12 h-12 mb-3 text-surface-300"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z"
          />
        </svg>
        <p className="font-medium text-surface-500">
          No {type === 'scheduled' ? 'scheduled' : 'sent'} emails yet
        </p>
        <p className="text-sm mt-1">
          {type === 'scheduled'
            ? 'Create a campaign to schedule emails'
            : 'Emails will appear here after they are sent'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase tracking-wider">
                Recipient
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase tracking-wider">
                {type === 'scheduled' ? 'Scheduled' : 'Sent At'}
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-surface-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {emails.map((email) => (
              <tr
                key={email.id}
                className="hover:bg-surface-50 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="text-sm text-surface-800 font-medium">
                    {email.recipient}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-surface-600 truncate block max-w-xs">
                    {email.subject}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-surface-500">
                    {type === 'scheduled'
                      ? formatDateTime(email.scheduledAt)
                      : formatDateTime(email.sentAt || email.scheduledAt)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={getStatusBadgeClass(email.status)}>
                    {email.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
          <p className="text-sm text-surface-500">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
