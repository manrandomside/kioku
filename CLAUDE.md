# CLAUDE.md — Kioku (記憶) Project Spec

> Japanese vocabulary learning platform. Next.js 15 + Supabase + FSRS + AI.  
> Full spec: `/designs/kioku-project-spec.md` | Logo: `/designs/logo/`

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript 5
- **DB/Auth/Storage**: Supabase (PostgreSQL + Auth + Storage 1GB)
- **ORM**: Drizzle ORM | **Validation**: Zod
- **Styling**: Tailwind CSS 4 + shadcn/ui + Framer Motion
- **State**: Zustand (client) + TanStack Query v5 (server)
- **SRS**: ts-fsrs v5 | **AI**: Vercel AI SDK
- **AI Providers** (waterfall): Gemini 2.5 Flash-Lite → Groq → OpenRouter → WebLLM
- **Audio**: Pre-generated via Edge TTS (ja-JP-NanamiNeural), stored in Supabase Storage
- **Deploy**: Vercel Hobby (free) | **CI**: GitHub Actions (Supabase keep-alive cron)

## ATURAN PENTING

- SELALU lihat referensi visual di `/designs/references/` SEBELUM coding halaman frontend
- Ikuti design system di bawah, jangan improvisasi warna/font sendiri
- Full spec lengkap ada di `/designs/kioku-project-spec.md` jika butuh detail

## Database Schema (Key Fields Only)

```
book: id, title, slug, jlpt_level(enum N5-N1), chapter_start, chapter_end
chapter: id, book_id(FK), chapter_number, slug, vocab_count
vocabulary: id, chapter_id(FK), kanji?, hiragana, romaji, meaning_id, meaning_en, word_type(enum), jlpt_level, audio_url, example_jp?, example_id?, sort_order
kana: id, character, romaji, category(enum 6 types), row_group, column_position, audio_url
user: id, supabase_auth_id, email, display_name, avatar_url, jlpt_target, daily_goal_xp(30/50/100/200), auto_play_audio, show_romaji, theme(light/dark/system), onboarding_done, hirakata_known
srs_card: id, user_id(FK), vocabulary_id?(FK), kana_id?(FK), status(new/learning/review/relearning), stability, difficulty, due_date, scheduled_days, reps, lapses — CHECK(vocab XOR kana)
review_log: id, user_id(FK), card_id(FK), rating(again/hard/good/easy), prev_*/new_* states, review_duration_ms
quiz_session: id, user_id(FK), chapter_id?(FK), kana_category?, total_questions, correct_count, score_percent, xp_earned, time_spent_ms, is_completed, is_perfect
quiz_answer: id, session_id(FK), question_number, question_type(enum 7 types), vocabulary_id/kana_id, question_text, correct_answer, options(JSONB), user_answer, is_correct
user_gamification: id, user_id(FK), total_xp, current_level, current_streak, longest_streak, streak_freezes, last_activity_date, total_reviews, total_words_learned, daily_xp_earned, daily_goal_met
xp_transaction: id, user_id(FK), source(enum), amount, description, reference_id
achievement: id, name, description, icon, type(enum), condition(JSONB), xp_reward
achievement_unlock: id, user_id(FK), achievement_id(FK), unlocked_at
user_chapter_progress: id, user_id(FK), chapter_id(FK), vocab_seen/learning/review, completion_percent, best_quiz_score
daily_activity: id, user_id(FK), activity_date, reviews_count, quiz_count, xp_earned, goal_met
ai_chat_session: id, user_id(FK), title, message_count
ai_chat_message: id, session_id(FK), role(user/assistant/system), content, provider_used
ai_response_cache: id, prompt_hash(SHA256), response_text, provider, hit_count
pronunciation_attempt: id, user_id(FK), vocab/kana_id, expected_text, recognized_text, accuracy_score
ai_question_template: id, vocabulary_id(FK), question_type, question_text, correct_answer, wrong_answers(JSONB)
```

RLS: user data tables → `user_id = auth.uid()`. Content tables (vocabulary, kana, book, chapter) → public read. All 20 tables verified with RLS + correct policies.

