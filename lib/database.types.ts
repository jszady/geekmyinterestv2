/** Aligns with your existing Supabase tables — adjust only if your columns differ. */

export type ProfileRole = "user" | "admin";

/** Matches `public.profiles` — no `updated_at` column in this project. */
export type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  role: ProfileRole | null;
  created_at: string;
};

/** Use in every `.from("profiles").select(...)` so queries stay aligned with the table. */
export const PROFILES_SELECT_COLUMNS =
  "id, email, username, role, created_at" as const;

export type PostStatus = "draft" | "published";

export type PostCategoryDb =
  | "Movie"
  | "Anime"
  | "Show"
  | "Game"
  | "Tech";

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

/** 15 editorial blocks: text + optional storage path per section. */
export type PostEditorialSectionColumns = Partial<{
  [N in SectionNum as `section_${N}_text`]: string | null;
}> &
  Partial<{
    [N in SectionNum as `section_${N}_image`]: string | null;
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
} & PostEditorialSectionColumns;

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
};
