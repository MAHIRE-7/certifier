/**
 * Typed API Client for Certifier Backend
 */

const API_BASE = '/api/v1';

export interface UserSession {
  id: string;
  email: string;
  displayName: string;
  role: 'platform_admin' | 'organization_admin' | 'issuer';
  organization: {
    id: string;
    name: string;
    slug: string;
    approvalStatus: string;
  };
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('certifier_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('certifier_token', token);
    } else {
      localStorage.removeItem('certifier_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // Auth
  async register(body: any) {
    return this.request<{ token: string; user: UserSession }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: UserSession }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe() {
    return this.request<{ user: UserSession }>('/auth/me');
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.request<{
      metrics: {
        totalCredentials: number;
        activeCredentials: number;
        revokedCredentials: number;
        totalEvents: number;
        totalBadges: number;
      };
      recentCredentials: any[];
    }>('/dashboard/stats');
  }

  // Events
  async getEvents() {
    return this.request<{ events: any[] }>('/events');
  }

  async createEvent(event: any) {
    return this.request<{ event: any }>('/events', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }

  async getEvent(id: string) {
    return this.request<{ event: any; credentials: any[] }>(`/events/${id}`);
  }

  async previewCsv(eventId: string, csvContent: string) {
    return this.request<{ summary: any; validRows: any[]; invalidRows: any[] }>(
      `/events/${eventId}/imports`,
      {
        method: 'POST',
        body: JSON.stringify({ csvContent })
      }
    );
  }

  async issueCredentials(eventId: string, data: any) {
    return this.request<{ message: string; credentials: any[] }>(
      `/events/${eventId}/credentials/issue`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
  }

  // Credentials
  async getCredentials(params?: { search?: string; status?: string }) {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    return this.request<{ credentials: any[] }>(`/credentials?${qs.toString()}`);
  }

  async getCredential(id: string) {
    return this.request<{ credential: any; auditHistory: any[] }>(`/credentials/${id}`);
  }

  async revokeCredential(id: string, reason: string) {
    return this.request<{ message: string; id: string; status: string }>(
      `/credentials/${id}/revoke`,
      {
        method: 'POST',
        body: JSON.stringify({ reason })
      }
    );
  }

  // Badges
  async getBadges() {
    return this.request<{ badges: any[] }>('/badges');
  }

  async createBadge(badge: any) {
    return this.request<{ badge: any }>('/badges', {
      method: 'POST',
      body: JSON.stringify(badge)
    });
  }

  async issueBadge(badgeId: string, data: any) {
    return this.request<{ message: string; credential: any }>(
      `/badges/${badgeId}/issue`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
  }

  async getPublicBadge(badgeId: string) {
    return this.request<{ badge: any }>(`/badges/${badgeId}`);
  }

  // Public Verification (unauthenticated)
  async verifyCredential(credentialId: string) {
    return this.request<any>(`/verify/${credentialId}`);
  }

  async getPublicIssuer(slug: string) {
    return this.request<any>(`/issuers/${slug}`);
  }

  // Admin
  async getAdminIssuers() {
    return this.request<{ issuers: any[] }>('/admin/issuers');
  }

  async approveIssuer(id: string) {
    return this.request(`/admin/issuers/${id}/approve`, { method: 'POST' });
  }

  async suspendIssuer(id: string) {
    return this.request(`/admin/issuers/${id}/suspend`, { method: 'POST' });
  }

  async getAdminAudit() {
    return this.request<{ auditEvents: any[] }>('/admin/audit');
  }
}

export const api = new ApiClient();
