import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

const STREAM_URL = 'https://streams.radiomast.io/64e8b7e1-bd1e-405d-9670-5ebca9564559';
let _sound = null;
let _ready  = false;

async function _setup() {
  if (_ready) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS:       true,
    staysActiveInBackground:    true,
    allowsRecordingIOS:         false,
    shouldDuckAndroid:          true,
    playThroughEarpieceAndroid: false,
    interruptionModeIOS:        InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid:    InterruptionModeAndroid.DoNotMix,
  });
  _ready = true;
}

async function _killSound() {
  if (!_sound) return;
  const s = _sound;
  _sound = null;          // clear ref first — prevents double-stop race
  try { await s.unloadAsync(); } catch (_) {}
}

export async function play() {
  await _setup();
  await _killSound();
  const { sound } = await Audio.Sound.createAsync(
    { uri: STREAM_URL },
    { shouldPlay: true, isLooping: false }
  );
  _sound = sound;
}

export async function stop() {
  await _killSound();
}

export const STREAM = STREAM_URL;