## API Endpoints (Grouped)

```
AUTH:    POST /api/auth/signup|login|oauth|magic-link|logout  GET /api/auth/session
USER:    GET|PUT /api/v1/user/profile  POST /api/v1/user/onboarding  GET /api/v1/user/stats|streak
CONTENT: GET /api/v1/books  GET /api/v1/books/:slug/chapters  GET /api/v1/chapters/:slug(/vocabulary)
         GET /api/v1/vocabulary/:id|search  GET /api/v1/kana(/:category)  GET /api/v1/jlpt/:level/vocabulary
SRS:     GET /api/v1/srs/due|stats  GET /api/v1/srs/chapter/:id|kana/:cat  POST /api/v1/srs/cards|review
STUDY:   GET /api/v1/study/session|status
LEECH:   GET /api/v1/leech/cards|confused-pairs|summary
QUIZ:    POST /api/v1/quiz/start  POST /api/v1/quiz/:id/answer|complete  GET /api/v1/quiz/history|:id
AI:      POST /api/v1/ai/chat(streaming)  GET /api/v1/ai/chat/sessions|:id/messages  DELETE /api/v1/ai/chat/:id
         POST /api/v1/ai/generate-questions|pronunciation/check
GAMIF:   GET /api/v1/gamification/overview|achievements|xp-history|heatmap  POST /api/v1/gamification/daily-check
PROGRESS:GET /api/v1/progress/chapters(/:id)|jlpt/:level|daily
```

Rate limited endpoints: AI chat (20/min), pronunciation (30/min), search (30/min), daily-check (10/min).

## Design System

**Colors**: Primary `#0A3A3A` (deep teal) | Accent `#C2E959` (lime) | Secondary `#A6E2AC` (mint) | Teal `#248288`  
**Dark mode**: BG `#0D1117` | Surface `#161B22` | Text `#E6EDF3` | Border `#30363D`  
**Semantic**: Success `#22C55E` | Error `#EF4444` | Warning `#F59E0B` | Info `#3B82F6`  
**SRS colors**: New `#9CA3AF` | Learning `#FBBF24` | Review `#22C55E` | Relearning `#F97316`  
**Word types**: Noun `#3B82F6` | Verb `#EF4444` | i-Adj `#22C55E` | na-Adj `#8B5CF6` | Adverb `#F59E0B`  
**Fonts**: Display=Playfair Display(700,800) | Heading+Body=Plus Jakarta Sans(400-700) | JP=Noto Sans JP | Mono=JetBrains Mono  
**Radius**: sm=8 md=12 lg=16 xl=24 | **Spacing**: 4/8/12/16/20/24/32/40/48/64/80px  
**Logo**: Rounded wordmark "kioku", torii gate in "o", lime green "i". See `/designs/logo/`  
**Effects**: Green gradient mesh bg, glassmorphism cards, 3D flip animation (Framer Motion perspective 1000px)  
**Responsive**: Desktop=sidebar+content | Tablet=bottom-nav+hamburger | Mobile=bottom-nav+stacked | Quiz/Flashcard=fullscreen immersive

## Coding Rules

- **Variables/functions/comments/commits**: English. **User-facing strings**: Indonesian
- **No emoji** in source code. Comments explain WHAT, not HOW
- **Naming**: files=kebab-case | components=PascalCase | functions=camelCase | constants=UPPER_SNAKE | db=snake_case
- **Imports order**: external libs → internal libs → components → types → styles (blank line between groups)
- **Components**: function declaration (not arrow), props interface above, hooks→logic→JSX
- **Server Actions**: 'use server', Zod validation, revalidatePath
- **API responses**: `{ success: boolean, data?: T, error?: { code, message } }`
- **Error handling**: try-catch all API routes, console.error with route path prefix
- **Commits**: `<type>(<scope>): <description>` — feat/fix/refactor/style/docs/test/chore/perf
- **TypeScript**: strict mode, no `any` without justification
- **Env vars**: NEXT*PUBLIC* prefix for client-side, validate with Zod

