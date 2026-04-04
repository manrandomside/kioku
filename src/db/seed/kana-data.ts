// Kana seed data: 214 characters total
// Hiragana basic (46) + dakuten (25) + combo (36) = 107
// Katakana basic (46) + dakuten (25) + combo (36) = 107

type KanaCategory =
  | "hiragana_basic"
  | "hiragana_dakuten"
  | "hiragana_combo"
  | "katakana_basic"
  | "katakana_dakuten"
  | "katakana_combo";

interface KanaSeedEntry {
  character: string;
  romaji: string;
  category: KanaCategory;
  rowGroup: string;
  columnPosition: number;
}

// columnPosition: 1=a, 2=i, 3=u, 4=e, 5=o (vowel order in row)

const HIRAGANA_BASIC: KanaSeedEntry[] = [
  // a-row
  { character: "あ", romaji: "a", category: "hiragana_basic", rowGroup: "a", columnPosition: 1 },
  { character: "い", romaji: "i", category: "hiragana_basic", rowGroup: "a", columnPosition: 2 },
  { character: "う", romaji: "u", category: "hiragana_basic", rowGroup: "a", columnPosition: 3 },
  { character: "え", romaji: "e", category: "hiragana_basic", rowGroup: "a", columnPosition: 4 },
  { character: "お", romaji: "o", category: "hiragana_basic", rowGroup: "a", columnPosition: 5 },
  // ka-row
  { character: "か", romaji: "ka", category: "hiragana_basic", rowGroup: "ka", columnPosition: 1 },
  { character: "き", romaji: "ki", category: "hiragana_basic", rowGroup: "ka", columnPosition: 2 },
  { character: "く", romaji: "ku", category: "hiragana_basic", rowGroup: "ka", columnPosition: 3 },
  { character: "け", romaji: "ke", category: "hiragana_basic", rowGroup: "ka", columnPosition: 4 },
  { character: "こ", romaji: "ko", category: "hiragana_basic", rowGroup: "ka", columnPosition: 5 },
  // sa-row
  { character: "さ", romaji: "sa", category: "hiragana_basic", rowGroup: "sa", columnPosition: 1 },
  { character: "し", romaji: "shi", category: "hiragana_basic", rowGroup: "sa", columnPosition: 2 },
  { character: "す", romaji: "su", category: "hiragana_basic", rowGroup: "sa", columnPosition: 3 },
  { character: "せ", romaji: "se", category: "hiragana_basic", rowGroup: "sa", columnPosition: 4 },
  { character: "そ", romaji: "so", category: "hiragana_basic", rowGroup: "sa", columnPosition: 5 },
  // ta-row
  { character: "た", romaji: "ta", category: "hiragana_basic", rowGroup: "ta", columnPosition: 1 },
  { character: "ち", romaji: "chi", category: "hiragana_basic", rowGroup: "ta", columnPosition: 2 },
  { character: "つ", romaji: "tsu", category: "hiragana_basic", rowGroup: "ta", columnPosition: 3 },
  { character: "て", romaji: "te", category: "hiragana_basic", rowGroup: "ta", columnPosition: 4 },
  { character: "と", romaji: "to", category: "hiragana_basic", rowGroup: "ta", columnPosition: 5 },
  // na-row
  { character: "な", romaji: "na", category: "hiragana_basic", rowGroup: "na", columnPosition: 1 },
  { character: "に", romaji: "ni", category: "hiragana_basic", rowGroup: "na", columnPosition: 2 },
  { character: "ぬ", romaji: "nu", category: "hiragana_basic", rowGroup: "na", columnPosition: 3 },
  { character: "ね", romaji: "ne", category: "hiragana_basic", rowGroup: "na", columnPosition: 4 },
  { character: "の", romaji: "no", category: "hiragana_basic", rowGroup: "na", columnPosition: 5 },
  // ha-row
  { character: "は", romaji: "ha", category: "hiragana_basic", rowGroup: "ha", columnPosition: 1 },
  { character: "ひ", romaji: "hi", category: "hiragana_basic", rowGroup: "ha", columnPosition: 2 },
  { character: "ふ", romaji: "fu", category: "hiragana_basic", rowGroup: "ha", columnPosition: 3 },
  { character: "へ", romaji: "he", category: "hiragana_basic", rowGroup: "ha", columnPosition: 4 },
  { character: "ほ", romaji: "ho", category: "hiragana_basic", rowGroup: "ha", columnPosition: 5 },
  // ma-row
  { character: "ま", romaji: "ma", category: "hiragana_basic", rowGroup: "ma", columnPosition: 1 },
  { character: "み", romaji: "mi", category: "hiragana_basic", rowGroup: "ma", columnPosition: 2 },
  { character: "む", romaji: "mu", category: "hiragana_basic", rowGroup: "ma", columnPosition: 3 },
  { character: "め", romaji: "me", category: "hiragana_basic", rowGroup: "ma", columnPosition: 4 },
  { character: "も", romaji: "mo", category: "hiragana_basic", rowGroup: "ma", columnPosition: 5 },
  // ya-row
  { character: "や", romaji: "ya", category: "hiragana_basic", rowGroup: "ya", columnPosition: 1 },
  { character: "ゆ", romaji: "yu", category: "hiragana_basic", rowGroup: "ya", columnPosition: 3 },
  { character: "よ", romaji: "yo", category: "hiragana_basic", rowGroup: "ya", columnPosition: 5 },
  // ra-row
  { character: "ら", romaji: "ra", category: "hiragana_basic", rowGroup: "ra", columnPosition: 1 },
  { character: "り", romaji: "ri", category: "hiragana_basic", rowGroup: "ra", columnPosition: 2 },
  { character: "る", romaji: "ru", category: "hiragana_basic", rowGroup: "ra", columnPosition: 3 },
  { character: "れ", romaji: "re", category: "hiragana_basic", rowGroup: "ra", columnPosition: 4 },
  { character: "ろ", romaji: "ro", category: "hiragana_basic", rowGroup: "ra", columnPosition: 5 },
  // wa-row
  { character: "わ", romaji: "wa", category: "hiragana_basic", rowGroup: "wa", columnPosition: 1 },
  { character: "を", romaji: "o", category: "hiragana_basic", rowGroup: "wa", columnPosition: 5 },
  // n
  { character: "ん", romaji: "n", category: "hiragana_basic", rowGroup: "n", columnPosition: 1 },
];

