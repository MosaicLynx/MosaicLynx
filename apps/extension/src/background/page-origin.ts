/**
 * Return the canonical origin allowed for the initial Chrome milestone.
 * Production pages must use HTTPS; plain HTTP is reserved for loopback
 * development pages only.
 */
export const pageOrigin = (url: string): string | undefined => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return parsed.origin;
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '[::1]')
    )
      return parsed.origin;
    return undefined;
  } catch {
    return undefined;
  }
};
