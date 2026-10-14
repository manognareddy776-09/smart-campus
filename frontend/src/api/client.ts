import {
  AuthResponse,
  Campus,
  Claim,
  ContactRequest,
  FlagItem,
  ItemDetail,
  ItemSummary,
  MatchResult,
  NotificationItem,
  PaginatedItems,
  User,
  AdminStats
} from '../types';

const BASE_URL = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('lf_token');
  }

  public setToken(token: string) {
    localStorage.setItem('lf_token', token);
  }

  public clearToken() {
    localStorage.removeItem('lf_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Trans-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // If body is NOT FormData, default to JSON Content-Type
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = 'An unexpected error occurred';
      try {
        const errJson = await response.json();
        if (errJson.detail) {
          if (typeof errJson.detail === 'string') {
            errorMsg = errJson.detail;
          } else if (Array.isArray(errJson.detail)) {
            errorMsg = errJson.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
          }
        }
      } catch {
        errorMsg = response.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    // Handle 204 or empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return {} as T;
  }

  // ---------------- AUTH ----------------
  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.access_token);
    return res;
  }

  async register(payload: {
    email: string;
    password: string;
    display_name: string;
    college_id?: string;
    campus_id?: string;
    phone_number?: string;
    contact_preferences?: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async updateProfile(payload: {
    display_name?: string;
    campus_id?: string;
    college_id?: string;
    phone_number?: string;
    contact_preferences?: string;
  }): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async changePassword(payload: { current_password: string; new_password: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ---------------- CAMPUSES ----------------
  async getCampuses(): Promise<Campus[]> {
    return this.request<Campus[]>('/campuses');
  }

  // ---------------- ITEMS ----------------
  async listItems(params: {
    q?: string;
    report_type?: string;
    category?: string;
    campus_id?: string;
    status?: string;
    sort?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<PaginatedItems> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.report_type) query.set('report_type', params.report_type);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.campus_id) query.set('campus_id', params.campus_id);
    if (params.status) query.set('status', params.status);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', params.page.toString());
    if (params.page_size) query.set('page_size', params.page_size.toString());

    return this.request<PaginatedItems>(`/items?${query.toString()}`);
  }

  async getMyItems(report_type?: string): Promise<ItemSummary[]> {
    const query = report_type ? `?report_type=${report_type}` : '';
    return this.request<ItemSummary[]>(`/items/user/my${query}`);
  }

  async getItem(public_id: string): Promise<ItemDetail> {
    return this.request<ItemDetail>(`/items/${public_id}`);
  }

  async createItem(payload: {
    title: string;
    description: string;
    category: string;
    report_type: 'lost' | 'found';
    general_location: string;
    event_date: string;
    campus_id?: string;
    preferred_contact?: string;
    image_path?: string;
  }): Promise<ItemDetail> {
    return this.request<ItemDetail>('/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateItem(public_id: string, payload: Partial<{
    title: string;
    description: string;
    category: string;
    general_location: string;
    event_date: string;
    campus_id: string;
    preferred_contact: string;
    status: string;
    image_path: string;
  }>): Promise<ItemDetail> {
    return this.request<ItemDetail>(`/items/${public_id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteItem(public_id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/items/${public_id}`, {
      method: 'DELETE',
    });
  }

  async uploadItemImage(public_id: string, file: File): Promise<{ image_path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ image_path: string }>(`/items/${public_id}/images`, {
      method: 'POST',
      body: formData,
    });
  }

  async getItemMatches(public_id: string, minScore = 30): Promise<MatchResult[]> {
    return this.request<MatchResult[]>(`/items/${public_id}/matches?min_score=${minScore}`);
  }

  // ---------------- CLAIMS ----------------
  async submitClaim(public_id: string, payload: { private_claim_details: string; proof_answers?: string }): Promise<Claim> {
    return this.request<Claim>(`/items/${public_id}/claims`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMyClaims(): Promise<Claim[]> {
    return this.request<Claim[]>('/my/claims');
  }

  async getItemClaims(public_id: string): Promise<Claim[]> {
    return this.request<Claim[]>(`/items/${public_id}/claims`);
  }

  async updateClaimStatus(claim_id: string, payload: { status: string; finder_notes?: string }): Promise<Claim> {
    return this.request<Claim>(`/claims/${claim_id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // ---------------- CONTACT ----------------
  async sendContact(public_id: string, message: string): Promise<ContactRequest> {
    return this.request<ContactRequest>(`/items/${public_id}/contact`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getMyContacts(): Promise<ContactRequest[]> {
    return this.request<ContactRequest[]>('/my/contact-requests');
  }

  async updateContactStatus(id: string, status: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/contact-requests/${id}/status?status_val=${status}`, {
      method: 'PATCH',
    });
  }

  // ---------------- FAVORITES ----------------
  async toggleFavorite(public_id: string, isFav: boolean): Promise<{ is_favorite: boolean }> {
    if (isFav) {
      return this.request<{ is_favorite: boolean }>(`/items/${public_id}/favorite`, { method: 'DELETE' });
    } else {
      return this.request<{ is_favorite: boolean }>(`/items/${public_id}/favorite`, { method: 'POST' });
    }
  }

  async getMyFavorites(): Promise<ItemSummary[]> {
    return this.request<ItemSummary[]>('/my/favorites');
  }

  // ---------------- NOTIFICATIONS ----------------
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>('/my/notifications');
  }

  async getUnreadCount(): Promise<number> {
    const res = await this.request<{ unread_count: number }>('/my/notifications/unread-count');
    return res.unread_count;
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request(`/my/notifications/${id}`, { method: 'PATCH' });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request('/my/notifications/read-all', { method: 'POST' });
  }

  // ---------------- FLAGS ----------------
  async flagItem(public_id: string, payload: { reason: string; details?: string }): Promise<FlagItem> {
    return this.request<FlagItem>(`/items/${public_id}/flag`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ---------------- ADMIN ----------------
  async getAdminStats(): Promise<AdminStats> {
    return this.request<AdminStats>('/admin/stats');
  }

  async getAdminItems(moderation_status?: string, report_type?: string): Promise<ItemSummary[]> {
    const query = new URLSearchParams();
    if (moderation_status) query.set('moderation_status', moderation_status);
    if (report_type) query.set('report_type', report_type);
    return this.request<ItemSummary[]>(`/admin/items?${query.toString()}`);
  }

  async updateModeration(public_id: string, status: string, notes?: string): Promise<any> {
    return this.request(`/admin/items/${public_id}/moderation`, {
      method: 'PATCH',
      body: JSON.stringify({ moderation_status: status, notes }),
    });
  }

  async getAdminFlags(statusFilter?: string): Promise<FlagItem[]> {
    const query = statusFilter ? `?status_filter=${statusFilter}` : '';
    return this.request<FlagItem[]>(`/admin/flags${query}`);
  }

  async updateFlagStatus(flagId: string, status: string): Promise<any> {
    return this.request(`/admin/flags/${flagId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getAuditLogs(): Promise<any[]> {
    return this.request<any[]>('/admin/audit-logs');
  }
}

export const api = new ApiClient();
