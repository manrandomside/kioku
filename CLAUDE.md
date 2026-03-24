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

RLS: user data tables → `user_id = auth.uid()`. Content tables (vocabulary, kana, book, chapter) → public read.

## API Endpoints (Grouped)

```
AUTH:    POST /api/auth/signup|login|oauth|magic-link|logout  GET /api/auth/session
USER:    GET|PUT /api/v1/user/profile  POST /api/v1/user/onboarding  GET /api/v1/user/stats|streak
CONTENT: GET /api/v1/books  GET /api/v1/books/:slug/chapters  GET /api/v1/chapters/:slug(/vocabulary)
         GET /api/v1/vocabulary/:id|search  GET /api/v1/kana(/:category)  GET /api/v1/jlpt/:level/vocabulary
SRS:     GET /api/v1/srs/due|stats  GET /api/v1/srs/chapter/:id|kana/:cat  POST /api/v1/srs/cards|review
QUIZ:    POST /api/v1/quiz/start  POST /api/v1/quiz/:id/answer|complete  GET /api/v1/quiz/history|:id
AI:      POST /api/v1/ai/chat(streaming)  GET /api/v1/ai/chat/sessions|:id/messages  DELETE /api/v1/ai/chat/:id
         POST /api/v1/ai/generate-questions|pronunciation/check
GAMIF:   GET /api/v1/gamification/overview|achievements|xp-history|heatmap  POST /api/v1/gamification/daily-check
PROGRESS:GET /api/v1/progress/chapters(/:id)|jlpt/:level|daily
```

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
├── app/(dashboard)/home/          # Dashboard with stats
├── app/(dashboard)/learn/hirakata/# HIRAKATA module
├── app/(dashboard)/learn/mnn/[chapter]/
├── app/(dashboard)/review/        # SRS review session
├── app/(dashboard)/quiz/[chapter]/# Quiz session
├── app/(dashboard)/chat/          # AI tutor
├── app/(dashboard)/profile/       # Settings, stats, achievements
├── app/api/                       # API routes (auth, v1/*)
├── components/{flashcard,quiz,kana,audio,gamification,chat,ui}/
├── lib/{srs,ai,audio,supabase}/   # Business logic
├── stores/                        # Zustand stores
├── db/{schema,migrations,seed}/   # Drizzle schema + seed data
└── types/                         # Shared TypeScript types
```

## Priority Phases

- **[P0] Setup**: Next.js 15 + Supabase + Auth (Google/GitHub OAuth) + Drizzle migrations + seed kana + seed MNN vocab
- **[P1] Core**: Kana grid + flashcard (3D flip + FSRS rating) + quiz (7 types + audio) + chapter navigation + progress tracking
- **[P2] Gamification**: XP system + streak + achievements + dashboard stats + heatmap + PWA
- **[P3] AI**: Chatbot (Gemini waterfall + streaming) + pronunciation (Web Speech API) + auto-generate quiz bank

---

## Status Progress (Diupdate Berkala)

### [P0] Setup & Foundation

- [x] Init Next.js 15 + TypeScript + Tailwind + shadcn/ui
- [x] Supabase project setup + env vars
- [x] Drizzle ORM config + schema definitions
- [x] DB migrations (all 20 tables + enums + RLS)
- [x] Supabase Auth (Google OAuth + GitHub OAuth + magic link)
- [x] Auth middleware + protected routes
- [x] Seed data: kana (214 characters)
- [x] Seed data: MNN vocabulary Bab 1-50 (from PDF + MinnaNoDS)
- [x] Basic layout: AppShell + Navbar + BottomNav + ThemeToggle
- [x] Vercel deployment + GitHub Actions keep-alive cron
- [ ] Pre-generate audio files (Edge TTS) + upload to Supabase Storage

### [P1] Core Features

- [x] Kana grid page (color-coded by SRS status)
- [x] Kana flashcard session (flip + audio + FSRS rating)
- [x] Kana quiz session (romaji ↔ kana)
- [x] Chapter selection page (progress indicators)
- [x] Chapter detail page (vocab list + tabs)
- [x] Vocabulary flashcard session (furigana + flip + audio + FSRS)
- [x] FSRS engine integration (ts-fsrs scheduling + review submission)
- [x] Quiz session (7 question types + audio + scoring)
- [x] Review session (due cards queue + daily summary)
- [x] User onboarding flow (profile + JLPT target + hirakata assessment)
- [x] Progress tracking per chapter
- [x] Search vocabulary (global search bar)

### [P2] Gamification & Polish

- [x] XP system (earn + transactions + level calculation)
- [x] Streak system (daily check + freeze + notifications)
- [x] Achievement definitions (seed ~50 badges)
- [x] Achievement unlock logic + UI
- [x] Dashboard: stats overview + streak + XP bar + due cards count
- [x] Dashboard: activity heatmap (365 days)
- [x] Dashboard: SRS distribution chart
- [x] Animations: card flip, XP increment, level-up confetti, streak fire
- [x] Sound effects: correct/incorrect ding
- [x] PWA: service worker + manifest + offline cache
- [x] Responsive polish (mobile + tablet)
- [x] Dark mode complete pass

### [P3] AI Features

- [x] AI provider waterfall (Gemini → Groq → OpenRouter → WebLLM)
- [x] AI chatbot UI (streaming + message history)
- [x] AI chatbot system prompt (MNN-aware, level-adaptive)
- [ ] Pronunciation: Web Speech API integration
- [ ] Pronunciation: scoring (Levenshtein distance)
- [ ] Pronunciation: Whisper.cpp WASM fallback
- [ ] AI quiz generation: build-time pre-generation script
- [ ] AI response caching (prompt hash → Supabase)

---

## Catatan Teknis (Diupdate Seiring Development)

- `meaningId` pada tabel vocabulary MNN masih English placeholder, perlu batch translation ke Indonesian nanti.
- TODO: Tambahkan toggle switch Kanji/Kana di quiz dan flashcard. Saat ini tampilan terlalu kanji-heavy untuk pemula N5. User harus bisa pilih apakah ingin fokus kanji atau kana. Ini juga berlaku untuk tampilan kosakata di chapter detail — tulisan besar seharusnya bisa di-switch antara kanji dan kana.
