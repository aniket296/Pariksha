/**
 * Lightweight class name merger.
 * Filters falsy values and joins with spaces.
 * Sufficient for our controlled component library.
 */
export function cn(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(' ')
}
