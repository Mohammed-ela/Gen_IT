const STORAGE_KEY = "gen_it_favorites";

export function getFavoriteSirens(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function isFavoriteSiren(siren: string): boolean {
  return getFavoriteSirens().includes(siren);
}

export function toggleFavoriteSiren(siren: string): string[] {
  if (typeof window === "undefined") return [];
  const favorites = new Set(getFavoriteSirens());
  if (favorites.has(siren)) favorites.delete(siren);
  else favorites.add(siren);
  const next = [...favorites];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("favorites:changed", { detail: next }));
  return next;
}
