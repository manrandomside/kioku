# Security Audit Report — Kioku

Date: 2026-03-29

## Summary

- Total issues found: 8
- Critical: 0 | Important: 5 | Info: 3
- Level 3 (Bonus): Security headers implemented, 4/8 npm vulnerabilities fixed

Overall: The project has strong fundamentals — RLS is fully implemented on all tables, all protected endpoints have auth checks, XSS risk is minimal (no dangerouslySetInnerHTML), and SQL injection risk is low (Drizzle ORM parameterized). The main gaps are **missing input validation** on some server actions, **no rate limiting** on API routes, and **missing Zod validation** on auth actions.

---

## Level 1 — Critical

### 1. Row Level Security (RLS)

All tables have RLS enabled with correct policies. Helper function `public.get_user_id()` bridges `auth.uid()` to internal `user.id`.

#### User Data Tables

| Tabel | RLS Enabled | Policy Correct | Status |
|-------|------------|----------------|--------|
| user | Yes | Yes (SELECT/UPDATE/INSERT: supabase_auth_id = auth.uid()) | OK |
| srs_card | Yes | Yes (SELECT/INSERT/UPDATE/DELETE: user_id = get_user_id()) | OK |
| review_log | Yes | Yes (SELECT/INSERT: user_id = get_user_id()) | OK |
| quiz_session | Yes | Yes (SELECT/INSERT/UPDATE: user_id = get_user_id()) | OK |
| quiz_answer | Yes | Yes (SELECT/INSERT via session_id subquery) | OK |
| user_gamification | Yes | Yes (SELECT/INSERT/UPDATE: user_id = get_user_id()) | OK |
| xp_transaction | Yes | Yes (SELECT/INSERT: user_id = get_user_id()) | OK |
| achievement_unlock | Yes | Yes (SELECT/INSERT: user_id = get_user_id()) | OK |
| user_chapter_progress | Yes | Yes (SELECT/INSERT/UPDATE: user_id = get_user_id()) | OK |
| daily_activity | Yes | Yes (SELECT/INSERT/UPDATE: user_id = get_user_id()) | OK |
| ai_chat_session | Yes | Yes (SELECT/INSERT/UPDATE/DELETE: user_id = get_user_id()) | OK |
| ai_chat_message | Yes | Yes (SELECT/INSERT via session_id subquery) | OK |
| pronunciation_attempt | Yes | Yes (SELECT/INSERT: user_id = get_user_id()) | OK |

#### Content Tables (Public Read)

| Tabel | RLS Enabled | Policy Correct | Status |
|-------|------------|----------------|--------|
| book | Yes | Yes (SELECT: true) | OK |
| chapter | Yes | Yes (SELECT: true) | OK |
| vocabulary | Yes | Yes (SELECT: true) | OK |
| kana | Yes | Yes (SELECT: true) | OK |
| achievement | Yes | Yes (SELECT: true) | OK |
| ai_response_cache | Yes | Yes (SELECT: true) | OK |
| ai_question_template | Yes | Yes (SELECT: true) | OK |

Issues found: **None**

### 2. API Auth Check

