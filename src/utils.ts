export function areEqual(a: string, b: string) {
  if (!a || !b) return a === b;
  return a.toLowerCase() === b.toLowerCase();
}
