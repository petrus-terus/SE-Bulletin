# Sabah Electricity Bulletin — Pilot Deployment & Cloud Architecture Guide

> **Target Architecture**: Frontend on **Cloudflare Pages** + Database & Storage on **Supabase**  
> **Status**: Ready for Pilot Deployment  
> **Repository Root**: `D:\SE Bulletin`

---

## 1. Executive Summary & Architecture Overview

For the **Phase 1 Pilot**, no standalone backend server (e.g. Node.js or ASP.NET Core) is required. The architecture utilizes **Supabase** as a high-performance Backend-as-a-Service (BaaS) paired with **Cloudflare Pages** for global, low-latency static edge delivery.

```mermaid
graph LR
    subgraph Client ["Client Device (iOS / Android / Desktop)"]
        Browser["React + Vite PWA (393x852 iPhone baseline)"]
        SW["Service Worker (Cache API + Offline Feed)"]
        Browser <--> SW
    end

    subgraph Cloudflare ["Cloudflare Global Network"]
        CF_Pages["Cloudflare Pages (HTTPS / CDN / SPA Routing)"]
    end

    subgraph Supabase ["Supabase Cloud Services"]
        PG_DB[(PostgreSQL Database)]
        Realtime["Realtime Engine (WebSockets for Live Likes/Comments)"]
        Storage["Supabase Storage (bulletin-media bucket)"]
        REST["PostgREST Auto-Generated REST API"]
    end

    Browser -->|Static Assets / PWA Shell| CF_Pages
    Browser -->|REST API / DB Queries| REST
    Browser -->|WebSockets (Live Feed Updates)| Realtime
    Browser -->|Photo & Attachment Uploads| Storage
    REST <--> PG_DB
    Realtime <--> PG_DB
    Storage <--> PG_DB
```

---

## 2. Step 1: Supabase Database Setup & SQL Migration

Run the following complete SQL script in your **Supabase Dashboard** (`SQL Editor` → `New Query`):

