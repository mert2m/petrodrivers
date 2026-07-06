/** Minimal className joiner (falsy-safe). NativeWind resolves conflicting utilities by order (last wins). */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
