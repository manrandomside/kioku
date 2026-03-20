import { pgEnum } from "drizzle-orm/pg-core";

export const jlptLevelEnum = pgEnum("jlpt_level", [
  "N5",
  "N4",
  "N3",
  "N2",
  "N1",
]);

export const wordTypeEnum = pgEnum("word_type", [
  "noun",
  "verb",
  "i_adjective",
  "na_adjective",
  "adverb",
  "particle",
  "conjunction",
  "expression",
  "counter",
  "prefix",
  "suffix",
  "pronoun",
  "interjection",
]);

export const kanaCategoryEnum = pgEnum("kana_category", [
  "hiragana_basic",
  "hiragana_dakuten",
  "hiragana_combo",
  "katakana_basic",
  "katakana_dakuten",
  "katakana_combo",
]);

export const srsStatusEnum = pgEnum("srs_status", [
  "new",
  "learning",
  "review",
  "relearning",
]);

export const srsRatingEnum = pgEnum("srs_rating", [
  "again",
  "hard",
  "good",
  "easy",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "meaning_to_word",
  "word_to_meaning",
  "audio_to_word",
  "audio_to_meaning",
  "kanji_to_hiragana",
  "hiragana_to_kanji",
  "fill_in_blank",
]);

export const themeEnum = pgEnum("theme", ["light", "dark", "system"]);

export const dailyGoalXpEnum = pgEnum("daily_goal_xp", [
  "30",
  "50",
  "100",
  "200",
]);

export const xpSourceEnum = pgEnum("xp_source", [
  "review",
  "quiz",
  "perfect_quiz",
  "streak_bonus",
  "achievement",
  "daily_bonus",
]);

export const achievementTypeEnum = pgEnum("achievement_type", [
  "streak",
  "review_count",
  "quiz_score",
  "words_learned",
  "level",
  "special",
]);

export const chatRoleEnum = pgEnum("chat_role", [
  "user",
  "assistant",
  "system",
]);
