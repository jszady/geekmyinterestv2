/** Aligns with your existing Supabase tables — adjust only if your columns differ. */

export type ProfileRole = "user" | "admin";

/** Matches `public.profiles` — no `updated_at` column in this project. */
export type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  role: ProfileRole | null;
  avatar_url: string | null;
  bio: string | null;
  author_header_image: string | null;
  created_at: string;
};

/** Use in every `.from("profiles").select(...)` so queries stay aligned with the table. */
export const PROFILES_SELECT_COLUMNS =
  "id, email, username, role, avatar_url, bio, author_header_image, created_at" as const;

/** Matches `public.profiles_public` (view) — no email or role; safe for anon/other-user reads. */
export type ProfilePublicRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  author_header_image: string | null;
  created_at: string;
};

export const PROFILES_PUBLIC_SELECT_COLUMNS =
  "id, username, avatar_url, bio, author_header_image, created_at" as const;

export type PostStatus = "draft" | "published";

import type { PostCategoryDb } from "@/lib/posts/categories";

export type { PostCategoryDb };

export type HomepageSlot =
  | "main_feature"
  | "feature_1"
  | "feature_2"
  | "feature_3"
  | "feature_4"
  | "feature_5"
  | "feature_6";

type SectionNum =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;

/** 15 editorial blocks: text + optional image path + optional trailer URL per section. */
export type PostEditorialSectionColumns = Partial<{
  [N in SectionNum as `section_${N}_text`]: string | null;
}> &
  Partial<{
    [N in SectionNum as `section_${N}_image_top`]: string | null;
  }> &
  Partial<{
    [N in SectionNum as `section_${N}_video_url_top`]: string | null;
  }> &
  Partial<{
    [N in SectionNum as `section_${N}_image`]: string | null;
  }> &
  Partial<{
    [N in SectionNum as `section_${N}_video_url`]: string | null;
  }>;

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: PostCategoryDb | string;
  status: PostStatus | string;
  homepage_slot: HomepageSlot | string | null;
  card_image: string | null;
  hero_image: string | null;
  /** @deprecated Legacy body — use `section_*` when migrating. */
  inline_image: string | null;
  /** @deprecated Legacy body — use `section_*_text` when migrating. */
  body_part_1: string | null;
  /** @deprecated Legacy body — use `section_*_text` when migrating. */
  body_part_2: string | null;
  author_id: string;
  created_at: string;
  updated_at?: string | null;
  published_at?: string | null;
  /** V2 flexible blocks (JSON array). When non-empty, article uses block renderer instead of sections. */
  content_blocks?: unknown | null;
} & PostEditorialSectionColumns;

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  /** Null for top-level comments; references `comments.id` for replies. */
  parent_comment_id: string | null;
};

/** Matches `public.tags` — create in Supabase (see `supabase/schema-tags.sql`). */
export type TagRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

/** Junction `public.post_tags` — no separate id. */
export type PostTagRow = {
  post_id: string;
  tag_id: string;
};

export type PodcastEpisodeStatus = "draft" | "published";

export type PodcastEpisodeRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  episode_number: number | null;
  runtime: string | null;
  thumbnail_image: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  status: PodcastEpisodeStatus | string;
  author_id: string;
  created_at: string;
  updated_at: string | null;
  published_at: string | null;
};
