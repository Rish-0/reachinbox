'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDateTime, getStatusBadgeClass } from '@/lib/utils';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.searchEmails(query.trim());
      setResults(res.data || []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search emails..."
            className="input-field pl-9 pr-4 py-2 text-sm"
          />
        </div>
        <button
          id="search-btn"
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className="btn-primary text-sm py-2"
        >
          Search
        </button>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searched && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-surface-200 shadow-xl z-30 max-h-80 overflow-y-auto animate-slide-down">
          {loading ? (
            <div className="p-4 text-center text-surface-400">
              <svg className="w-5 h-5 mx-auto animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-surface-400 text-sm">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <>
              <div className="px-4 py-2 bg-surface-50 text-xs font-medium text-surface-500 border-b border-surface-100">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              {results.map((r: any) => (
                <div
                  key={r.id}
                  className="px-4 py-3 hover:bg-surface-50 border-b border-surface-50 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-surface-800">
                      {r.recipient}
                    </span>
                    <span className={getStatusBadgeClass(r.status)}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5 truncate">
                    {r.subject}
                  </p>
                </div>
              ))}
            </>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 text-xs text-surface-400 hover:bg-surface-50 
                       border-t border-surface-100 text-center"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
