// src/services/dailyService.js
// Daily.co call-in service for Hammer Radio

const DAILY_API_KEY = 'e2151fb1cf021a6eefe550ca21439cd106f9ad3027cc82c57fea03ba3f0a25de';
const ROOM_NAME = 'hammer-radio-call-in';
const ROOM_URL = 'https://hammerradio.daily.co/hammer-radio-call-in';

/**
 * Generate a guest meeting token for a listener calling in.
 * Token is valid for 2 hours.
 */
export async function createGuestToken(displayName = 'Listener') {
  try {
    const res = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: ROOM_NAME,
          user_name: displayName,
          is_owner: false,
          start_audio_off: false,
          start_video_off: true,
          exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours
        },
      }),
    });
    if (!res.ok) throw new Error(`Daily.co API ${res.status}`);
    const data = await res.json();
    return `${ROOM_URL}?t=${data.token}`;
  } catch (e) {
    console.warn('[Daily] token error, using public URL:', e.message);
    return ROOM_URL; // fallback to public room URL
  }
}

/**
 * Generate a host/owner token for Jackson.
 */
export async function createHostToken() {
  try {
    const res = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: ROOM_NAME,
          user_name: 'Jackson Hammer',
          is_owner: true,
          start_audio_off: false,
          start_video_off: true,
          exp: Math.floor(Date.now() / 1000) + 14400, // 4 hours
        },
      }),
    });
    if (!res.ok) throw new Error(`Daily.co API ${res.status}`);
    const data = await res.json();
    return `${ROOM_URL}?t=${data.token}`;
  } catch (e) {
    console.warn('[Daily] host token error:', e.message);
    return ROOM_URL;
  }
}

export { ROOM_URL, ROOM_NAME };
