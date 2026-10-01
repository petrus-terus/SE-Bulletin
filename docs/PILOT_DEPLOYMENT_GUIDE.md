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
-- 1. Create Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
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
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
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

-- 3. Create Profiles Table (for Personalization & Onboarding)
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create Permissive Policies for the Pilot Phase
-- Posts Policies
CREATE POLICY "Allow public select on active posts"
    ON public.posts FOR SELECT
    USING (deleted_at IS NULL);

CREATE POLICY "Allow public insert on posts"
    ON public.posts FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on posts"
    ON public.posts FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on posts"
    ON public.posts FOR DELETE
    USING (true);

-- Comments Policies
CREATE POLICY "Allow public select on comments"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on comments"
    ON public.comments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public delete on comments"
    ON public.comments FOR DELETE
    USING (true);

-- Profiles Policies
CREATE POLICY "Allow public select on profiles"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert/update on profiles"
    ON public.profiles FOR ALL
    USING (true);

-- 6. Enable Realtime Replication for Live Counters
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
```

---

## 3. Step 2: Supabase Storage Bucket Setup (`bulletin-media`)

To store uploaded site inspection photos, plant maintenance logs, and custom avatars without bloating database rows with base64 strings:

1. In Supabase Dashboard, go to **Storage** → Click **New Bucket**.
2. Name: `bulletin-media`.
3. Toggle **Public bucket** to `ON` (enables staff to view images without authentication tokens).
4. Save the bucket.
5. In **Configuration > Policies**, add a policy for `bulletin-media`:
   - Name: `Public Access and Uploads`
   - Allowed operations: `SELECT` (Read) and `INSERT` (Upload).
   - Target roles: `anon`, `authenticated`.

---

## 4. Step 3: Cloudflare Pages Deployment Guide

Deploying the client repository to Cloudflare Pages:

1. Push your latest code to your Git provider (GitHub / GitLab).
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) → Navigate to **Workers & Pages**.
3. Click **Create application** → **Pages** → **Connect to Git**.
4. Select the repository: `SE-Bulletin` (or your repository name).
5. **Set Build Configuration**:
   - **Framework Preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `client`
6. **Set Environment Variables**:
   Under **Environment variables (advanced)**, add:
   - `VITE_SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOi...` (your public anon key from Supabase Dashboard > Project Settings > API)
7. Click **Save and Deploy**.

### SPA Routing & PWA Verification
- Cloudflare Pages will automatically read [`client/public/_redirects`](../client/public/_redirects):
  ```text
  /*    /index.html   200
  ```
  This guarantees direct page reloads (e.g. `/profile` or `/detail`) do not produce 404 errors.
- Automatic HTTPS will activate the Service Worker and the **"Install SE Bulletin"** mobile install prompt.

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
