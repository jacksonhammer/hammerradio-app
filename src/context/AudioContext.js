import React, {
  createContext, useContext, useEffect, useRef, useState, useCallback,
} from 'react';
import * as AudioService from '../services/audioService';
import { subscribe as subscribeIce } from '../services/icecasting';

const AudioCtx = createContext(null);

export function AudioProvider({ children }) {
  const [playing,       setPlaying]       = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [isLive,        setIsLive]        = useState(false);
  const [nowPlaying,    setNowPlaying]    = useState('Hammer Radio');
  const [listenerCount, setListenerCount] = useState(0);

  // Icecast polling
  useEffect(() => {
    const unsub = subscribeIce(meta => {
      setIsLive(meta.isLive);
      setNowPlaying(meta.nowPlaying || 'Hammer Radio');
      setListenerCount(meta.listenerCount || 0);
    });
    return unsub;
  }, []);

  // Keep lock screen / Bluetooth / CarPlay Now Playing metadata in sync
  // whenever the song or live status changes.
  useEffect(() => {
    AudioService.updateNowPlayingMetadata(nowPlaying, isLive);
  }, [nowPlaying, isLive]);

  const togglePlay = useCallback(async () => {
    if (playing) {
      setPlaying(false);
      await AudioService.stop();
    } else {
      setLoading(true);
      try {
        await AudioService.play();
        setPlaying(true);
      } catch (e) {
        console.warn('[Audio] play error:', e.message);
      } finally {
        setLoading(false);
      }
    }
  }, [playing]);

  const value = {
    playing, loading, isLive, nowPlaying,
    listenerCount, togglePlay,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used inside AudioProvider');
  return ctx;
}