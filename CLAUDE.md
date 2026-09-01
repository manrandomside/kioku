# CLAUDE.md — Kioku (記憶)

> Platform belajar bahasa Jepang untuk pelajar Indonesia. Next.js 16 + Supabase + FSRS + AI.
> Live: https://kioku-learn.vercel.app
> Spec lengkap: `designs/kioku-project-spec.md` | Logo: `designs/logo/` | Referensi visual: `designs/references/`

Dokumen ini adalah sumber kebenaran tunggal untuk konteks project Kioku. Baca dari atas sebelum mulai bekerja di sesi baru.

---

## 1. Konteks Produk

**Masalah yang dipecahkan.** Pelajar Indonesia yang belajar bahasa Jepang lewat buku _Minna no Nihongo_ punya materi yang bagus tapi tidak punya alat untuk menghafalnya. Mereka jatuh ke salah satu dari dua ekstrem: menulis ulang kosakata di buku tulis (tidak ada pengulangan terjadwal, cepat lupa), atau memakai Anki (kuat, tapi setup-nya rumit, tampilannya menakutkan untuk pemula, dan deck-nya hampir selalu berbahasa Inggris). Kioku mengisi celah itu — SRS serius dengan pengalaman yang ramah pemula, dalam Bahasa Indonesia, dan sudah terisi materi MNN Bab 1-50.

**Target pengguna.** Pemula murni sampai level N5-N4, berbahasa Indonesia, mayoritas belajar dari HP di sela waktu luang. Asumsikan pengguna **tidak tahu apa itu SRS, FSRS, atau leech** — semua istilah teknis harus disembunyikan di balik bahasa sehari-hari di antarmuka.

**Kenapa MNN Bab 1-50.** Minna no Nihongo adalah buku standar yang dipakai hampir semua kursus bahasa Jepang di Indonesia. Bab 1-50 mencakup Shokyuu I dan II, yang setara dengan cakupan N5-N4. Dengan mengikuti urutan bab buku, Kioku bisa dipakai berdampingan dengan kelas yang sedang diikuti pengguna, bukan menggantikannya.

**Kenapa FSRS, bukan SM-2.** SM-2 (algoritma klasik Anki) menjadwalkan berdasarkan aturan tetap. FSRS memodelkan _stability_ dan _difficulty_ per kartu dan memprediksi kapan sebuah kata hampir terlupakan, sehingga menghasilkan jumlah review yang lebih sedikit untuk tingkat retensi yang sama. Untuk pengguna yang cuma punya 10-15 menit sehari, selisih itu menentukan apakah mereka bertahan atau menyerah.

**Prinsip produk.**

- **Gratis penuh, tanpa iklan.** Semua biaya ditekan agar muat di free tier. Ini bukan produk komersial.
- **Bahasa Indonesia sebagai bahasa antarmuka.** Bukan terjemahan dari Inggris — arti kata pun diterjemahkan ulang dari PDF kosakata MNN berbahasa Indonesia.
- **Sesi pendek.** Setiap alur belajar dirancang selesai dalam 5-15 menit. Tidak ada sesi yang menuntut duduk lama.
- **Mobile-first.** Desktop penting, tapi HP adalah perangkat utama.
- **Satu tombol untuk memulai.** Pengguna tidak perlu memutuskan "hari ini belajar apa" — tombol "Belajar Sekarang" (Smart Study) yang menentukan.

**Status project.** Aktif dikembangkan, sudah live di production, dan berfungsi ganda sebagai portofolio. Repo publik di GitHub.

---

## 2. Glosarium

Istilah berikut dipakai di seluruh dokumen ini, di kode, dan di antarmuka.

| Istilah                | Arti                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **MNN**                | Minna no Nihongo — buku ajar yang jadi sumber materi kosakata (Bab 1-50)                                            |
| **HIRAKATA**           | Modul belajar huruf dasar: Hiragana + Katakana (214 karakter)                                                       |
| **SRS**                | Spaced Repetition System — sistem pengulangan berjarak                                                              |
| **FSRS**               | Free Spaced Repetition Scheduler — algoritma penjadwalan yang dipakai, via library `ts-fsrs`                         |
| **Due card**           | Kartu yang sudah waktunya direview hari ini menurut FSRS                                                            |
| **Smart Study**        | Sesi belajar otomatis 3 fase (review due → kata baru → quiz). Di antarmuka disebut **"Belajar Sekarang"**            |
| **Leech**              | Kata yang berkali-kali gagal diingat (`lapses >= 4`). Di antarmuka disebut **"Kata Sulit"**                          |
| **Confused pairs**     | Dua kata yang sering tertukar, dideteksi dari riwayat `quiz_answer` (`confusion_count >= 2`)                         |
| **Kanji/Kana toggle**  | Saklar tampilan: kata ditampilkan dalam kanji atau hiragana saja. Global di DB, bisa di-override per halaman         |
| **JLPT auto-upgrade**  | Kenaikan target JLPT otomatis (N5 → N4) saat semua bab Buku 1 dikuasai lewat quiz                                    |
| **Tour**               | Onboarding tour interaktif 8 langkah untuk pengguna baru                                                            |
| **WIB**                | Asia/Jakarta (UTC+7) — satu-satunya zona waktu untuk semua perhitungan tanggal                                      |

---

## 3. Workflow & Cara Kerja

Bagian ini menjelaskan cara pemilik project ingin bekerja. **Hormati ini di setiap sesi.**

### Rencana dulu, kode belakangan

Pemilik project **bukan programmer**. Konsekuensinya:

- **Selalu buat rencana dan minta persetujuan sebelum menulis atau mengubah kode.** Jangan langsung generate.
- Rencana ditulis dalam **Bahasa Indonesia**, bahasa non-teknis, dan menyebut file mana saja yang akan disentuh serta apa dampaknya.
- Pemilik project lebih memilih **merevisi teks rencana daripada merevisi kode**. Waktu untuk memperjelas rencana selalu lebih murah daripada memperbaiki implementasi yang salah arah.
- Kalau ada dua cara yang sama-sama masuk akal, **tawarkan pilihan beserta rekomendasi**, jangan diam-diam pilih sendiri.
- Untuk perbaikan sepele (typo, salah warna, ganti teks), tidak perlu rencana formal — langsung kerjakan.

### Alur desain UI

Prototype di **Claude Design** (claude.ai/design) → ditinjau dan disetujui → di-handoff ke Claude Code untuk implementasi. Jangan mulai membangun halaman baru dari nol tanpa referensi visual.

### Aturan database

