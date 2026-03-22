import { config } from "dotenv";

config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { achievement } from "../schema/gamification";

type AchievementType =
  | "streak"
  | "review_count"
  | "quiz_score"
  | "quiz_speed"
  | "words_learned"
  | "chapter_complete"
  | "level"
  | "special";

interface AchievementSeed {
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  badgeColor: string;
  type: AchievementType;
  condition: Record<string, unknown>;
  xpReward: number;
  sortOrder: number;
}

// Badge colors per category
const COLORS = {
  streak: "#F97316",
  review_count: "#3B82F6",
  quiz_score: "#8B5CF6",
  quiz_speed: "#EC4899",
  words_learned: "#22C55E",
  chapter_complete: "#14B8A6",
  level: "#F59E0B",
  special: "#6366F1",
};

const ACHIEVEMENTS: AchievementSeed[] = [
  // ===== STREAK (8) =====
  {
    name: "Langkah Pertama",
    nameEn: "First Step",
    description: "Mulai streak pertamamu! Belajar 1 hari berturut-turut.",
    icon: "footprints",
    badgeColor: COLORS.streak,
    type: "streak",
    condition: { type: "streak", value: 1 },
    xpReward: 10,
    sortOrder: 100,
  },
  {
    name: "Pejuang Mingguan",
    nameEn: "Weekly Warrior",
    description: "Belajar 7 hari berturut-turut tanpa putus.",
    icon: "flame",
    badgeColor: COLORS.streak,
    type: "streak",
    condition: { type: "streak", value: 7 },
    xpReward: 50,
    sortOrder: 101,
  },
  {
    name: "Dua Minggu Konsisten",
    nameEn: "Two Weeks Strong",
    description: "Belajar 14 hari berturut-turut. Konsistensi adalah kunci!",
    icon: "flame",
    badgeColor: COLORS.streak,
    type: "streak",
    condition: { type: "streak", value: 14 },
    xpReward: 75,
    sortOrder: 102,
  },
  {
    name: "Sebulan Tanpa Henti",
    nameEn: "Unstoppable Month",
    description: "30 hari streak! Kamu sudah membentuk kebiasaan belajar.",
    icon: "flame-kindling",
    badgeColor: COLORS.streak,
    type: "streak",
    condition: { type: "streak", value: 30 },
    xpReward: 100,
    sortOrder: 103,
  },
  {
    name: "Dua Bulan Kuat",
    nameEn: "Two Months Strong",
    description: "60 hari streak! Dedikasi yang luar biasa.",
    icon: "flame-kindling",
    badgeColor: COLORS.streak,
    type: "streak",
    condition: { type: "streak", value: 60 },
    xpReward: 200,
    sortOrder: 104,
  },
  {
    name: "Tiga Bulan Legendaris",
    nameEn: "Legendary Quarter",
    description: "90 hari streak! Kamu benar-benar legendaris.",
    icon: "crown",
    badgeColor: COLORS.streak,
    type: "streak",
    condition: { type: "streak", value: 90 },
    xpReward: 300,
    sortOrder: 105,
  },
  {
    name: "Setengah Tahun!",
    nameEn: "Half Year Hero",
    description: "180 hari streak! Setengah tahun belajar tanpa henti.",
    icon: "crown",
    badgeColor: COLORS.streak,
    type: "streak",
    condition: { type: "streak", value: 180 },
    xpReward: 400,
    sortOrder: 106,
  },
  {
    name: "Master Konsistensi",
    nameEn: "Consistency Master",
    description: "365 hari streak! Satu tahun penuh belajar setiap hari.",
    icon: "trophy",
    badgeColor: COLORS.streak,
    type: "streak",
    condition: { type: "streak", value: 365 },
    xpReward: 500,
    sortOrder: 107,
  },

  // ===== WORDS LEARNED (8) =====
  {
    name: "Kata Pertama",
    nameEn: "First Word",
    description: "Kuasai kata pertamamu! Perjalanan dimulai dari sini.",
    icon: "book-open",
    badgeColor: COLORS.words_learned,
    type: "words_learned",
    condition: { type: "words_learned", value: 1 },
    xpReward: 10,
    sortOrder: 200,
  },
  {
    name: "Sepuluh Kata",
    nameEn: "Ten Words",
    description: "Kuasai 10 kata. Kosakatamu mulai berkembang!",
    icon: "book-open",
    badgeColor: COLORS.words_learned,
    type: "words_learned",
    condition: { type: "words_learned", value: 10 },
    xpReward: 25,
    sortOrder: 201,
  },
  {
    name: "Lima Puluh Kata",
    nameEn: "Fifty Words",
    description: "Kuasai 50 kata. Sudah bisa percakapan sederhana!",
    icon: "book-text",
    badgeColor: COLORS.words_learned,
    type: "words_learned",
    condition: { type: "words_learned", value: 50 },
    xpReward: 50,
    sortOrder: 202,
  },
  {
    name: "Seratus Kata",
    nameEn: "Hundred Words",
    description: "Kuasai 100 kata. Kosakatamu semakin kaya!",
    icon: "book-text",
    badgeColor: COLORS.words_learned,
    type: "words_learned",
    condition: { type: "words_learned", value: 100 },
    xpReward: 75,
    sortOrder: 203,
  },
  {
    name: "Dua Ratus Kata",
    nameEn: "Two Hundred Words",
    description: "Kuasai 200 kata. Pemahaman bacaanmu meningkat pesat!",
    icon: "library",
    badgeColor: COLORS.words_learned,
    type: "words_learned",
    condition: { type: "words_learned", value: 200 },
    xpReward: 100,
    sortOrder: 204,
  },
  {
    name: "Lima Ratus Kata",
    nameEn: "Five Hundred Words",
    description: "Kuasai 500 kata. Kamu sudah mahir!",
    icon: "library",
    badgeColor: COLORS.words_learned,
    type: "words_learned",
    condition: { type: "words_learned", value: 500 },
    xpReward: 200,
    sortOrder: 205,
  },
  {
    name: "Seribu Kata",
    nameEn: "Thousand Words",
    description: "Kuasai 1000 kata. Level kosakatamu sangat tinggi!",
    icon: "graduation-cap",
    badgeColor: COLORS.words_learned,
    type: "words_learned",
    condition: { type: "words_learned", value: 1000 },
    xpReward: 300,
    sortOrder: 206,
  },
  {
    name: "Kolektor Kosakata",
    nameEn: "Vocabulary Collector",
    description: "Kuasai 1500 kata. Semua kosakata MNN sudah kamu kuasai!",
    icon: "sparkles",
    badgeColor: COLORS.words_learned,
    type: "words_learned",
    condition: { type: "words_learned", value: 1500 },
    xpReward: 500,
    sortOrder: 207,
  },

  // ===== QUIZ SCORE (6) =====
  {
    name: "Quiz Pertama",
    nameEn: "First Quiz",
    description: "Selesaikan quiz pertamamu!",
    icon: "circle-help",
    badgeColor: COLORS.quiz_score,
    type: "quiz_score",
    condition: { type: "quiz_complete", value: 1 },
    xpReward: 10,
    sortOrder: 300,
  },
  {
    name: "Nilai Sempurna",
    nameEn: "Perfect Score",
    description: "Raih skor 100% di sebuah quiz untuk pertama kalinya!",
    icon: "star",
    badgeColor: COLORS.quiz_score,
    type: "quiz_score",
    condition: { type: "perfect_quiz", value: 1 },
    xpReward: 25,
    sortOrder: 301,
  },
  {
    name: "Lima Kali Sempurna",
    nameEn: "Five Times Perfect",
    description: "Raih skor 100% di 5 quiz berbeda.",
    icon: "stars",
    badgeColor: COLORS.quiz_score,
    type: "quiz_score",
    condition: { type: "perfect_quiz", value: 5 },
    xpReward: 75,
    sortOrder: 302,
  },
  {
    name: "Sepuluh Kali Sempurna",
    nameEn: "Ten Times Perfect",
    description: "Raih skor 100% di 10 quiz berbeda. Luar biasa!",
    icon: "award",
    badgeColor: COLORS.quiz_score,
    type: "quiz_score",
    condition: { type: "perfect_quiz", value: 10 },
    xpReward: 150,
    sortOrder: 303,
  },
  {
    name: "Mesin Quiz",
    nameEn: "Quiz Machine",
    description: "Selesaikan 50 quiz. Kamu mesin penjawab!",
    icon: "brain",
    badgeColor: COLORS.quiz_score,
    type: "quiz_score",
    condition: { type: "quiz_complete", value: 50 },
    xpReward: 200,
    sortOrder: 304,
  },
  {
    name: "Quiz Master",
    nameEn: "Quiz Master",
    description: "Selesaikan 100 quiz. Tidak ada quiz yang bisa mengalahkanmu!",
    icon: "trophy",
    badgeColor: COLORS.quiz_score,
    type: "quiz_score",
    condition: { type: "quiz_complete", value: 100 },
    xpReward: 300,
    sortOrder: 305,
  },

  // ===== QUIZ SPEED (3) =====
  {
    name: "Speed Demon",
    nameEn: "Speed Demon",
    description: "Selesaikan quiz dalam waktu kurang dari 2 menit.",
    icon: "timer",
    badgeColor: COLORS.quiz_speed,
    type: "quiz_speed",
    condition: { type: "quiz_speed", max_time_ms: 120000 },
    xpReward: 50,
    sortOrder: 400,
  },
  {
    name: "Kilat",
    nameEn: "Lightning Fast",
    description: "Selesaikan quiz dalam waktu kurang dari 1.5 menit.",
    icon: "zap",
    badgeColor: COLORS.quiz_speed,
    type: "quiz_speed",
    condition: { type: "quiz_speed", max_time_ms: 90000 },
    xpReward: 75,
    sortOrder: 401,
  },
  {
    name: "Secepat Cahaya",
    nameEn: "Speed of Light",
    description: "Selesaikan quiz dalam waktu kurang dari 1 menit!",
    icon: "bolt",
    badgeColor: COLORS.quiz_speed,
    type: "quiz_speed",
    condition: { type: "quiz_speed", max_time_ms: 60000 },
    xpReward: 100,
    sortOrder: 402,
  },

  // ===== CHAPTER COMPLETE (8) =====
  {
    name: "Bab Pertama Tuntas",
    nameEn: "First Chapter Done",
    description: "Selesaikan bab pertamamu dengan 100% penguasaan.",
    icon: "bookmark-check",
    badgeColor: COLORS.chapter_complete,
    type: "chapter_complete",
    condition: { type: "chapter_complete", value: 1 },
    xpReward: 25,
    sortOrder: 500,
  },
  {
    name: "Lima Bab Selesai",
    nameEn: "Five Chapters Done",
    description: "Selesaikan 5 bab. Progresmu sangat baik!",
    icon: "bookmark-check",
    badgeColor: COLORS.chapter_complete,
    type: "chapter_complete",
    condition: { type: "chapter_complete", value: 5 },
    xpReward: 75,
    sortOrder: 501,
  },
  {
    name: "Sepuluh Bab",
    nameEn: "Ten Chapters",
    description: "Selesaikan 10 bab. Kamu sudah seperempat jalan!",
    icon: "book-marked",
    badgeColor: COLORS.chapter_complete,
    type: "chapter_complete",
    condition: { type: "chapter_complete", value: 10 },
    xpReward: 100,
    sortOrder: 502,
  },
  {
    name: "Setengah Jalan MNN I",
    nameEn: "Halfway MNN I",
    description: "Selesaikan 13 bab. Setengah jalan MNN Buku I!",
    icon: "book-marked",
    badgeColor: COLORS.chapter_complete,
    type: "chapter_complete",
    condition: { type: "chapter_complete", value: 13 },
    xpReward: 150,
    sortOrder: 503,
  },
  {
    name: "MNN I Selesai!",
    nameEn: "MNN I Complete!",
    description: "Selesaikan 25 bab. Seluruh Minna no Nihongo I tuntas!",
    icon: "party-popper",
    badgeColor: COLORS.chapter_complete,
    type: "chapter_complete",
    condition: { type: "chapter_complete", value: 25 },
    xpReward: 250,
    sortOrder: 504,
  },
  {
    name: "Siap JLPT N5",
    nameEn: "JLPT N5 Ready",
    description: "Selesaikan semua bab level N5. Siap ujian JLPT N5!",
    icon: "badge-check",
    badgeColor: COLORS.chapter_complete,
    type: "chapter_complete",
    condition: { type: "jlpt_complete", value: "N5" },
    xpReward: 300,
    sortOrder: 505,
  },
  {
    name: "MNN II Selesai!",
    nameEn: "MNN II Complete!",
    description: "Selesaikan 50 bab. Seluruh Minna no Nihongo I & II tuntas!",
    icon: "party-popper",
    badgeColor: COLORS.chapter_complete,
    type: "chapter_complete",
    condition: { type: "chapter_complete", value: 50 },
    xpReward: 400,
    sortOrder: 506,
  },
  {
    name: "Siap JLPT N4",
    nameEn: "JLPT N4 Ready",
    description: "Selesaikan semua bab level N4. Siap ujian JLPT N4!",
    icon: "badge-check",
    badgeColor: COLORS.chapter_complete,
    type: "chapter_complete",
    condition: { type: "jlpt_complete", value: "N4" },
    xpReward: 500,
    sortOrder: 507,
  },

  // ===== LEVEL (5) =====
  {
    name: "Level 5",
    nameEn: "Level 5",
    description: "Mencapai Level 5. Kamu mulai menemukan ritme belajar!",
    icon: "arrow-up-circle",
    badgeColor: COLORS.level,
    type: "level",
    condition: { type: "level_reach", value: 5 },
    xpReward: 25,
    sortOrder: 600,
  },
  {
    name: "Level 10",
    nameEn: "Level 10",
    description: "Mencapai Level 10. Double digits! Terus belajar!",
    icon: "arrow-up-circle",
    badgeColor: COLORS.level,
    type: "level",
    condition: { type: "level_reach", value: 10 },
    xpReward: 50,
    sortOrder: 601,
  },
  {
    name: "Level 20",
    nameEn: "Level 20",
    description: "Mencapai Level 20. Kamu sudah sangat berpengalaman!",
    icon: "shield",
    badgeColor: COLORS.level,
    type: "level",
    condition: { type: "level_reach", value: 20 },
    xpReward: 100,
    sortOrder: 602,
  },
  {
    name: "Level 30",
    nameEn: "Level 30",
    description: "Mencapai Level 30. Kamu hampir menjadi master!",
    icon: "shield",
    badgeColor: COLORS.level,
    type: "level",
    condition: { type: "level_reach", value: 30 },
    xpReward: 200,
    sortOrder: 603,
  },
  {
    name: "Level 50",
    nameEn: "Level 50",
    description: "Mencapai Level 50. Level tertinggi! Kamu adalah legenda!",
    icon: "gem",
    badgeColor: COLORS.level,
    type: "level",
    condition: { type: "level_reach", value: 50 },
    xpReward: 500,
    sortOrder: 604,
  },

  // ===== REVIEW COUNT (6) =====
  {
    name: "Review Pertama",
    nameEn: "First Review",
    description: "Selesaikan review pertamamu. Awal yang baik!",
    icon: "rotate-ccw",
    badgeColor: COLORS.review_count,
    type: "review_count",
    condition: { type: "review_count", value: 1 },
    xpReward: 10,
    sortOrder: 700,
  },
  {
    name: "100 Review",
    nameEn: "100 Reviews",
    description: "Selesaikan 100 review. Otakmu semakin tajam!",
    icon: "rotate-ccw",
    badgeColor: COLORS.review_count,
    type: "review_count",
    condition: { type: "review_count", value: 100 },
    xpReward: 50,
    sortOrder: 701,
  },
  {
    name: "500 Review",
    nameEn: "500 Reviews",
    description: "Selesaikan 500 review. Dedikasi luar biasa!",
    icon: "repeat",
    badgeColor: COLORS.review_count,
    type: "review_count",
    condition: { type: "review_count", value: 500 },
    xpReward: 100,
    sortOrder: 702,
  },
  {
    name: "1000 Review",
    nameEn: "1000 Reviews",
    description: "Selesaikan 1000 review. Seribu kali ulang, seribu kali ingat!",
    icon: "repeat",
    badgeColor: COLORS.review_count,
    type: "review_count",
    condition: { type: "review_count", value: 1000 },
    xpReward: 200,
    sortOrder: 703,
  },
  {
    name: "5000 Review",
    nameEn: "5000 Reviews",
    description: "Selesaikan 5000 review. Kamu tak kenal lelah!",
    icon: "infinity",
    badgeColor: COLORS.review_count,
    type: "review_count",
    condition: { type: "review_count", value: 5000 },
    xpReward: 300,
    sortOrder: 704,
  },
  {
    name: "Review Legend",
    nameEn: "Review Legend",
    description: "Selesaikan 10000 review. Kamu benar-benar legenda review!",
    icon: "trophy",
    badgeColor: COLORS.review_count,
    type: "review_count",
    condition: { type: "review_count", value: 10000 },
    xpReward: 500,
    sortOrder: 705,
  },

  // ===== SPECIAL (6) =====
  {
    name: "Penjelajah Kana",
    nameEn: "Kana Explorer",
    description: "Kuasai semua karakter Hiragana. Selamat!",
    icon: "languages",
    badgeColor: COLORS.special,
    type: "special",
    condition: { type: "kana_complete", category: "hiragana" },
    xpReward: 100,
    sortOrder: 800,
  },
  {
    name: "Ahli Katakana",
    nameEn: "Katakana Expert",
    description: "Kuasai semua karakter Katakana. Hebat!",
    icon: "languages",
    badgeColor: COLORS.special,
    type: "special",
    condition: { type: "kana_complete", category: "katakana" },
    xpReward: 100,
    sortOrder: 801,
  },
  {
    name: "Master Kana",
    nameEn: "Kana Master",
    description: "Kuasai semua Hiragana dan Katakana. Fondasi yang sempurna!",
    icon: "scroll-text",
    badgeColor: COLORS.special,
    type: "special",
    condition: { type: "kana_complete", category: "all" },
    xpReward: 200,
    sortOrder: 802,
  },
  {
    name: "Burung Awal",
    nameEn: "Early Bird",
    description: "Belajar sebelum jam 6 pagi. Rajin sekali!",
    icon: "sunrise",
    badgeColor: COLORS.special,
    type: "special",
    condition: { type: "time_of_day", before_hour: 6 },
    xpReward: 25,
    sortOrder: 803,
  },
  {
    name: "Burung Hantu",
    nameEn: "Night Owl",
    description: "Belajar setelah jam 11 malam. Semangat belajar malam!",
    icon: "moon",
    badgeColor: COLORS.special,
    type: "special",
    condition: { type: "time_of_day", after_hour: 23 },
    xpReward: 25,
    sortOrder: 804,
  },
  {
    name: "Rajin Weekend",
    nameEn: "Weekend Learner",
    description: "Belajar di hari Sabtu dan Minggu. Weekend produktif!",
    icon: "calendar-check",
    badgeColor: COLORS.special,
    type: "special",
    condition: { type: "weekend_activity" },
    xpReward: 25,
    sortOrder: 805,
  },
];

async function seedAchievements() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[seed-achievements] DATABASE_URL is not set");
    process.exit(1);
  }

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  console.log(`[seed-achievements] Seeding ${ACHIEVEMENTS.length} achievements...`);

  const rows = ACHIEVEMENTS.map((a) => ({
    name: a.name,
    nameEn: a.nameEn,
    description: a.description,
    icon: a.icon,
    badgeColor: a.badgeColor,
    type: a.type as typeof achievement.$inferInsert.type,
    condition: a.condition,
    xpReward: a.xpReward,
    sortOrder: a.sortOrder,
  }));

  // Clear existing achievements and re-seed
  const { sql: rawSql } = await import("drizzle-orm");
  await db.delete(achievement);

  const result = await db.insert(achievement).values(rows);

  console.log(`[seed-achievements] Inserted ${ACHIEVEMENTS.length} achievements`);
  await client.end();
  console.log("[seed-achievements] Done");
}

seedAchievements().catch((err) => {
  console.error("[seed-achievements] Error:", err);
  process.exit(1);
});
