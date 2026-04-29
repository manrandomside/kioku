<div align="center">

# 記憶 Kioku

**AI-Powered Japanese Learning Platform for Indonesian Speakers**

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000?logo=vercel)](https://kioku-learn.vercel.app)

A fullstack web platform combining the FSRS spaced repetition algorithm, an AI tutor, an interactive guided tour, and a comprehensive 36-page user guide to help Indonesian speakers learn Japanese vocabulary. Built end-to-end on free-tier infrastructure, Kioku ships 2,909 vocabulary words, 214 kana characters, and 3,085 pre-generated audio files. 100% free, no ads, no upsell.

[Live Demo](https://kioku-learn.vercel.app) · [User Guide (PDF)](./public/guidebook/kioku-guidebook.pdf) · [Security Audit](./SECURITY-AUDIT.md) · [Project Spec](./designs/kioku-project-spec.md)

![Landing Page](./public/screenshots/landing-kioku.png)

</div>

---

## Why Kioku?

- **Scientific** — FSRS algorithm (Anki v23.10+), 20-30% more efficient than SM-2 SuperMemo
- **Comprehensive** — 2,909 vocabulary words, 214 kana characters, 3,085 audio files, 7 quiz types, AI tutor, full user guide
- **Onboarding Done Right** — Forced 3-step onboarding, interactive guided tour for new users, 36-page user guide PDF
- **Free Forever** — Runs entirely on free tiers ($0/month, no ads, no upsell, no paid tier)
- **Indonesia-first** — All translations and UI in Bahasa Indonesia, content sourced from Minna no Nihongo Book I (Ch. 1-25, JLPT N5) and Book II (Ch. 26-50, JLPT N4)

---

## Highlights

- **Smart Study Session** — One-click adaptive session combining due card review, new vocab learning, and quiz validation in 3 phases
- **Spaced Repetition Engine (FSRS)** — Type-safe TypeScript implementation calculating optimal review intervals per card
- **AI Tutor with Provider Waterfall** — Gemini → Groq → OpenRouter cascade for high availability on free tier
- **Interactive Onboarding Tour** — 8-step guided tour with cross-device persistence (synced via Postgres)
- **Leech Detection** — Automatic identification of difficult cards (lapses ≥4) with dedicated forced-recall practice
- **JLPT Auto-Upgrade** — Detects N5 mastery and upgrades target to N4 with celebration modal
- **50 Achievements + 60 Levels** — Gamification system with XP economy and 365-day activity heatmap
- **Pre-generated Audio Pipeline** — 3,085 MP3 files via Microsoft Edge TTS (NanamiNeural), zero runtime cost
- **PWA-Ready** — Service worker, offline cache, install banner, mobile-responsive across all 30+ pages
- **Production-Grade Security** — RLS on 20 tables, rate limiting, Zod validation, security headers, full audit report

---

## Screenshots

<div align="center">

### Dashboard
![Dashboard](./public/screenshots/full-dashboard-kioku.png)

### Onboarding Tour
First-time users are welcomed with an interactive 8-step guided tour. Progress is persisted to Postgres so the tour never repeats across devices.

![Onboarding Tour](./public/screenshots/onboarding-tour-kioku.png)

### Learn Hub
![Learn Hub](./public/screenshots/learn-hub-kioku.png)

### Smart Study Session
![Smart Study](./public/screenshots/smart-study-session-kioku.png)

### Session Summary with XP Breakdown
![Summary](./public/screenshots/smart-study-summary-kioku.png)

### Flashcard with Spaced Repetition
![Flashcard](./public/screenshots/flashcard-mnn-kioku.png)

### Interactive Quiz with Explanations
![Quiz](./public/screenshots/quiz-mnn-kioku.png)

### Hiragana & Katakana Grid
![Kana Grid](./public/screenshots/kana-grid-kioku.png)

### Review Summary
![Review](./public/screenshots/review-summary-kioku.png)

### Kata Sulit (Leech Detection)
![Kata Sulit](./public/screenshots/kata-sulit-kioku.png)

### AI Tutor (Sensei)
![AI Tutor](./public/screenshots/ai-tutor-kioku.png)

### Profile & Stats
![Profile](./public/screenshots/profile-kioku.png)

</div>

---

## Documentation

Kioku ships with a comprehensive 36-page user guide that covers everything from first signup to advanced features.

[Download User Guide (PDF)](./public/guidebook/kioku-guidebook.pdf)

The guide includes:

- **Chapter 1** — Welcome to Kioku and the science behind spaced repetition
- **Chapter 2** — Getting started: account creation and onboarding
- **Chapter 3** — Learning content: HIRAKATA module and Minna no Nihongo
- **Chapter 4** — Study methods: Smart Study, Flashcard, Review, Quiz, Kata Sulit
- **Chapter 5** — Using the AI Tutor effectively
- **Chapter 6** — Gamification: XP, levels, streaks, achievements
- **Chapter 7** — Profile and settings
- **Chapter 8** — Tips and tricks for effective learning
- **Chapter 9** — Troubleshooting common issues
- **Chapter 10** — About Kioku, tech stack, and privacy

The guide is also accessible from within the app via the profile dropdown menu.

---

## Features

### Learning
- **Smart Study Session** — One-click optimal study session ("Belajar Sekarang") with 3 phases: review due cards, learn new words, and quiz. Adaptive chapter selection based on JLPT target and user progress
- **HIRAKATA Module** — Learn 214 hiragana & katakana characters with an interactive color-coded grid, flashcards, and quizzes
- **MNN Vocabulary** — 2,909 words from Minna no Nihongo Ch. 1-50 (JLPT N5 & N4), with Indonesian translations
- **FSRS Spaced Repetition** — ts-fsrs v5 calculates optimal review intervals per card; review uses 4-button rating (Again / Hard / Good / Easy) with re-queue for failed cards (max 3x)
- **2-Button Flashcards** — Don't Know / Know with retry queue (max 3x), simpler than Anki's 4-button approach for the learning phase
- **7 Quiz Types** — Multiple choice (JP-ID, ID-JP), audio recognition, type hiragana, fill-in-the-blank, matching, speaking. 20 questions per session with answer explanations
- **Kata Sulit / Leech Detection** — Automatic detection of frequently forgotten words (lapses ≥4) and confused word pairs from quiz history. Specialized training with intensive flashcard (5x retry) and forced recall quiz
- **JLPT Auto-Upgrade** — Automatically advances from N5 to N4 when all Book 1 chapters are mastered via quiz, with a celebration modal

### Documentation & Onboarding
- **Forced Onboarding Flow** — 3-step wizard (display name + JLPT target + Hirakata assessment) blocks dashboard until completed
- **Interactive Guided Tour** — 8-step product tour for first-time users with spotlight + tooltip, cross-device persisted via Postgres `tour_completed` column
- **36-Page User Guide PDF** — Comprehensive documentation accessible from the profile dropdown and the landing page footer
- **Restart Tour Anytime** — "Lihat Tour Lagi" option in the profile dropdown menu replays the tour on demand

### Gamification
- **XP & Level System** — Earn XP from flashcards, quizzes, and achievements. Level 1-60 with progressive formula (50 × level²)
- **Streak System** — Daily streak counter with freeze protection and milestone rewards (7, 14, 30, 60, 90, 180, 365 days). Validates without auto-resetting on missed days
- **Dynamic Streak Reminder** — Time-of-day-aware personalized messages with 5 distinct slots (dini hari, pagi, siang, sore, malam), countdown to midnight, and color-coded borders per time of day
- **50 Achievements** — Badges for streaks, words learned, quiz scores, speed runs, chapter completion, time-of-day activity, and more
- **365-Day Activity Heatmap** — GitHub-style contribution graph visualizing daily activity over the past year
- **Daily Goal** — 5 configurable tiers (100 / 300 / 500 / 750 / 1,000 XP) with goal-met bonus

### AI
- **AI Tutor "Sensei"** — Context-aware chatbot with provider waterfall (Gemini 2.5 Flash-Lite → Groq Llama 3.3 70B → OpenRouter), streaming responses, conversation history, and 4 categorized suggested prompts
- **Pronunciation Check** — Web Speech API integration with accuracy scoring (Levenshtein distance + ~1,766 kanji-to-hiragana mappings)
- **Auto-Generate Quiz Questions** — Build-time pipeline generates question bank with SHA-256 prompt hashing for cache deduplication

### UX
- **Profile Customization** — 16 Japanese-themed emoji avatars with gradient ring (lime-to-teal) and rotation animation, plus inline display name editing
- **Account Security** — Change password modal with real-time validation (email/password users), Google OAuth info panel for OAuth users, multi-step delete account with type-to-confirm + 5-second countdown timer
- **Display Mode Toggle** — Switch between Kanji and Kana-only display across flashcards, quizzes, and reviews; setting persisted per user with per-page Zustand override
- **Dark / Light Mode** — System-aware theme toggle with full dark mode coverage
- **PWA Install** — Service worker + manifest + offline cache + floating install banner
- **Auto-play Audio Toggle** — Global preference auto-plays Japanese audio across flashcard, quiz, review, and kana grid
- **Responsive Design** — Desktop sidebar + content layout, tablet bottom-nav + hamburger, mobile bottom-nav + stacked, fullscreen immersive flashcard/quiz screens

### Security & Performance
- **Lighthouse Score** — Performance 86, Accessibility 94, Best Practices 96, SEO 100
- **RLS on 20 Tables** — Row Level Security enforced on every table; user data scoped to `auth.uid()`, content tables public-read
- **Rate Limiting** — In-memory sliding window (AI chat 20/min, pronunciation 30/min, search 30/min, daily-check 10/min)
- **Zod Validation** — Runtime + compile-time validation on all API routes and Server Actions
- **Security Headers** — HSTS, X-Frame-Options, CSP, X-Content-Type-Options
- **Cascade Account Deletion** — Removes all user data across tables + Supabase Auth via service role
- **Real-time Stats** — Force-dynamic ensures fresh dashboard and profile data on every navigation

### Data Quality
- **Verified Kana Data** — All 214 hiragana & katakana characters verified and corrected (12 romaji errors fixed: ぢ→ji, づ→zu, を→o, etc.)
- **Curated MNN Vocabulary** — 2,909 published words synced from Minna no Nihongo PDFs; entries not present in the textbook are hidden via `is_published = false`
- **Indonesian Translations** — All vocabulary `meaning_id` translated from MNN PDF Ch. 1-50 (2,016 rows updated)
- **WIB Timezone** — All date calculations use Asia/Jakarta via centralized `timezone.ts` utility

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 15** (App Router) | Fullstack framework with RSC, Server Actions, streaming |
| **React 19** | UI with Server Components and Suspense |
| **TypeScript 5** | End-to-end type safety (strict mode) |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Accessible, customizable component library |
| **Framer Motion** | Animations (3D card flip, page transitions, micro-interactions) |
| **Zustand** | Client state (quiz / flashcard / tour sessions, display mode) |
| **TanStack Query v5** | Server state, caching, background refetch |

### Backend & Database
| Technology | Purpose |
|---|---|
| **Supabase** | PostgreSQL + Auth (Google OAuth, email/password, magic link) + Storage (1 GB) |
| **Drizzle ORM** | Type-safe SQL with auto migrations |
| **Zod** | Runtime + compile-time validation on all API routes and Server Actions |
| **ts-fsrs v5** | FSRS spaced repetition algorithm |

### AI & Audio
| Technology | Purpose |
|---|---|
| **Vercel AI SDK** | Unified streaming interface for all AI providers |
| **Google Gemini 2.5 Flash-Lite** | Primary AI provider (free tier) |
| **Groq Cloud** | Fallback #1 — Llama 3.3 70B |
| **OpenRouter** | Fallback #2 |
| **Microsoft Edge TTS** | Pre-generated audio (ja-JP-NanamiNeural), 3,085 files in Supabase Storage |
| **Web Speech API** | Browser-native speech recognition for pronunciation check |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Vercel Hobby** | Hosting + CDN + Serverless (free tier) |
| **GitHub Actions** | CI/CD + Supabase keep-alive cron |
| **PWA** | Service worker + manifest + offline cache + install banner |

---

## Architecture

```
+--------------------------------------------------+
|               CLIENT (Browser / PWA)              |
|  Next.js 15 + React 19 + TypeScript              |
|  Tailwind CSS 4 + shadcn/ui + Framer Motion      |
|  Zustand + TanStack Query                         |
+--------------------------------------------------+
|              SERVER (Vercel Serverless)            |
|  Server Components + Server Actions               |
|  Vercel AI SDK + ts-fsrs v5                       |
|  Drizzle ORM + Zod validation                     |
+--------------------------------------------------+
|             BACKEND SERVICES (Free Tier)           |
|  Supabase PostgreSQL + Auth + Storage              |
|  Gemini -> Groq -> OpenRouter (AI waterfall)       |
+--------------------------------------------------+
|              DEPLOYMENT & CI/CD                    |
|  Vercel Hobby + GitHub Actions                     |
+--------------------------------------------------+
```

**Key data flows:**
- **SRS Engine** — ts-fsrs calculates optimal review intervals per card, scheduling is stored in PostgreSQL
- **AI Waterfall** — Gemini (primary) → Groq → OpenRouter, each provider tried in sequence on failure/rate-limit
- **Audio** — Pre-generated at build time via Edge TTS, stored in Supabase Storage, zero runtime cost
- **Timezone** — All date calculations use WIB (Asia/Jakarta) via centralized utility
- **Tour Persistence** — Onboarding tour completion synced to Postgres `user.tour_completed` with localStorage fast cache

---

## Database

20 tables with Row Level Security (RLS) on all tables:

- **Content** (public read): `book`, `chapter`, `vocabulary` (2,909 words), `kana` (214 chars), `achievement` (50 badges), `ai_question_template`
- **User Data** (RLS protected): `user`, `srs_card`, `review_log`, `quiz_session`, `quiz_answer`, `user_gamification`, `xp_transaction`, `achievement_unlock`, `user_chapter_progress`, `daily_activity`
- **AI** (RLS protected): `ai_chat_session`, `ai_chat_message`, `ai_response_cache`, `pronunciation_attempt`

---

## Security

Full security audit completed — see [SECURITY-AUDIT.md](./SECURITY-AUDIT.md).

| Area | Status |
|---|---|
| Row Level Security (RLS) | 20/20 tables |
| API Authentication | All endpoints verified |
| Input Validation (Zod) | All forms and API routes |
| Rate Limiting | AI chat (20/min), pronunciation (30/min), search (30/min) |
| Security Headers | HSTS, X-Frame-Options, CSP, X-Content-Type-Options |
| SQL Injection | Protected (Drizzle ORM parameterized queries) |
| XSS | Protected (React auto-escape) |
| CSRF | Protected (Next.js Server Actions) |

---

## Project Status

All planned phases are complete. Project is in production at https://kioku-learn.vercel.app.

| Phase | Description | Status |
|---|---|---|
| **P0** | Setup & Foundation | Complete |
| **P1** | Core Features (Flashcard, Quiz, Review, Search) | Complete |
| **P2** | Gamification & Polish (XP, Streak, Achievements, PWA) | Complete |
| **P3** | AI Features (Chatbot, Pronunciation, Quiz Generation) | Complete |
| **P4** | UX Improvements (Landing, Auth, Security Audit, JLPT Upgrade) | Complete |
| **P5** | Smart Study & Leech Detection | Complete |
| **P6** | Profile Enhancement & Documentation | Complete |

Total: 70+ features shipped, 30+ pages, 20 database tables, 8 onboarding tour steps, 36-page user guide.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- [Supabase](https://supabase.com/) account (free tier)
- API keys: [Gemini](https://aistudio.google.com/), [Groq](https://console.groq.com/), [OpenRouter](https://openrouter.ai/) (all free)

### Installation

```bash
# Clone repository
git clone https://github.com/manrandomside/kioku.git
cd kioku

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npm run db:migrate

# Seed data (kana + vocabulary)
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url

# AI Providers
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## License

This project uses a dual licensing approach to clearly separate the source code (which is fully open) from the educational content (which originates from copyrighted material).

### Source Code

The source code in this repository is released under the **MIT License**. You are free to study, fork, modify, and use the code for any purpose, including commercial use, with proper attribution.

See [LICENSE](./LICENSE) for the full MIT License text.

### Content & Educational Materials

Vocabulary content is sourced from **Minna no Nihongo** (copyrighted by 3A Corporation, Tokyo) and is included here for **personal educational use only**. Indonesian translations, example sentence adaptations, and the structured database schema are derivative works created specifically for this learning platform.

You may **not**:

- Redistribute the vocabulary database for commercial purposes
- Republish Minna no Nihongo content outside the context of personal learning
- Train AI models on the curated vocabulary dataset without explicit permission

For commercial licensing of the vocabulary content, please contact 3A Corporation directly.

### Trademark & Branding

The "Kioku" name, logo, color palette, and design system are personal project assets. Please do not reuse them for derivative products or services in ways that may cause confusion with the original platform.

### Inquiries

For licensing questions, partnership requests, or contributions: [GitHub Issues](https://github.com/manrandomside/kioku/issues)

---

<div align="center">

Built with care by [@manrandomside](https://github.com/manrandomside) — A portfolio project demonstrating fullstack + AI engineering capabilities.

[Live Demo](https://kioku-learn.vercel.app) · [User Guide](./public/guidebook/kioku-guidebook.pdf) · [GitHub Issues](https://github.com/manrandomside/kioku/issues)

</div>