const HIRAGANA_DAKUTEN: KanaSeedEntry[] = [
  // ga-row
  { character: "が", romaji: "ga", category: "hiragana_dakuten", rowGroup: "ga", columnPosition: 1 },
  { character: "ぎ", romaji: "gi", category: "hiragana_dakuten", rowGroup: "ga", columnPosition: 2 },
  { character: "ぐ", romaji: "gu", category: "hiragana_dakuten", rowGroup: "ga", columnPosition: 3 },
  { character: "げ", romaji: "ge", category: "hiragana_dakuten", rowGroup: "ga", columnPosition: 4 },
  { character: "ご", romaji: "go", category: "hiragana_dakuten", rowGroup: "ga", columnPosition: 5 },
  // za-row
  { character: "ざ", romaji: "za", category: "hiragana_dakuten", rowGroup: "za", columnPosition: 1 },
  { character: "じ", romaji: "ji", category: "hiragana_dakuten", rowGroup: "za", columnPosition: 2 },
  { character: "ず", romaji: "zu", category: "hiragana_dakuten", rowGroup: "za", columnPosition: 3 },
  { character: "ぜ", romaji: "ze", category: "hiragana_dakuten", rowGroup: "za", columnPosition: 4 },
  { character: "ぞ", romaji: "zo", category: "hiragana_dakuten", rowGroup: "za", columnPosition: 5 },
  // da-row
  { character: "だ", romaji: "da", category: "hiragana_dakuten", rowGroup: "da", columnPosition: 1 },
  { character: "ぢ", romaji: "ji", category: "hiragana_dakuten", rowGroup: "da", columnPosition: 2 },
  { character: "づ", romaji: "zu", category: "hiragana_dakuten", rowGroup: "da", columnPosition: 3 },
  { character: "で", romaji: "de", category: "hiragana_dakuten", rowGroup: "da", columnPosition: 4 },
  { character: "ど", romaji: "do", category: "hiragana_dakuten", rowGroup: "da", columnPosition: 5 },
  // ba-row
  { character: "ば", romaji: "ba", category: "hiragana_dakuten", rowGroup: "ba", columnPosition: 1 },
  { character: "び", romaji: "bi", category: "hiragana_dakuten", rowGroup: "ba", columnPosition: 2 },
  { character: "ぶ", romaji: "bu", category: "hiragana_dakuten", rowGroup: "ba", columnPosition: 3 },
  { character: "べ", romaji: "be", category: "hiragana_dakuten", rowGroup: "ba", columnPosition: 4 },
  { character: "ぼ", romaji: "bo", category: "hiragana_dakuten", rowGroup: "ba", columnPosition: 5 },
  // pa-row (handakuten)
  { character: "ぱ", romaji: "pa", category: "hiragana_dakuten", rowGroup: "pa", columnPosition: 1 },
  { character: "ぴ", romaji: "pi", category: "hiragana_dakuten", rowGroup: "pa", columnPosition: 2 },
  { character: "ぷ", romaji: "pu", category: "hiragana_dakuten", rowGroup: "pa", columnPosition: 3 },
  { character: "ぺ", romaji: "pe", category: "hiragana_dakuten", rowGroup: "pa", columnPosition: 4 },
  { character: "ぽ", romaji: "po", category: "hiragana_dakuten", rowGroup: "pa", columnPosition: 5 },
];

