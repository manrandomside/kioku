-- Fix incorrect romaji values in kana table
-- ぢ/ヂ should be "ji" (not "di"), づ/ヅ should be "zu" (not "du")
-- を/ヲ should be "o" (not "wo") per modern Japanese pronunciation
-- ぢゃ/ヂャ combo row should use ja/ju/jo (not dya/dyu/dyo)

-- Hiragana dakuten fixes
UPDATE kana SET romaji = 'ji' WHERE character = 'ぢ' AND romaji = 'di';
UPDATE kana SET romaji = 'zu' WHERE character = 'づ' AND romaji = 'du';

-- Katakana dakuten fixes
UPDATE kana SET romaji = 'ji' WHERE character = 'ヂ' AND romaji = 'di';
UPDATE kana SET romaji = 'zu' WHERE character = 'ヅ' AND romaji = 'du';

-- を/ヲ particle pronunciation fix
UPDATE kana SET romaji = 'o' WHERE character = 'を' AND romaji = 'wo';
UPDATE kana SET romaji = 'o' WHERE character = 'ヲ' AND romaji = 'wo';

-- Hiragana combo fixes (ぢゃ row)
UPDATE kana SET romaji = 'ja' WHERE character = 'ぢゃ' AND romaji = 'dya';
UPDATE kana SET romaji = 'ju' WHERE character = 'ぢゅ' AND romaji = 'dyu';
UPDATE kana SET romaji = 'jo' WHERE character = 'ぢょ' AND romaji = 'dyo';

-- Katakana combo fixes (ヂャ row)
UPDATE kana SET romaji = 'ja' WHERE character = 'ヂャ' AND romaji = 'dya';
UPDATE kana SET romaji = 'ju' WHERE character = 'ヂュ' AND romaji = 'dyu';
UPDATE kana SET romaji = 'jo' WHERE character = 'ヂョ' AND romaji = 'dyo';
