/**
 * Extract postId và username từ X/Twitter link
 * @param link Link X/Twitter
 * @returns { postId, username } hoặc null nếu không hợp lệ
 */
export function extractPostIdAndUsernameFromLink(link: string): {
  postId: string | null;
  username: string | null;
} {
  const regex =
    /https?:\/\/(www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)([?#].*)?/i;
  const match = link.match(regex);
  return { postId: match?.[4] || null, username: match?.[3] || null };
}
/**
 * Link utility functions for the post links scene
 */

/**
 * Check if text contains Twitter/X links
 */
export function isXPostLinks(text: string): boolean {
  // Enhanced regex to match X/Twitter links with query parameters
  const xRegex =
    /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+([?#][^\\s]*)?/i;
  return xRegex.test(text);
}

/**
 * Extract Twitter/X links from text
 */
export function extractXLinks(text: string): string[] {
  // Enhanced regex to handle query parameters and fragments in URLs
  const xRegex =
    /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+([?#][^\\s]*)?/gi;
  const matches = text.match(xRegex);
  return matches ? [...new Set(matches)] : []; // Remove duplicates
}

/**
 * Extract username from X/Twitter link
 */
export function extractUsernameFromLink(link: string): string | null {
  // Enhanced regex that handles query parameters and fragments in URLs
  const regex =
    /https?:\/\/(www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/\d+([?#].*)?/i;
  const match = link.match(regex);
  return match ? match[3] : null;
}
