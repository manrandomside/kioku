export type KanaWithSrs = {
  id: string;
  character: string;
  romaji: string;
  category: string;
  rowGroup: string;
  columnPosition: number;
  audioUrl: string | null;
  srsStatus: "new" | "learning" | "review" | "relearning" | null;
};

// Row ordering for kana grid (traditional gojuon order)
export const BASIC_ROW_ORDER = ["a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa", "n"];
export const DAKUTEN_ROW_ORDER = ["ga", "za", "da", "ba", "pa"];
export const COMBO_ROW_ORDER = ["kya", "sha", "cha", "nya", "hya", "mya", "rya", "gya", "ja", "bya", "pya", "dya"];

export function getRowLabel(rowGroup: string): string {
  const labels: Record<string, string> = {
    a: "A", ka: "KA", sa: "SA", ta: "TA", na: "NA",
    ha: "HA", ma: "MA", ya: "YA", ra: "RA", wa: "WA", n: "N",
    ga: "GA", za: "ZA", da: "DA", ba: "BA", pa: "PA",
    kya: "KYA", sha: "SHA", cha: "CHA", nya: "NYA", hya: "HYA",
    mya: "MYA", rya: "RYA", gya: "GYA", ja: "JA", bya: "BYA",
    pya: "PYA", dya: "DYA",
  };
  return labels[rowGroup] ?? rowGroup.toUpperCase();
}