## Folder Structure

```
src/
├── app/(auth)/                    # Login, register, magic-link
├── app/(onboarding)/              # Onboarding flow (forced)
├── app/(dashboard)/home/          # Dashboard with stats
├── app/(dashboard)/learn/         # Learn hub (HIRAKATA + MNN cards)
├── app/(dashboard)/learn/hirakata/# HIRAKATA module
├── app/(dashboard)/learn/mnn/[chapter]/
├── app/(dashboard)/review/        # SRS review session
├── app/(dashboard)/smart-study/   # Smart Study session (3 phases)
├── app/(dashboard)/kata-sulit/    # Leech detection + training
├── app/(dashboard)/quiz/[chapter]/# Quiz session
├── app/(dashboard)/chat/          # AI tutor
├── app/(dashboard)/profile/       # Settings, stats, achievements
├── app/api/                       # API routes (auth, v1/*)
├── components/{flashcard,quiz,kana,audio,gamification,chat,ui}/
├── components/{pwa,auth}/         # PWA install + auth components
├── lib/{srs,ai,audio,supabase}/   # Business logic
├── lib/{rate-limit,gamification,progress}/ # Rate limiting, XP, progress
├── lib/{smart-study,leech}/       # Smart Study + leech detection services
├── lib/utils/                     # Timezone (WIB) + shared utilities
├── stores/                        # Zustand stores
├── db/{schema,migrations,seed}/   # Drizzle schema + seed data
└── types/                         # Shared TypeScript types
```

## Priority Phases

- **[P0] Setup**: Next.js 15 + Supabase + Auth (Google/GitHub OAuth) + Drizzle migrations + seed kana + seed MNN vocab
- **[P1] Core**: Kana grid + flashcard (3D flip + FSRS rating) + quiz (7 types + audio) + chapter navigation + progress tracking
- **[P2] Gamification**: XP system + streak + achievements + dashboard stats + heatmap + PWA
- **[P3] AI**: Chatbot (Gemini waterfall + streaming) + pronunciation (Web Speech API) + auto-generate quiz bank
- **[P4] Polish & UX**: Landing page, auth redesign, review improvements, security audit, SEO, JLPT auto-upgrade
- **[P5] Smart Study & Leech**: Smart Study session (3 phases), leech detection, dashboard redesign, bug fixes

---

## Status Progress (Diupdate Berkala)

### [P0] Setup & Foundation

- [x] Init Next.js 15 + TypeScript + Tailwind + shadcn/ui
- [x] Supabase project setup + env vars
- [x] Drizzle ORM config + schema definitions
- [x] DB migrations (all 20 tables + enums + RLS)
- [x] Supabase Auth (Google OAuth + magic link — GitHub OAuth dihapus)
- [x] Auth middleware + protected routes
- [x] Seed data: kana (214 characters)
- [x] Seed data: MNN vocabulary Bab 1-50 (from PDF + MinnaNoDS)
- [x] Basic layout: AppShell + Navbar + BottomNav + ThemeToggle
- [x] Vercel deployment + GitHub Actions keep-alive cron
- [x] Pre-generate audio files (Edge TTS) + upload to Supabase Storage
- [x] Auto-play audio across all pages (flashcard, quiz, review, kana grid) + toggle setting

### [P1] Core Features

- [x] Kana grid page (color-coded by SRS status)
- [x] Kana flashcard session (flip + audio + FSRS rating)
- [x] Kana quiz session (romaji ↔ kana)
- [x] Chapter selection page (progress indicators)
- [x] Chapter detail page (vocab list + tabs)
- [x] Vocabulary flashcard session (furigana + flip + audio + FSRS) (2-button: Belum Paham/Sudah Paham)
- [x] FSRS engine integration (ts-fsrs scheduling + review submission)
- [x] Quiz session (7 question types + audio + scoring) + answer explanations
- [x] Review session (due cards queue + 4-button FSRS rating + re-queue Again max 3x)
- [x] User onboarding flow (forced — dashboard blocked until completed)
- [x] Progress tracking per chapter (quiz-based mastery)
- [x] Search vocabulary (global search bar)

