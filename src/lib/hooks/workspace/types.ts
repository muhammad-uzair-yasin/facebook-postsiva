/** Facebook profile snippet from login/GET workspaces (same shape as GET /facebook/user-profile profile). */
export interface FacebookProfileSnippet {
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  profile_picture_url?: string | null;
  profile_link?: string | null;
  locale?: string | null;
  timezone?: number | null;
  verified?: boolean | null;
  about?: string | null;
  birthday?: string | null;
  location?: string | null;
  hometown?: string | null;
  website?: string | null;
}

/** Facebook page for login response: id (page_id) and name. */
export interface FacebookPageSnippet {
  id: string;
  name?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  facebook_connected?: boolean;
  /** From login cache or GET /workspaces; full profile when from login. */
  facebook_profile?: FacebookProfileSnippet | null;
  /** From login response; also in GET /workspaces. */
  facebook_pages?: FacebookPageSnippet[] | null;
  /** From login response; also in GET /workspaces. */
  member_count?: number;
}

export interface WorkspaceMember {
  user_id: string;
  email: string;
  role_name: string;
}

export interface WorkspaceCreateBody {
  name: string;
  slug?: string | null;
}

export interface WorkspaceUpdateBody {
  name?: string | null;
  slug?: string | null;
}

export interface WorkspaceAddMemberBody {
  email?: string | null;
  user_id?: string | null;
  role_id: number;
}