const HIRAGANA_COMBO: KanaSeedEntry[] = [
  // kya-row
  { character: "きゃ", romaji: "kya", category: "hiragana_combo", rowGroup: "kya", columnPosition: 1 },
  { character: "きゅ", romaji: "kyu", category: "hiragana_combo", rowGroup: "kya", columnPosition: 2 },
  { character: "きょ", romaji: "kyo", category: "hiragana_combo", rowGroup: "kya", columnPosition: 3 },
  // sha-row
  { character: "しゃ", romaji: "sha", category: "hiragana_combo", rowGroup: "sha", columnPosition: 1 },
  { character: "しゅ", romaji: "shu", category: "hiragana_combo", rowGroup: "sha", columnPosition: 2 },
  { character: "しょ", romaji: "sho", category: "hiragana_combo", rowGroup: "sha", columnPosition: 3 },
  // cha-row
  { character: "ちゃ", romaji: "cha", category: "hiragana_combo", rowGroup: "cha", columnPosition: 1 },
  { character: "ちゅ", romaji: "chu", category: "hiragana_combo", rowGroup: "cha", columnPosition: 2 },
  { character: "ちょ", romaji: "cho", category: "hiragana_combo", rowGroup: "cha", columnPosition: 3 },
  // nya-row
  { character: "にゃ", romaji: "nya", category: "hiragana_combo", rowGroup: "nya", columnPosition: 1 },
  { character: "にゅ", romaji: "nyu", category: "hiragana_combo", rowGroup: "nya", columnPosition: 2 },
  { character: "にょ", romaji: "nyo", category: "hiragana_combo", rowGroup: "nya", columnPosition: 3 },
  // hya-row
  { character: "ひゃ", romaji: "hya", category: "hiragana_combo", rowGroup: "hya", columnPosition: 1 },
  { character: "ひゅ", romaji: "hyu", category: "hiragana_combo", rowGroup: "hya", columnPosition: 2 },
  { character: "ひょ", romaji: "hyo", category: "hiragana_combo", rowGroup: "hya", columnPosition: 3 },
  // mya-row
  { character: "みゃ", romaji: "mya", category: "hiragana_combo", rowGroup: "mya", columnPosition: 1 },
  { character: "みゅ", romaji: "myu", category: "hiragana_combo", rowGroup: "mya", columnPosition: 2 },
  { character: "みょ", romaji: "myo", category: "hiragana_combo", rowGroup: "mya", columnPosition: 3 },
  // rya-row
  { character: "りゃ", romaji: "rya", category: "hiragana_combo", rowGroup: "rya", columnPosition: 1 },
  { character: "りゅ", romaji: "ryu", category: "hiragana_combo", rowGroup: "rya", columnPosition: 2 },
  { character: "りょ", romaji: "ryo", category: "hiragana_combo", rowGroup: "rya", columnPosition: 3 },
  // gya-row
  { character: "ぎゃ", romaji: "gya", category: "hiragana_combo", rowGroup: "gya", columnPosition: 1 },
  { character: "ぎゅ", romaji: "gyu", category: "hiragana_combo", rowGroup: "gya", columnPosition: 2 },
  { character: "ぎょ", romaji: "gyo", category: "hiragana_combo", rowGroup: "gya", columnPosition: 3 },
  // ja-row
  { character: "じゃ", romaji: "ja", category: "hiragana_combo", rowGroup: "ja", columnPosition: 1 },
  { character: "じゅ", romaji: "ju", category: "hiragana_combo", rowGroup: "ja", columnPosition: 2 },
  { character: "じょ", romaji: "jo", category: "hiragana_combo", rowGroup: "ja", columnPosition: 3 },
  // bya-row
  { character: "びゃ", romaji: "bya", category: "hiragana_combo", rowGroup: "bya", columnPosition: 1 },
  { character: "びゅ", romaji: "byu", category: "hiragana_combo", rowGroup: "bya", columnPosition: 2 },
  { character: "びょ", romaji: "byo", category: "hiragana_combo", rowGroup: "bya", columnPosition: 3 },
  // pya-row
  { character: "ぴゃ", romaji: "pya", category: "hiragana_combo", rowGroup: "pya", columnPosition: 1 },
  { character: "ぴゅ", romaji: "pyu", category: "hiragana_combo", rowGroup: "pya", columnPosition: 2 },
  { character: "ぴょ", romaji: "pyo", category: "hiragana_combo", rowGroup: "pya", columnPosition: 3 },
  // dya-row (less common but standard)
  { character: "ぢゃ", romaji: "ja", category: "hiragana_combo", rowGroup: "dya", columnPosition: 1 },
  { character: "ぢゅ", romaji: "ju", category: "hiragana_combo", rowGroup: "dya", columnPosition: 2 },
  { character: "ぢょ", romaji: "jo", category: "hiragana_combo", rowGroup: "dya", columnPosition: 3 },
];

