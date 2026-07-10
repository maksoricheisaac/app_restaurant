/**
 * Strips all HTML/script tags and trims whitespace from a user-supplied string.
 * Prevents stored-XSS when these values are rendered in the admin dashboard.
 */
export function stripHtml(
  value: string | undefined | null,
): string | undefined {
  if (value == null) return undefined;
  return (
    value
      .replace(/<[^>]*>/g, '') // remove tags
      .replace(/&[a-z#0-9]+;/gi, ' ') // decode common HTML entities to space
      .trim() || undefined
  );
}
