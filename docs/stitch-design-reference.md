# Stitch Design System & Screen Reference

> **Stitch Project ID**: `2754827937194949885`  
> **Project Title**: `Sabah Electricity Bulletin App`  
> **Target Device**: Mobile (390 x 844 / 393 x 852 pts, iPhone 14/15 Pro scale)

---

## 1. High-Fidelity Screens in Stitch

| Screen Title | Screen Resource ID | Key UI Components |
|---|---|---|
| **Home Feed** | `projects/2754827937194949885/screens/ead5d6e91e184f828f947a3983a30404` | Corporate top app bar with SESB logo, department filter chips, live presence dot, feed cards with verified badges, multi-image carousel, like/comment bar, nested preview comment, 5-tab bottom navigation with center elevated FAB. |
| **Create Post** | `projects/2754827937194949885/screens/98594a1d09ac40588307ebb1f34940e0` | Modal/sheet with post archetype selector (Status, Photo/Gallery, Announcement), department dropdown, title input, rich text area, media attachment picker, comment toggle, and green publish button. |
| **Post Discussion & Comments** | `projects/2754827937194949885/screens/63e66dac7efe4a80b4fc2fe5a5675388` | Detailed post view, high-res image, reaction summary, threaded nested comment hierarchy with author avatars, timestamp, and sticky reply input bar. |
| **Explore & Directory** | `projects/2754827937194949885/screens/c7d5574ff8bd4fb99f9e4846a7bd10d2` | Search bar with instant debounce, trending company announcements grid, and department directory list with follower counts. |
| **Notifications** | `projects/2754827937194949885/screens/644bbf713b774c33a39e97205fad5c58` | Grouped alerts (Today, Earlier), department announcement notifications, likes, comments, and mentions, with "Mark all as read" action. |
| **Employee Profile & Directory** | `projects/2754827937194949885/screens/107fecddf153464eaf52cf02c8e4f2cc` | Large avatar, employee ID (`SESB-1001`), official designation, department, "My Posts" / "Saved" / "Drafts" tabs, and settings menu. |

---

## 2. Design System Tokens (Extracted from Stitch Project)

### Color Tokens
```css
:root {
  /* Brand Core */
  --color-primary: #003E7A;             /* Deep Blue Navy */
  --color-primary-container: #0055A4;   /* Sabah Electricity Corporate Blue */
  --color-secondary: #006C4D;           /* Corporate Forest Green */
  --color-tertiary: #1A7A5A;            /* Kinabalu Peak Green */
  --color-accent-green: #10B981;        /* CTA Accent (Always with #0B0F17 text) */

  /* Surfaces & Canvas */
  --color-surface-base: #F5F7FA;        /* Canvas Background */
  --color-surface-card: #FFFFFF;        /* Card & Modal Surface */
  --color-surface-alt: #E8EDF2;         /* Chip background / alt surface */
  --color-border-subtle: #E2E8F0;       /* Hairline card & input borders */

  /* Typography */
  --color-text-main: #111C2D;           /* High contrast heading text */
  --color-text-body: #424751;           /* Readable body copy */
  --color-text-muted: #64748B;          /* Timestamps, captions, metadata */

  /* Alerts */
  --color-error: #BA1A1A;               /* Critical / Red badge */
  --color-error-container: #FFDAD6;     /* Urgent safety alert container */
}
```

### Elevation & Depth
- **Level 1 (Cards)**: `0px 1px 3px rgba(30, 41, 59, 0.06), 0px 1px 2px rgba(30, 41, 59, 0.04)`
- **Level 2 (Popovers / Overlays)**: `0px 4px 6px -1px rgba(30, 41, 59, 0.08), 0px 2px 4px -1px rgba(30, 41, 59, 0.04)`
- **Level 3 (Floating Create FAB)**: `0px 8px 16px -2px rgba(0, 85, 164, 0.28), 0px 4px 6px -2px rgba(0, 85, 164, 0.12)`
