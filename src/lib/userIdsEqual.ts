/** Compare UUID strings from API or localStorage (case/whitespace tolerant). */
export function userIdsEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const x = typeof a === "string" ? a.trim().toLowerCase() : "";
  const y = typeof b === "string" ? b.trim().toLowerCase() : "";
  if (!x || !y) return false;
  return x === y;
}