| Endpoint/Action | Auth Check | Status |
|----------------|-----------|--------|
| POST /api/v1/ai/chat | Yes (getUser + getInternalUserId + verifySessionOwner) | OK |
| GET /api/v1/ai/chat/sessions | Yes (getUser + getInternalUserId) | OK |
| DELETE /api/v1/ai/chat/[sessionId] | Yes (getUser + getInternalUserId + verifySessionOwner) | OK |
| GET /api/v1/ai/chat/[sessionId]/messages | Yes (getUser + getInternalUserId + verifySessionOwner) | OK |
| POST /api/v1/ai/pronunciation/check | Yes (getUser + getInternalUserId) | OK |
| GET /api/v1/ai/test | Yes (production gate + getUser) | OK |
| GET /api/v1/gamification/achievements | Yes (getUser + getInternalUserId) | OK |
| POST /api/v1/gamification/daily-check | Yes (getUser + getInternalUserId) | OK |
| GET /api/v1/gamification/heatmap | Yes (getUser + getInternalUserId) | OK |
| GET /api/v1/gamification/overview | Yes (getUser + getInternalUserId) | OK |
| GET /api/v1/progress/chapters | Yes (getUser + getInternalUserId) | OK |
| GET /api/v1/vocabulary/search | No (public content) | OK |
| submitKanaReview (server action) | Yes (getUser + getInternalUserId) | OK |
| submitVocabReview (server action) | Yes (getUser + getInternalUserId) | OK |
| submitReviewByCardId (server action) | Yes (getUser + getInternalUserId) | OK |
| createQuizSession (server action) | Yes (getUser + getInternalUserId) | OK |
| submitQuizResult (server action) | Yes (getUser + getInternalUserId) | OK |
| completeOnboarding (server action) | Yes (getUser) | OK |
| updateAutoPlayAudio (server action) | Yes (getUser + getInternalUserId) | OK |
| updateDisplayMode (server action) | Yes (getUser + getInternalUserId) | OK |
| updateDailyGoal (server action) | Yes (getUser + getInternalUserId + Zod) | OK |
| signInWithEmail (server action) | No (auth endpoint) | OK |
| signUpWithEmail (server action) | No (auth endpoint) | OK |
| signInWithOAuth (server action) | No (auth endpoint) | OK |
| signInWithMagicLink (server action) | No (auth endpoint) | OK |
| signOut (server action) | No (logout endpoint) | OK |

Issues found: **None** — all protected endpoints have auth, auth endpoints correctly skip auth.

### 3. Input Validation

| Endpoint/Action | Zod Validation | Status |
|----------------|---------------|--------|
| POST /api/v1/ai/chat | No (manual text extraction) | ISSUE |
| POST /api/v1/ai/pronunciation/check | Yes (bodySchema) | OK |
| POST /api/v1/gamification/daily-check | N/A (no input) | OK |
| GET /api/v1/vocabulary/search | Partial (limit clamped, no Zod) | OK |
| submitKanaReview | No Zod (accepts raw kanaId, rating, duration) | ISSUE |
| submitVocabReview | No Zod (accepts raw vocabularyId, rating, duration) | ISSUE |
| submitReviewByCardId | Yes (Zod schema) | OK |
| createQuizSession | Yes (Zod schema) | OK |
| submitQuizResult / submitVocabQuizResult | Yes (Zod schema + idempotency) | OK |
| completeOnboarding | Yes (Zod schema) | OK |
| updateDailyGoal | Yes (Zod enum) | OK |
| updateAutoPlayAudio | No Zod (boolean param) | ISSUE |
| updateDisplayMode | No Zod (enum param) | ISSUE |
| signInWithEmail | No Zod (FormData) | INFO |
| signUpWithEmail | No Zod (FormData) | INFO |
| signInWithMagicLink | No Zod (FormData) | INFO |

Issues found:
- **submitKanaReview**: No validation on kanaId (UUID), rating (enum), reviewDurationMs (number bounds)
- **submitVocabReview**: Same as above for vocabularyId
- **updateAutoPlayAudio**: No validation on boolean param
- **updateDisplayMode**: No validation on mode enum param
- **AI chat route**: No Zod schema for request body

### 4. Environment Variables

