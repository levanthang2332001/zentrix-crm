# Zentrix CRM Setup Guide

## Context and Goals

This guide establishes the foundational implementation standards for the Zentrix CRM project. The goal is to provide engineers with a clear, actionable foundation that aligns visual design with engineering execution from day one.

## Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js (App Router) | 16.x (LTS) |
| Runtime | Bun | 1.3.x |
| Styling | Tailwind CSS (CSS Variables) | 4.x |
| Typography | IBM Plex Sans | 1.x |
| Authentication | Clerk (Google OAuth) | @clerk/nextjs v6 |
| UI Components | Shadcn/UI (Radix UI) | 4.x |
| Icons | Lucide React | latest |

### Next.js 16 Notes

Next.js 16 is LTS. Key points:
- `middleware.ts` (deprecated) → use `proxy.ts` (both still work)
- All `params`, `searchParams`, `cookies()`, `headers()` must be `await`ed
- `revalidateTag()` requires a `cacheLife` profile as second argument
- Parallel routes require `default.js` or build fails
- Turbopack is the default bundler
- `serverRuntimeConfig` / `publicRuntimeConfig` removed — use `.env` instead
- `next lint` removed — run ESLint directly

### Clerk v6

- `auth()` is async — `await auth()` everywhere
- `clerkMiddleware()` replaces `clerkClient` singleton patterns
- `auth().protect()` → `auth.protect()`
- `redirectToSignIn()` / `redirectToSignUp()` replaced by `const { redirectToSignIn } = await auth()`

## Design Tokens

The following semantic tokens **must** be used in place of raw values. All color references use hex format without transparency — apply opacity via Tailwind's opacity modifier when needed.

```css
/* Brand Colors */
--color-primary:   #0C5CAB
--color-secondary: #0a4a8a
--color-success:   #10b981
--color-warning:   #f59e0b
--color-danger:    #ef4444

/* Surface */
--color-surface:   #09090b
--color-text:      #fafafa

/* Spacing: 8pt baseline grid */
--space-1:  8px
--space-2:  16px
--space-3:  24px
--space-4:  32px
--space-5:  40px
--space-6:  48px
```

## Typography Scale

```
Display: 32px / weight 600
H1:      24px / weight 600
H2:      20px / weight 500
Body:    16px / weight 400
Small:   14px / weight 400
Caption: 12px / weight 400
```

## Directory Structure

```
app/
├── (auth)/                 # Clerk catch-all routes
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   └── sso-callback/[[...sso-callback]]/page.tsx
├── (dashboard)/            # Protected routes (middleware)
├── api/                    # Route handlers
├── globals.css             # Tailwind 4 tokens + base styles
└── layout.tsx              # Root layout (ClerkProvider, QueryClient, Theme)

components/
├── ui/                     # Shadcn base components
├── layout/                 # Sidebar, Header, shared chrome
├── dashboard/             # Dashboard-specific components
└── shared/                 # Reusable business components

lib/                        # Utilities, business logic, API wrappers
services/                   # API service functions
utils/                      # cn(), formatDate(), other helpers
hooks/                      # Custom React hooks (useMetrics, useUser, etc.)
types/                      # TypeScript interfaces and types
providers/                 # Context providers (Auth, Theme, Query)
```

## Authentication (Clerk)

Google OAuth only — sign-in and sign-up are the same flow. On first Google sign-in, an account is created automatically.

### Required Routes

```
app/(auth)/
├── sign-in/[[...sign-in]]/page.tsx   ← primary landing page
├── sign-up/[[...sign-up]]/page.tsx   ← minimal stub (Clerk needs it mounted)
└── sso-callback/[[...sso-callback]]/page.tsx  ← handles Google OAuth redirect
```

### Route Files

```typescript
// app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return <SignIn />
}
```

```typescript
// app/(auth)/sign-up/[[...sign-up]]/page.tsx
// Minimal stub — Clerk needs <SignUp> mounted for OAuth flow.
// Disable Google for sign-up in Clerk Dashboard so this page shows no providers.
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return <SignUp />
}
```

```typescript
// app/(auth)/sso-callback/[[...sso-callback]]/page.tsx
'use client'

import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk()
  const router = useRouter()

  useEffect(() => {
    handleRedirectCallback({})
  }, [handleRedirectCallback])

  return null
}
```

### Route Protection

```typescript
// proxy.ts (Next.js 16)
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: ['/dashboard/:path*']
};
```

All `/dashboard/**` routes require authentication. Landing and auth routes are public.

### Clerk v6 Auth Pattern

```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
  // ...
}
```

### Required Environment Variables

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SSO_CALLBACK_URL=/sso-callback
```

### Clerk Dashboard Configuration

1. Go to **SSO connections** → configure Google OAuth.
2. Optionally disable Google for sign-up so it only appears on the sign-in page. Sign-in and sign-up flow are otherwise identical for OAuth — the same Google button creates an account on first use.
3. Set redirect URL to `/sso-callback`.

## Component Requirements

Every component **must** implement these states:

| State | Trigger | Visual Behavior |
|-------|---------|-----------------|
| Default | — | Base styles, no decoration |
| Hover | pointer enter | Subtle highlight, cursor pointer |
| Focus-visible | keyboard focus | Visible ring (2px primary) |
| Active | pointer down | Slight scale or color press |
| Disabled | `disabled` attr | 40% opacity, no pointer events |
| Loading | `isLoading` prop | Spinner overlay or skeleton |

## Accessibility Requirements

- All interactive elements must have **44px+ touch targets**.
- Use semantic HTML (`<button>`, `<nav>`, `<main>`) before ARIA.
- Provide `aria-label` on icon-only buttons.
- Support `prefers-reduced-motion` — disable non-essential animations.
- Ensure text contrast meets **WCAG 2.2 AA** (4.5:1 for body, 3:1 for large text).

## Layout Standards

### Sidebar

- Collapsible with toggle button (chevron icon).
- Active route indicated with primary color left border + background tint.
- Navigation items: icon + label, 44px height minimum.
- User profile section at bottom with Clerk `<UserButton />`.

### Header

- Height: 64px.
- Contains: global search input, notification bell, `<UserButton />`.
- Sticky positioning with `backdrop-blur`.

### Metric Cards

- Rounded corners: `rounded-xl`.
- Glass-like surface: `bg-surface/80 backdrop-blur`.
- Content: label (caption), value (display), optional trend indicator.

## Anti-Patterns

- **Do not** use raw hex values in component code — reference CSS variables only.
- **Do not** mix Tailwind utility spacing with arbitrary values — use the 8pt scale.
- **Do not** leave interactive elements without hover/focus states.
- **Do not** hardcode strings — extract to `types/` and `messages.ts`.

## QA Checklist

- [ ] All tokens defined in `globals.css` — no raw color/spacing in components.
- [ ] Sidebar collapses without breaking layout.
- [ ] All routes under `/dashboard` redirect to sign-in when unauthenticated.
- [ ] Metric cards render empty/loading states without layout shift.
- [ ] Keyboard navigation cycles through all interactive elements.
- [ ] `prefers-reduced-motion` respected — no animation on cards or sidebar.
- [ ] Touch targets on mobile meet 44px minimum.
- [ ] `params` and `searchParams` are awaited in all server components and route handlers.
- [ ] If using Next.js 16: `proxy.ts` exists (or `middleware.ts` still present), parallel routes have `default.js`.
- [ ] Clerk `auth()` is awaited everywhere — no sync `auth()` calls remaining.
- [ ] `/sso-callback` route exists and `handleRedirectCallback` is wired up — OAuth redirect works end-to-end.