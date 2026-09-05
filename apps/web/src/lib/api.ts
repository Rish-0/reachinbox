const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Redirect to login on auth failure
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('Authentication required');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error: ${res.status}`);
  }

  return data;
}

export const api = {
  // Auth
  getMe: () => fetchApi<any>('/api/me'),
  logout: () =>
    fetchApi<any>('/auth/logout', { method: 'POST' }),
  disconnectSlack: () =>
    fetchApi<any>('/auth/slack/disconnect', { method: 'POST' }),

  // Campaigns
  createCampaign: (data: any) =>
    fetchApi<any>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCampaigns: (page = 1, limit = 20) =>
    fetchApi<any>(`/api/campaigns?page=${page}&limit=${limit}`),

  // Emails
  getScheduledEmails: (page = 1, limit = 20) =>
    fetchApi<any>(`/api/emails/scheduled?page=${page}&limit=${limit}`),
  getSentEmails: (page = 1, limit = 20) =>
    fetchApi<any>(`/api/emails/sent?page=${page}&limit=${limit}`),
  searchEmails: (q: string, page = 1, limit = 20) =>
    fetchApi<any>(
      `/api/emails/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`
    ),

  // URLs for redirects
  googleAuthUrl: `${API_URL}/auth/google`,
  slackAuthUrl: `${API_URL}/auth/slack`,
};
