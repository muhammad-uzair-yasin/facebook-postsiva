export interface FacebookComment {
  id: string;
  from?: {
    id?: string | null;
    name?: string | null;
  } | null;
  message?: string | null;
  created_time?: string | null;
  like_count?: number | null;
  comment_count?: number | null;
  can_hide?: boolean | null;
  can_like?: boolean | null;
  can_remove?: boolean | null;
  can_reply_privately?: boolean | null;
  is_hidden?: boolean | null;
  parent?: { id: string } | null;
  comments?: FacebookComment[];
}

export interface FacebookCommentFlat {
  comment_id: string;
  parent_comment_id: string | null;
  message?: string | null;
  author_name?: string | null;
  created_at: string | null;
  like_count: number;
  reply_count: number;
  is_hidden: boolean;
  has_children: boolean;
}

export interface FacebookCommentsPaging {
  cursors?: {
    before?: string;
    after?: string;
  };
  next?: string | null;
  previous?: string | null;
}

export interface GetFacebookCommentsResponse {
  success: boolean;
  message: string;
  data: FacebookComment[] | null;
  paging?: FacebookCommentsPaging;
  source?: string | null;
  error?: string | null;
}

export interface CommentActionResponse {
  success: boolean;
  message: string;
  error?: string | null;
}
