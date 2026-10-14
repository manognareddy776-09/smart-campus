export interface Campus {
  id: string;
  name: string;
  location: string;
  code?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  college_id?: string;
  campus_id?: string;
  campus_name?: string;
  role: 'user' | 'admin';
  phone_number?: string;
  contact_preferences: 'in_app' | 'email' | 'phone';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ItemSummary {
  id: string;
  public_id: string;
  title: string;
  category: string;
  report_type: 'lost' | 'found';
  general_location: string;
  event_date: string;
  image_path?: string | null;
  status: 'open' | 'claimed' | 'returned' | 'closed';
  moderation_status: 'approved' | 'pending' | 'rejected';
  campus_name?: string;
  created_at: string;
}

export interface ItemDetail extends ItemSummary {
  description: string;
  preferred_contact: string;
  campus_id?: string;
  owner_display_name: string;
  is_owner: boolean;
  is_favorite: boolean;
  has_claimed: boolean;
  updated_at: string;
}

export interface PaginatedItems {
  items: ItemSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MatchFactorBreakdown {
  category_match: boolean;
  category_score: number;
  keyword_overlap: string[];
  text_similarity_score: number;
  campus_match: boolean;
  campus_score: number;
  date_proximity_days: number;
  date_score: number;
}

export interface MatchResult {
  item: ItemSummary;
  match_score: number; // 0 to 100
  shared_characteristics: string[];
  breakdown: MatchFactorBreakdown;
}

export interface Claim {
  id: string;
  item_id: string;
  item_public_id: string;
  item_title: string;
  item_report_type: 'lost' | 'found';
  item_image_path?: string | null;
  claimant_id: string;
  claimant_name: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  private_claim_details?: string;
  finder_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactRequest {
  id: string;
  item_id: string;
  item_public_id: string;
  item_title: string;
  requester_id: string;
  requester_name: string;
  recipient_id: string;
  recipient_name: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'resolved';
  is_sender: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  related_resource_id?: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface FlagItem {
  id: string;
  item_id: string;
  item_public_id: string;
  item_title: string;
  reporter_id: string;
  reporter_name: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

export interface AdminStats {
  total_reports: number;
  lost_reports: number;
  found_reports: number;
  pending_moderation: number;
  active_claims: number;
  successfully_returned: number;
  total_users: number;
  flagged_listings: number;
}