- Status: **OK**
- `.gitignore` correctly ignores `.env*` files
- `.env.local` is NOT committed to git
- `.env.example` exists with placeholder values only (no secrets)
- `NEXT_PUBLIC_` vars: Only `SUPABASE_URL` and `SUPABASE_ANON_KEY` (both safe/public by design)
- Server-only keys (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`) are accessed only in server code
- AI config (`src/lib/ai/config.ts`) validates API keys with Zod on server side

Issues found: **None**

---

## Level 2 — Important

### 5. Rate Limiting

Status: **NO RATE LIMITING IMPLEMENTED**

No rate limiting library installed. No rate limiting code anywhere in the codebase.

| Endpoint | Needs Rate Limit | Current Protection | Risk |
|----------|-----------------|-------------------|------|
| POST /api/v1/ai/chat | YES (expensive AI calls) | Auth only | HIGH — could rack up API costs |
| POST /api/v1/ai/pronunciation/check | YES | Auth only | MEDIUM |
| POST /api/v1/gamification/daily-check | YES | Auth only | LOW |
| GET /api/v1/vocabulary/search | YES (public, scrapable) | Limit clamped 1-50 | LOW |
| submitKanaReview | LOW (has auth) | Auth + RLS | LOW |
| submitVocabReview | LOW (has auth) | Auth + RLS | LOW |
| signInWithEmail/signUpWithEmail | YES (brute force) | Supabase built-in limits | MEDIUM |

Priority fix: AI chat endpoint (most expensive), then auth endpoints.

### 6. SQL Injection

Status: **LOW RISK**

- All DB queries use Drizzle ORM (parameterized by default)
- Search endpoint uses `ilike()` operator (safe, parameterized)
- One `sql.raw()` usage in `src/lib/ai/cache.ts` — safe (hardcoded constant `7`, not user input)
- All `sql` template literals use Drizzle column references, not user input

Issues found: **None**

### 7. XSS (Cross-Site Scripting)

Status: **LOW RISK**

- **No `dangerouslySetInnerHTML`** anywhere in codebase
- **No `innerHTML`** usage
- Chat messages rendered via custom markdown parser (`src/components/chat/message-bubble.tsx`) that only handles bold/italic/code — no HTML passthrough
- User display names rendered as React text nodes (auto-escaped)
- Onboarding validates displayName length (`.min(1).max(100)`)
- No third-party markdown library (react-markdown, etc.) that could allow HTML injection

Issues found: **None**

### 8. CSRF

Status: **ADEQUATE**

- All Server Actions have built-in Next.js CSRF protection
- API routes rely on Supabase auth cookies (SameSite attribute)
- Auth callback validates redirect URLs (prevents open redirect):
  ```ts
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/home";
  ```
- API routes don't explicitly validate Origin header, but Supabase cookie auth + SameSite provides adequate protection

Issues found: **None critical** (Origin header validation would be defense-in-depth but not required)

---

## Level 3 — Bonus

### 9. Security Headers
- Status: **IMPLEMENTED**
- Headers added: X-DNS-Prefetch-Control, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP
- Configured in: `next.config.ts`
- CSP policy includes:
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (required by Next.js)
  - `style-src` allows Google Fonts
  - `font-src` allows Google Fonts (gstatic)
  - `img-src` allows Supabase Storage, Google/GitHub avatars
  - `connect-src` allows Supabase, Gemini, Groq, OpenRouter APIs
  - `media-src` allows Supabase Storage (audio)
  - `frame-ancestors 'none'` (prevents clickjacking)
  - `microphone=(self)` in Permissions-Policy (for pronunciation feature)

### 10. Dependency Audit (npm audit)
- Date: 2026-03-29
- Total vulnerabilities: 8
- Critical: 0 | High: 2 | Moderate: 6 | Low: 0
- Fixed: 4 (via `npm audit fix`) — brace-expansion, path-to-regexp, picomatch, yaml
- Remaining: 4 moderate (all esbuild via drizzle-kit dependency chain)
  - `esbuild <=0.24.2` — dev server request forwarding vulnerability (GHSA-67mh-4wv8-2f99)
  - Only affects development server, not production builds
  - Fix requires `npm audit fix --force` which would downgrade drizzle-kit to 0.18.1 (breaking change)
  - Risk: LOW — esbuild vulnerability only exploitable in dev mode, not in production deployment

---

## Recommended Fixes (Priority Order)

1. **Add rate limiting to AI chat endpoint** — prevents API cost abuse (HIGH)
2. **Add Zod validation to submitKanaReview / submitVocabReview** — validate UUID + rating enum + duration bounds (MEDIUM)
3. **Add Zod validation to AI chat request body** — validate messages array structure (MEDIUM)
4. **Add Zod validation to updateAutoPlayAudio / updateDisplayMode** — validate params (LOW)
5. **Add Zod validation to auth actions** — validate email format + password length (LOW)
6. **Add rate limiting to pronunciation check + daily-check** — prevent spam (LOW)
7. **Add rate limiting to search endpoint** — prevent scraping (LOW)