- Setiap perubahan schema **wajib** punya file migration bernomor di `src/db/migrations/` (`NNNN_deskripsi_singkat.sql`).
- **Jangan pernah** menjalankan `db:push` ke database production — hanya `db:generate` lalu `db:migrate`.
- Migration yang sudah diterapkan tidak boleh diedit. Kalau salah, buat migration baru yang memperbaikinya.
- Ubah `src/db/schema/*.ts` dan file migration bersamaan — keduanya harus sinkron.

### Kapan CLAUDE.md diperbarui

Perbarui file ini setiap kali:

- sebuah fitur selesai dikerjakan (tambahkan ke Status Progress),
- ada migration baru (tambahkan ke Catatan Teknis),
- ada keputusan teknis yang **tidak bisa dibaca dari kode** — misalnya alasan sebuah pendekatan ditolak.

### Verifikasi perubahan

Urutan standar setelah mengubah kode:

1. `npm run lint`
2. `npm run build`
3. `npm run dev` lalu cek manual di browser

Untuk perubahan yang menyentuh data, jalankan script dalam mode dry-run dulu sebelum `--apply`.

### Batasan yang harus dihormati

- **Vercel Hobby** — tanpa cron berbayar, tanpa fungsi berdurasi panjang.
- **Supabase free tier** — Storage 1GB, database bisa di-pause kalau idle (dijaga oleh cron keep-alive di GitHub Actions).
- **Tanpa layanan berbayar.** Jangan usulkan solusi yang butuh langganan (Redis terkelola, Upstash berbayar, dll.) tanpa menyebut biayanya lebih dulu.
- Semua provider AI memakai tier gratis, disusun berlapis (waterfall) supaya kalau satu kehabisan kuota, yang berikutnya mengambil alih.

### Yang tidak boleh disentuh tanpa diminta

- `.env.local` dan segala isinya
- Data seed yang sudah berjalan di production
- Migration yang sudah diterapkan
- `SECURITY-AUDIT.md` — file ini sengaja **tidak dilacak git** (lihat Catatan Teknis)

---

## 4. Aturan Penting

- **SELALU** lihat referensi visual di `designs/references/` **SEBELUM** membangun halaman frontend.
- Ikuti design system di bagian 9. **Jangan berimprovisasi warna atau font sendiri.**
- Spec lengkap ada di `designs/kioku-project-spec.md` kalau butuh detail yang tidak tercakup di sini.
- Semua teks yang dilihat pengguna berbahasa **Indonesia**, termasuk pesan error.
- Semua perhitungan tanggal lewat `src/lib/utils/timezone.ts` (WIB). **Jangan** pakai `new Date()` mentah untuk logika harian.

---

## 5. Tech Stack

- **Framework**: Next.js 16.2 (App Router), React 19.2, TypeScript 5 (strict)
- **DB / Auth / Storage**: Supabase (PostgreSQL + Auth + Storage 1GB)
- **ORM**: Drizzle ORM 0.45 + driver `postgres` | **Migrasi**: drizzle-kit
- **Validasi**: Zod v4
- **Styling**: Tailwind CSS 4 + shadcn/ui + `@base-ui/react` + Framer Motion 12
- **State**: Zustand 5 (client). Data server diambil lewat Server Components — **tidak memakai TanStack Query**
- **SRS**: `ts-fsrs` v5
- **AI**: Vercel AI SDK v6 (`ai@6`) + `@ai-sdk/{google,groq,openai,react}`
- **AI Providers** (waterfall): Gemini 2.5 Flash-Lite → Groq → OpenRouter → WebLLM
- **Audio**: pre-generate via Edge TTS (`ja-JP-NanamiNeural`), disimpan di Supabase Storage
- **Utilitas**: `wanakana` (konversi romaji ↔ kana), `sonner` (toast), `canvas-confetti`, `next-themes`, `lucide-react`
- **Deploy**: Vercel Hobby (gratis) | **CI**: GitHub Actions (cron keep-alive Supabase)

Catatan versi: Next.js 16 punya perubahan API dibanding versi sebelumnya. Baca panduan di `node_modules/next/dist/docs/` sebelum menulis kode Next.js (lihat juga `AGENTS.md`).

---

## 6. Arsitektur Aplikasi

Kioku **bukan** aplikasi REST API. Pola sebenarnya:

- **Baca data** — dilakukan di Server Components lewat helper di `src/lib/queries/`. Halaman mengambil datanya sendiri di server; tidak ada fetch dari klien untuk render awal.
- **Tulis data** — lewat **Server Actions** (`'use server'`), divalidasi dengan Zod, lalu `revalidatePath`. Ini jalur utama untuk submit review, jawab quiz, ubah setting, dan sejenisnya.
- **REST routes** (`src/app/api/`) — hanya dipakai untuk hal yang benar-benar harus dipanggil dari klien: streaming AI, polling status, pencarian saat mengetik, dan data yang di-_fetch_ ulang tanpa reload halaman.

Itu sebabnya `src/app/api/` isinya sedikit (18 route) sementara logika aplikasinya banyak — sebagian besar hidup di Server Actions dan `lib/`.

---

## 7. Database Schema

**22 tabel.** Field yang ditulis di bawah adalah field kunci, bukan daftar lengkap — schema otoritatif ada di `src/db/schema/`.