### [P2] Gamification & Polish

- [x] XP system (earn + transactions + level calculation)
- [x] Streak system (daily check + freeze + notifications)
- [x] Achievement definitions (seed ~50 badges)
- [x] Achievement unlock logic + UI
- [x] Dashboard: stats overview + streak + XP bar + due cards breakdown (learning/review/overdue)
- [x] Dashboard: activity heatmap (365 days)
- [x] Dashboard: SRS distribution chart
- [x] Dashboard: review countdown timer (real-time)
- [x] Animations: card flip, XP increment, level-up confetti, streak fire
- [x] Sound effects: correct/incorrect ding
- [x] PWA: service worker + manifest + offline cache + install banner (floating)
- [x] Responsive polish (mobile + tablet)
- [x] Dark mode complete pass

### [P3] AI Features

- [x] AI provider waterfall (Gemini → Groq → OpenRouter → WebLLM)
- [x] AI chatbot UI (streaming + message history) + delete confirmation
- [x] AI chatbot system prompt (MNN-aware, level-adaptive, natural conversational Sensei)
- [x] AI suggested prompts (4 categories: Kosakata, Grammar, Percakapan, Budaya)
- [x] Pronunciation: Web Speech API integration
- [x] Pronunciation: scoring (Levenshtein distance)
- [x] Pronunciation: Whisper.cpp WASM fallback (SKIPPED — Web Speech API sudah cover ~85% browser. Whisper WASM ~75MB terlalu berat untuk fallback. Ditambahkan browser detection message sebagai gantinya. Bisa ditambahkan post-launch jika ada demand.)
- [x] AI quiz generation: build-time pre-generation script
- [x] AI response caching (prompt hash → Supabase)

### [P4] Polish & UX Improvements

- [x] Landing page redesign (10 sections: navbar, hero, stats, features, how-it-works, FSRS method, app preview, tech stack, CTA, footer)
- [x] Login & Register redesign (split layout, branding panel, floating kanji, password eye icon)
- [x] OAuth: remove GitHub, keep Google only + email/password
- [x] Register flow: redirect to /login first, not directly to onboarding
- [x] Force onboarding: dashboard layout blocks access if onboarding_done = false
- [x] Onboarding polish (glassmorphism, gradient, step labels, icons per step)
- [x] Profile simplification (no "Pengaturan" label, inline edit display name, JLPT read-only)
- [x] JLPT auto-upgrade (N5→N4 when all Book 1 chapters mastered via quiz, celebration modal)
- [x] JLPT target-aware navigation (default MNN tab, reminder dialog, completion banner)
- [x] Halaman /learn hub (2 premium cards: HIRAKATA + MNN)
- [x] Sidebar sticky (overflow-x-clip fix)
- [x] Nav cleanup: remove Quiz from nav, consistent naming (AI Tutor, BELAJAR)
- [x] Halaman 404 (Japanese-themed, floating kanji, gradient background)
- [x] SEO: meta tags, OG image (dynamic ImageResponse), per-page titles (%s | Kioku)
- [x] Loading skeleton screens (8 pages)
- [x] Quiz: answer explanations, kanji above hiragana format, "Kata yang Perlu Diulang" in summary
- [x] Review: re-queue Again cards (max 3 retry), "Ulang" label, deduped summary stats
- [x] Review summary: akurasi %, tips, "Perlu Diulang" section
- [x] Dashboard: review breakdown + warning banner + countdown timer
- [x] Daily goal toast redesign
- [x] AI chatbot: improved system prompt, 4 category suggested prompts, chat input mobile fix
- [x] Security audit Level 1+2+3 (SECURITY-AUDIT.md)
- [x] Rate limiting: in-memory sliding window (AI chat, pronunciation, search, daily-check)
- [x] Zod validation added to review actions, AI chat, auth, user settings
- [x] Security headers: HSTS, X-Frame-Options, CSP, etc
- [x] PWA install banner (floating bottom-right) + install text trigger
- [x] Logout animation overlay (gradient, kanji decorations, loading bar)
- [x] README.md profesional (screenshots, tech stack, architecture, security, cost)
- [x] Review bug fixes: duplicate review, reviewed_at timestamp
- [x] Error messages translated to Indonesian

