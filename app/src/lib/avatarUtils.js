/**
 * avatarUtils.js
 *
 * Shared avatar fallback utilities.
 * Provides consistent initials-based avatars using ui-avatars.com
 * with brand-consistent purple colors, plus a safety-net onError handler.
 */

const DEFAULT_AVATAR = '/assets/images/default-avatar.jpg';

/**
 * Generate a ui-avatars.com URL for initials-based avatar.
 * Uses consistent brand purple colors (E9E0F7 bg / 6D31C2 text).
 *
 * @param {string} name - User's display name (first name, full name, etc.)
 * @returns {string} URL to initials avatar image
 */
export function getInitialsAvatarUrl(name) {
  const safeName = (name && typeof name === 'string' && name.trim()) || '?';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=E9E0F7&color=6D31C2&rounded=true&bold=true&size=128`;
}

/**
 * onError handler for <img> elements that loads the local default avatar
 * as a last-resort fallback. Prevents infinite error loops.
 *
 * Usage: <img onError={handleAvatarError} />
 *
 * @param {Event} e - The error event from the <img> element
 */
export function handleAvatarError(e) {
  e.target.onerror = null; // prevent infinite loop
  e.target.src = DEFAULT_AVATAR;
}

export { DEFAULT_AVATAR };