const KATAKANA_BASIC: KanaSeedEntry[] = [
  // a-row
  { character: "ア", romaji: "a", category: "katakana_basic", rowGroup: "a", columnPosition: 1 },
  { character: "イ", romaji: "i", category: "katakana_basic", rowGroup: "a", columnPosition: 2 },
  { character: "ウ", romaji: "u", category: "katakana_basic", rowGroup: "a", columnPosition: 3 },
  { character: "エ", romaji: "e", category: "katakana_basic", rowGroup: "a", columnPosition: 4 },
  { character: "オ", romaji: "o", category: "katakana_basic", rowGroup: "a", columnPosition: 5 },
  // ka-row
  { character: "カ", romaji: "ka", category: "katakana_basic", rowGroup: "ka", columnPosition: 1 },
  { character: "キ", romaji: "ki", category: "katakana_basic", rowGroup: "ka", columnPosition: 2 },
  { character: "ク", romaji: "ku", category: "katakana_basic", rowGroup: "ka", columnPosition: 3 },
  { character: "ケ", romaji: "ke", category: "katakana_basic", rowGroup: "ka", columnPosition: 4 },
  { character: "コ", romaji: "ko", category: "katakana_basic", rowGroup: "ka", columnPosition: 5 },
  // sa-row
  { character: "サ", romaji: "sa", category: "katakana_basic", rowGroup: "sa", columnPosition: 1 },
  { character: "シ", romaji: "shi", category: "katakana_basic", rowGroup: "sa", columnPosition: 2 },
  { character: "ス", romaji: "su", category: "katakana_basic", rowGroup: "sa", columnPosition: 3 },
  { character: "セ", romaji: "se", category: "katakana_basic", rowGroup: "sa", columnPosition: 4 },
  { character: "ソ", romaji: "so", category: "katakana_basic", rowGroup: "sa", columnPosition: 5 },
  // ta-row
  { character: "タ", romaji: "ta", category: "katakana_basic", rowGroup: "ta", columnPosition: 1 },
  { character: "チ", romaji: "chi", category: "katakana_basic", rowGroup: "ta", columnPosition: 2 },
  { character: "ツ", romaji: "tsu", category: "katakana_basic", rowGroup: "ta", columnPosition: 3 },
  { character: "テ", romaji: "te", category: "katakana_basic", rowGroup: "ta", columnPosition: 4 },
  { character: "ト", romaji: "to", category: "katakana_basic", rowGroup: "ta", columnPosition: 5 },
  // na-row
  { character: "ナ", romaji: "na", category: "katakana_basic", rowGroup: "na", columnPosition: 1 },
  { character: "ニ", romaji: "ni", category: "katakana_basic", rowGroup: "na", columnPosition: 2 },
  { character: "ヌ", romaji: "nu", category: "katakana_basic", rowGroup: "na", columnPosition: 3 },
  { character: "ネ", romaji: "ne", category: "katakana_basic", rowGroup: "na", columnPosition: 4 },
  { character: "ノ", romaji: "no", category: "katakana_basic", rowGroup: "na", columnPosition: 5 },
  // ha-row
  { character: "ハ", romaji: "ha", category: "katakana_basic", rowGroup: "ha", columnPosition: 1 },
  { character: "ヒ", romaji: "hi", category: "katakana_basic", rowGroup: "ha", columnPosition: 2 },
  { character: "フ", romaji: "fu", category: "katakana_basic", rowGroup: "ha", columnPosition: 3 },
  { character: "ヘ", romaji: "he", category: "katakana_basic", rowGroup: "ha", columnPosition: 4 },
  { character: "ホ", romaji: "ho", category: "katakana_basic", rowGroup: "ha", columnPosition: 5 },
  // ma-row
  { character: "マ", romaji: "ma", category: "katakana_basic", rowGroup: "ma", columnPosition: 1 },
  { character: "ミ", romaji: "mi", category: "katakana_basic", rowGroup: "ma", columnPosition: 2 },
  { character: "ム", romaji: "mu", category: "katakana_basic", rowGroup: "ma", columnPosition: 3 },
  { character: "メ", romaji: "me", category: "katakana_basic", rowGroup: "ma", columnPosition: 4 },
  { character: "モ", romaji: "mo", category: "katakana_basic", rowGroup: "ma", columnPosition: 5 },
  // ya-row
  { character: "ヤ", romaji: "ya", category: "katakana_basic", rowGroup: "ya", columnPosition: 1 },
  { character: "ユ", romaji: "yu", category: "katakana_basic", rowGroup: "ya", columnPosition: 3 },
  { character: "ヨ", romaji: "yo", category: "katakana_basic", rowGroup: "ya", columnPosition: 5 },
  // ra-row
  { character: "ラ", romaji: "ra", category: "katakana_basic", rowGroup: "ra", columnPosition: 1 },
  { character: "リ", romaji: "ri", category: "katakana_basic", rowGroup: "ra", columnPosition: 2 },
  { character: "ル", romaji: "ru", category: "katakana_basic", rowGroup: "ra", columnPosition: 3 },
  { character: "レ", romaji: "re", category: "katakana_basic", rowGroup: "ra", columnPosition: 4 },
  { character: "ロ", romaji: "ro", category: "katakana_basic", rowGroup: "ra", columnPosition: 5 },
  // wa-row
  { character: "ワ", romaji: "wa", category: "katakana_basic", rowGroup: "wa", columnPosition: 1 },
  { character: "ヲ", romaji: "o", category: "katakana_basic", rowGroup: "wa", columnPosition: 5 },
  // n
  { character: "ン", romaji: "n", category: "katakana_basic", rowGroup: "n", columnPosition: 1 },
];

