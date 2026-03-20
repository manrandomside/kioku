# PROJECT SPECIFICATION DOCUMENT
# Kioku — Platform Belajar Bahasa Jepang Fullstack + AI

> **Versi**: 1.1  
> **Tanggal**: 20 Maret 2026  
> **Status**: Brainstorming & Planning Phase  
> **Nama Project**: Kioku (記憶 = Memori / Ingatan)  
> **Logo**: Wordmark rounded dengan torii gate di huruf "o", aksen lime green di huruf "i"

---

## DAFTAR ISI

- [A. Konsep dan Tujuan Project](#a-konsep-dan-tujuan-project)
- [B. Tech Stack](#b-tech-stack)
- [C. Struktur Database](#c-struktur-database)
- [D. Fitur & User Flow](#d-fitur--user-flow)
- [E. API Endpoints](#e-api-endpoints)
- [F. UI/UX & Design System](#f-uiux--design-system)
- [G. Aturan Coding](#g-aturan-coding)

---

# A. KONSEP DAN TUJUAN PROJECT

## Nama Project

**Kioku** (記憶) — berarti "Memori" atau "Ingatan" dalam bahasa Jepang. Nama ini dipilih karena:

- **Makna yang tepat**: Langsung terhubung dengan inti aplikasi — spaced repetition adalah ilmu tentang memori
- **Unik**: Belum ada app besar yang menggunakan nama ini
- **Mudah dieja**: 5 huruf, mudah diketik di keyboard (`k-i-o-k-u`)
- **International-friendly**: Mudah diucapkan dan dieja secara internasional
- **Satu kata**: Mengikuti pola nama app populer (Duolingo, Migii, Yomikko, Mazii, Miraa)
- **Domain tersedia**: `kioku.vercel.app` tersedia untuk deployment

## Deskripsi Project

**Kioku** adalah platform web fullstack berbasis AI untuk belajar bahasa Jepang yang dirancang khusus untuk penutur bahasa Indonesia. Platform ini berfokus pada penguasaan kosakata (語彙/goi) melalui metode pembelajaran saintifik menggunakan spaced repetition (FSRS), flashcard interaktif bergaya Anki, quiz adaptif bergaya Duolingo, serta fitur AI canggih yang mencakup chatbot tutor, koreksi pengucapan, dan generasi soal otomatis.

Konten utama bersumber dari buku **Minna no Nihongo (MNN)** Buku I (Bab 1–25) dan Buku II (Bab 26–50), yang dipetakan ke level **JLPT N5** dan **JLPT N4**. Platform juga menyediakan modul dasar Hiragana & Katakana (HIRAKATA) sebagai titik awal bagi pemula absolut.

## Tujuan Utama

1. **Edukatif**: Menjadi platform belajar kosakata bahasa Jepang nomor satu untuk penutur Indonesia, dengan metode yang terbukti secara saintifik (spaced repetition)
2. **Portofolio**: Mendemonstrasikan kemampuan fullstack development + AI engineering dengan tech stack modern dan arsitektur production-grade
3. **HKI (Hak Kekayaan Intelektual)**: Menghasilkan deliverable yang layak untuk registrasi hak cipta — mencakup implementasi algoritma, arsitektur AI, database kosakata, dan desain UI/UX original
4. **Aksesibilitas**: Seluruh platform gratis diakses, berjalan di infrastruktur berbiaya nol

## Fitur Utama

### Fitur Inti (MVP — Fase 1 & 2)

| No | Fitur | Deskripsi |
|----|-------|-----------|
| 1 | **Modul HIRAKATA** | Belajar Hiragana & Katakana lengkap (214 karakter) dengan grid interaktif, flashcard, quiz, dan audio pengucapan. Titik awal wajib untuk pemula |
| 2 | **Flashcard Bergaya Anki** | Kartu interaktif dengan tampilan hiragana besar + kanji kecil di atas (furigana terbalik). Tap untuk flip — menampilkan arti, tipe kata, contoh kalimat + audio otomatis. Rating 4 tombol (Again/Hard/Good/Easy) dengan interval FSRS |
| 3 | **Quiz Bergaya Duolingo** | 20 soal acak per sesi dari bab yang dipilih. 7 tipe soal (pilihan ganda JP→ID, ID→JP, audio recognition, mengetik hiragana, isi titik-titik, matching, speaking). Audio otomatis saat soal muncul dan saat jawaban dipilih |
| 4 | **Mesin SRS (FSRS)** | Algoritma spaced repetition state-of-the-art (sama dengan Anki v23.10). Menghitung interval optimal berdasarkan difficulty, stability, dan retrievability. 20–30% lebih efisien dari SM-2 klasik |
| 5 | **Audio Pengucapan** | Pre-generated untuk seluruh ~1.500 kosakata MNN + 214 kana menggunakan Microsoft Edge TTS (Neural voice Nanami). Playback instan, konsisten, zero runtime cost |
| 6 | **Navigasi Konten MNN** | Struktur hierarkis: Buku → Bab → Kosakata. MNN Buku 1 (Bab 1–25, JLPT N5), MNN Buku 2 (Bab 26–50, JLPT N4). Setiap bab menampilkan daftar kosakata, flashcard deck, dan quiz |
| 7 | **Autentikasi** | Login/Register via Google OAuth, GitHub OAuth, dan magic link email. Powered by Supabase Auth (50K MAU gratis) |
| 8 | **Tracking Progres** | Per pengguna: progres per bab (%), total kata dikuasai, distribusi SRS stage, riwayat review, statistik akurasi quiz |

### Fitur Gamifikasi (Fase 3)

| No | Fitur | Deskripsi |
|----|-------|-----------|
| 9 | **Sistem XP & Level** | Ekonomi poin: 5 XP/review, 15 XP/quiz selesai, 10 XP bonus harian, 50–500 XP milestone streak. Level 1–60 dengan formula `50 * level^2` |
| 10 | **Streak Harian** | Mekanisme retensi utama. Hitung hari berurutan belajar. Streak freeze didapat di milestone. Notifikasi pengingat untuk streak terancam |
| 11 | **Achievement & Badge** | ~50 badge: "Langkah Pertama" (pelajaran pertama), "Siap JLPT N5" (semua N5 dikuasai), "Pejuang Mingguan" (7 hari streak), "Speed Demon" (quiz < 2 menit), dll |
| 12 | **Dashboard Statistik** | Visualisasi progres: heatmap aktivitas (seperti GitHub), grafik streak, distribusi SRS (new/learning/review/mature), akurasi per bab, words learned timeline |

### Fitur AI (Fase 4)

| No | Fitur | Deskripsi |
|----|-------|-----------|
| 13 | **AI Chatbot Tutor** | Percakapan bahasa Jepang dengan AI yang mengoreksi tata bahasa, menjelaskan budaya, dan menyesuaikan level kosakata MNN pengguna. Waterfall: Gemini → Groq → OpenRouter → WebLLM |
| 14 | **Koreksi Pengucapan** | Web Speech API + Whisper.cpp (WebAssembly) untuk mendeteksi dan menilai pengucapan pengguna. Skor akurasi + feedback visual |
| 15 | **Auto-Generate Soal** | AI menghasilkan soal quiz, kalimat contoh, dan latihan kontekstual berdasarkan bab dan level pengguna. Pre-generated saat build + real-time via waterfall AI |

### Fitur Tambahan (Post-Launch)

| No | Fitur | Deskripsi |
|----|-------|-----------|
| 16 | **JLPT N3/N2/N1** | Ekspansi kosakata untuk level lanjut (skema database sudah mendukung) |
| 17 | **Modul Tata Bahasa** | Pola kalimat (文型/bunkei) per bab MNN |
| 18 | **Pembelajaran Kanji** | Kanji dengan dekomposisi radikal, stroke order, terinspirasi WaniKani |
| 19 | **Leaderboard** | Peringkat pengguna berdasarkan XP, streak, akurasi |
| 20 | **Mode Offline (PWA)** | Service worker untuk cache kosakata, audio, dan state kartu. Sync saat online |

## Hal yang Perlu Dipertimbangkan

### Teknis
- **Supabase Free Tier Pause**: Project di-pause setelah 7 hari tidak aktif. WAJIB setup GitHub Actions cron job untuk ping harian
- **Gemini Rate Limit**: Free tier dipotong 50–80% sejak Desember 2025. Waterfall multi-provider adalah keharusan, bukan opsi
- **Audio Storage**: ~1.500 MP3 * ~50KB rata-rata = ~75MB. Masih aman di 1GB Supabase Storage, tapi perlu kompresi dan naming convention yang konsisten
- **review_log Growth**: Tabel ini tumbuh paling cepat (~50 row/user/hari). Arsip entri >6 bulan untuk tetap di bawah 500MB
- **Edge Cases Kosakata**: Beberapa kata MNN punya multiple reading (同音異義語). Pastikan setiap entry punya unique ID, bukan bergantung pada hiragana saja

### Legal & HKI
- **Konten MNN**: Kosakata bahasa (kata-kata) tidak bisa di-copyright-kan, tapi susunan/organisasi bisa. Pastikan organisasi konten cukup original (bukan copy-paste layout buku)
- **HKI Deliverable**: Yang bisa didaftarkan — (1) Source code, (2) Desain UI/UX, (3) Database schema design, (4) Implementasi algoritma FSRS wrapper, (5) Arsitektur AI waterfall
- **Dataset**: Gunakan MinnaNoDS (open-source) sebagai base, tambahkan terjemahan Indonesia sendiri = karya turunan yang sah

### UX
- **Onboarding**: User baru harus diarahkan ke HIRAKATA dulu, bukan langsung ke MNN. Tapi jangan blokir — beri pilihan "Saya sudah bisa Hiragana/Katakana"
- **Session Length**: Target 5–15 menit per sesi. Flashcard deck max 20 kartu baru + due cards. Quiz max 20 soal. Jangan membuat user overwhelmed
- **Audio Autoplay**: Harus ada setting ON/OFF. Banyak user belajar di tempat umum
- **Dark/Light Mode**: Wajib ada. Banyak user belajar malam hari
- **Bahasa Interface**: Bahasa Indonesia sebagai default, dengan opsi English

---

# B. TECH STACK

## Arsitektur Utama

```
+----------------------------------------------------------+
|                      CLIENT (Browser)                     |
|  Next.js 15 (App Router) + React 19 + TypeScript 5       |
|  Tailwind CSS 4 + shadcn/ui + Framer Motion               |
|  Zustand (client state) + TanStack Query v5 (server)      |
|  Web Speech API + Web Audio API + WebAssembly (Whisper)    |
+----------------------------------------------------------+
|                      SERVER (Vercel Edge)                  |
|  Next.js API Routes + Server Actions + Server Components   |
|  Vercel AI SDK (streaming) + ts-fsrs v5 (SRS engine)      |
|  Drizzle ORM (type-safe SQL) + Zod (validation)           |
+----------------------------------------------------------+
|                    BACKEND SERVICES (Free Tier)            |
|  Supabase PostgreSQL (500MB) + Auth (50K MAU)             |
|  Supabase Storage (1GB) + Realtime                        |
|  Gemini 2.5 Flash-Lite > Groq > OpenRouter > WebLLM       |
+----------------------------------------------------------+
|                     DEPLOYMENT & CI/CD                     |
|  Vercel Hobby (100GB BW) + GitHub Actions (cron + CI)     |
|  Edge TTS (build-time audio gen) + ESLint + Prettier      |
+----------------------------------------------------------+
```

## Detail Tech Stack

### Frontend

| Teknologi | Versi | Fungsi | Justifikasi |
|-----------|-------|--------|-------------|
| **Next.js** | 15 (App Router) | Framework fullstack | RSC, Server Actions, streaming, image optimization. Ekosistem React terbesar, skill #1 yang dicari recruiter |
| **React** | 19 | UI library | Server Components, Suspense, transitions. Standar industri |
| **TypeScript** | 5.x | Type safety | Mengurangi bug, autocomplete IDE, dokumentasi otomatis |
| **Tailwind CSS** | 4 | Utility-first CSS | Rapid prototyping, konsisten, tree-shaking otomatis |
| **shadcn/ui** | Latest | Component library | Accessible, customizable, copy-paste (bukan dependency). Bisa di-theme sesuai design system |
| **Framer Motion** | 12.x | Animasi | Flip card 3D, page transitions, confetti, progress bar animasi, micro-interactions |
| **Zustand** | 5.x | Client state | ~3KB, tanpa Provider wrapper, perfect untuk quiz/flashcard session state |
| **TanStack Query** | 5.x | Server state | Caching, background refetch, optimistic updates, infinite scrolling |
| **next-themes** | Latest | Dark/Light mode | SSR-safe theme switching, system preference detection |
| **Lucide React** | Latest | Icons | Konsisten, tree-shakeable, 1000+ ikon |

### Backend & Database

| Teknologi | Versi | Fungsi | Justifikasi |
|-----------|-------|--------|-------------|
| **Supabase** | Latest | Backend-as-a-Service | PostgreSQL + Auth + Storage + Realtime dalam 1 free tier. Mengeliminasi kebutuhan 3-4 layanan terpisah |
| **Drizzle ORM** | Latest | ORM | Type-safe, SQL-like syntax, edge-compatible, migrasi otomatis. Lebih ringan dari Prisma, tanpa engine binary |
| **Zod** | 3.x | Schema validation | Runtime + compile-time validation untuk form, API payload, environment variables |
| **ts-fsrs** | 5.x | SRS Algorithm | Implementasi FSRS resmi TypeScript. Algoritma yang sama digunakan Anki v23.10+ |

### AI & Audio

| Teknologi | Fungsi | Free Tier |
|-----------|--------|-----------|
| **Vercel AI SDK** | Unified streaming interface untuk semua AI provider | Gratis (library) |
| **Google Gemini 2.5 Flash-Lite** | AI chatbot utama, quiz generation | 1.000 RPD, no credit card |
| **Groq Cloud (Llama 3.3 70B)** | Fallback AI #1 | ~500K token/hari |
| **OpenRouter** | Fallback AI #2 (model gratis) | 50 RPD tanpa payment |
| **Cloudflare Workers AI** | Fallback AI #3 | 10.000 Neurons/hari |
| **WebLLM** | Fallback AI #4 (browser-local) | Unlimited, no API |
| **Microsoft Edge TTS** | Pre-generate audio kosakata (build-time) | Gratis, Neural voice, ja-JP-NanamiNeural |
| **Web Speech API** | Speech-to-text (pronunciation check) + TTS fallback | Gratis, browser-native |
| **whisper.cpp (WASM)** | Fallback speech recognition (offline) | Gratis, ~75MB model |

### Deployment & DevTools

| Teknologi | Fungsi | Free Tier |
|-----------|--------|-----------|
| **Vercel** | Hosting + CDN + serverless functions | 100GB BW, 6000 build min/mo |
| **GitHub** | Version control + CI/CD | Unlimited repos |
| **GitHub Actions** | CI pipeline + Supabase keep-alive cron | 2.000 min/mo |
| **ESLint** | Linting | Gratis |
| **Prettier** | Code formatting | Gratis |
| **Husky + lint-staged** | Pre-commit hooks | Gratis |

### Kenapa BUKAN Alternatif Lain?

| Dipertimbangkan | Ditolak Karena |
|----------------|----------------|
| SvelteKit | Ekosistem library ~10x lebih kecil dari React. Sulit menemukan library flashcard, audio player, quiz components yang mature |
| Remix / React Router v7 | Kehilangan momentum komunitas setelah merger. Vercel integration tidak se-native Next.js |
| Prisma | Binary engine ~15MB, cold start lambat di serverless. Drizzle lebih ringan dan edge-compatible |
| MongoDB Atlas | Document model kurang cocok untuk data relasional SRS (user > card > vocabulary > chapter). SQL joins jauh lebih efisien |
| PlanetScale | Menghapus free tier April 2024 |
| Firebase | Firestore pricing per read/write bisa mahal untuk SRS (50 reads/user/day). Supabase unlimited reads |
| Clerk Auth | Free tier hanya 10K MAU vs Supabase 50K MAU. Menambah dependency terpisah |

---

# C. STRUKTUR DATABASE

## Entity Relationship Diagram (Konseptual)

```
+-----------+    +-----------+    +-------------+
|   book    |---<|  chapter  |---<|  vocabulary |
+-----------+    +-----------+    +-------------+
                                       |
                                       | (vocabulary_id)
                    +------------------+
                    |                  |
              +-----+------+    +-----+-------+
              |  srs_card  |    |quiz_question |
              +-----+------+    +-----+-------+
                    |                  |
                    | (user_id)        | (session_id)
              +-----+------+    +-----+-------+
              |    user    |    | quiz_session |
              +-----+------+    +-------------+
                    |
         +----------+----------+
         |          |          |
   +-----+----+ +--+---+ +----+---------+
   |user_gamif| |review| |achievement   |
   |ication   | |_log  | |_unlock       |
   +----------+ +------+ +--------------+
```

## Enum Types

```sql
-- Tipe kata dalam kosakata
CREATE TYPE word_type AS ENUM (
  'noun',           -- 名詞 (meishi) - Kata benda
  'i_adjective',    -- い形容詞 (i-keiyoushi) - Adjektiva い
  'na_adjective',   -- な形容詞 (na-keiyoushi) - Adjektiva な
  'verb_group1',    -- 動詞グループ1 - Kata kerja grup 1
  'verb_group2',    -- 動詞グループ2 - Kata kerja grup 2
  'verb_group3',    -- 動詞グループ3 - Kata kerja grup 3
  'adverb',         -- 副詞 (fukushi) - Kata keterangan
  'conjunction',    -- 接続詞 (setsuzokushi) - Kata sambung
  'particle',       -- 助詞 (joshi) - Partikel
  'expression',     -- 表現 (hyougen) - Ungkapan/ekspresi
  'counter',        -- 助数詞 (josuushi) - Kata bantu bilangan
  'pronoun',        -- 代名詞 (daimeishi) - Kata ganti
  'greeting'        -- 挨拶 (aisatsu) - Salam/sapaan
);

-- Level JLPT
CREATE TYPE jlpt_level AS ENUM ('N5', 'N4', 'N3', 'N2', 'N1');

-- Status kartu SRS
CREATE TYPE srs_status AS ENUM ('new', 'learning', 'review', 'relearning');

-- Rating review SRS
CREATE TYPE srs_rating AS ENUM ('again', 'hard', 'good', 'easy');

-- Tipe soal quiz
CREATE TYPE question_type AS ENUM (
  'jp_to_id_choice',      -- Lihat Jepang → Pilih arti Indonesia
  'id_to_jp_choice',      -- Lihat Indonesia → Pilih jawaban Jepang
  'audio_to_id_choice',   -- Dengar audio → Pilih arti
  'type_hiragana',        -- Lihat arti → Ketik hiragana
  'fill_blank',           -- Isi titik-titik dalam kalimat
  'matching',             -- Cocokkan pasangan
  'speaking'              -- Ucapkan kata (speech recognition)
);

-- Kategori kana
CREATE TYPE kana_category AS ENUM (
  'hiragana_gojuon',      -- Hiragana dasar (あ-ん)
  'hiragana_dakuten',     -- Hiragana dakuten (が-ぽ)
  'hiragana_combo',       -- Hiragana kombinasi (きゃ-りょ)
  'katakana_gojuon',      -- Katakana dasar (ア-ン)
  'katakana_dakuten',     -- Katakana dakuten (ガ-ポ)
  'katakana_combo'        -- Katakana kombinasi (キャ-リョ)
);

-- Tipe achievement
CREATE TYPE achievement_type AS ENUM (
  'streak',          -- Berbasis streak (7 hari, 30 hari, dll)
  'words_learned',   -- Berbasis jumlah kata dikuasai
  'quiz_score',      -- Berbasis skor quiz
  'quiz_speed',      -- Berbasis kecepatan quiz
  'chapter_complete', -- Menyelesaikan bab
  'level_reach',     -- Mencapai level tertentu
  'review_count',    -- Jumlah total review
  'special'          -- Achievement khusus
);

-- Tipe transaksi XP
CREATE TYPE xp_source AS ENUM (
  'flashcard_review',    -- Review flashcard
  'quiz_complete',       -- Menyelesaikan quiz
  'quiz_perfect',        -- Skor sempurna quiz
  'daily_goal',          -- Target harian tercapai
  'streak_milestone',    -- Milestone streak
  'achievement_unlock',  -- Membuka achievement
  'level_up'             -- Naik level
);

-- Provider AI
CREATE TYPE ai_provider AS ENUM (
  'gemini', 'groq', 'openrouter', 'cloudflare', 'webllm', 'cache'
);
```

## Tabel-Tabel Database

### 1. Tabel `user` (Pengguna)

```sql
CREATE TABLE "user" (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_auth_id  UUID UNIQUE NOT NULL,       -- ID dari Supabase Auth
  email             VARCHAR(255) UNIQUE NOT NULL,
  display_name      VARCHAR(100) NOT NULL,
  avatar_url        TEXT,                        -- URL foto profil dari OAuth
  preferred_name    VARCHAR(50),                 -- Nama panggilan
  native_language   VARCHAR(10) DEFAULT 'id',    -- Bahasa native (id/en)
  jlpt_target       jlpt_level DEFAULT 'N5',     -- Target JLPT
  daily_goal_xp     INTEGER DEFAULT 50,          -- Target XP harian (30/50/100/200)
  auto_play_audio   BOOLEAN DEFAULT true,        -- Autoplay audio di flashcard
  show_romaji       BOOLEAN DEFAULT true,        -- Tampilkan romaji
  theme             VARCHAR(10) DEFAULT 'system', -- light/dark/system
  onboarding_done   BOOLEAN DEFAULT false,       -- Sudah selesai onboarding?
  hirakata_known    BOOLEAN DEFAULT false,       -- Sudah bisa hiragana/katakana?
  timezone          VARCHAR(50) DEFAULT 'Asia/Jakarta',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_supabase_id ON "user"(supabase_auth_id);
CREATE INDEX idx_user_email ON "user"(email);
```

### 2. Tabel `book` (Buku MNN)

```sql
CREATE TABLE book (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(100) NOT NULL,         -- "Minna no Nihongo Shokyuu I"
  title_jp        VARCHAR(100),                  -- "みんなの日本語 初級I"
  slug            VARCHAR(50) UNIQUE NOT NULL,   -- "mnn-1"
  jlpt_level      jlpt_level NOT NULL,           -- N5
  chapter_start   INTEGER NOT NULL,              -- 1
  chapter_end     INTEGER NOT NULL,              -- 25
  description     TEXT,
  is_published    BOOLEAN DEFAULT true,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Tabel `chapter` (Bab)

```sql
CREATE TABLE chapter (
  id              SERIAL PRIMARY KEY,
  book_id         INTEGER NOT NULL REFERENCES book(id) ON DELETE CASCADE,
  chapter_number  INTEGER NOT NULL,               -- 1, 2, 3, ... 50
  title           VARCHAR(200),                   -- Judul bab (opsional)
  slug            VARCHAR(50) UNIQUE NOT NULL,    -- "bab-1"
  vocab_count     INTEGER DEFAULT 0,              -- Cache: jumlah kosakata
  is_published    BOOLEAN DEFAULT true,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(book_id, chapter_number)
);

CREATE INDEX idx_chapter_book ON chapter(book_id);
CREATE INDEX idx_chapter_number ON chapter(chapter_number);
```

### 4. Tabel `vocabulary` (Kosakata)

```sql
CREATE TABLE vocabulary (
  id              SERIAL PRIMARY KEY,
  chapter_id      INTEGER NOT NULL REFERENCES chapter(id) ON DELETE CASCADE,
  kanji           VARCHAR(100),                   -- 私 (bisa NULL untuk kata tanpa kanji)
  hiragana        VARCHAR(200) NOT NULL,           -- わたし
  romaji          VARCHAR(200) NOT NULL,           -- watashi
  meaning_id      TEXT NOT NULL,                   -- "Saya" (Bahasa Indonesia)
  meaning_en      TEXT,                            -- "I, me" (Bahasa Inggris)
  word_type       word_type DEFAULT 'noun',
  jlpt_level      jlpt_level NOT NULL,
  audio_url       TEXT,                            -- URL ke file MP3 di Supabase Storage
  example_jp      TEXT,                            -- Contoh kalimat Jepang
  example_id      TEXT,                            -- Terjemahan contoh kalimat
  note            TEXT,                            -- Catatan tambahan
  sort_order      INTEGER DEFAULT 0,              -- Urutan dalam bab
  is_published    BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vocab_chapter ON vocabulary(chapter_id);
CREATE INDEX idx_vocab_jlpt ON vocabulary(jlpt_level);
CREATE INDEX idx_vocab_hiragana ON vocabulary(hiragana);
CREATE INDEX idx_vocab_search ON vocabulary USING gin(
  to_tsvector('simple', hiragana || ' ' || COALESCE(kanji, '') || ' ' || meaning_id || ' ' || romaji)
);
```

### 5. Tabel `kana` (Hiragana & Katakana)

```sql
CREATE TABLE kana (
  id              SERIAL PRIMARY KEY,
  character       VARCHAR(10) NOT NULL,           -- あ, ア, きゃ, dll
  romaji          VARCHAR(10) NOT NULL,           -- a, ka, kya, dll
  category        kana_category NOT NULL,          -- hiragana_gojuon, dll
  row_group       VARCHAR(10) NOT NULL,           -- a, ka, sa, ta, na, dll (untuk grouping grid)
  column_position INTEGER NOT NULL,               -- Posisi dalam row (1-5: a,i,u,e,o)
  audio_url       TEXT,
  stroke_count    INTEGER,
  sort_order      INTEGER DEFAULT 0,
  is_published    BOOLEAN DEFAULT true,

  UNIQUE(character, category)
);

CREATE INDEX idx_kana_category ON kana(category);
CREATE INDEX idx_kana_row ON kana(row_group);
```

### 6. Tabel `srs_card` (Kartu SRS per User per Kata)

```sql
CREATE TABLE srs_card (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  vocabulary_id   INTEGER REFERENCES vocabulary(id) ON DELETE CASCADE,
  kana_id         INTEGER REFERENCES kana(id) ON DELETE CASCADE,

  -- FSRS State
  status          srs_status DEFAULT 'new',
  stability       FLOAT DEFAULT 0,               -- Hari sampai recall drop ke 90%
  difficulty      FLOAT DEFAULT 0,               -- 1.0 - 10.0
  due_date        TIMESTAMPTZ DEFAULT NOW(),      -- Kapan harus direview
  last_review     TIMESTAMPTZ,                   -- Terakhir direview
  scheduled_days  INTEGER DEFAULT 0,             -- Interval terjadwal dalam hari
  elapsed_days    INTEGER DEFAULT 0,             -- Hari sejak review terakhir
  reps            INTEGER DEFAULT 0,             -- Total review berhasil
  lapses          INTEGER DEFAULT 0,             -- Total lupa (rating "again")
  
  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: harus punya salah satu (vocabulary ATAU kana), bukan keduanya
  CONSTRAINT chk_card_type CHECK (
    (vocabulary_id IS NOT NULL AND kana_id IS NULL) OR
    (vocabulary_id IS NULL AND kana_id IS NOT NULL)
  ),
  -- Satu user tidak bisa punya duplikat kartu untuk kata yang sama
  UNIQUE(user_id, vocabulary_id),
  UNIQUE(user_id, kana_id)
);

-- Index kritis untuk performa: ambil kartu yang jatuh tempo per user
CREATE INDEX idx_srs_user_due ON srs_card(user_id, due_date) WHERE status != 'new';
CREATE INDEX idx_srs_user_status ON srs_card(user_id, status);
CREATE INDEX idx_srs_user_vocab ON srs_card(user_id, vocabulary_id);
```

### 7. Tabel `review_log` (Log Review SRS)

```sql
CREATE TABLE review_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  card_id         UUID NOT NULL REFERENCES srs_card(id) ON DELETE CASCADE,
  
  rating          srs_rating NOT NULL,            -- again/hard/good/easy
  
  -- State SEBELUM review
  prev_status     srs_status,
  prev_stability  FLOAT,
  prev_difficulty FLOAT,
  prev_due        TIMESTAMPTZ,
  
  -- State SESUDAH review
  new_status      srs_status,
  new_stability   FLOAT,
  new_difficulty  FLOAT,
  new_due         TIMESTAMPTZ,
  new_interval    INTEGER,                        -- Interval baru dalam hari
  
  review_duration_ms  INTEGER,                    -- Waktu yang dihabiskan (milidetik)
  reviewed_at     TIMESTAMPTZ DEFAULT NOW(),

  -- Partisi berdasarkan bulan untuk manajemen storage
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_user_date ON review_log(user_id, reviewed_at DESC);
CREATE INDEX idx_review_card ON review_log(card_id);
```

### 8. Tabel `quiz_session` (Sesi Quiz)

```sql
CREATE TABLE quiz_session (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  chapter_id      INTEGER REFERENCES chapter(id),
  kana_category   kana_category,                 -- NULL jika quiz vocabulary, set jika quiz kana
  
  total_questions INTEGER NOT NULL DEFAULT 20,
  correct_count   INTEGER DEFAULT 0,
  wrong_count     INTEGER DEFAULT 0,
  score_percent   FLOAT DEFAULT 0,
  xp_earned       INTEGER DEFAULT 0,
  time_spent_ms   INTEGER DEFAULT 0,             -- Total waktu sesi
  is_completed    BOOLEAN DEFAULT false,
  is_perfect      BOOLEAN DEFAULT false,         -- Semua benar?
  
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_user ON quiz_session(user_id);
CREATE INDEX idx_quiz_chapter ON quiz_session(chapter_id);
CREATE INDEX idx_quiz_completed ON quiz_session(user_id, is_completed, completed_at DESC);
```

### 9. Tabel `quiz_answer` (Jawaban Quiz per Soal)

```sql
CREATE TABLE quiz_answer (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES quiz_session(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,              -- Nomor soal (1-20)
  question_type   question_type NOT NULL,
  
  -- Soal
  vocabulary_id   INTEGER REFERENCES vocabulary(id),
  kana_id         INTEGER REFERENCES kana(id),
  question_text   TEXT NOT NULL,                  -- Teks soal yang ditampilkan
  correct_answer  TEXT NOT NULL,                  -- Jawaban benar
  options         JSONB,                          -- Opsi jawaban (untuk pilihan ganda)
  
  -- Jawaban user
  user_answer     TEXT,                           -- Jawaban yang dipilih user
  is_correct      BOOLEAN DEFAULT false,
  time_spent_ms   INTEGER DEFAULT 0,             -- Waktu per soal
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_answer_session ON quiz_answer(session_id);
```

### 10. Tabel `user_gamification` (State Gamifikasi — Denormalized)

```sql
CREATE TABLE user_gamification (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  
  -- XP & Level
  total_xp            INTEGER DEFAULT 0,
  current_level       INTEGER DEFAULT 1,
  xp_to_next_level    INTEGER DEFAULT 50,        -- Cache: XP yang dibutuhkan untuk naik level
  
  -- Streak
  current_streak      INTEGER DEFAULT 0,
  longest_streak      INTEGER DEFAULT 0,
  streak_freezes      INTEGER DEFAULT 0,         -- Jumlah streak freeze tersedia
  last_activity_date  DATE,                       -- Tanggal terakhir aktivitas (untuk hitung streak)
  
  -- Statistik Agregat
  total_reviews       INTEGER DEFAULT 0,
  total_words_learned INTEGER DEFAULT 0,          -- Kata dengan status "review" atau "mature"
  total_kana_learned  INTEGER DEFAULT 0,
  total_quiz_taken    INTEGER DEFAULT 0,
  total_quiz_perfect  INTEGER DEFAULT 0,
  total_days_active   INTEGER DEFAULT 0,
  avg_quiz_accuracy   FLOAT DEFAULT 0,
  
  -- Daily tracking
  daily_xp_earned     INTEGER DEFAULT 0,          -- XP hari ini (reset tiap hari)
  daily_goal_met      BOOLEAN DEFAULT false,       -- Target harian tercapai?
  daily_reviews_done  INTEGER DEFAULT 0,           -- Review hari ini
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### 11. Tabel `xp_transaction` (Log Transaksi XP)

```sql
CREATE TABLE xp_transaction (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  source          xp_source NOT NULL,
  amount          INTEGER NOT NULL,               -- Jumlah XP (positif)
  description     TEXT,                            -- "Review flashcard Bab 1"
  reference_id    UUID,                            -- ID referensi (quiz_session_id, dll)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_xp_user_date ON xp_transaction(user_id, created_at DESC);
```

### 12. Tabel `achievement` (Definisi Achievement)

```sql
CREATE TABLE achievement (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,           -- "Langkah Pertama"
  name_en         VARCHAR(100),                    -- "First Steps"
  description     TEXT NOT NULL,                   -- "Selesaikan pelajaran pertamamu"
  icon            VARCHAR(50) NOT NULL,            -- Nama ikon Lucide
  badge_color     VARCHAR(7) DEFAULT '#c2e959',    -- Warna badge hex
  type            achievement_type NOT NULL,
  condition       JSONB NOT NULL,                  -- {"type": "streak", "value": 7}
  xp_reward       INTEGER DEFAULT 0,              -- XP yang didapat saat unlock
  sort_order      INTEGER DEFAULT 0,
  is_published    BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 13. Tabel `achievement_unlock` (Achievement yang Dibuka User)

```sql
CREATE TABLE achievement_unlock (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  achievement_id  INTEGER NOT NULL REFERENCES achievement(id) ON DELETE CASCADE,
  unlocked_at     TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_achievement_user ON achievement_unlock(user_id);
```

### 14. Tabel `user_chapter_progress` (Progres per Bab)

```sql
CREATE TABLE user_chapter_progress (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  chapter_id          INTEGER NOT NULL REFERENCES chapter(id) ON DELETE CASCADE,
  
  total_vocab         INTEGER DEFAULT 0,          -- Total kosakata di bab ini
  vocab_seen          INTEGER DEFAULT 0,          -- Yang sudah pernah dilihat
  vocab_learning      INTEGER DEFAULT 0,          -- Status learning
  vocab_review        INTEGER DEFAULT 0,          -- Status review (sudah hafal)
  completion_percent  FLOAT DEFAULT 0,            -- Persentase penyelesaian
  
  best_quiz_score     FLOAT DEFAULT 0,            -- Skor quiz terbaik
  total_quiz_attempts INTEGER DEFAULT 0,
  
  first_started_at    TIMESTAMPTZ,
  last_studied_at     TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, chapter_id)
);

CREATE INDEX idx_progress_user ON user_chapter_progress(user_id);
```

### 15. Tabel `daily_activity` (Aktivitas Harian — untuk Heatmap)

```sql
CREATE TABLE daily_activity (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  activity_date   DATE NOT NULL,
  
  reviews_count   INTEGER DEFAULT 0,
  quiz_count      INTEGER DEFAULT 0,
  xp_earned       INTEGER DEFAULT 0,
  time_spent_ms   INTEGER DEFAULT 0,
  new_words       INTEGER DEFAULT 0,
  goal_met        BOOLEAN DEFAULT false,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, activity_date)
);

CREATE INDEX idx_daily_user_date ON daily_activity(user_id, activity_date DESC);
```

### 16. Tabel `ai_chat_session` (Sesi Chat AI)

```sql
CREATE TABLE ai_chat_session (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title           VARCHAR(200) DEFAULT 'Percakapan Baru',
  is_active       BOOLEAN DEFAULT true,
  message_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user ON ai_chat_session(user_id, updated_at DESC);
```

### 17. Tabel `ai_chat_message` (Pesan Chat AI)

```sql
CREATE TABLE ai_chat_message (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES ai_chat_session(id) ON DELETE CASCADE,
  role            VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  provider_used   ai_provider,                    -- Provider yang digunakan
  tokens_used     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_session ON ai_chat_message(session_id, created_at ASC);
```

### 18. Tabel `ai_response_cache` (Cache Respons AI)

```sql
CREATE TABLE ai_response_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash     VARCHAR(64) UNIQUE NOT NULL,    -- SHA-256 hash dari prompt
  prompt_text     TEXT NOT NULL,
  response_text   TEXT NOT NULL,
  provider        ai_provider NOT NULL,
  tokens_used     INTEGER DEFAULT 0,
  hit_count       INTEGER DEFAULT 1,              -- Berapa kali cache ini digunakan
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ                     -- NULL = tidak expire
);

CREATE INDEX idx_cache_hash ON ai_response_cache(prompt_hash);
CREATE INDEX idx_cache_expires ON ai_response_cache(expires_at) WHERE expires_at IS NOT NULL;
```

### 19. Tabel `pronunciation_attempt` (Percobaan Pengucapan)

```sql
CREATE TABLE pronunciation_attempt (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  vocabulary_id     INTEGER REFERENCES vocabulary(id),
  kana_id           INTEGER REFERENCES kana(id),
  
  expected_text     VARCHAR(200) NOT NULL,         -- Teks yang seharusnya diucapkan
  recognized_text   VARCHAR(200),                  -- Teks yang dikenali speech API
  confidence_score  FLOAT DEFAULT 0,              -- 0.0 - 1.0
  accuracy_score    FLOAT DEFAULT 0,              -- Skor akurasi (Levenshtein-based)
  provider          VARCHAR(20) DEFAULT 'web_speech', -- web_speech / whisper
  is_correct        BOOLEAN DEFAULT false,
  
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pronunciation_user ON pronunciation_attempt(user_id, created_at DESC);
```

### 20. Tabel `ai_question_template` (Template Soal AI — Pre-generated)

```sql
CREATE TABLE ai_question_template (
  id              SERIAL PRIMARY KEY,
  vocabulary_id   INTEGER NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  question_type   question_type NOT NULL,
  question_text   TEXT NOT NULL,                   -- Soal yang di-generate AI
  correct_answer  TEXT NOT NULL,
  wrong_answers   JSONB NOT NULL,                  -- Array jawaban salah
  explanation     TEXT,                             -- Penjelasan jawaban
  difficulty      INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vocabulary_id, question_type, question_text)
);

CREATE INDEX idx_template_vocab ON ai_question_template(vocabulary_id);
CREATE INDEX idx_template_type ON ai_question_template(question_type);
```

### Row Level Security (RLS) — Contoh Kritis

```sql
-- User hanya bisa akses data mereka sendiri
ALTER TABLE srs_card ENABLE ROW LEVEL SECURITY;
CREATE POLICY srs_card_user_policy ON srs_card
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE review_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY review_log_user_policy ON review_log
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE quiz_session ENABLE ROW LEVEL SECURITY;
CREATE POLICY quiz_session_user_policy ON quiz_session
  FOR ALL USING (user_id = auth.uid());

-- Tabel konten bisa diakses semua orang (read-only)
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
CREATE POLICY vocab_read_policy ON vocabulary
  FOR SELECT USING (true);

ALTER TABLE kana ENABLE ROW LEVEL SECURITY;
CREATE POLICY kana_read_policy ON kana
  FOR SELECT USING (true);
```

---

# D. FITUR & USER FLOW

## Flow 1: Onboarding (User Baru)

```
[Landing Page — kioku.vercel.app]
     |
     +-- Klik "Mulai Belajar" / "Sign Up"
     |
     v
[Auth Page] --- Google OAuth / GitHub OAuth / Magic Link
     |
     v
[Onboarding Step 1: Profil]
  - Input display name
  - Pilih target JLPT (N5/N4/N3)
  - Pilih target harian (Santai 30XP / Reguler 50XP / Serius 100XP / Intens 200XP)
     |
     v
[Onboarding Step 2: Asesmen]
  - "Apakah kamu sudah bisa membaca Hiragana & Katakana?"
  - [Ya, saya sudah bisa] -> Skip ke dashboard, hirakata_known = true
  - [Belum, saya mau belajar dulu] -> Arahkan ke modul HIRAKATA
     |
     v
[Dashboard] <- User baru melihat:
  - Welcome card dengan nama
  - Rekomendasi: "Mulai dari Hiragana!" atau "Mulai Bab 1 MNN!"
  - Stats kosong (0 XP, 0 streak, 0 kata)
  - Quick action buttons: Belajar Baru / Review / Quiz
```

## Flow 2: Belajar HIRAKATA

```
[Dashboard] -> Klik "Belajar Hiragana" atau "Belajar Katakana"
     |
     v
[Kana Overview Page]
  - Grid 46 karakter dasar (gojuon) dalam layout tradisional 10x5
  - Karakter BERWARNA berdasarkan status SRS:
    - Abu-abu: Belum dipelajari
    - Kuning: Sedang dipelajari (learning)
    - Hijau: Sudah hafal (review/mature)
  - Filter: Gojuon / Dakuten / Handakuten / Kombinasi
  - Tombol: [Mulai Flashcard] [Mulai Quiz]
     |
     +-- Klik karakter -> Modal popup: karakter besar + romaji + audio
     |
     +-- Klik [Mulai Flashcard] ->
     |   [Flashcard Session - Kana]
     |     - 10 karakter baru per sesi (configurable)
     |     - Tampilan: Karakter besar di tengah
     |     - Tap -> Flip: Romaji + Audio autoplay
     |     - Rating: Again / Hard / Good / Easy
     |     - Progress bar di atas
     |     - Selesai -> Ringkasan sesi + XP earned
     |
     +-- Klik [Mulai Quiz] ->
         [Quiz Session - Kana]
           - 20 soal acak dari karakter yang sudah dipelajari
           - Tipe: Lihat kana -> pilih romaji, atau sebaliknya
           - Audio otomatis saat soal muncul
           - Feedback instant: benar (hijau + ding) / salah (merah + goyang)
           - Soal salah diulang di akhir sesi
           - Selesai -> Skor + XP + animasi level up (jika ada)
```

## Flow 3: Belajar Kosakata MNN (Flashcard)

```
[Dashboard] -> Klik "Belajar Baru" atau pilih bab dari sidebar
     |
     v
[Chapter Selection Page]
  - Grid/List bab 1-50, grouped by buku
  - Setiap card bab menampilkan:
    - Nomor bab + jumlah kosakata
    - Progress bar (% selesai)
    - Badge JLPT level
    - Status: Belum mulai / Sedang dipelajari / Selesai
     |
     v
[Chapter Detail Page - Bab X]
  - Header: Nomor bab, jumlah kata, JLPT level, progress
  - Tab: [Daftar Kata] [Flashcard] [Quiz]
  
  - Tab Daftar Kata:
    Tabel scrollable semua kosakata di bab ini
    Kolom: No | Hiragana (besar) + Kanji (kecil atas) | Romaji | Arti (ID) | Tipe | Audio
    Klik baris -> Modal detail kata
  
  - Tab Flashcard -> [Flashcard Session]
     |
     v
[Flashcard Session - Vocabulary]
  - Kartu depan menampilkan:
    +---------------------------+
    |      私 (kanji kecil)     |  <- Kanji di atas (font kecil, abu-abu)
    |                           |
    |     わたし                |  <- Hiragana di tengah (font besar, bold)
    |                           |
    |     watashi               |  <- Romaji di bawah (font kecil, opsional)
    +---------------------------+
  
  - Tap kartu -> FLIP (animasi 3D rotateY):
    +---------------------------+
    |      私 (kanji)           |
    |     わたし (hiragana)     |
    |                           |
    |     [audio] "watashi"     |  <- Audio autoplay
    |                           |
    |  > Saya                   |  <- Arti Bahasa Indonesia (besar)
    |  > Kata ganti             |  <- Tipe kata (badge berwarna)
    |                           |
    |  わたしはインドネシア     |  <- Contoh kalimat
    |  じんです。               |
    |  (Saya orang Indonesia)   |
    +---------------------------+
  
  - Setelah flip, muncul 4 tombol di bawah:
    [Again 1m] [Hard 6m] [Good 10m] [Easy 4d]
    (Interval ditampilkan di bawah setiap tombol)
  
  - Progress: "5 / 20 kartu" + progress bar
  - Selesai -> Summary screen:
    - Total kartu direview
    - Kartu baru dipelajari
    - Kartu lupa (again)
    - XP earned
    - Tombol: [Lanjut Belajar] [Kembali ke Bab]
```

## Flow 4: Quiz Kosakata (Duolingo-style)

```
[Chapter Detail] -> Tab Quiz -> Klik [Mulai Quiz]
     |
     v
[Quiz Loading]
  - Generate 20 soal acak dari bab yang dipilih
  - Tipe soal bervariasi (random dari 7 tipe)
     |
     v
[Quiz Session]
  - Layout:
    +-----------------------------------+
    | [x Keluar]  ████████░░░  10/20    |  <- Progress bar
    +-----------------------------------+
    |                                   |
    |  [audio] (audio otomatis diputar) |
    |                                   |
    |  Apa arti dari kata ini?          |  <- Instruksi
    |                                   |
    |      わたし                       |  <- Soal (hiragana besar)
    |      私                           |  <- Kanji (kecil di bawah)
    |                                   |
    +-----------------------------------+
    |                                   |
    |  +-----------+  +-----------+     |
    |  |   Saya    |  |   Kamu    |     |  <- 4 opsi pilihan
    |  +-----------+  +-----------+     |
    |  +-----------+  +-----------+     |
    |  |   Dia     |  |   Kami    |     |
    |  +-----------+  +-----------+     |
    |                                   |
    |  [Periksa]                        |  <- Tombol submit
    +-----------------------------------+
  
  - Setelah pilih + klik Periksa:
    - BENAR: Background hijau, ikon check, suara "ding!", +XP animasi
    - SALAH: Background merah, goyang, tampilkan jawaban benar
    - Tombol [Lanjut] muncul
  
  - Tipe soal yang muncul secara acak:
    1. JP->ID Choice: Lihat kata Jepang -> Pilih arti Indonesia
    2. ID->JP Choice: Lihat arti Indonesia -> Pilih kata Jepang
    3. Audio Choice: Dengar audio -> Pilih arti yang benar
    4. Type Hiragana: Lihat arti -> Ketik hiragana jawabannya
    5. Fill Blank: "___はインドネシアじんです" -> Pilih kata yang tepat
    6. Matching: Cocokkan 4 pasang kata (drag & drop)
    7. Speaking: Ucapkan kata -> Speech recognition menilai
  
  - Quiz selesai:
    +-----------------------------------+
    |         Quiz Selesai!             |
    |                                   |
    |    Skor: 18/20 (90%)              |
    |    XP Didapat: +15 XP             |
    |    Bonus Sempurna: -              |
    |    Waktu: 3 menit 42 detik        |
    |                                   |
    |    Kata yang perlu diulang:        |
    |    - せんせい (Guru)              |
    |    - びょういん (Rumah sakit)     |
    |                                   |
    |  [Ulangi Quiz] [Kembali ke Bab]   |
    +-----------------------------------+
```

## Flow 5: Review Harian (SRS Due Cards)

```
[Dashboard] -> Kartu "Review: 23 kartu jatuh tempo" -> Klik
     |
     v
[Review Session]
  - Sama seperti Flashcard Session, tapi:
    - Hanya menampilkan kartu yang due_date <= sekarang
    - Urutan: Learning cards dulu -> Overdue review cards -> New cards
    - Counter: "Tersisa: 23 kartu (5 learning, 15 review, 3 baru)"
  - Setelah selesai semua:
    - Summary: reviewed, lapsed, new learned
    - Daily goal check: "Target harian tercapai! +10 XP bonus"
    - Streak update: "Streak: 7 hari!"
```

## Flow 6: AI Chatbot Tutor

```
[Dashboard / Sidebar] -> Klik "Chat dengan Sensei"
     |
     v
[AI Chat Interface]
  - Sidebar kiri: Daftar sesi chat sebelumnya
  - Area chat utama: Bubble messages
  - Input box di bawah + tombol kirim + tombol mikrofon
  
  - Contoh interaksi:
    User: "Sensei, bagaimana cara menggunakan partikel は dan が?"
    AI: "Pertanyaan bagus! は dan が keduanya bisa menandai subjek,
         tapi fungsinya berbeda..."
    (AI merespons dalam campuran Indonesia + Jepang sesuai level user)
  
  - Fitur chat:
    - Streaming response (kata per kata muncul)
    - Furigana otomatis di teks Jepang
    - Tombol audio untuk memutar teks Jepang
    - Suggested questions / quick prompts
    - Context-aware: AI tahu bab mana yang sedang dipelajari user
```

## Flow 7: Pronunciation Practice

```
[Flashcard / Vocabulary Detail] -> Klik ikon mikrofon
     |
     v
[Pronunciation Modal]
  - Tampilan: Kata target (hiragana besar + kanji + arti)
  - Tombol "Dengar Dulu" -> Putar audio contoh
  - Tombol "Rekam" ->
    - Mikrofon aktif (indikator animasi)
    - User mengucapkan kata
    - Speech recognition memproses
  - Hasil:
    +-----------------------------------+
    |  Target: わたし (watashi)          |
    |  Kamu bilang: わたし              |
    |                                   |
    |  Akurasi: 95% ████████████░       |
    |  Status: Sangat Bagus!            |
    |                                   |
    |  [Coba Lagi] [Kata Berikutnya]    |
    +-----------------------------------+
```

## Yang Dilihat Pengguna di Dashboard

```
+-------------------------------------------------------------+
| [Logo Kioku]  Home  Belajar  Review  Quiz  Chat  Profile    |
+----------------------+--------------------------------------+
|                      |                                      |
|  Selamat datang,     |  Streak: 12 hari                     |
|  Ahmad!              |  Level 8 (1,240 XP)                  |
|                      |  Target hari ini: 35/50 XP           |
|  Lanjutkan           |  ████████████████░░░  70%            |
|  belajarmu:          |                                      |
|                      +--------------------------------------+
|  +----------------+  |  Review Jatuh Tempo                  |
|  | Bab 3 MNN      |  |  23 kartu harus direview hari ini   |
|  | Progress: 60%  |  |  [Mulai Review]                     |
|  | [Lanjut]       |  |                                      |
|  +----------------+  +--------------------------------------+
|                      |  Statistik Mingguan                  |
|  Aktivitas Terakhir: |  +-----------------------------+     |
|  - Review 15 kartu   |  | Sen Sel Rab Kam Jum Sab Min |     |
|  - Quiz Bab 2: 85%   |  |  ##  ##  ##  ##  --  --  -- |     |
|  - 3 kata baru       |  |  45  60  35  50  --  --  -- |     |
|                      |  +-----------------------------+     |
|  Achievement Baru:   |                                      |
|  Pejuang Mingguan    |  Distribusi SRS:                     |
|                      |  Baru: 120 | Learning: 45            |
|                      |  Review: 89 | Mature: 234            |
+----------------------+--------------------------------------+
```

---

# E. API ENDPOINTS

## Konvensi

- Base URL: `/api/v1`
- Autentikasi: Supabase JWT via `Authorization: Bearer <token>`
- Format response: `{ success: boolean, data?: T, error?: { code: string, message: string } }`
- Middleware: `auth` = wajib login, `rateLimit` = rate limiting

## Auth Endpoints

| Method | Path | Deskripsi | Middleware | Request Body | Response |
|--------|------|-----------|------------|-------------|----------|
| POST | `/api/auth/signup` | Register via email | - | `{ email, password }` | `{ user, session }` |
| POST | `/api/auth/login` | Login via email | - | `{ email, password }` | `{ user, session }` |
| POST | `/api/auth/oauth` | Login via OAuth (Google/GitHub) | - | `{ provider }` | Redirect URL |
| POST | `/api/auth/magic-link` | Kirim magic link | - | `{ email }` | `{ message }` |
| POST | `/api/auth/logout` | Logout | auth | - | `{ message }` |
| GET | `/api/auth/session` | Cek sesi aktif | auth | - | `{ user, session }` |

## User Endpoints

| Method | Path | Deskripsi | Middleware | Request Body | Response |
|--------|------|-----------|------------|-------------|----------|
| GET | `/api/v1/user/profile` | Ambil profil user | auth | - | `{ user }` |
| PUT | `/api/v1/user/profile` | Update profil | auth | `{ display_name?, daily_goal_xp?, theme?, ... }` | `{ user }` |
| POST | `/api/v1/user/onboarding` | Selesaikan onboarding | auth | `{ display_name, jlpt_target, daily_goal_xp, hirakata_known }` | `{ user }` |
| GET | `/api/v1/user/stats` | Statistik lengkap user | auth | - | `{ gamification, daily_activity[], chapter_progress[] }` |
| GET | `/api/v1/user/streak` | Info streak | auth | - | `{ current_streak, longest_streak, streak_freezes, last_activity }` |

## Content Endpoints (Publik, Read-Only)

| Method | Path | Deskripsi | Middleware | Response |
|--------|------|-----------|------------|----------|
| GET | `/api/v1/books` | Daftar semua buku | - | `{ books[] }` |
| GET | `/api/v1/books/:slug/chapters` | Daftar bab dalam buku | - | `{ chapters[] }` |
| GET | `/api/v1/chapters/:slug` | Detail bab + kosakata | - | `{ chapter, vocabulary[] }` |
| GET | `/api/v1/chapters/:slug/vocabulary` | Kosakata per bab (paginated) | - | `{ vocabulary[], pagination }` |
| GET | `/api/v1/vocabulary/:id` | Detail satu kata | - | `{ vocabulary }` |
| GET | `/api/v1/vocabulary/search?q=...` | Cari kosakata | - | `{ results[] }` |
| GET | `/api/v1/kana` | Semua kana | - | `{ kana[] }` |
| GET | `/api/v1/kana/:category` | Kana per kategori | - | `{ kana[] }` |
| GET | `/api/v1/jlpt/:level/vocabulary` | Kosakata per level JLPT | - | `{ vocabulary[], pagination }` |

## SRS / Flashcard Endpoints

| Method | Path | Deskripsi | Middleware | Request Body | Response |
|--------|------|-----------|------------|-------------|----------|
| GET | `/api/v1/srs/due` | Kartu jatuh tempo hari ini | auth | Query: `?limit=50` | `{ cards[], total_due }` |
| GET | `/api/v1/srs/chapter/:chapterId` | Kartu SRS per bab | auth | - | `{ cards[], stats }` |
| GET | `/api/v1/srs/kana/:category` | Kartu SRS kana | auth | - | `{ cards[], stats }` |
| POST | `/api/v1/srs/cards` | Buat kartu baru (mulai belajar kata baru) | auth | `{ vocabulary_ids: number[] }` atau `{ kana_ids: number[] }` | `{ cards[] }` |
| POST | `/api/v1/srs/review` | Submit rating review | auth | `{ card_id, rating: 'again'|'hard'|'good'|'easy', duration_ms }` | `{ updated_card, xp_earned }` |
| GET | `/api/v1/srs/stats` | Statistik SRS global user | auth | - | `{ new, learning, review, total, due_today }` |

## Quiz Endpoints

| Method | Path | Deskripsi | Middleware | Request Body | Response |
|--------|------|-----------|------------|-------------|----------|
| POST | `/api/v1/quiz/start` | Mulai sesi quiz baru | auth | `{ chapter_id?, kana_category?, question_count: 20 }` | `{ session_id, questions[] }` |
| POST | `/api/v1/quiz/:sessionId/answer` | Submit jawaban soal | auth | `{ question_number, user_answer, time_spent_ms }` | `{ is_correct, correct_answer, explanation? }` |
| POST | `/api/v1/quiz/:sessionId/complete` | Selesaikan quiz | auth | - | `{ score, xp_earned, is_perfect, summary }` |
| GET | `/api/v1/quiz/history` | Riwayat quiz | auth | Query: `?limit=20&offset=0` | `{ sessions[], pagination }` |
| GET | `/api/v1/quiz/:sessionId` | Detail sesi quiz | auth | - | `{ session, answers[] }` |

## AI Endpoints

| Method | Path | Deskripsi | Middleware | Request Body | Response |
|--------|------|-----------|------------|-------------|----------|
| POST | `/api/v1/ai/chat` | Kirim pesan ke AI tutor (streaming) | auth, rateLimit | `{ session_id?, message, context?: { chapter_id } }` | SSE stream |
| GET | `/api/v1/ai/chat/sessions` | Daftar sesi chat | auth | - | `{ sessions[] }` |
| GET | `/api/v1/ai/chat/:sessionId/messages` | Pesan dalam sesi | auth | - | `{ messages[] }` |
| DELETE | `/api/v1/ai/chat/:sessionId` | Hapus sesi chat | auth | - | `{ message }` |
| POST | `/api/v1/ai/generate-questions` | Generate soal AI (admin/build) | auth | `{ vocabulary_ids, question_types }` | `{ questions[] }` |
| POST | `/api/v1/ai/pronunciation/check` | Cek pengucapan | auth | `{ audio_blob (base64), expected_text }` | `{ recognized, accuracy, feedback }` |

## Gamification Endpoints

| Method | Path | Deskripsi | Middleware | Response |
|--------|------|-----------|------------|----------|
| GET | `/api/v1/gamification/overview` | Overview gamifikasi | auth | `{ level, xp, streak, achievements_unlocked }` |
| GET | `/api/v1/gamification/achievements` | Semua achievement + status unlock | auth | `{ achievements[] }` |
| GET | `/api/v1/gamification/xp-history` | Riwayat XP | auth | `{ transactions[], pagination }` |
| GET | `/api/v1/gamification/heatmap` | Data heatmap aktivitas (1 tahun) | auth | `{ daily_activities[] }` |
| POST | `/api/v1/gamification/daily-check` | Cek & update daily goal + streak | auth | `{ goal_met, streak_updated, xp_bonus }` |

## Progress Endpoints

| Method | Path | Deskripsi | Middleware | Response |
|--------|------|-----------|------------|----------|
| GET | `/api/v1/progress/chapters` | Progres semua bab | auth | `{ chapter_progress[] }` |
| GET | `/api/v1/progress/chapters/:id` | Progres detail satu bab | auth | `{ progress, vocab_breakdown }` |
| GET | `/api/v1/progress/jlpt/:level` | Progres per JLPT level | auth | `{ total, learned, percentage }` |
| GET | `/api/v1/progress/daily` | Aktivitas harian (30 hari) | auth | `{ daily_activities[] }` |

---

# F. UI/UX & DESIGN SYSTEM

## Identitas Visual: Kioku (記憶)

### Logo
- **Tipe**: Wordmark rounded dengan torii gate terintegrasi di huruf "o"
- **Aksen**: Huruf "i" seluruhnya berwarna lime green (#C2E959)
- **Font logo**: Rounded sans-serif (custom dari AI-generated, di-refine di Figma)
- **Variasi**: Full color (teal + lime), monokrom putih (untuk dark bg), monokrom gelap (untuk light bg)
- **Favicon**: Ikon "ki" atau torii gate saja dalam lingkaran

### Arah Estetika
**"Zen-Tech Fusion"** — Menggabungkan ketenangan estetika Jepang (negative space, simplicity, natural colors) dengan modernitas tech startup (gradients, glassmorphism, bold typography, micro-interactions). Hasilnya: platform yang terasa premium tapi approachable, serius tapi menyenangkan.

### Color Palette

```
BRAND COLORS
  Primary (Deep Teal)        #0A3A3A
  Primary Light              #0F4F4F
  Primary Dark               #062828

  Accent (Lime Green)        #C2E959
  Accent Hover               #D4F06B
  Accent Dark                #A8D040

  Secondary (Mint)           #A6E2AC
  Secondary Light            #D0F5D4

  Teal Mid                   #248288
  Teal Light                 #2C989F

NEUTRALS
  Background Light           #F7F8F6
  Background Dark            #0D1117
  Surface Light              #FFFFFF
  Surface Dark               #161B22
  Text Primary Light         #1A1A1A
  Text Primary Dark          #E6EDF3
  Text Secondary Light       #636B74
  Text Secondary Dark        #8B949E
  Border Light               #E2E6EA
  Border Dark                #30363D

SEMANTIC
  Success                    #22C55E
  Error                      #EF4444
  Warning                    #F59E0B
  Info                       #3B82F6

SRS STATUS COLORS
  New (Abu-abu)              #9CA3AF
  Learning (Kuning)          #FBBF24
  Review (Hijau)             #22C55E
  Relearning (Oranye)        #F97316

WORD TYPE BADGE COLORS
  Noun                       #3B82F6
  Verb                       #EF4444
  i-Adjective                #22C55E
  na-Adjective               #8B5CF6
  Adverb                     #F59E0B
  Expression                 #EC4899
```

### CSS Variables (Tailwind Config)

```css
:root {
  /* Brand */
  --color-primary: 10 58 58;           /* #0A3A3A */
  --color-primary-light: 15 79 79;     /* #0F4F4F */
  --color-accent: 194 233 89;          /* #C2E959 */
  --color-secondary: 166 226 172;      /* #A6E2AC */
  --color-teal: 36 130 136;            /* #248288 */
  
  /* Surfaces */
  --color-bg: 247 248 246;             /* #F7F8F6 */
  --color-surface: 255 255 255;        /* #FFFFFF */
  --color-text: 26 26 26;             /* #1A1A1A */
  --color-text-secondary: 99 107 116;  /* #636B74 */
  --color-border: 226 230 234;         /* #E2E6EA */
  
  /* Spacing */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-2xl: 32px;
  --radius-full: 9999px;
}

.dark {
  --color-bg: 13 17 23;               /* #0D1117 */
  --color-surface: 22 27 34;          /* #161B22 */
  --color-text: 230 237 243;          /* #E6EDF3 */
  --color-text-secondary: 139 148 158; /* #8B949E */
  --color-border: 48 54 61;           /* #30363D */
}
```

### Typography

| Penggunaan | Font | Weight | Size | Alasan |
|-----------|------|--------|------|--------|
| **Display / Hero Heading** | **Playfair Display** | 700, 800 | 48-72px | Serif elegan, kontras dengan body sans-serif. Memberikan kesan "premium tapi ramah" |
| **Section Heading** | **Plus Jakarta Sans** | 600, 700 | 24-36px | Geometric sans-serif buatan Indonesia, sangat cocok untuk heading modern |
| **Body Text** | **Plus Jakarta Sans** | 400, 500 | 14-16px | Readability sangat baik, mendukung banyak bahasa |
| **Japanese Text** | **Noto Sans JP** | 400, 500, 700 | 18-48px | Font Jepang paling lengkap, mendukung semua kanji MNN |
| **Monospace** | **JetBrains Mono** | 400 | 13-14px | Untuk tampilan romaji dan technical elements |
| **Furigana / Ruby** | **Noto Sans JP** | 400 | 10-12px | Konsisten dengan teks Jepang utama |

### Komponen yang Perlu Dibuat

**Layout Components:**
- `AppShell` — Layout utama dengan sidebar/bottom nav
- `Navbar` — Top navigation (desktop)
- `BottomNav` — Bottom navigation (mobile, 5 tab)
- `Sidebar` — Sidebar navigasi chapter (desktop)
- `PageHeader` — Header halaman dengan breadcrumb
- `Container` — Max-width container responsif

**Card Components:**
- `FlashCard` — Kartu flashcard dengan animasi flip 3D
- `KanaCard` — Kartu kana individual (untuk grid)
- `ChapterCard` — Kartu bab dengan progress indicator
- `StatCard` — Kartu statistik kecil (XP, streak, level)
- `AchievementCard` — Kartu badge achievement
- `GlassCard` — Kartu glassmorphism untuk section feature

**Quiz Components:**
- `QuizSession` — Container sesi quiz
- `QuestionCard` — Kartu soal (7 variasi tipe)
- `ChoiceButton` — Tombol pilihan jawaban
- `MatchingBoard` — Board drag-and-drop matching
- `TypeInput` — Input field untuk mengetik hiragana
- `QuizProgressBar` — Progress bar animasi
- `QuizResult` — Layar hasil akhir quiz
- `FeedbackOverlay` — Overlay benar/salah dengan animasi

**SRS Components:**
- `ReviewSession` — Container sesi review
- `RatingButtons` — 4 tombol rating (Again/Hard/Good/Easy)
- `IntervalLabel` — Label interval di bawah rating
- `SRSStageIndicator` — Indikator stage (new/learning/review)

**Gamification Components:**
- `XPBar` — Progress bar XP ke level berikutnya
- `StreakFire` — Animasi api streak
- `LevelBadge` — Badge level user
- `AchievementBadge` — Badge achievement (locked/unlocked)
- `ConfettiCelebration` — Animasi confetti saat level up
- `DailyGoalRing` — Ring progress target harian
- `ActivityHeatmap` — Heatmap 365 hari (seperti GitHub)

**Audio Components:**
- `AudioButton` — Tombol play audio
- `PronunciationRecorder` — Komponen rekam + nilai pengucapan
- `WaveformVisualizer` — Visualisasi gelombang audio

**Chat Components:**
- `ChatInterface` — Layout chat lengkap
- `MessageBubble` — Bubble pesan (user/AI)
- `SuggestedPrompts` — Quick prompt buttons
- `StreamingText` — Teks yang muncul kata per kata

**Kana Components:**
- `KanaGrid` — Grid 10x5 karakter kana
- `KanaModal` — Modal detail karakter kana

**Common/Shared Components:**
- `ThemeToggle` — Switch dark/light mode
- `SearchBar` — Search kosakata global
- `LoadingSpinner` — Loading indicator
- `EmptyState` — State kosong (ilustrasi + pesan)
- `Toaster` — Toast notification
- `ProgressRing` — Circular progress indicator
- `FuriganaText` — Render teks dengan furigana (HTML ruby)

### Layout Responsive

```
DESKTOP (>=1024px):
+------------------------------------------------------------+
|  [Kioku Logo]   Home   Belajar   Review   Quiz   Chat [User]|
+----------+-------------------------------------------------+
|          |                                                  |
| SIDEBAR  |              MAIN CONTENT                        |
|          |                                                  |
| - MNN 1  |  (scrollable, max-width: 1200px, centered)      |
|   Bab 1  |                                                  |
|   Bab 2  |                                                  |
|   ...    |                                                  |
| - MNN 2  |                                                  |
|   Bab 26 |                                                  |
|   ...    |                                                  |
|          |                                                  |
+----------+-------------------------------------------------+
  Sidebar collapse ke icon-only saat width < 1280px

TABLET (768px - 1023px):
+----------------------------------------+
|  [Kioku]     [Menu]      [User]        |
+----------------------------------------+
|                                        |
|         MAIN CONTENT                   |
|    (sidebar jadi hamburger menu)       |
|                                        |
|    Cards: 2 kolom grid                 |
|                                        |
+----------------------------------------+
|  Home | Belajar | Review | Quiz | Chat |
+----------------------------------------+

MOBILE (<768px):
+--------------------------+
|  [Kioku]     [User]      |
+--------------------------+
|                          |
|     MAIN CONTENT         |
|   (full-width, padded)   |
|                          |
|   Cards: 1 kolom stack   |
|                          |
|   Flashcard: 85% width   |
|   Quiz buttons: full-w   |
|                          |
+--------------------------+
| Home Blj Rev Quiz Chat   |
+--------------------------+

FLASHCARD/QUIZ SESSION (Full Screen):
+--------------------------+
| [x]  Progress Bar  10/20 |
+--------------------------+
|                          |
|                          |
|      CARD / QUESTION     |  <- 60-70% viewport
|                          |
|                          |
+--------------------------+
|                          |
|   BUTTONS / OPTIONS      |  <- Bottom 30% (thumb zone)
|                          |
+--------------------------+
```

### Spacing System

| Token | Value | Penggunaan |
|-------|-------|-----------|
| `space-1` | 4px | Micro gap (antara ikon dan teks) |
| `space-2` | 8px | Tight gap (padding badge, gap antar tag) |
| `space-3` | 12px | Compact (padding card kecil) |
| `space-4` | 16px | Default (padding card, gap grid) |
| `space-5` | 20px | Comfortable gap |
| `space-6` | 24px | Section padding horizontal |
| `space-8` | 32px | Section gap |
| `space-10` | 40px | Large section gap |
| `space-12` | 48px | Page section gap |
| `space-16` | 64px | Hero section padding |
| `space-20` | 80px | Major section gap |

### Efek Visual Khusus

**Green Gradient Mesh (Background Hero/Section):**
```css
.gradient-mesh {
  background: 
    radial-gradient(ellipse at 20% 50%, rgba(166, 226, 172, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(194, 233, 89, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(36, 130, 136, 0.15) 0%, transparent 50%);
}
```

**Glassmorphism Card:**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
}
```

**Card Flip 3D Animation (Framer Motion):**
```
- perspective: 1000px pada container
- rotateY: 0deg -> 180deg (0.6s ease-in-out)
- backface-visibility: hidden pada kedua sisi
- Box shadow shifts during flip untuk depth effect
```

---

# G. ATURAN CODING

## Prinsip Umum

1. **Bahasa Kode**: Semua nama variabel, fungsi, class, file, folder, comment, commit message dalam **Bahasa Inggris**
2. **Bahasa User-Facing**: Semua string yang ditampilkan ke user dalam **Bahasa Indonesia** (default), dengan dukungan i18n untuk English di masa depan
3. **Comment**: Tambahkan comment secukupnya untuk menjelaskan FUNGSI dari blok kode, bukan menjelaskan CARA kerja per-baris. Comment harus informatif, bukan noise
4. **Tidak ada emoji/emoticon**: Nol emoji di dalam source code (comment, variabel, string)
5. **TypeScript Strict**: `strict: true` di tsconfig.json. Tidak ada `any` tanpa justifikasi eksplisit

## Konvensi Penamaan

| Jenis | Konvensi | Contoh |
|-------|---------|--------|
| File/Folder | kebab-case | `flashcard-session.tsx`, `use-srs-review.ts` |
| React Component | PascalCase | `FlashCard`, `QuizSession`, `RatingButton` |
| Function/Variable | camelCase | `getUserProfile`, `dueCards`, `isCorrect` |
| Constant | UPPER_SNAKE_CASE | `MAX_DAILY_CARDS`, `FSRS_DEFAULT_PARAMS` |
| Type/Interface | PascalCase | `VocabularyItem`, `SRSCardState`, `QuizQuestion` |
| Enum Value | PascalCase | `QuestionType.JpToIdChoice` |
| Database Column | snake_case | `created_at`, `user_id`, `due_date` |
| CSS Variable | kebab-case | `--color-primary`, `--radius-md` |
| API Route | kebab-case | `/api/v1/srs/due-cards` |
| Environment Variable | UPPER_SNAKE_CASE prefixed | `NEXT_PUBLIC_SUPABASE_URL`, `GEMINI_API_KEY` |

## Struktur File & Import

```typescript
// Urutan import (pisahkan dengan baris kosong antar grup):

// 1. External libraries
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Internal libraries/utils
import { cn } from '@/lib/utils';
import { fsrsScheduler } from '@/lib/srs/scheduler';

// 3. Components
import { FlashCard } from '@/components/flashcard/flash-card';
import { Button } from '@/components/ui/button';

// 4. Types
import type { VocabularyItem, SRSCardState } from '@/types';

// 5. Styles (jika ada)
import './styles.css';
```

## Pola React Component

```typescript
// Contoh: components/flashcard/flash-card.tsx

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { VocabularyItem } from '@/types';

interface FlashCardProps {
  vocabulary: VocabularyItem;
  isFlipped: boolean;
  onFlip: () => void;
  className?: string;
}

// Component menggunakan function declaration, bukan arrow function untuk export
export function FlashCard({ vocabulary, isFlipped, onFlip, className }: FlashCardProps) {
  // Hooks di atas
  // Logic di tengah
  // Return JSX di bawah
  
  return (
    <motion.div
      className={cn('relative cursor-pointer', className)}
      onClick={onFlip}
    >
      {/* Card content */}
    </motion.div>
  );
}
```

## Pola Server Action

```typescript
// app/actions/srs.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { reviewSchema } from '@/lib/validations/srs';

// Server action untuk submit review SRS
export async function submitReview(formData: FormData) {
  const supabase = createServerClient();
  
  // Validasi input dengan Zod
  const parsed = reviewSchema.safeParse({
    cardId: formData.get('cardId'),
    rating: formData.get('rating'),
  });
  
  if (!parsed.success) {
    return { error: 'Data tidak valid' };
  }
  
  // ... business logic
  
  revalidatePath('/review');
  return { success: true, data: updatedCard };
}
```

## Aturan Commit Message

Format: `<type>(<scope>): <description>`

| Type | Deskripsi |
|------|-----------|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `refactor` | Refactor tanpa perubahan behavior |
| `style` | Perubahan formatting/styling |
| `docs` | Dokumentasi |
| `test` | Penambahan/perubahan test |
| `chore` | Maintenance (dependency, config) |
| `perf` | Optimisasi performa |

Contoh:
```
feat(flashcard): implement 3d flip animation with framer motion
fix(srs): correct due date calculation for timezone offset
refactor(quiz): extract question generator into separate service
style(dashboard): adjust stat card spacing on mobile
```

## Environment Variables

```bash
# .env.local (JANGAN commit ke git)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Providers
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Kioku
```

## Error Handling

```typescript
// Semua API route harus menggunakan try-catch dengan format konsisten
export async function GET(request: Request) {
  try {
    // ... logic
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('[API] /api/v1/srs/due:', error);
    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan server' } },
      { status: 500 }
    );
  }
}
```

## Testing (Post-MVP)

- Unit test: Vitest untuk utility functions dan SRS engine
- Component test: React Testing Library untuk komponen kritis
- E2E test: Playwright untuk critical flows (login, flashcard, quiz)
- Coverage target: 80% untuk `lib/srs/` (bagian paling kritis)

---

# RINGKASAN KEPUTUSAN KUNCI

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| Nama project | **Kioku** (記憶 = Memori) | Unik, bermakna, mudah dieja, belum ada app besar yang pakai |
| Logo | Wordmark rounded + torii gate di "o" + lime "i" | Memorable, readable, scalable, on-brand |
| Framework | Next.js 15 App Router | Ekosistem terbesar, fitur terlengkap, portfolio signal terkuat |
| Database | Supabase (PostgreSQL) | All-in-one free tier (DB + Auth + Storage) |
| SRS Algorithm | FSRS via ts-fsrs | State-of-the-art, sama dengan Anki, 20-30% lebih efisien |
| AI Primary | Gemini 2.5 Flash-Lite | 1000 RPD gratis, context window terbesar |
| Audio | Edge TTS pre-generated | Kualitas Neural TTS, zero runtime cost |
| Styling | Tailwind + shadcn/ui | Rapid development, customizable, accessible |
| Display Font | Playfair Display | Elegan, kontras serif/sans, premium feel |
| Body Font | Plus Jakarta Sans | Clean, modern, buatan Indonesia |
| JP Font | Noto Sans JP | Terlengkap, rendering sempurna |
| Color Primary | #0A3A3A (Deep Teal) | Sesuai referensi, premium, unik |
| Color Accent | #C2E959 (Lime Green) | Energetik, CTA yang jelas, kontras tinggi |
| Deployment | Vercel Hobby | Gratis, native Next.js, preview deploys |
| Total Biaya | Rp0/bulan | Semua layanan pada free tier |

---

> **Dokumen ini adalah fondasi project Kioku. Setiap keputusan di sini menjadi acuan saat coding dimulai. Versi: 1.1 — Updated dengan nama project Kioku dan logo final.**