### [P5] Smart Study & Leech Detection

- [x] Smart Study Session ("Belajar Sekarang") — 3 phases: review due cards + learn new words + quiz
- [x] Smart Study backend: smart-study-service.ts (generateSmartSession, getSmartSessionStatus)
- [x] Smart Study API: GET /api/v1/study/session, GET /api/v1/study/status
- [x] Smart Study UI: full session page with phase indicator, Framer Motion transitions
- [x] Smart Study new words: selected based on user progress + JLPT target
- [x] Smart Study quiz: 8 questions from mix of review + new words (no matching/speaking types)
- [x] Smart Study summary: breakdown per phase, XP breakdown, count-up animation
- [x] Smart Study bonus: +15 XP on session complete (idempotent)
- [x] Smart Study: Kanji/Kana toggle in all 3 phases + feedback
- [x] Dashboard redesign: "Belajar Sekarang" large CTA card (surface color, lime button)
- [x] Dashboard: remove 3 old cards (Review/Belajar MNN/Hirakata)
- [x] Dashboard: 3 small cards (Streak, Review Breakdown with countdown, Kata Sulit)
- [x] Dashboard countdown: "X kartu siap direview sekarang" or "X kartu akan siap direview dalam..."
- [x] Leech detection backend: leech-service.ts (getLeechCards, getConfusedPairs, getLeechSummary)
- [x] Leech API: GET /api/v1/leech/cards, confused-pairs, summary
- [x] Kata Sulit page (/kata-sulit): 2 tabs (Sering Lupa + Sering Tertukar) + Kanji/Kana toggle
- [x] Leech training (/kata-sulit/latihan): Phase 1 intensive flashcard (retry 5x) + Phase 2 forced recall quiz (3 hard types)
- [x] Sidebar badge: red badge showing leech count
- [x] Logout overlay redesign: full-screen elegant (deep teal gradient, Framer Motion)
- [x] CTA "Tersedia sebagai aplikasi" centered
- [x] Streak bug fix: no reset when user skips a day, fixed with validateStreak()
- [x] Timezone audit: 6 files fixed from UTC to WIB (Asia/Jakarta) via centralized timezone.ts
- [x] Schema fix: 24 columns .default("now()") changed to .$defaultFn() across 6 schema files
- [x] XP tracking: fix literal "now()" string in xp_transaction + daily_activity reset bug
- [x] Quiz feedback: follows Kanji/Kana toggle (furigana style)
- [x] Review countdown: clarified labels ("X kartu siap direview sekarang" vs "X kartu akan siap direview dalam...")
- [x] OG image path fix
- [x] Unused imports cleanup
- [x] Comprehensive audit: 80+ checks across 16 areas, zero remaining issues
- [x] Streak reminder dinamis: 5 time slot (dini hari/pagi/siang/sore/malam), pesan personal dengan nama user, countdown malam, border warna per waktu
- [x] Halaman /learn redesign: 3 card Metode Belajar (Belajar Sekarang, Review, Kata Sulit) + 2 card Materi (HIRAKATA, MNN), gradient style, badge info dinamis, countdown timer review
- [x] Kana data fix: 12 romaji errors corrected (ぢ→ji, づ→zu, を→o, combo ぢゃ/ぢゅ/ぢょ), migration 0009_fix_kana_romaji.sql, pronunciation-scoring.ts updated
- [x] Progress bar notes: 4 lokasi (HIRAKATA, MNN list, MNN per-bab, Dashboard)
- [x] Profile redesign comprehensive:
  - Statistik Belajar: 3 highlight cards (XP w/ progress bar, Level w/ XP-to-next, Streak w/ longest) + 6 detail cards (Kata Dikuasai, Quiz Selesai, Akurasi, Hari Aktif, Total Review, Bergabung Sejak)
  - Avatar picker: 16 preset emoji Jepang, gradient ring (lime-to-teal), hover rotation animation, always-visible pencil edit indicator
  - Header: enhanced gradient with radial overlay
  - Ubah Password: modal with real-time validation (email/password users only)
  - Keamanan untuk Google OAuth: info text + link ke Google Account settings
  - Hapus Akun multi-step: Step 1 warning with real data counts, Step 2 type "HAPUS AKUN" + 5-second countdown timer, cascade delete all tables + Supabase Auth
  - Real-time stats: force-dynamic ensures fresh data on every navigation
  - Bug fix Kata Dikuasai = 0: now uses getTotalQuizMasteredWords() (same query as dashboard)
  - Bug fix Bergabung Sejak Invalid Date: fallback to authUser.created_at + Indonesian short months format
  - Footer text removed