```
book: id, title, slug, jlpt_level(enum N5-N1), chapter_start, chapter_end
chapter: id, book_id(FK), chapter_number, slug, vocab_count
vocabulary: id, chapter_id(FK), kanji?, hiragana, romaji, meaning_id, meaning_en, word_type(enum),
            jlpt_level, audio_url, example_jp?, example_id?, sort_order, is_published
kana: id, character, romaji, category(enum 6 tipe), row_group, column_position, audio_url
user: id, supabase_auth_id, email, display_name, preferred_name, avatar_url, jlpt_target,
      daily_goal_xp(enum 100/300/500/750/1000), auto_play_audio, show_romaji, display_mode(kanji|kana),
      theme(light/dark/system), onboarding_done, hirakata_known, tour_completed, created_at, updated_at
srs_card: id, user_id(FK), vocabulary_id?(FK), kana_id?(FK), status(new/learning/review/relearning),
          stability, difficulty, due_date, scheduled_days, reps, lapses — CHECK(vocab XOR kana)
review_log: id, user_id(FK), card_id(FK), rating(again/hard/good/easy), prev_*/new_* states, review_duration_ms
quiz_session: id, user_id(FK), chapter_id?(FK), kana_category?, total_questions, correct_count,
              score_percent, xp_earned, time_spent_ms, is_completed, is_perfect
quiz_answer: id, session_id(FK), question_number, question_type(enum 7 tipe), vocabulary_id/kana_id,
             question_text, correct_answer, options(JSONB), user_answer, is_correct
user_gamification: id, user_id(FK), total_xp, current_level, current_streak, longest_streak, streak_freezes,
                   last_activity_date, total_reviews, total_words_learned, daily_xp_earned, daily_goal_met
xp_transaction: id, user_id(FK), source(enum), amount, description, reference_id
achievement: id, name, description, icon, type(enum), condition(JSONB), xp_reward
achievement_unlock: id, user_id(FK), achievement_id(FK), unlocked_at
user_chapter_progress: id, user_id(FK), chapter_id(FK), vocab_seen/learning/review, completion_percent, best_quiz_score
daily_activity: id, user_id(FK), activity_date, reviews_count, quiz_count, xp_earned, goal_met
ai_chat_session: id, user_id(FK), title, message_count
ai_chat_message: id, session_id(FK), role(user/assistant/system), content, provider_used
ai_response_cache: id, prompt_hash(SHA256), response_text, provider, hit_count, expires_at
pronunciation_attempt: id, user_id(FK), vocab/kana_id, expected_text, recognized_text, accuracy_score
ai_question_template: id, vocabulary_id(FK), question_type, question_text, correct_answer, wrong_answers(JSONB)
feedback: id, user_id?(FK nullable), type(enum bug/feature/general/rating), title?, content, rating?(1-5),
          page_url?, screenshot_url?, show_publicly(default false), public_approved(default false),
          status(enum new/reviewing/in_progress/resolved/wontfix), admin_notes?, created_at, updated_at
public_stats_cache: id(serial), key(unique), value(jsonb), updated_at — cache denormalisasi untuk halaman stats publik
```

**Enum** (definisi lengkap di `src/db/schema/enums.ts`):

`jlpt_level`(5) · `word_type`(13) · `kana_category`(6) · `srs_status`(4) · `srs_rating`(4) · `question_type`(7) · `theme`(3) · `daily_goal_xp`(5) · `xp_source`(6) · `achievement_type`(8) · `chat_role`(3) · `feedback_type`(4) · `feedback_status`(5)

**RLS.** Tabel data pengguna → `user_id = auth.uid()` (dijembatani helper `public.get_user_id()`). Tabel konten (`vocabulary`, `kana`, `book`, `chapter`, `achievement`) → boleh dibaca publik. Semua tabel sudah diverifikasi punya RLS aktif dengan policy yang benar.

---

## 8. API Routes & Server Actions

### REST Routes — 18 route yang benar-benar ada

Semua di bawah prefix `/api/v1/`.

```
AI (6)
  POST   /ai/chat                          Chat tutor, respons streaming
  GET    /ai/chat/sessions                 Daftar sesi chat milik user
  DELETE /ai/chat/[sessionId]              Hapus satu sesi chat
  GET    /ai/chat/[sessionId]/messages     Riwayat pesan dalam satu sesi
  POST   /ai/pronunciation/check           Skoring pengucapan
  GET    /ai/test                          Health check provider AI

GAMIFICATION (4)
  GET    /gamification/overview            Ringkasan XP, level, streak
  GET    /gamification/achievements        Daftar achievement + status unlock
  GET    /gamification/heatmap             Data heatmap aktivitas 365 hari
  POST   /gamification/daily-check         Check-in harian (streak + daily goal)

LEECH (4)
  GET    /leech/cards                      Kartu yang sering dilupakan
  GET    /leech/confused-pairs             Pasangan kata yang sering tertukar
  GET    /leech/summary                    Ringkasan untuk badge sidebar & dashboard
  GET    /leech/training                   Materi sesi latihan Kata Sulit

STUDY (2)
  GET    /study/session                    Bangun sesi Smart Study (3 fase)
  GET    /study/status                     Status ketersediaan sesi

PROGRESS (1)
  GET    /progress/chapters                Progres per bab

CONTENT (1)
  GET    /vocabulary/search                Pencarian kosakata global
```

Rate limit (in-memory sliding window, `src/lib/rate-limit.ts`): AI chat 20/menit · pronunciation 30/menit · search 30/menit · daily-check 10/menit.

`src/app/api/auth/` sengaja kosong (`.gitkeep`) — autentikasi ditangani Server Actions dan Supabase Auth, bukan route handler.

### Server Actions — 12 file

```
src/app/actions/account.ts                             Ubah password, hapus akun (cascade)
src/app/actions/tour.ts                                markTourCompleted, getTourCompletedStatus
src/app/actions/user-settings.ts                       Profil, preferensi, display mode
src/app/(auth)/actions.ts                              Login, register, magic link, OAuth, logout
src/app/(onboarding)/onboarding/actions.ts             Simpan jawaban onboarding
src/app/(dashboard)/review/actions.ts                  Submit rating FSRS sesi review
src/app/(dashboard)/study/session/actions.ts           Submit hasil per fase Smart Study
src/app/(dashboard)/kata-sulit/latihan/actions.ts      Submit hasil latihan leech
src/app/(dashboard)/learn/hirakata/flashcard/actions.ts
src/app/(dashboard)/learn/hirakata/quiz/actions.ts
src/app/(dashboard)/learn/mnn/[chapter]/flashcard/actions.ts
src/app/(dashboard)/learn/mnn/[chapter]/quiz/actions.ts
```

### Query helper (baca data di Server Components)

`src/lib/queries/` — `chapters.ts`, `chat.ts`, `dashboard.ts`, `kana.ts`, `quiz-templates.ts`, `review.ts`, `safe-query.ts`

---

## 9. Design System

**Warna utama**: Primary `#0A3A3A` (deep teal) | Accent `#C2E959` (lime) | Secondary `#A6E2AC` (mint) | Teal `#248288`
**Dark mode**: BG `#0D1117` | Surface `#161B22` | Text `#E6EDF3` | Border `#30363D`
**Semantik**: Success `#22C55E` | Error `#EF4444` | Warning `#F59E0B` | Info `#3B82F6`
**Status SRS**: New `#9CA3AF` | Learning `#FBBF24` | Review `#22C55E` | Relearning `#F97316`
**Jenis kata**: Noun `#3B82F6` | Verb `#EF4444` | i-Adj `#22C55E` | na-Adj `#8B5CF6` | Adverb `#F59E0B`

**Font**: Display = Playfair Display (700, 800) | Heading + Body = Plus Jakarta Sans (400-700) | Jepang = Noto Sans JP | Mono = JetBrains Mono
**Radius**: sm 8 · md 12 · lg 16 · xl 24
**Spacing**: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 px

