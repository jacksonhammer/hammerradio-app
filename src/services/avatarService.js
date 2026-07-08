/**
 * Resolve the best avatar URL for a user profile.
 *
 * Priority:
 *   1. Instagram handle  → unavatar.io/instagram/{handle}
 *   2. Facebook handle   → unavatar.io/facebook/{handle}
 *   3. Generated initials (ui-avatars.com) — always works, no API key
 */
export function getAvatarUrl({ displayName = '', instagram = '', facebook = '' }) {
  const igHandle = instagram.replace(/^@/, '').trim();
  const fbHandle = facebook.replace(/^@/, '').trim();

  if (igHandle) {
    return `https://unavatar.io/instagram/${igHandle}`;
  }
  if (fbHandle) {
    return `https://unavatar.io/facebook/${fbHandle}`;
  }
  return generatedAvatar(displayName);
}

export function generatedAvatar(displayName = '') {
  const name = encodeURIComponent(displayName || '?');
  return `https://ui-avatars.com/api/?name=${name}&background=E8650A&color=fff&size=200&bold=true&rounded=true`;
}
