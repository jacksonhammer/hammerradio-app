const CACHE = new Map();

/**
 * Fetches album art URL from iTunes Search API.
 * nowPlayingStr is typically "Artist - Title" from Icecast.
 * Returns a URL string or null.
 */
export async function fetchAlbumArt(nowPlayingStr) {
  if (
    !nowPlayingStr ||
    nowPlayingStr === 'Hammer Radio' ||
    nowPlayingStr === 'Live Stream'
  ) {
    return null;
  }

  if (CACHE.has(nowPlayingStr)) return CACHE.get(nowPlayingStr);

  try {
    const query = encodeURIComponent(nowPlayingStr.replace(' - ', ' '));
    const res = await Promise.race([
      fetch(
        `https://itunes.apple.com/search?term=${query}&media=music&entity=musicTrack&limit=1`
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      ),
    ]);
    const data = await res.json();
    const url100 = data?.results?.[0]?.artworkUrl100;
    // Upgrade to 300×300
    const art = url100
      ? url100.replace('100x100bb', '300x300bb').replace('100x100', '300x300')
      : null;
    CACHE.set(nowPlayingStr, art);
    return art;
  } catch {
    CACHE.set(nowPlayingStr, null);
    return null;
  }
}
