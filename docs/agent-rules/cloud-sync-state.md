# Full-Lifecycle Cloud Sync & State Rules

> **Scope**: Triggered whenever creating or editing data services, state context, custom hooks, or real-time event listeners in `client/src/services/`, `client/src/context/`, or `client/src/hooks/`.

---

## 1. Dual-Persistence Protocol
Whenever an interactive user action occurs (creating a post, posting a comment, submitting a poll vote, bookmarking, reacting):
1. **Optimistic Local Update**: Update local React state / context immediately for zero perceived latency.
2. **Cloud Persistence Call**: Always invoke the remote database service (`bulletinService.*`) so data persists in Supabase across page reloads and user sessions.
3. **Rollback on Error**: Catch rejections and roll back the optimistic state if the network or Supabase mutation fails.

---

## 2. Detail & Sub-View State Parity
- **Never isolate sub-view state** (e.g. `PostDetailView`, `CommentDrawer`, `SavedPostsDrawer`) with disconnected local mock arrays or preview-only slices.
- Bind sub-views to the reactive root thread state (e.g. `commentsByPost`).
- Trigger cloud fetches (`bulletinService.getComments(postId)`) whenever the sub-view or drawer opens to ensure fresh data.

---

## 3. Realtime Payload Completeness
In Supabase Realtime listeners (`INSERT`, `UPDATE`, `DELETE` channels):
- Verify that incoming payloads map **all rich fields**, not just basic title and content:
  - `poll_data`
  - `pdf_url`, `pdf_name`
  - `reactions_breakdown`
  - `quote_post_id`
  - `views_count`, `reshares_count`
- Pass raw records through domain mappers in `client/src/services/rowMappers.ts` before inserting into React state.

---

## 4. Initial Mount Fetch
- Every top-level feature state (`posts`, `stories`, `profiles`, `comments`) MUST call its corresponding `get*()` service in a `useEffect(..., [])` on mount.
- Never leave screens displaying solely hardcoded seed/mock data when network connectivity is available.

---

## 5. Foreign Key Resolution
- In data mappers (e.g. `getPosts`), verify relational ID columns (e.g. `quote_post_id`) are resolved against cache/memory rather than expecting non-existent flat object columns.
- Ensure orphaned relational references (e.g. a quoted post that was deleted) render graceful fallback cards (`"Original post unavailable"`) rather than crashing the view.

---

## 6. Counter Math Integrity
- **Never add local state array lengths to server count fields** (e.g. `localComments.length + post.commentsCount`), which causes double-counting bugs.
- Always use the active collection length: `activeComments.length || post.commentsCount`.

---

## 7. Supabase Row Level Security (RLS) & Storage
- Always verify that Supabase tables (`posts`, `comments`, `profiles`, `likes`, `bookmarks`) have active RLS policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` so queries do not fail silently.
- Cloudflare Workers SPA Routing: Never add `client/public/_redirects` with `/* /index.html 200` — doing so triggers Cloudflare API error `100324` ("Infinite loop detected in this rule"). `wrangler.jsonc` handles SPA routing natively via `"not_found_handling": "single-page-application"`.