**Logo**: wordmark membulat "kioku", gerbang torii di huruf "o", huruf "i" berwarna lime. Aset di `designs/logo/`.
**Efek khas**: latar gradient mesh hijau, kartu glassmorphism, animasi flip 3D (Framer Motion, perspective 1000px).
**Responsif**: Desktop = sidebar + konten · Tablet = bottom-nav + hamburger · Mobile = bottom-nav + stacked · Quiz/Flashcard = fullscreen immersive.

---

## 10. Coding Rules

- **Variabel, fungsi, komentar, dan pesan commit**: English. **Teks untuk pengguna**: Indonesian.
- **Tanpa emoji** di source code. Komentar menjelaskan **apa**, bukan **bagaimana**.
- **Penamaan**: file = kebab-case | komponen = PascalCase | fungsi = camelCase | konstanta = UPPER_SNAKE | kolom DB = snake_case
- **Urutan import**: library eksternal → library internal → komponen → tipe → styles (dipisah baris kosong antar grup)
- **Komponen**: pakai function declaration (bukan arrow), interface props ditulis di atas komponen, urutan isi hooks → logic → JSX
- **Server Actions**: `'use server'`, validasi Zod, lalu `revalidatePath`
- **Bentuk respons API**: `{ success: boolean, data?: T, error?: { code, message } }`
- **Error handling**: semua route pakai try-catch, `console.error` diawali prefix path route
- **Commit**: `<type>(<scope>): <description>` — feat / fix / refactor / style / docs / test / chore / perf
- **TypeScript**: strict mode, tidak boleh `any` tanpa alasan tertulis
- **Env var**: prefix `NEXT_PUBLIC_` untuk yang dipakai di klien, divalidasi dengan Zod

---

## 11. Folder Structure

```
src/
├── app/(auth)/{login,register,magic-link}/     Halaman autentikasi + actions.ts
├── app/(onboarding)/onboarding/                Alur onboarding (wajib) + actions.ts
├── app/(dashboard)/home/                       Dashboard utama
├── app/(dashboard)/learn/                      Learn hub
├── app/(dashboard)/learn/hirakata/             Modul HIRAKATA (+ flashcard/, quiz/)
├── app/(dashboard)/learn/mnn/[chapter]/        Modul MNN per bab (+ flashcard/, quiz/)
├── app/(dashboard)/study/session/              Sesi Smart Study (3 fase)
├── app/(dashboard)/review/                     Sesi review SRS
├── app/(dashboard)/kata-sulit/                 Halaman leech (+ latihan/)
├── app/(dashboard)/quiz/[chapter]/             Sesi quiz per bab
├── app/(dashboard)/chat/                       AI Tutor
├── app/(dashboard)/profile/                    Profil, statistik (+ achievements/)
├── app/(dashboard)/search/                     Hasil pencarian kosakata
├── app/actions/                                Server Actions global (account, tour, user-settings)
├── app/api/v1/                                 18 REST route (lihat bagian 8)
├── app/auth/callback/                          Callback OAuth Supabase
├── app/offline/                                Halaman fallback PWA
│
├── components/audio/          components/auth/         components/chat/
├── components/common/         components/dashboard/    components/flashcard/
├── components/gamification/   components/kana/         components/layout/
├── components/mnn/            components/profile/      components/providers/
├── components/pwa/            components/quiz/         components/review/
├── components/search/         components/ui/           (17 folder)
│
├── lib/ai/                    Waterfall provider, system prompt, cache
├── lib/audio/                 Playback + kanji-hiragana-dict + pronunciation scoring
├── lib/gamification/          XP, level, streak, achievement
├── lib/progress/              Progres bab & JLPT
├── lib/queries/               Helper baca data untuk Server Components
├── lib/quiz/                  Generator soal & scoring
├── lib/services/              smart-study-service.ts, leech-service.ts
├── lib/srs/                   Integrasi ts-fsrs
├── lib/supabase/              Client server/browser/middleware
├── lib/utils/timezone.ts      Sumber kebenaran tunggal untuk tanggal (WIB)
├── lib/rate-limit.ts          Rate limiter in-memory
├── lib/utils.ts               Helper umum (cn, dll.)
│
├── stores/                    auto-play-store, display-mode-store, smart-study-store, tour-store
├── db/schema/                 ai, content, enums, feedback, gamification, quiz, srs, user, index
├── db/migrations/             0000-0014 (lihat Catatan Teknis)
├── db/seed/                   Seed kana, MNN, achievement
└── types/                     Tipe TypeScript bersama
```

Di luar `src/`: `scripts/` (tooling data & audio), `designs/` (spec, logo, referensi, screenshot), `public/` (aset statis + guidebook PDF).

---

## 12. Roadmap Fase

- **[P0] Setup** — Next.js + Supabase + Auth (Google OAuth + email/password + magic link) + migrasi Drizzle + seed kana + seed kosakata MNN
- **[P1] Core** — Grid kana + flashcard (flip 3D + rating FSRS) + quiz (7 tipe soal + audio) + navigasi bab + pelacakan progres
- **[P2] Gamification** — Sistem XP + streak + achievement + statistik dashboard + heatmap + PWA
- **[P3] AI** — Chatbot (waterfall Gemini + streaming) + pengucapan (Web Speech API) + pre-generate bank soal
- **[P4] Polish & UX** — Landing page, redesain auth, perbaikan review, audit keamanan, SEO, JLPT auto-upgrade
- **[P5] Smart Study & Leech** — Sesi Smart Study (3 fase), deteksi leech, redesain dashboard, perbaikan bug
- **[P6] Documentation & Polish** — Penulisan ulang README, guidebook PDF, onboarding tour interaktif
- **[P7] Community & Feedback** — Halaman stats publik + sistem feedback _(konsep, belum diimplementasi)_

---

## 13. Status Progress

### [P0] Setup & Foundation

- [x] Init Next.js + TypeScript + Tailwind + shadcn/ui
- [x] Setup project Supabase + env vars
- [x] Konfigurasi Drizzle ORM + definisi schema
- [x] Migrasi DB (semua tabel + enum + RLS)
- [x] Supabase Auth (Google OAuth + magic link — GitHub OAuth dihapus)
- [x] Middleware auth + protected routes
- [x] Seed data: kana (214 karakter)
- [x] Seed data: kosakata MNN Bab 1-50 (dari PDF + MinnaNoDS)
- [x] Layout dasar: AppShell + Navbar + BottomNav + ThemeToggle
- [x] Deployment Vercel + cron keep-alive GitHub Actions
- [x] Pre-generate file audio (Edge TTS) + upload ke Supabase Storage
- [x] Auto-play audio di semua halaman (flashcard, quiz, review, grid kana) + toggle setting

