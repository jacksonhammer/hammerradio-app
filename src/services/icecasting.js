import axios from 'axios';

const STATUS_URL =
  'https://www.radiomast.io/stream/64e8b7e1-bd1e-405d-9670-5ebca9564559/icecast/status-json.xsl';
const POLL_MS = 10000;

let _timer     = null;
let _listeners = [];
let _lastMeta  = { isLive: false, nowPlaying: 'Hammer Radio', listenerCount: 0 };

async function fetchMeta() {
  try {
    const res = await axios.get(STATUS_URL, { timeout: 6000 });
    const data = res.data;
    const src  = data?.icestats?.source;
    if (!src) return { isLive: false, nowPlaying: 'Hammer Radio', listenerCount: 0 };
    const source = Array.isArray(src) ? src[0] : src;
    return {
      isLive:        true,
      nowPlaying:    source.title || source.song || 'Live Stream',
      listenerCount: source.listeners ?? 0,
      description:   source.server_description ?? '',
    };
  } catch (e) {
    return { isLive: false, nowPlaying: 'Hammer Radio', listenerCount: 0 };
  }
}

function _notify(meta) {
  _listeners.forEach(cb => { try { cb(meta); } catch (_) {} });
}

async function _tick() {
  const meta = await fetchMeta();
  _lastMeta  = meta;
  _notify(meta);
}

/**
 * subscribe(callback) → returns unsubscribe fn
 * callback is called immediately with last known state, then on every poll.
 */
export function subscribe(cb) {
  _listeners.push(cb);
  cb(_lastMeta);                        // immediate call with current state
  if (!_timer) {
    _tick();
    _timer = setInterval(_tick, POLL_MS);
  }
  return function unsubscribe() {
    _listeners = _listeners.filter(l => l !== cb);
    if (_listeners.length === 0 && _timer) {
      clearInterval(_timer);
      _timer = null;
    }
  };
}

export { fetchMeta };
