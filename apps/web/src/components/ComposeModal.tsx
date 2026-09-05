'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { parseEmails } from '@reachinbox/shared';
import toast from 'react-hot-toast';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState('');
  const [startTime, setStartTime] = useState('');
  const [delayBetween, setDelayBetween] = useState(10);
  const [hourlyLimit, setHourlyLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse emails for preview count
  const parsedEmails = parseEmails(recipients);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRecipients((prev) => (prev ? `${prev}\n${content}` : content));
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (parsedEmails.length === 0) {
      toast.error('No valid email addresses found');
      return;
    }

    setLoading(true);
    try {
      await api.createCampaign({
        sender,
        subject,
        body,
        recipients,
        startTime: new Date(startTime).toISOString(),
        delayBetweenMs: delayBetween * 1000,
        hourlyLimit,
      });

      toast.success(`Campaign created with ${parsedEmails.length} emails!`);
      onSuccess();
      resetForm();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSender('');
    setSubject('');
    setBody('');
    setRecipients('');
    setStartTime('');
    setDelayBetween(10);
    setHourlyLimit(50);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-surface-900">Compose New Email</h2>
          </div>
          <button
            type="submit"
            form="compose-form"
            disabled={loading || parsedEmails.length === 0}
            className="btn-primary text-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>

        {/* Form */}
        <form id="compose-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* From */}
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">From</label>
            <input
              id="sender-input"
              type="email"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="oliver.brown@domain.io"
              className="input-field"
              required
            />
          </div>

          {/* To (Recipients) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-surface-600">To</label>
              <div className="flex items-center gap-2">
                {parsedEmails.length > 0 && (
                  <span className="text-xs text-primary-600 font-medium">
                    {parsedEmails.length} valid email{parsedEmails.length !== 1 ? 's' : ''}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Upload List
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
            <textarea
              id="recipients-input"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="Paste emails here (comma, newline, or semicolon separated) or upload a CSV/text file..."
              className="input-field min-h-[80px] resize-y text-sm"
              rows={3}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Subject</label>
            <input
              id="subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="input-field"
              required
            />
          </div>

          {/* Schedule Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Start Time</label>
              <input
                id="start-time-input"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-field text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Delay (seconds)</label>
              <input
                id="delay-input"
                type="number"
                value={delayBetween}
                onChange={(e) => setDelayBetween(parseInt(e.target.value) || 0)}
                min={0}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Hourly Limit</label>
              <input
                id="hourly-limit-input"
                type="number"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(parseInt(e.target.value) || 1)}
                min={1}
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Body</label>
            <textarea
              id="body-input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your email body..."
              className="input-field min-h-[150px] resize-y"
              rows={6}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || parsedEmails.length === 0}
              className="btn-primary text-sm"
            >
              {loading ? 'Creating...' : `Schedule ${parsedEmails.length} Email${parsedEmails.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