### [P1] Core Features

- [x] Halaman grid kana (diberi warna sesuai status SRS)
- [x] Sesi flashcard kana (flip + audio + rating FSRS)
- [x] Sesi quiz kana (romaji <-> kana)
- [x] Halaman pemilihan bab (indikator progres)
- [x] Halaman detail bab (daftar kosakata + tab)
- [x] Sesi flashcard kosakata (furigana + flip + audio + FSRS) — 2 tombol: Belum Paham / Sudah Paham
- [x] Integrasi engine FSRS (penjadwalan ts-fsrs + submit review)
- [x] Sesi quiz (7 tipe soal + audio + scoring) + penjelasan jawaban
- [x] Sesi review (antrean due card + 4 tombol rating FSRS + re-queue Again maks 3x)
- [x] Alur onboarding user (wajib — dashboard diblokir sampai selesai)
- [x] Pelacakan progres per bab (mastery berbasis quiz)
- [x] Pencarian kosakata (search bar global)

### [P2] Gamification & Polish

- [x] Sistem XP (perolehan + transaksi + kalkulasi level)
- [x] Sistem streak (check harian + freeze + notifikasi)
- [x] Definisi achievement (seed ~50 badge)
- [x] Logika unlock achievement + UI
- [x] Dashboard: ringkasan statistik + streak + XP bar + breakdown due card (learning/review/overdue)
- [x] Dashboard: heatmap aktivitas (365 hari)
- [x] Dashboard: grafik distribusi SRS
- [x] Dashboard: countdown timer review (real-time)
- [x] Animasi: card flip, XP increment, confetti level-up, streak fire
- [x] Sound effect: ding benar/salah
- [x] PWA: service worker + manifest + offline cache + install banner (floating)
- [x] Polish responsif (mobile + tablet)
- [x] Dark mode complete pass

### [P3] AI Features

- [x] Waterfall provider AI (Gemini -> Groq -> OpenRouter -> WebLLM)
- [x] UI chatbot AI (streaming + riwayat pesan) + konfirmasi hapus
- [x] System prompt chatbot (MNN-aware, adaptif level, gaya Sensei yang natural)
- [x] Suggested prompt AI (4 kategori: Kosakata, Grammar, Percakapan, Budaya)
- [x] Pengucapan: integrasi Web Speech API
- [x] Pengucapan: scoring (Levenshtein distance)
- [x] Pengucapan: fallback Whisper.cpp WASM — **DILEWATI**. Web Speech API sudah mencakup ~85% browser; model Whisper WASM ~75MB terlalu berat untuk sekadar fallback. Diganti dengan pesan deteksi browser. Bisa ditambahkan pasca-launch kalau ada permintaan.
- [x] Generasi soal AI: script pre-generation saat build (`scripts/generate-quiz-questions.ts`) — script selesai, tapi **belum pernah dijalankan**: tabel `ai_question_template` masih kosong
- [x] Caching respons AI (hash prompt -> Supabase)

### [P4] Polish & UX Improvements

- [x] Redesain landing page (10 section: navbar, hero, stats, features, how-it-works, metode FSRS, app preview, tech stack, CTA, footer)
- [x] Redesain Login & Register (split layout, panel branding, kanji melayang, ikon mata untuk password)
- [x] OAuth: GitHub dihapus, hanya Google + email/password
- [x] Alur register: diarahkan ke /login dulu, bukan langsung ke onboarding
- [x] Onboarding dipaksakan: layout dashboard memblokir akses kalau `onboarding_done = false`
- [x] Polish onboarding (glassmorphism, gradient, label per langkah, ikon per langkah)
- [x] Penyederhanaan profil (tanpa label "Pengaturan", edit display name inline, JLPT read-only)
- [x] JLPT auto-upgrade (N5 -> N4 saat semua bab Buku 1 dikuasai lewat quiz, modal perayaan)
- [x] Navigasi sadar target JLPT (tab MNN sebagai default, dialog pengingat, banner penyelesaian)
- [x] Halaman /learn hub (2 kartu premium: HIRAKATA + MNN)
- [x] Sidebar sticky (perbaikan overflow-x-clip)
- [x] Pembersihan nav: Quiz dihapus dari nav, penamaan konsisten (AI Tutor, BELAJAR)
- [x] Halaman 404 (bertema Jepang, kanji melayang, latar gradient)
- [x] SEO: meta tag, OG image (ImageResponse dinamis), judul per halaman (%s | Kioku)
- [x] Skeleton loading (8 halaman)
- [x] Quiz: penjelasan jawaban, format kanji di atas hiragana, "Kata yang Perlu Diulang" di ringkasan
- [x] Review: re-queue kartu Again (maks 3x), label "Ulang", statistik ringkasan dideduplikasi
- [x] Ringkasan review: akurasi %, tips, section "Perlu Diulang"
- [x] Dashboard: breakdown review + banner peringatan + countdown timer
- [x] Redesain toast daily goal
- [x] Chatbot AI: system prompt diperbaiki, 4 kategori suggested prompt, perbaikan input chat di mobile
- [x] Audit keamanan Level 1+2+3 (SECURITY-AUDIT.md, kini file lokal)
- [x] Rate limiting: sliding window in-memory (AI chat, pengucapan, search, daily-check)
- [x] Validasi Zod ditambahkan ke review actions, AI chat, auth, user settings
- [x] Security header: HSTS, X-Frame-Options, CSP, dll.
- [x] PWA install banner (floating kanan bawah) + pemicu berupa teks
- [x] Overlay animasi logout (gradient, dekorasi kanji, loading bar)
- [x] README.md profesional (screenshot, tech stack, arsitektur, keamanan, biaya)
- [x] Perbaikan bug review: review ganda, timestamp `reviewed_at`
- [x] Pesan error diterjemahkan ke Bahasa Indonesia

### [P5] Smart Study & Leech Detection

