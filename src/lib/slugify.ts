/**
 * Turns a display name into a URL-safe slug. Vietnamese and other accented
 * characters are transliterated via NFD normalization (e.g. "Đồ Điện Tử" ->
 * "do-dien-tu") so KOL store names produce readable URLs.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