- [x] Dashboard Kata Sulit card: penjelasan untuk empty state
- [x] Skeleton loading update: dashboard + learn + profile pages match new layouts
- [x] Lighthouse optimization: Performance 63→86 (font preload, lazy motion, dynamic imports, image dimensions, accessibility fixes)

### Onboarding Tour Enhancement (Selesai)

- [x] Tambah 2 step baru: "Review Harian" (target tour-review, sisip setelah Smart Study) + "Profil & Panduan" (target tour-user-menu, step terakhir). Total 8 step.
- [x] Polish copy 6 step existing: lebih punchy + spesifik (FSRS 20-30% efisien, 214 kana, 2.909 MNN, level 1-60, 50 achievement, dst).
- [x] Tag `id="tour-user-menu"` di DropdownMenuTrigger user-menu.tsx (element selalu visible di topbar).
- [x] Persistence ke DB: kolom `tour_completed` di tabel user. Migration 0013_add_tour_completed.sql.
- [x] Server actions: `markTourCompleted()` + `getTourCompletedStatus()` di src/app/actions/tour.ts. Graceful fallback jika kolom belum ada.
- [x] Tour store: `syncCompletedFromServer()` action + `completeTour()` fire-and-forget panggil server. localStorage tetap sebagai fast cache.
- [x] Interactive tour bootstrap: fetch server status saat mount, sync down (server→local) atau backfill up (local→server) untuk legacy users. Auto-start delay 1500ms.
- [x] Cross-device sync: user yang complete tour di device A tidak akan lihat tour lagi di device B.

### [P6] Documentation & Polish

- [x] README.md restructured with comprehensive documentation, onboarding tour, and guidebook sections (14 sections total: Header, Why Kioku, Highlights, Screenshots, Documentation, Features, Tech Stack, Architecture, Database, Security, Project Status, Getting Started, License, Footer).
- [x] Highlights section baru: 10 fitur unggulan untuk recruiter (Smart Study, FSRS, AI Waterfall, Tour, Leech, JLPT Auto-Upgrade, Achievements, Audio Pipeline, PWA, Security).
- [x] Documentation section baru: link ke 36-page guidebook PDF + ToC 10 chapter.
- [x] Project Status section baru: tabel P0-P6 lengkap dengan status Complete + summary line (70+ features, 30+ pages, 20 tables, 8 tour steps, 36-page guide).
- [x] Features restructured: tambah sub-header "Documentation & Onboarding" + refresh items (Profile Customization, Account Security, Dynamic Streak Reminder, JLPT Auto-Upgrade).
- [x] License + Footer dirombak: include MNN copyright disclaimer + portfolio context untuk recruiter.
- [x] Screenshot order ditata ulang sesuai user-journey: Dashboard → Onboarding Tour → Learn Hub → Smart Study → Summary → Flashcard → Quiz → Kana Grid → Review → Kata Sulit → AI Tutor → Profile.

---

## Catatan Teknis (Diupdate Seiring Development)