- [x] Sesi Smart Study ("Belajar Sekarang") — 3 fase: review due card + belajar kata baru + quiz
- [x] Backend Smart Study: `smart-study-service.ts` (generateSmartSession, getSmartSessionStatus)
- [x] API Smart Study: GET /api/v1/study/session, GET /api/v1/study/status
- [x] UI Smart Study: halaman sesi lengkap dengan indikator fase, transisi Framer Motion
- [x] Kata baru Smart Study: dipilih berdasarkan progres user + target JLPT
- [x] Quiz Smart Study: 8 soal dari campuran kata review + kata baru (tanpa tipe matching/speaking)
- [x] Ringkasan Smart Study: breakdown per fase, breakdown XP, animasi count-up
- [x] Bonus Smart Study: +15 XP saat sesi selesai (idempoten)
- [x] Smart Study: toggle Kanji/Kana di ketiga fase + feedback
- [x] Redesain dashboard: kartu CTA besar "Belajar Sekarang" (warna surface, tombol lime)
- [x] Dashboard: 3 kartu lama dihapus (Review / Belajar MNN / Hirakata)
- [x] Dashboard: 3 kartu kecil (Streak, Review Breakdown dengan countdown, Kata Sulit)
- [x] Countdown dashboard: "X kartu siap direview sekarang" atau "X kartu akan siap direview dalam..."
- [x] Backend deteksi leech: `leech-service.ts` (getLeechCards, getConfusedPairs, getLeechSummary)
- [x] API leech: GET /api/v1/leech/cards, confused-pairs, summary, training
- [x] Halaman Kata Sulit (/kata-sulit): 2 tab (Sering Lupa + Sering Tertukar) + toggle Kanji/Kana
- [x] Latihan leech (/kata-sulit/latihan): Fase 1 flashcard intensif (retry 5x) + Fase 2 quiz forced recall (3 tipe sulit)
- [x] Badge sidebar: badge merah menampilkan jumlah leech
- [x] Redesain overlay logout: full-screen elegan (gradient deep teal, Framer Motion)
- [x] CTA "Tersedia sebagai aplikasi" dibuat rata tengah
- [x] Perbaikan bug streak: tidak reset saat user melewatkan satu hari, diperbaiki dengan `validateStreak()`
- [x] Audit timezone: 6 file diperbaiki dari UTC ke WIB (Asia/Jakarta) lewat `timezone.ts` terpusat
- [x] Perbaikan schema: 24 kolom `.default("now()")` diubah ke `.$defaultFn()` di 6 file schema
- [x] Pelacakan XP: perbaikan string literal "now()" di `xp_transaction` + bug reset `daily_activity`
- [x] Feedback quiz: mengikuti toggle Kanji/Kana (gaya furigana)
- [x] Countdown review: label diperjelas ("X kartu siap direview sekarang" vs "X kartu akan siap direview dalam...")
- [x] Perbaikan path OG image
- [x] Pembersihan import yang tidak terpakai
- [x] Audit menyeluruh: 80+ pemeriksaan di 16 area, tidak ada isu tersisa
- [x] Pengingat streak dinamis: 5 slot waktu (dini hari/pagi/siang/sore/malam), pesan personal dengan nama user, countdown malam, warna border per waktu
- [x] Redesain halaman /learn: 3 kartu Metode Belajar (Belajar Sekarang, Review, Kata Sulit) + 2 kartu Materi (HIRAKATA, MNN), gaya gradient, badge info dinamis, countdown timer review
- [x] Perbaikan data kana: 12 romaji salah dikoreksi (ぢ->ji, づ->zu, を->o, kombinasi ぢゃ/ぢゅ/ぢょ), migration 0009, `pronunciation-scoring.ts` diperbarui
- [x] Catatan progress bar di 4 lokasi (HIRAKATA, daftar MNN, MNN per bab, Dashboard)
- [x] Redesain profil menyeluruh:
  - Statistik Belajar: 3 kartu highlight (XP dengan progress bar, Level dengan XP-to-next, Streak dengan longest) + 6 kartu detail (Kata Dikuasai, Quiz Selesai, Akurasi, Hari Aktif, Total Review, Bergabung Sejak)
  - Avatar picker: 16 emoji Jepang preset, ring gradient (lime-to-teal), animasi rotasi saat hover, indikator edit pensil yang selalu terlihat
  - Header: gradient diperkaya dengan radial overlay
  - Ubah Password: modal dengan validasi real-time (khusus pengguna email/password)
  - Keamanan untuk pengguna Google OAuth: teks info + tautan ke pengaturan Google Account
  - Hapus Akun bertahap: Langkah 1 peringatan dengan jumlah data sebenarnya, Langkah 2 ketik "HAPUS AKUN" + timer hitung mundur 5 detik, cascade delete semua tabel + Supabase Auth
  - Statistik real-time: `force-dynamic` memastikan data segar di setiap navigasi
  - Perbaikan bug Kata Dikuasai = 0: kini memakai `getTotalQuizMasteredWords()` (query yang sama dengan dashboard)
  - Perbaikan bug Bergabung Sejak Invalid Date: fallback ke `authUser.created_at` + format bulan singkat Indonesia
  - Teks footer dihapus
- [x] Kartu Kata Sulit di dashboard: penjelasan untuk empty state
- [x] Pembaruan skeleton loading: halaman dashboard + learn + profile disesuaikan dengan layout baru
- [x] Optimasi Lighthouse: Performance 63 -> 86 (font preload, lazy motion, dynamic import, dimensi gambar, perbaikan aksesibilitas)

### [P6] Documentation & Polish

- [x] README.md direstrukturisasi dengan dokumentasi menyeluruh, onboarding tour, dan section guidebook (14 section: Header, Why Kioku, Highlights, Screenshots, Documentation, Features, Tech Stack, Architecture, Database, Security, Project Status, Getting Started, License, Footer)
- [x] Section Highlights baru: 10 fitur unggulan untuk recruiter (Smart Study, FSRS, AI Waterfall, Tour, Leech, JLPT Auto-Upgrade, Achievement, Audio Pipeline, PWA, Security)
- [x] Section Documentation baru: tautan ke guidebook PDF 36 halaman + daftar isi 10 bab
- [x] Section Project Status baru: tabel P0-P6 lengkap dengan status Complete + baris ringkasan
- [x] Features direstrukturisasi: tambah sub-header "Documentation & Onboarding" + item baru (Profile Customization, Account Security, Dynamic Streak Reminder, JLPT Auto-Upgrade)
- [x] License + Footer dirombak: memuat disclaimer hak cipta MNN + konteks portofolio untuk recruiter
- [x] Urutan screenshot ditata ulang mengikuti user journey: Dashboard -> Onboarding Tour -> Learn Hub -> Smart Study -> Summary -> Flashcard -> Quiz -> Kana Grid -> Review -> Kata Sulit -> AI Tutor -> Profile

#### Onboarding Tour Enhancement