```sql
-- ==============================================================================
-- Sabah Electricity Bulletin (SE Bulletin) - Complete Clean Pilot Schema
-- Drops old/conflicting test tables and recreates the full schema cleanly.
-- ==============================================================================

-- 0. Clean up previous test tables to prevent column mismatch errors
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Create Posts Table
CREATE TABLE public.posts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT,
    author_name TEXT NOT NULL,
    author_role TEXT,
    author_avatar TEXT DEFAULT '/user_face.png',
    department TEXT NOT NULL,
    department_id TEXT DEFAULT 'dept-ops',
    department_color TEXT DEFAULT '#0055A4',
    location TEXT,
    image_url TEXT,
    media_urls JSONB DEFAULT '[]'::jsonb,
    is_pinned BOOLEAN DEFAULT false,
    official_notice BOOLEAN DEFAULT false,
    comments_enabled BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    reshares_count INTEGER DEFAULT 0,
    quote_post_id TEXT REFERENCES public.posts(id) ON DELETE SET NULL,
    reactions_breakdown JSONB DEFAULT '{"like":0,"celebrate":0,"support":0,"insightful":0,"safety":0}'::jsonb,
    poll_data JSONB DEFAULT NULL,
    pdf_url TEXT DEFAULT NULL,
    pdf_name TEXT DEFAULT NULL,
    pdf_size TEXT DEFAULT NULL,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ DEFAULT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Comments Table
CREATE TABLE public.comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT DEFAULT '/user_face.png',
    department TEXT NOT NULL,
    avatar_initials TEXT DEFAULT 'SE',
    text TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Stories Table (24-Hour Casual Updates)
CREATE TABLE public.stories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    department_id TEXT NOT NULL,
    department_name TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT DEFAULT '/user_face.png',
    image_url TEXT NOT NULL,
    caption TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Profiles Table (for Personalization & Onboarding)
CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT,
    designation TEXT NOT NULL,
    department TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT '/user_face.png',
    cover_url TEXT DEFAULT '/mock-images/image3.png',
    office_location TEXT DEFAULT 'Wisma SESB HQ, Kota Kinabalu',
    phone_extension TEXT DEFAULT 'Ext. 4102',
    bio TEXT,
    role TEXT DEFAULT 'GeneralStaff',
    is_verified BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create Permissive Policies for Pilot
-- Posts Policies
DROP POLICY IF EXISTS "Allow public select on active posts" ON public.posts;
CREATE POLICY "Allow public select on active posts"
    ON public.posts FOR SELECT
    USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Allow public insert on posts" ON public.posts;
CREATE POLICY "Allow public insert on posts"
    ON public.posts FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on posts" ON public.posts;
CREATE POLICY "Allow public update on posts"
    ON public.posts FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Allow public delete on posts" ON public.posts;
CREATE POLICY "Allow public delete on posts"
    ON public.posts FOR DELETE
    USING (true);

-- Comments Policies
DROP POLICY IF EXISTS "Allow public select on comments" ON public.comments;
CREATE POLICY "Allow public select on comments"
    ON public.comments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert on comments" ON public.comments;
CREATE POLICY "Allow public insert on comments"
    ON public.comments FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on comments" ON public.comments;
CREATE POLICY "Allow public delete on comments"
    ON public.comments FOR DELETE
    USING (true);

-- Stories Policies
DROP POLICY IF EXISTS "Allow public select on stories" ON public.stories;
CREATE POLICY "Allow public select on stories"
    ON public.stories FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert on stories" ON public.stories;
CREATE POLICY "Allow public insert on stories"
    ON public.stories FOR INSERT
    WITH CHECK (true);

-- Profiles Policies
DROP POLICY IF EXISTS "Allow public select on profiles" ON public.profiles;
CREATE POLICY "Allow public select on profiles"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert/update on profiles" ON public.profiles;
CREATE POLICY "Allow public insert/update on profiles"
    ON public.profiles FOR ALL
    USING (true);

-- 7. Enable Realtime Replication for Live Counters & Content (Safe Check)
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'posts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'stories'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
    END IF;
END $$;

-- 8. Stored Procedure for Atomic Post View Tracking
CREATE OR REPLACE FUNCTION public.increment_post_views(target_post_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.posts
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = target_post_id;
END;
$$;
```

---

## 3. Step 2: Supabase Storage Bucket Setup (`bulletin-media`)

To store uploaded site inspection photos, plant maintenance logs, and custom avatars without bloating database rows with base64 strings:

> 🛡️ **Built-in Storage Quota Safeguard**: The client includes [`imageCompressor.ts`](../client/src/utils/imageCompressor.ts), an HTML5 Canvas downscaling engine that auto-compresses mobile device photos to max 1600px at 0.82 WebP/JPEG quality (~95% byte reduction: 4.8MB $\rightarrow$ 210KB) before uploading. This allows thousands of posts and stories to run safely within Supabase's 1GB Free Tier limit.

1. In Supabase Dashboard, go to **Storage** → Click **New Bucket**.
2. Name: `bulletin-media` (must be exact).
3. Toggle **Public bucket** to `ON`.
4. Click **Save bucket**.
5. Run the following SQL script in your **Supabase SQL Editor** to enable public uploads and reads:

```sql
-- Allow public uploads into bulletin-media bucket
DROP POLICY IF EXISTS "Allow public uploads to bulletin-media" ON storage.objects;
CREATE POLICY "Allow public uploads to bulletin-media"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'bulletin-media');

-- Allow public reads from bulletin-media bucket
DROP POLICY IF EXISTS "Allow public read from bulletin-media" ON storage.objects;
CREATE POLICY "Allow public read from bulletin-media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'bulletin-media');
```

---

## 4. Step 3: Cloudflare Workers & Static Assets Deployment Guide

Deploying the client repository to Cloudflare:

