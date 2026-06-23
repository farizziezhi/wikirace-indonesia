/**
 * Helper localStorage untuk identitas pemain di sisi browser.
 * - clientId: dibuat sekali per browser (UUID), dipakai sebagai identitas
 *   konsisten antar tab session.
 * - username: dipersist agar pemain tidak perlu mengetik ulang.
 *
 * Semua fungsi aman dipanggil dari client component saja
 * (di server, `localStorage` tidak ada — fungsi akan return string kosong).
 */

const CLIENT_ID_KEY = "wikirace:clientId";
const USERNAME_KEY = "wikirace:username";

/** Ambil clientId dari localStorage, atau buat baru jika belum ada. */
export function getOrCreateClientId(): string {
  if (typeof window === "undefined") return "";

  let id = window.localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = window.crypto.randomUUID();
    window.localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

/** Ambil username terakhir yang dipakai (string kosong jika belum ada). */
export function getSavedUsername(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(USERNAME_KEY) ?? "";
}

/** Simpan username untuk session berikutnya. */
export function saveUsername(username: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERNAME_KEY, username);
}

const LANGUAGE_KEY = "wikirace:language";

/** Ambil bahasa terpilih terakhir dari localStorage (default 'id'). */
export function getSavedLanguage(): "id" | "en" {
  if (typeof window === "undefined") return "id";
  const val = window.localStorage.getItem(LANGUAGE_KEY);
  return val === "en" ? "en" : "id";
}

/** Simpan pilihan bahasa pengguna. */
export function saveLanguage(lang: "id" | "en"): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_KEY, lang);
}

/* ------------------------------------------------------------------ */
/*  Bahasa Tampilan UI — independen dari bahasa artikel Wikipedia      */
/* ------------------------------------------------------------------ */

const UI_LANGUAGE_KEY = "wikirace:uiLanguage";

/** Ambil bahasa UI dari localStorage (default 'en'). */
export function getSavedUiLanguage(): "id" | "en" {
  if (typeof window === "undefined") return "en";
  const val = window.localStorage.getItem(UI_LANGUAGE_KEY);
  return val === "id" ? "id" : "en";
}

/** Simpan pilihan bahasa UI. */
export function saveUiLanguage(lang: "id" | "en"): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(UI_LANGUAGE_KEY, lang);
}

/** Simpan token player untuk room tertentu di sessionStorage. */
export function savePlayerToken(roomId: string, token: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`wikirace:token:${roomId.toUpperCase()}`, token);
}

/** Ambil token player untuk room tertentu dari sessionStorage. */
export function getPlayerToken(roomId: string): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(`wikirace:token:${roomId.toUpperCase()}`) ?? "";
}


