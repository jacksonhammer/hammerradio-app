import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { Audio } from 'expo-av';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(ms) {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ArchiveScreen() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Playback state
  const [currentId, setCurrentId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);

  const soundRef = useRef(null);

  // ── Fetch episodes ──
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'archives'));
        const eps = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(ep => ep.published)
          .sort((a, b) => a.episode - b.episode);
        setEpisodes(eps);
      } catch (e) {
        console.warn('[Archive] fetch error:', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Unload on unmount ──
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // ── Playback status callback ──
  const onPlaybackStatusUpdate = useCallback((status) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis ?? 0);
    setDuration(status.durationMillis ?? 0);
    setBuffering(status.isBuffering ?? false);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setCurrentId(null);
      setPosition(0);
    }
  }, []);

  // ── Press episode play button ──
  const handlePress = useCallback(async (episode) => {
    if (currentId === episode.id && soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (!status.isLoaded) return;
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
        } else {
          await soundRef.current.playAsync();
        }
      } catch (e) {
        console.warn('[Archive] toggle error:', e.message);
      }
      return;
    }

    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }

    setCurrentId(episode.id);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
    setBuffering(true);

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: episode.audioUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        onPlaybackStatusUpdate,
      );

      soundRef.current = sound;
    } catch (e) {
      console.warn('[Archive] load error:', e.message);
      setCurrentId(null);
      setBuffering(false);
    }
  }, [currentId, onPlaybackStatusUpdate]);

  // ── Skip forward / back ──
  const skip = useCallback(async (seconds) => {
    if (!soundRef.current || !duration) return;
    const newPos = Math.max(0, Math.min(duration, position + seconds * 1000));
    await soundRef.current.setPositionAsync(newPos).catch(() => {});
  }, [position, duration]);

  // ── Seek ──
  const seekTo = useCallback(async (fraction) => {
    if (!soundRef.current || !duration) return;
    await soundRef.current.setPositionAsync(Math.floor(fraction * duration)).catch(() => {});
  }, [duration]);

  // ── Scrubber pan responder ──
  const scrubberWidth = useRef(0);
  const makePanResponder = useCallback(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => !!currentId,
      onMoveShouldSetPanResponder: () => !!currentId,
      onPanResponderGrant: (e) => {
        seekTo(Math.max(0, Math.min(1, e.nativeEvent.locationX / scrubberWidth.current)));
      },
      onPanResponderMove: (e) => {
        seekTo(Math.max(0, Math.min(1, e.nativeEvent.locationX / scrubberWidth.current)));
      },
    }),
  [currentId, seekTo]);

  // ─── Render episode card ──────────────────────────────────────────────────

  const renderEpisode = ({ item: ep }) => {
    const active = currentId === ep.id;
    const progress = active && duration > 0 ? position / duration : 0;

    return (
      <View style={[styles.card, active && styles.cardActive]}>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => handlePress(ep)}
            style={[styles.playBtn, active && styles.playBtnActive]}
            activeOpacity={0.7}
          >
            {buffering && active ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : active && isPlaying ? (
              <Text style={styles.playIcon}>⏸</Text>
            ) : (
              <Text style={styles.playIcon}>▶</Text>
            )}
          </TouchableOpacity>

          <View style={styles.info}>
            <View style={styles.metaRow}>
              <Text style={styles.epNumber}>EP. {String(ep.episode).padStart(3, '0')}</Text>
              <Text style={styles.epDate}>{ep.date}</Text>
            </View>
            <Text style={styles.epTitle} numberOfLines={2}>{ep.title}</Text>
          </View>
        </View>

        {active && (
          <View style={styles.progressSection}>
            <View
              style={styles.scrubberTrack}
              onLayout={e => { scrubberWidth.current = e.nativeEvent.layout.width; }}
              {...makePanResponder().panHandlers}
            >
              <View style={[styles.scrubberFill, { width: `${progress * 100}%` }]} />
              <View style={[styles.scrubberThumb, { left: `${progress * 100}%` }]} />
            </View>

            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <View style={styles.skipRow}>
                <TouchableOpacity onPress={() => skip(-30)} style={styles.skipBtn}>
                  <Text style={styles.skipText}>↺ 30</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => skip(30)} style={styles.skipBtn}>
                  <Text style={styles.skipText}>30 ↻</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.timeText, { textAlign: 'right' }]}>{formatTime(duration)}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ─── Loading / empty ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={[StyleSheet.absoluteFill, styles.bg]} />
        <ActivityIndicator size="large" color="#E8650A" />
      </View>
    );
  }

  if (episodes.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={[StyleSheet.absoluteFill, styles.bg]} />
        <Text style={styles.emptyText}>No episodes available yet.</Text>
        <Text style={styles.emptySubText}>Check back after the next show.</Text>
      </View>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────
  // The absolutely-positioned bg View covers the full screen behind the FlatList,
  // including any empty space below the list that the navigator would show as white.

  return (
    <View style={styles.screen}>
      <View style={[StyleSheet.absoluteFill, styles.bg]} />
      <FlatList
        data={episodes}
        keyExtractor={ep => ep.id}
        renderItem={renderEpisode}
        style={styles.flatList}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerLabel}>EPISODE ARCHIVE</Text>
            <Text style={styles.headerTitle}>The Signal</Text>
            <Text style={styles.headerSub}>Every episode, on demand.</Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ORANGE = '#E8650A';
const BG    = '#0a0a0f';
const SURFACE = '#0f1419';

const styles = StyleSheet.create({
  // Screen wrapper — flex 1 so it fills the navigator slot
  screen: {
    flex: 1,
  },
  // Absolute dark backdrop — covers every pixel the navigator exposes
  bg: {
    backgroundColor: BG,
  },
  flatList: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  // Loading / empty
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#444',
    fontSize: 13,
    textAlign: 'center',
  },

  // Header
  header: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerLabel: {
    color: ORANGE,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 6,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSub: {
    color: '#555',
    fontSize: 13,
    marginTop: 4,
  },

  // Episode card
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,101,10,0.12)',
    padding: 16,
    marginBottom: 10,
  },
  cardActive: {
    borderColor: 'rgba(232,101,10,0.5)',
  },

  // Top row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(232,101,10,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232,101,10,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  playBtnActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  playIcon: {
    fontSize: 18,
    color: '#fff',
  },
  info: { flex: 1 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  epNumber: {
    color: ORANGE,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: 'rgba(232,101,10,0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  epDate: {
    color: '#444',
    fontSize: 11,
  },
  epTitle: {
    color: '#e8e8e8',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },

  // Progress
  progressSection: { marginTop: 14 },
  scrubberTrack: {
    height: 4,
    backgroundColor: '#1a2030',
    borderRadius: 2,
    marginBottom: 8,
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberFill: {
    height: 4,
    backgroundColor: ORANGE,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  scrubberThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    top: -4,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeText: {
    color: '#444',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    width: 44,
  },
  skipRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
});