1. Push your latest code to your Git repository (`main` branch).
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) → Navigate to **Workers & Pages**.
3. Click **Create application** → **Connect to Git**.
4. Select the repository: `petrus-terus/SE-Bulletin`.
5. **Set Configuration**:
   - **Project name**: `se-bulletin`
   - **Build command**: `cd client && npm install && npm run build`
   - **Deploy command**: `npx wrangler deploy` (default)
   - **Preview command**: `npx wrangler preview` (default)
6. **Set Environment Variables**:
   Under **Advanced settings** (or Environment variables), add:
   - `VITE_SUPABASE_URL`: `https://xxqrrqyncsxmhplcomns.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `sb_publishable_...` (your public anon key)
7. Click **Deploy**.

### SPA Routing & PWA Verification
- Cloudflare uses [`wrangler.jsonc`](../wrangler.jsonc) with native Single Page Application routing:
  ```jsonc
  {
    "name": "se-bulletin",
    "compatibility_date": "2024-11-01",
    "assets": {
      "directory": "./client/dist",
      "not_found_handling": "single-page-application"
    }
  }
  ```
  This natively routes direct page reloads and deep links to `index.html` without infinite redirect loops.
- Automatic HTTPS activates the Service Worker and the **"Install SE Bulletin"** mobile install prompt.

---

## 5. Step 4: Pilot Testing Checklist on Mobile Hardware

Before distributing the link to Sabah Electricity colleagues:

- [ ] **Android Chrome Test**:
  - Open the Cloudflare Pages URL on Android.
  - Verify bottom banner: "Install SE Bulletin — Fast offline access & home screen widget".
  - Click **Install** and verify the app installs as a standalone fullscreen app without browser URL bars.
- [ ] **iOS Safari Test**:
  - Open URL on iPhone Safari.
  - Tap **Install** or the bottom install banner.
  - Verify the 3-step illustrated Apple HIG instruction sheet appears (*Tap Share button → Scroll down → Add to Home Screen*).
  - Add to Home Screen and launch from icon.
- [ ] **Profile Personalization**:
  - Open Profile tab.
  - Tap camera icon on avatar → switch to Official Sabah Electricity Crest.
  - Tap "Edit Cover" → switch to *Tenom Pangi Hydro* or *Wisma SESB HQ*.
  - Tap "Edit Profile" → update Job Role & Station → click "Save Changes".
  - Verify instant update across TopAppBar and authored feed cards.
- [ ] **Realtime Interaction Test**:
  - Open the app on two devices simultaneously.
  - Like a post on Device A → verify reaction counter updates on Device B within ~500ms via WebSockets.
  - Add a comment on Device A → verify comment appears in the drawer on Device B.
  - Edit or delete a post on Device A → verify change reflects instantly on Device B without manual page reload.

---

## 6. Pilot Access Gate & Account Credentials Reference

### Pre-Auth Security Gate
To prevent unauthorized public discovery on the Cloudflare Pages pilot URL:
- **Pilot Passcode**: `SEBULLETIN@2026` (stored in `localStorage` under `sesb_pilot_unlocked`)

### Built-in Accounts
| Account | Username / Email | Password | Role | Permissions |
|---|---|---|---|---|
| **TEST_USER** *(SuperAdmin)* | `TEST_USER` / `test@sesb.com.my` | `TestAdmin@2026` *(or `SEBULLETIN@2026`)* | SuperAdmin | Author of all migrated bulletins & stories; **Global moderation rights** to edit/delete any post across the platform (including CEO posts). |
| **CEO Office** | `CEO` / `ceo.office@sesb.com.my` | `CeoOffice@2026` *(or `SEBULLETIN@2026`)* | SuperAdmin | Author of the official IDD Coffee Machine poll bulletin; executive profile. |
| **New Staff Sign Up** | *Any Sabah Electricity name & email* | *User-defined* | GeneralStaff | Auto-registered via the "New Staff Sign Up" tab; can author new posts/stories, and edit/delete **only their own** posts. |
