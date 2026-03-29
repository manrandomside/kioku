<div align="center">

# 記憶 Kioku

**Platform Belajar Kosakata Bahasa Jepang untuk Penutur Indonesia**

[Live Demo](https://kioku-learn.vercel.app) · [Laporan Security](./SECURITY-AUDIT.md) · [Spesifikasi Project](./designs/kioku-project-spec.md)

![Landing Page](./public/screenshots/landing-kioku.png)

</div>

---

## Tentang Kioku

**Kioku** (記憶 — "Memori") adalah platform web fullstack berbasis AI untuk belajar kosakata bahasa Jepang. Dirancang khusus untuk penutur Indonesia, platform ini menggabungkan spaced repetition (FSRS), flashcard interaktif, quiz bergaya Duolingo, dan AI tutor — semuanya gratis.

Konten bersumber dari buku **Minna no Nihongo** Buku I (Bab 1–25, JLPT N5) dan Buku II (Bab 26–50, JLPT N4), dilengkapi modul Hiragana & Katakana untuk pemula.

### Mengapa Kioku?

- **Saintifik** — Menggunakan algoritma FSRS (sama dengan Anki v23.10+), 20-30% lebih efisien dari SM-2
- **Lengkap** — 2.900+ kosakata, 214 kana, 3.000+ audio, 7 tipe quiz, AI tutor
- **Gratis** — Seluruh platform berjalan di free tier (Rp0/bulan)
- **Indonesia-first** — Semua terjemahan dan antarmuka dalam Bahasa Indonesia

---

## Screenshots

<div align="center">

### Dashboard
![Dashboard](./public/screenshots/full-dashboard-kioku.png)

### Flashcard dengan Spaced Repetition
![Flashcard](./public/screenshots/flashcard-mnn-kioku.png)

### Quiz Interaktif dengan Penjelasan
![Quiz](./public/screenshots/quiz-mnn-kioku.png)

### AI Tutor (Sensei)
![AI Tutor](./public/screenshots/ai-tutor-kioku.png)

### Grid Hiragana & Katakana
![Kana Grid](./public/screenshots/kana-grid-kioku.png)

### Review Summary
![Review](./public/screenshots/review-summary-kioku.png)

</div>

---

## Fitur Utama

### Pembelajaran
- **Modul HIRAKATA** — Belajar 214 karakter Hiragana & Katakana dengan grid interaktif, flashcard, dan quiz
- **Kosakata MNN** — 2.900+ kata dari Minna no Nihongo Bab 1-50 (JLPT N5 & N4)
- **Flashcard Cerdas** — Kartu interaktif dengan furigana, audio, dan rating FSRS (Again/Hard/Good/Easy)
- **Quiz 7 Tipe** — Pilihan ganda (JP↔ID), audio recognition, ketik hiragana, isi titik-titik, matching, speaking
- **Audio Native** — 3.000+ file audio pre-generated dengan suara natural Jepang (Microsoft Edge TTS, Nanami Neural)

### Spaced Repetition (FSRS)
- **Algoritma FSRS** — Free Spaced Repetition Scheduler, state-of-the-art (via ts-fsrs v5)
- **Review Session** — Kartu jatuh tempo otomatis muncul, dengan re-queue untuk kartu "Again" (max 3 retry)
- **Real-time Countdown** — Timer countdown saat menunggu kartu berikutnya jatuh tempo
- **Dashboard Informatif** — Breakdown kartu (learning/review/overdue), warning jika banyak terlambat

### AI Features
- **AI Tutor "Sensei"** — Chatbot yang memahami level JLPT user, streaming response, context-aware
- **Multi-Provider Waterfall** — Gemini 2.5 Flash-Lite → Groq → OpenRouter (auto-fallback jika limit tercapai)
- **Pronunciation Check** — Web Speech API untuk menilai pengucapan user
- **Response Caching** — Cache respons AI untuk mengurangi API calls

### Gamifikasi
- **Sistem XP & Level** — Earn XP dari flashcard, quiz, dan review. Level 1-60 dengan formula progresif
- **Streak Harian** — Streak counter dengan freeze protection dan milestone rewards
- **50+ Achievement** — Badge untuk berbagai pencapaian (streak, kata dikuasai, skor quiz, dll)
- **Activity Heatmap** — Visualisasi aktivitas 365 hari (seperti GitHub contribution graph)

### JLPT-Aware Navigation
- **Rekomendasi Bab** — Dashboard mengarahkan ke bab yang sesuai level target
- **Default Tab** — Halaman MNN otomatis buka tab sesuai JLPT target (N5→Buku 1, N4→Buku 2)
- **Dialog Pengingat** — User N5 yang akses materi N4 mendapat pengingat sopan jika N5 belum selesai
- **Badge Completion** — Notifikasi dan saran upgrade saat level N5 selesai

---

## Tech Stack

### Frontend
| Teknologi | Fungsi |
|-----------|--------|
| **Next.js 15** (App Router) | Framework fullstack dengan RSC, Server Actions, streaming |
| **React 19** | UI library dengan Server Components dan Suspense |
| **TypeScript 5** | Type safety end-to-end |
| **Tailwind CSS 4** | Utility-first CSS |
| **shadcn/ui** | Accessible, customizable component library |
| **Framer Motion** | Animasi (card flip 3D, page transitions, micro-interactions) |
| **Zustand** | Client state management (quiz/flashcard session) |
| **TanStack Query v5** | Server state, caching, background refetch |

### Backend & Database
| Teknologi | Fungsi |
|-----------|--------|
| **Supabase** | PostgreSQL + Auth (50K MAU) + Storage (1GB) + RLS |
| **Drizzle ORM** | Type-safe SQL, edge-compatible, auto migrations |
| **Zod** | Runtime + compile-time validation |
| **ts-fsrs v5** | FSRS algorithm implementation |

### AI & Audio
| Teknologi | Fungsi |
|-----------|--------|
| **Vercel AI SDK** | Unified streaming interface untuk semua AI provider |
| **Google Gemini 2.5 Flash-Lite** | Primary AI provider (1000 RPD gratis) |
| **Groq Cloud** | Fallback AI #1 (Llama 3.3 70B) |
| **OpenRouter** | Fallback AI #2 |
| **Microsoft Edge TTS** | Pre-generated audio (ja-JP-NanamiNeural) |
| **Web Speech API** | Browser-native speech recognition |

### Infrastructure
| Teknologi | Fungsi |
|-----------|--------|
| **Vercel** | Hosting + CDN + serverless (free tier) |
| **GitHub Actions** | CI/CD + Supabase keep-alive cron |
| **ESLint + Prettier** | Code quality |

---

## Arsitektur

```
┌──────────────────────────────────────────────────┐
│                 CLIENT (Browser)                  │
│  Next.js 15 + React 19 + TypeScript              │
│  Tailwind CSS 4 + shadcn/ui + Framer Motion      │
│  Zustand + TanStack Query                        │
├──────────────────────────────────────────────────┤
│                SERVER (Vercel Edge)               │
│  Server Components + Server Actions              │
│  Vercel AI SDK + ts-fsrs v5                      │
│  Drizzle ORM + Zod                               │
├──────────────────────────────────────────────────┤
│              BACKEND SERVICES (Free)              │
│  Supabase PostgreSQL + Auth + Storage             │
│  Gemini → Groq → OpenRouter (waterfall)          │
├──────────────────────────────────────────────────┤
│              DEPLOYMENT & CI/CD                   │
│  Vercel Hobby + GitHub Actions                    │
└──────────────────────────────────────────────────┘
```

### Database Schema

20 tabel dengan Row Level Security (RLS) pada semua tabel:

- **Konten**: book, chapter, vocabulary (2.900+ kata), kana (214 karakter), achievement (50+ badge), ai_question_template
- **User Data**: user, srs_card, review_log, quiz_session, quiz_answer, user_gamification, xp_transaction, achievement_unlock, user_chapter_progress, daily_activity
- **AI**: ai_chat_session, ai_chat_message, ai_response_cache, pronunciation_attempt

### Security

Audit keamanan lengkap telah dilakukan — lihat [SECURITY-AUDIT.md](./SECURITY-AUDIT.md).

| Area | Status |
|------|--------|
| Row Level Security (RLS) | 20/20 tabel protected |
| API Authentication | Semua endpoint verified |
| Input Validation (Zod) | Semua form dan API validated |
| Rate Limiting | AI chat, pronunciation, search, daily-check |
| Security Headers | HSTS, X-Frame-Options, CSP, dll |
| SQL Injection | Protected (Drizzle ORM parameterized) |
| XSS | Protected (React auto-escape) |
| CSRF | Protected (Next.js Server Actions) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm atau pnpm
- Akun Supabase (free tier)
- API keys: Gemini, Groq, OpenRouter (semua gratis)

### Installation

```bash
# Clone repository
git clone https://github.com/manrandomside/kioku.git
cd kioku

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan credentials kamu

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

# AI Providers
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, register, magic link
│   ├── (dashboard)/     # Dashboard, learn, review, chat, profile
│   ├── (onboarding)/    # User onboarding flow
│   └── api/             # API routes
├── components/
│   ├── flashcard/       # Flashcard components
│   ├── quiz/            # Quiz components (7 types)
│   ├── review/          # Review session
│   ├── chat/            # AI tutor interface
│   ├── kana/            # Kana grid & modal
│   ├── gamification/    # XP, streak, achievements, heatmap
│   └── ui/              # shadcn/ui + custom components
├── lib/
│   ├── srs/             # FSRS engine wrapper
│   ├── ai/              # AI provider waterfall + system prompt
│   ├── audio/           # Audio playback + pronunciation
│   └── supabase/        # Supabase client helpers
├── db/
│   ├── schema/          # Drizzle ORM schema (20 tables)
│   └── migrations/      # SQL migrations
└── stores/              # Zustand stores
```

---

## Biaya Operasional

| Layanan | Free Tier | Penggunaan Kioku |
|---------|-----------|-----------------|
| Vercel | 100GB bandwidth | Hosting + CDN |
| Supabase | 500MB DB, 1GB storage, 50K MAU | Database + Auth + Audio storage |
| Gemini | 1000 req/day | AI chatbot primary |
| Groq | ~500K token/day | AI fallback #1 |
| OpenRouter | 50 req/day | AI fallback #2 |
| **Total** | | **Rp0/bulan** |

---

## License

This project is created for educational and portfolio purposes.

---

<div align="center">

**Kioku** — Dibuat dengan dedikasi untuk pembelajar bahasa Jepang Indonesia

[Live Demo](https://kioku-learn.vercel.app)

</div>