- `meaningId` pada tabel vocabulary MNN sudah ditranslasi ke Bahasa Indonesia dari PDF kosakata MNN Bab 1-50 (1942/2692 rows updated via update-vocabulary-meanings.ts, + 74 tambahan via sync-vocabulary.ts). Data source: `scripts/data/mnn-vocabulary-indonesian.json`.
- Vocabulary yang tidak ada di PDF MNN Bab 1-50 di-hide (`is_published = false`). Total 666 hidden, 2026 published. Semua query frontend/API sudah filter `is_published = true`. Script: `scripts/sync-vocabulary.ts`. Migration: `0006_add_vocabulary_is_published.sql`.
- DONE: Toggle switch Kanji/Kana sudah diimplementasi di chapter detail, flashcard, quiz, dan review. Setting global disimpan di DB (user.display_mode), per-halaman override via Zustand store. Komponen: DisplayModeToggle, DisplayModeProvider, useDisplayMode hook. Migration: 0007_add_user_display_mode.sql.
- Pronunciation scoring menggunakan ~1766 kanji→hiragana mappings (auto-generated dari PDF MNN Bab 1-50). Dictionary: `src/lib/audio/kanji-hiragana-dict.ts`. Data source: `scripts/data/kanji-hiragana-dict.ts`.
- Whisper.cpp WASM fallback di-skip karena model ~75MB terlalu berat dan Web Speech API sudah cover mayoritas browser (Chrome/Edge). Jika nanti ada demand dari user Firefox/Safari, bisa diimplementasi sebagai lazy-loaded optional feature.
- Flashcard: 2 tombol (Belum Paham/Sudah Paham) + retry queue max 3x. Review: 4 tombol FSRS (Ulang/Hard/Good/Easy) + re-queue Again max 3x.
- JLPT auto-upgrade: checkAndUpgradeJlpt() mengecek quiz mastery (bukan completion_percent). Trigger setelah quiz complete + fallback di dashboard load.
- Supabase Auth: "Confirm email" OFF. GitHub OAuth dihapus. Hanya Google + email/password + magic link.
- Onboarding: FORCED — dashboard layout redirect ke /onboarding jika onboarding_done = false.
- Security: SECURITY-AUDIT.md full report. Rate limiting in-memory. Security headers di next.config.ts.
- Daily goal: 5 tier (100/300/500/750/1000 XP).
- Smart Study kata baru: berdasarkan progress aktual user, bukan hanya JLPT target. JLPT target hanya starting point untuk user baru.
- Leech threshold: lapses >= 4. Confused pairs: dari quiz_answer history, confusion_count >= 2.
- Bonus XP: smart study session complete +15 XP, leech training complete +20 XP.
- Timezone utility: `src/lib/utils/timezone.ts` — single source of truth untuk semua date calculations (WIB/Asia/Jakarta).
- Schema timestamps: semua pakai `.$defaultFn(() => new Date().toISOString())`, bukan `.default("now()")`.
- Streak validation: validateStreak() dipanggil saat dashboard load, tidak auto-reset jika user skip hari.
- Streak reminder dinamis: getCurrentHourWIB() untuk determine time slot (5 slots), useEffect interval 60s untuk update countdown malam. Komponen: components/dashboard/streak-reminder.tsx.
- Avatar emoji: stored as plain emoji string in user.avatar_url column (NULL = default initial letter). Detection via !startsWith("http").
- Delete account: cascade delete semua tabel user data + Supabase Auth admin.deleteUser via service role. Setelah hapus, email bisa dipakai register ulang.
- Kana migration: 0009_fix_kana_romaji.sql berisi 12 UPDATE statements untuk fix romaji yang salah (ぢ→ji bukan di, dst).
- Legacy "now()" string fix: migration 0010_fix_legacy_now_string_timestamps.sql update existing rows yang masih punya literal "now()" string ke NOW()::text. Profile fallback ke authUser.created_at jika user.createdAt invalid.
- Profile stats query: Kata Dikuasai pakai getTotalQuizMasteredWords() (count distinct quiz_answer.vocabularyId where is_correct), bukan userGamification.totalWordsLearned (yang seringkali 0).
- Profile date format: Indonesian short months array ["Jan","Feb",..."Des"], format "DD MMM YYYY".