const KATAKANA_DAKUTEN: KanaSeedEntry[] = [
  // ga-row
  { character: "ガ", romaji: "ga", category: "katakana_dakuten", rowGroup: "ga", columnPosition: 1 },
  { character: "ギ", romaji: "gi", category: "katakana_dakuten", rowGroup: "ga", columnPosition: 2 },
  { character: "グ", romaji: "gu", category: "katakana_dakuten", rowGroup: "ga", columnPosition: 3 },
  { character: "ゲ", romaji: "ge", category: "katakana_dakuten", rowGroup: "ga", columnPosition: 4 },
  { character: "ゴ", romaji: "go", category: "katakana_dakuten", rowGroup: "ga", columnPosition: 5 },
  // za-row
  { character: "ザ", romaji: "za", category: "katakana_dakuten", rowGroup: "za", columnPosition: 1 },
  { character: "ジ", romaji: "ji", category: "katakana_dakuten", rowGroup: "za", columnPosition: 2 },
  { character: "ズ", romaji: "zu", category: "katakana_dakuten", rowGroup: "za", columnPosition: 3 },
  { character: "ゼ", romaji: "ze", category: "katakana_dakuten", rowGroup: "za", columnPosition: 4 },
  { character: "ゾ", romaji: "zo", category: "katakana_dakuten", rowGroup: "za", columnPosition: 5 },
  // da-row
  { character: "ダ", romaji: "da", category: "katakana_dakuten", rowGroup: "da", columnPosition: 1 },
  { character: "ヂ", romaji: "ji", category: "katakana_dakuten", rowGroup: "da", columnPosition: 2 },
  { character: "ヅ", romaji: "zu", category: "katakana_dakuten", rowGroup: "da", columnPosition: 3 },
  { character: "デ", romaji: "de", category: "katakana_dakuten", rowGroup: "da", columnPosition: 4 },
  { character: "ド", romaji: "do", category: "katakana_dakuten", rowGroup: "da", columnPosition: 5 },
  // ba-row
  { character: "バ", romaji: "ba", category: "katakana_dakuten", rowGroup: "ba", columnPosition: 1 },
  { character: "ビ", romaji: "bi", category: "katakana_dakuten", rowGroup: "ba", columnPosition: 2 },
  { character: "ブ", romaji: "bu", category: "katakana_dakuten", rowGroup: "ba", columnPosition: 3 },
  { character: "ベ", romaji: "be", category: "katakana_dakuten", rowGroup: "ba", columnPosition: 4 },
  { character: "ボ", romaji: "bo", category: "katakana_dakuten", rowGroup: "ba", columnPosition: 5 },
  // pa-row (handakuten)
  { character: "パ", romaji: "pa", category: "katakana_dakuten", rowGroup: "pa", columnPosition: 1 },
  { character: "ピ", romaji: "pi", category: "katakana_dakuten", rowGroup: "pa", columnPosition: 2 },
  { character: "プ", romaji: "pu", category: "katakana_dakuten", rowGroup: "pa", columnPosition: 3 },
  { character: "ペ", romaji: "pe", category: "katakana_dakuten", rowGroup: "pa", columnPosition: 4 },
  { character: "ポ", romaji: "po", category: "katakana_dakuten", rowGroup: "pa", columnPosition: 5 },
];

