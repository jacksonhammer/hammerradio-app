// src/services/musicKitService.js
// Apple MusicKit API — developer token valid ~6 months from build date
// Refresh by re-running the token generator script with your .p8 key

const DEVELOPER_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjlOOEpLNTY0N0YiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJEN0szMjlKNDM5IiwiaWF0IjoxNzgwNTI1NDk0LCJleHAiOjE3OTYzMDI0OTR9.ia7h7PnEmBuFxZBRJLhbpH0y3bQV4Mi8hn6lP0HGHA4UMa7YUHbtFdJIa-2KW2Nlbf_7QwvIe4bwPfHukx5HYQ';
const BASE = 'https://api.music.apple.com/v1/catalog/us';

export async function searchMusic(term, limit = 20) {
  if (!term || term.trim().length < 2) return [];
  try {
    const url = `${BASE}/search?term=${encodeURIComponent(term.trim())}&types=songs&limit=${limit}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${DEVELOPER_TOKEN}` },
    });
    if (!res.ok) throw new Error(`MusicKit API ${res.status}`);
    const data = await res.json();
    const songs = data?.results?.songs?.data || [];
    return songs.map(s => ({
      id: s.id,
      title: s.attributes?.name || 'Unknown',
      artist: s.attributes?.artistName || 'Unknown',
      album: s.attributes?.albumName || '',
      artwork: s.attributes?.artwork
        ? s.attributes.artwork.url.replace('{w}', '100').replace('{h}', '100')
        : null,
      durationMs: s.attributes?.durationInMillis || 0,
    }));
  } catch (e) {
    console.warn('[MusicKit search error]', e.message);
    return [];
  }
}

export async function getTopSongs(limit = 10) {
  try {
    const url = `${BASE}/charts?types=songs&limit=${limit}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${DEVELOPER_TOKEN}` },
    });
    if (!res.ok) throw new Error(`MusicKit charts ${res.status}`);
    const data = await res.json();
    const charts = data?.results?.songs?.[0]?.data || [];
    return charts.map(s => ({
      id: s.id,
      title: s.attributes?.name || 'Unknown',
      artist: s.attributes?.artistName || 'Unknown',
      album: s.attributes?.albumName || '',
      artwork: s.attributes?.artwork
        ? s.attributes.artwork.url.replace('{w}', '100').replace('{h}', '100')
        : null,
      durationMs: s.attributes?.durationInMillis || 0,
    }));
  } catch (e) {
    console.warn('[MusicKit charts error]', e.message);
    return [];
  }
}
