# Supabase SQL (schema & RLS)

This folder keeps database security and tag schema **version-controlled** so production can be reproduced and reviewed.

## How to apply migrations

**These SQL files are not auto-run by the Next.js app.** Apply them **manually** in the [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor** → New query → paste a migration file → **Run**.

Use a **staging project** first, confirm the app still works, then repeat in production.

## Production environment

- Set **`NEXT_PUBLIC_SITE_URL`** to your canonical site origin (e.g. `https://geekmyinterest.com`). Next.js and OAuth/email flows use it for absolute URLs and redirects; missing or wrong values break auth callbacks and metadata in production.

## Storage vs SQL order

**Create Storage buckets in the Dashboard before running `006_rls_storage.sql`.** The policies reference bucket ids `post-images` and `podcast-images`; if the buckets do not exist, policy creation can fail or uploads will break until buckets match the SQL.

## Layout

| Path | Purpose |
|------|---------|
| `schema-tags.sql` | Creates `tags` and `post_tags` tables + original RLS (legacy). Prefer **`migrations/005_rls_tags.sql`** for RLS once tables exist—it drops the old policy names and adds full admin CRUD for `tags`. |
| `migrations/001_rls_profiles.sql` | RLS on `profiles`: **no** public `SELECT` on the table (email/role); only **self or admin** may read full rows. Inserts/updates as before. |
| `migrations/002_rls_posts.sql` | RLS on `posts`: public sees published only; admins full CRUD; inserts require `author_id = auth.uid()`. |
| `migrations/003_rls_comments.sql` | RLS on `comments`: read on published posts; insert as self on published posts; delete own or admin. |
| `migrations/004_rls_podcast_episodes.sql` | RLS on `podcast_episodes`: mirror of posts pattern for published vs admin. |
| `migrations/005_rls_tags.sql` | RLS on `tags` / `post_tags`: public read; admin insert/update/delete on `tags`; admin insert/delete on `post_tags`. |
| `migrations/006_rls_storage.sql` | `storage.objects` policies for buckets `post-images` and `podcast-images`: public `SELECT`; authenticated admins for write. |
| `migrations/007_security_triggers.sql` | `profiles` trigger: only JWT-identified users may escalate `role`; **no JWT** (SQL Editor / postgres / typical service-role DB session) skips enforcement so the first admin can be set safely. |
| `migrations/008_comments_body_max_length.sql` | `CHECK (char_length(body) <= 250)` on `public.comments` (idempotent `DO` block). |
| `migrations/009_profiles_public_view.sql` | View **`profiles_public`**: `id`, `username`, `created_at` only — anon-safe. App uses it for comments, bylines, author pages, middleware. |

## Run order (Supabase SQL Editor)

Run **in numeric order** after your core tables (`profiles`, `posts`, `comments`, `podcast_episodes`, `tags`, `post_tags`) already exist:

1. `migrations/001_rls_profiles.sql`
2. `migrations/002_rls_posts.sql`
3. `migrations/003_rls_comments.sql`
4. `migrations/004_rls_podcast_episodes.sql`
5. `migrations/005_rls_tags.sql`  
   - If you previously ran `schema-tags.sql`, this file **replaces** those tag/post_tags policies by name (`DROP POLICY IF EXISTS` then `CREATE POLICY`).
6. `migrations/006_rls_storage.sql`  
   - Requires buckets **`post-images`** and **`podcast-images`** to exist **first** (see above).
7. `migrations/007_security_triggers.sql`
8. `migrations/008_comments_body_max_length.sql` (after `comments` exists; pairs with app `COMMENT_BODY_MAX_CHARS`)
9. `migrations/009_profiles_public_view.sql` — **required** after `001` before traffic hits the app with updated RLS: the app reads **`profiles_public`** for public-facing profile data.

You can paste each file’s contents into **SQL Editor** in one transaction per file, or concatenate in order for a single run.

### First-time tags tables

If `tags` / `post_tags` do not exist yet, run `schema-tags.sql` **once** first, then run migrations `001`–`009` (or at least `005` after `002` because `post_tags` references `posts`).

### Bootstrap the first admin

After RLS is on, promote your user with the **SQL Editor** (runs as database owner / no `auth.uid()` in session) or a **service role** client where `auth.uid()` is null so the trigger in **`007`** does not block the update:

```sql
update public.profiles
set role = 'admin'
where id = '<your-auth-user-uuid>';
```

JWT-backed clients (browser + anon key) still **cannot** set `role = admin` without already being an admin (trigger + RLS).

Until at least one admin exists, admin-only inserts/updates will fail for everyone using the anon/authenticated client.

## Verify RLS is enabled

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

`rowsecurity` should be `t` for tables you enabled.

## Verify policies

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

For storage:

```sql
select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
```

## What still may need dashboard / manual work

- **Creating storage buckets** and setting “public” access if your app expects public object URLs.
- **Auth providers** (Google, etc.) and **URL configuration**—not in SQL.
- **`NEXT_PUBLIC_SITE_URL`** in production env (see above).
- **Existing policies** on `storage.objects` or tables that used **different policy names** than in these files: audit with the queries above and drop duplicates if two policies overlap confusingly.
- **Service role** server code bypasses RLS by design; keep service keys server-only.

## Admin role format

Policies match the app’s check: `lower(trim(coalesce(role::text, ''))) = 'admin'`. If your column is an enum, `::text` still applies.

## Re-running migrations

Files use `DROP POLICY IF EXISTS`, `CREATE OR REPLACE FUNCTION`, and `DROP TRIGGER IF EXISTS` so you can re-apply during development. Always review on a staging project before production.
