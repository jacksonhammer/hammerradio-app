import { AudioPlayer, setAudioModeAsync } from 'expo-audio';

const STREAM_URL = 'https://streams.radiomast.io/64e8b7e1-bd1e-405d-9670-5ebca9564559';

let _player = null;
let _ready  = false;

async function _setup() {
  if (_ready) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  } catch (e) {
    // interruptionMode has a known bug on some platforms/SDK versions —
    // retry without it rather than failing background audio entirely.
    console.warn('[Audio] setAudioModeAsync warning:', e.message);
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      });
    } catch (_) {}
  }
  _ready = true;
}

async function _killPlayer() {
  if (!_player) return;
  const p = _player;
  _player = null;
  try {
    await p.pause();
    await p.release();
  } catch (_) {}
}

export async function play() {
  await _setup();
  await _killPlayer();
  const player = new AudioPlayer(STREAM_URL);
  _player = player;
  await player.play();
}

export async function stop() {
  await _killPlayer();
}

// expo-audio doesn't currently expose an explicit "set Now Playing info" API.
// For a live ICY/Icecast stream, iOS's native AVPlayer (which expo-audio uses
// under the hood) may automatically read the stream's own embedded metadata
// and populate the lock screen, as long as background audio + the correct
// session category are configured (handled in _setup() above). Kept as a
// no-op for now so AudioContext doesn't need any changes, and so we can add
// a real implementation later without touching the context again.
export async function updateNowPlayingMetadata(_nowPlaying, _isLive) {
  // no-op — see comment above
}

export const STREAM = STREAM_URL;