- [x] Tambah 2 langkah baru: "Review Harian" (target `tour-review`, disisipkan setelah Smart Study) + "Profil & Panduan" (target `tour-user-menu`, langkah terakhir). Total 8 langkah.
- [x] Polish copy 6 langkah lama: lebih ringkas dan spesifik (FSRS 20-30% lebih efisien, 214 kana, kosakata MNN, level 1-60, 50 achievement, dst.)
- [x] Tag `id="tour-user-menu"` di DropdownMenuTrigger `user-menu.tsx` (elemen selalu terlihat di topbar)
- [x] Persistensi ke DB: kolom `tour_completed` di tabel user. Migration 0013.
- [x] Server actions: `markTourCompleted()` + `getTourCompletedStatus()` di `src/app/actions/tour.ts`. Fallback aman kalau kolom belum ada.
- [x] Tour store: action `syncCompletedFromServer()` + `completeTour()` memanggil server secara fire-and-forget. localStorage tetap dipakai sebagai cache cepat.
- [x] Bootstrap tour interaktif: ambil status server saat mount, sync turun (server -> lokal) atau backfill naik (lokal -> server) untuk pengguna lama. Auto-start dengan jeda 1500ms.
- [x] Sinkronisasi lintas perangkat: pengguna yang menyelesaikan tour di perangkat A tidak akan melihatnya lagi di perangkat B.

### [P7] Community & Feedback System — Konsep, Belum Diimplementasi

Status: konsep sudah final. UI akan di-prototype di Claude Design lebih dulu sebelum implementasi. Tabel DB (`feedback`, `public_stats_cache`) sudah dibuat lewat migration 0014.

**Public Stats Page** — halaman publik yang menampilkan metrik komunitas Kioku:

- Hero section dengan tagline komunitas
- Grid angka besar: total pengguna, total review, total soal quiz dijawab, total kata dikuasai (animasi count-up)
- Sorotan aktivitas: rata-rata akurasi quiz, rekor streak terpanjang, paling aktif hari ini
- Visualisasi: heatmap aktivitas teragregasi atau grafik pertumbuhan (dianonimkan)
- Statistik konten: jumlah kosakata, jumlah kana, jumlah file audio, jumlah bab
- Sinyal kepercayaan: algoritma FSRS, 100% gratis, tanpa iklan
- CTA: Bergabung dengan Kioku
- Privasi: sepenuhnya teragregasi, tidak ada data individu yang terekspos
- Cache: 5 menit (in-memory atau tabel `public_stats_cache`)
- Route: `/community`

**Feedback System** — modal feedback dengan 4 kategori:

- Pemicu: floating button kanan bawah + item menu di dropdown profil
- Tab Bug: URL halaman (terdeteksi otomatis), deskripsi, langkah reproduksi, upload screenshot (opsional)
- Tab Saran: judul, deskripsi detail, kategori (UI / fitur baru / performa / lainnya)
- Tab Pendapat: rating 1-5 bintang, komentar bebas, opt-in untuk ditampilkan publik
- Tab Rating: hanya bintang 1-5 + komentar satu baris opsional
- Mode anonim didukung untuk pengguna yang belum login (dibatasi rate limit)
- Dinding testimoni publik (Fase 8) — alur persetujuan opt-in

**Admin Analytics** — Fase 8, belum akan dikerjakan: metrik pertumbuhan (retensi D1/D7/D30), metrik engagement (DAU/WAU/MAU), tingkat adopsi fitur, analisis funnel, inbox feedback + bug tracker, voting permintaan fitur.

---

## 14. Catatan Teknis

### Data & Konten

**Angka resmi konten.** Semua nilai di bawah diverifikasi langsung ke database production dan Supabase Storage pada 31 Agustus 2026. Pakai angka ini di README, copy landing page, dan copy tour — jangan mengarang ulang.

| Metrik                                        | Nilai                                    |
| --------------------------------------------- | ---------------------------------------- |
| Baris `vocabulary` (total di DB)              | 3.575                                    |
| Vocabulary tampil (`is_published = true`)     | **2.909**                                |
| Vocabulary disembunyikan                      | 666                                      |
| Kana                                          | 214 (semuanya punya audio)               |
| File audio di Supabase Storage (bucket `audio`) | **3.123** (2.909 vocabulary + 214 kana) |
| Bab                                           | 50                                       |
| Buku                                          | 2 (Shokyuu I dan II)                     |
| Achievement                                   | 50                                       |
| Tabel di schema `public`                      | 22, semuanya RLS aktif                   |

- Layout audio di Storage: `audio/kana/<uuid>.mp3` dan `audio/vocabulary/<nomor-bab>/<uuid>.mp3`.
- `meaningId` pada tabel vocabulary MNN sudah diterjemahkan ke Bahasa Indonesia dari PDF kosakata MNN Bab 1-50 (catatan historis: 1942 dari 2692 baris lewat `update-vocabulary-meanings.ts`, + 74 tambahan lewat `sync-vocabulary.ts`; jumlah baris bertambah setelah itu lewat `insert-missing-vocab.ts`). Sumber data: `scripts/data/mnn-vocabulary-indonesian.json`. Saat ini **tidak ada** baris published yang `meaning_id`-nya kosong.
- Kosakata yang tidak ada di PDF MNN Bab 1-50 disembunyikan lewat `is_published = false`. Semua query frontend dan API sudah memfilter `is_published = true`. Script: `scripts/sync-vocabulary.ts` (jalankan dry-run dulu, `--apply` untuk mengeksekusi). Migration: 0006.
- Kana di-seed dari `src/db/seed/kana-data.ts`.
- 919 dari 2.909 kosakata published tidak punya kanji (`kanji` NULL/kosong) — wajar untuk kata yang memang ditulis kana saja. Toggle Kanji/Kana harus tahan terhadap kasus ini.
- Scoring pengucapan memakai ~1766 pemetaan kanji -> hiragana (dihasilkan otomatis dari PDF MNN Bab 1-50). Kamus: `src/lib/audio/kanji-hiragana-dict.ts`. Sumber data: `scripts/data/kanji-hiragana-dict.ts`.

**Dua fitur yang schema-nya ada tapi datanya masih kosong:**

- **Contoh kalimat belum ada.** Kolom `vocabulary.example_jp` dan `example_id` ada di schema, tapi **0 baris terisi**. Jangan menjanjikan "contoh kalimat" di copy mana pun sampai datanya diisi. (Copy tour sempat menjanjikan ini dan sudah dikoreksi.)
- **Bank soal AI belum di-generate.** Tabel `ai_question_template` **kosong (0 baris)** meskipun script `scripts/generate-quiz-questions.ts` sudah ada dan fase P3 ditandai selesai. Quiz saat ini dibangun runtime dari data vocabulary, bukan dari template pre-generated. Script-nya perlu dijalankan kalau fitur ini mau benar-benar aktif.

