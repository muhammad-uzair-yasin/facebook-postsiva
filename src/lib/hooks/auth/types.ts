export interface AuthUser {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  is_active?: boolean;
  is_admin?: boolean;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: AuthUser; accessToken: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' };

export interface LoginPayload {
  email: string;
  password: string;
}

/** Workspace item from login/refresh (id, name, slug, facebook_connected, facebook_profile, facebook_pages, etc.). */
export interface LoginWorkspaceItem {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  facebook_connected?: boolean;
  facebook_profile?: unknown;
  facebook_pages?: unknown[];
  member_count?: number;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: AuthUser;
  workspaces?: LoginWorkspaceItem[];
}

