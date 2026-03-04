export interface FacebookPage {
  page_id: string;
  page_name?: string;
  page_vanity_name?: string;
  page_access_token?: string;
  page_category?: string;
  page_permissions?: string;
  expires_in?: number | null;
  expires_at?: string | null;
  followers_count?: number;
  fan_count?: number;
  created_at?: string;
  updated_at?: string | null;
}

export interface FacebookPagesResponse {
  success: boolean;
  message: string;
  data?: {
    success: boolean;
    message: string;
    user_id: string;
    pages: FacebookPage[] | FacebookPage | null;
    count: number;
  };
  // Legacy support - direct access (for backwards compatibility)
  user_id?: string;
  pages?: FacebookPage[] | FacebookPage | null;
  count?: number;
}

export interface FacebookOAuthState {
  loading: boolean;
  error: string | null;
  connected: boolean;
  isPopupOpen: boolean;
}

export interface FacebookTokenResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    expires_at?: string;
  };
}