const KATAKANA_COMBO: KanaSeedEntry[] = [
  // kya-row
  { character: "キャ", romaji: "kya", category: "katakana_combo", rowGroup: "kya", columnPosition: 1 },
  { character: "キュ", romaji: "kyu", category: "katakana_combo", rowGroup: "kya", columnPosition: 2 },
  { character: "キョ", romaji: "kyo", category: "katakana_combo", rowGroup: "kya", columnPosition: 3 },
  // sha-row
  { character: "シャ", romaji: "sha", category: "katakana_combo", rowGroup: "sha", columnPosition: 1 },
  { character: "シュ", romaji: "shu", category: "katakana_combo", rowGroup: "sha", columnPosition: 2 },
  { character: "ショ", romaji: "sho", category: "katakana_combo", rowGroup: "sha", columnPosition: 3 },
  // cha-row
  { character: "チャ", romaji: "cha", category: "katakana_combo", rowGroup: "cha", columnPosition: 1 },
  { character: "チュ", romaji: "chu", category: "katakana_combo", rowGroup: "cha", columnPosition: 2 },
  { character: "チョ", romaji: "cho", category: "katakana_combo", rowGroup: "cha", columnPosition: 3 },
  // nya-row
  { character: "ニャ", romaji: "nya", category: "katakana_combo", rowGroup: "nya", columnPosition: 1 },
  { character: "ニュ", romaji: "nyu", category: "katakana_combo", rowGroup: "nya", columnPosition: 2 },
  { character: "ニョ", romaji: "nyo", category: "katakana_combo", rowGroup: "nya", columnPosition: 3 },
  // hya-row
  { character: "ヒャ", romaji: "hya", category: "katakana_combo", rowGroup: "hya", columnPosition: 1 },
  { character: "ヒュ", romaji: "hyu", category: "katakana_combo", rowGroup: "hya", columnPosition: 2 },
  { character: "ヒョ", romaji: "hyo", category: "katakana_combo", rowGroup: "hya", columnPosition: 3 },
  // mya-row
  { character: "ミャ", romaji: "mya", category: "katakana_combo", rowGroup: "mya", columnPosition: 1 },
  { character: "ミュ", romaji: "myu", category: "katakana_combo", rowGroup: "mya", columnPosition: 2 },
  { character: "ミョ", romaji: "myo", category: "katakana_combo", rowGroup: "mya", columnPosition: 3 },
  // rya-row
  { character: "リャ", romaji: "rya", category: "katakana_combo", rowGroup: "rya", columnPosition: 1 },
  { character: "リュ", romaji: "ryu", category: "katakana_combo", rowGroup: "rya", columnPosition: 2 },
  { character: "リョ", romaji: "ryo", category: "katakana_combo", rowGroup: "rya", columnPosition: 3 },
  // gya-row
  { character: "ギャ", romaji: "gya", category: "katakana_combo", rowGroup: "gya", columnPosition: 1 },
  { character: "ギュ", romaji: "gyu", category: "katakana_combo", rowGroup: "gya", columnPosition: 2 },
  { character: "ギョ", romaji: "gyo", category: "katakana_combo", rowGroup: "gya", columnPosition: 3 },
  // ja-row
  { character: "ジャ", romaji: "ja", category: "katakana_combo", rowGroup: "ja", columnPosition: 1 },
  { character: "ジュ", romaji: "ju", category: "katakana_combo", rowGroup: "ja", columnPosition: 2 },
  { character: "ジョ", romaji: "jo", category: "katakana_combo", rowGroup: "ja", columnPosition: 3 },
  // bya-row
  { character: "ビャ", romaji: "bya", category: "katakana_combo", rowGroup: "bya", columnPosition: 1 },
  { character: "ビュ", romaji: "byu", category: "katakana_combo", rowGroup: "bya", columnPosition: 2 },
  { character: "ビョ", romaji: "byo", category: "katakana_combo", rowGroup: "bya", columnPosition: 3 },
  // pya-row
  { character: "ピャ", romaji: "pya", category: "katakana_combo", rowGroup: "pya", columnPosition: 1 },
  { character: "ピュ", romaji: "pyu", category: "katakana_combo", rowGroup: "pya", columnPosition: 2 },
  { character: "ピョ", romaji: "pyo", category: "katakana_combo", rowGroup: "pya", columnPosition: 3 },
  // dya-row
  { character: "ヂャ", romaji: "ja", category: "katakana_combo", rowGroup: "dya", columnPosition: 1 },
  { character: "ヂュ", romaji: "ju", category: "katakana_combo", rowGroup: "dya", columnPosition: 2 },
  { character: "ヂョ", romaji: "jo", category: "katakana_combo", rowGroup: "dya", columnPosition: 3 },
];

export const ALL_KANA: KanaSeedEntry[] = [
  ...HIRAGANA_BASIC,
  ...HIRAGANA_DAKUTEN,
  ...HIRAGANA_COMBO,
  ...KATAKANA_BASIC,
  ...KATAKANA_DAKUTEN,
  ...KATAKANA_COMBO,
];
