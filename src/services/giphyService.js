// ── Giphy Service ─────────────────────────────────────────────────
const GIPHY_KEY = '7J1K0IUqnOdJIU5LGEyu2HcoqLv1vrtP';
const BASE      = 'https://api.giphy.com/v1/gifs';

export async function fetchGifs(query = '', limit = 24) {
  const url = query.trim()
    ? `${BASE}/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&rating=pg`
    : `${BASE}/trending?api_key=${GIPHY_KEY}&limit=${limit}&rating=pg`;

  const res  = await fetch(url);
  const data = await res.json();

  return (data.data || []).map(gif => ({
    id:         gif.id,
    title:      gif.title || '',
    url:        gif.images.fixed_width.url,
    previewUrl: gif.images.fixed_width_small?.url || gif.images.fixed_width.url,
    width:      parseInt(gif.images.fixed_width.width  || '200', 10),
    height:     parseInt(gif.images.fixed_width.height || '200', 10),
  }));
}