### SRS & Belajar

- Flashcard: 2 tombol (Belum Paham / Sudah Paham) + antrean retry maks 3x. Review: 4 tombol FSRS (Ulang / Hard / Good / Easy) + re-queue Again maks 3x.
- Kata baru di Smart Study dipilih berdasarkan progres nyata pengguna, bukan semata target JLPT. Target JLPT hanya jadi titik awal untuk pengguna baru.
- Ambang leech: `lapses >= 4`. Confused pairs: dari riwayat `quiz_answer`, `confusion_count >= 2`.
- Toggle Kanji/Kana sudah terpasang di detail bab, flashcard, quiz, dan review. Setting global disimpan di DB (`user.display_mode`), override per halaman lewat Zustand store. Komponen: `DisplayModeToggle`, `DisplayModeProvider`, hook `useDisplayMode`. Migration: 0007.
- JLPT auto-upgrade: `checkAndUpgradeJlpt()` memeriksa mastery berbasis quiz, bukan `completion_percent`. Dipicu setelah quiz selesai, dengan fallback saat dashboard dimuat.
- Fallback Whisper.cpp WASM dilewati karena model ~75MB terlalu berat dan Web Speech API sudah mencakup mayoritas browser (Chrome/Edge). Kalau nanti ada permintaan dari pengguna Firefox/Safari, bisa dibuat sebagai fitur opsional yang di-lazy-load.

### Gamifikasi

- Daily goal: 5 tingkat (100 / 300 / 500 / 750 / 1000 XP). Nilai lama (30/50/200) sudah dimigrasi lewat migration 0008.
- Bonus XP: Smart Study selesai +15 XP, latihan leech selesai +20 XP.
- Validasi streak: `validateStreak()` dipanggil saat dashboard dimuat. Streak **tidak** auto-reset kalau pengguna melewatkan satu hari.
- Pengingat streak dinamis: `getCurrentHourWIB()` menentukan slot waktu (5 slot), `useEffect` interval 60 detik memperbarui countdown malam. Komponen: `src/components/dashboard/streak-reminder.tsx`.
- Statistik profil: "Kata Dikuasai" memakai `getTotalQuizMasteredWords()` (hitung distinct `quiz_answer.vocabularyId` yang `is_correct`), bukan `userGamification.totalWordsLearned` yang sering bernilai 0.

### Auth & Keamanan

- Supabase Auth: "Confirm email" OFF. GitHub OAuth dihapus. Hanya Google OAuth + email/password + magic link.
- Onboarding bersifat **wajib** — layout dashboard mengalihkan ke `/onboarding` kalau `onboarding_done = false`.
- Rate limiting in-memory di `src/lib/rate-limit.ts`. Security header dikonfigurasi di `next.config.ts`.
- Hapus akun: cascade delete semua tabel data pengguna + `admin.deleteUser` Supabase Auth lewat service role. Setelah dihapus, email bisa dipakai mendaftar ulang.
- `SECURITY-AUDIT.md` adalah laporan audit internal (RLS, auth per-endpoint, validasi, rate limit). File ini **sengaja tidak dilacak git** karena memuat detail kelemahan per-endpoint untuk aplikasi yang sedang live. Berkasnya tetap ada secara lokal. Ringkasan yang layak publik ada di section Security di README.

### Waktu & Timestamp

- `src/lib/utils/timezone.ts` adalah sumber kebenaran tunggal untuk semua perhitungan tanggal (WIB / Asia/Jakarta).
- Semua timestamp di schema memakai `.$defaultFn(() => new Date().toISOString())`, **bukan** `.default("now()")`.
- Perbaikan string "now()" warisan: migration 0010 memperbarui baris lama yang masih menyimpan string literal "now()" menjadi `NOW()::text`. Halaman profil punya fallback ke `authUser.created_at` kalau `user.createdAt` tidak valid.

### UI/UX

- Avatar emoji disimpan sebagai string emoji polos di kolom `user.avatar_url` (NULL = huruf inisial default). Dideteksi lewat `!startsWith("http")`.
- Format tanggal di profil: array bulan singkat Indonesia `["Jan","Feb",...,"Des"]`, format "DD MMM YYYY".
- Store Zustand: `auto-play-store`, `display-mode-store`, `smart-study-store`, `tour-store`.
- `src/lib/queries/safe-query.ts` membungkus query agar kegagalan tidak merusak render halaman.

### Riwayat Migration

| #    | Berkas                                       | Isi                                                            |
| ---- | -------------------------------------------- | -------------------------------------------------------------- |
| 0000 | `0000_pink_puff_adder.sql`                   | Schema awal (semua tabel + enum)                                |
| 0001 | `0001_rls_policies.sql`                      | Policy RLS untuk seluruh tabel                                  |
| 0002 | `0002_add_preferred_name.sql`                | Kolom `user.preferred_name`                                     |
| 0003 | `0003_achievement_columns.sql`               | Kolom tambahan tabel achievement                                |
| 0004 | `0004_unique_constraints_and_indexes.sql`    | Unique constraint + indeks                                      |
| 0005 | `0005_add_cache_expires_at.sql`              | `ai_response_cache.expires_at`                                  |
| 0006 | `0006_add_vocabulary_is_published.sql`       | `vocabulary.is_published`                                       |
| 0007 | `0007_add_user_display_mode.sql`             | `user.display_mode` (toggle Kanji/Kana)                         |
| 0008 | `0008_update_daily_goal_xp_enum.sql`         | Enum daily goal 30/50/100/200 -> 100/300/500/750/1000           |
| 0009 | `0009_fix_kana_romaji.sql`                   | 12 perbaikan romaji kana (ぢ->ji, dll.)                          |
| 0010 | `0010_fix_legacy_now_string_timestamps.sql`  | Perbaikan string literal "now()" pada baris lama                |
| 0011 | `0011_clear_external_avatar_urls.sql`        | Bersihkan URL avatar eksternal (pindah ke emoji)                |
| 0012 | `0012_add_quiz_session_completed_index.sql`  | Indeks `quiz_session.is_completed`                              |
| 0013 | `0013_add_tour_completed.sql`                | `user.tour_completed` (sync tour lintas perangkat)              |
| 0014 | `0014_add_feedback_and_stats_cache.sql`      | Tabel `feedback` + `public_stats_cache` (Fase 7)                |
