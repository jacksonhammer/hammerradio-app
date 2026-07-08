import React from 'react';
import {
  ActivityIndicator, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import COLORS from '../theme/colors';
import { useAudio } from '../context/AudioContext';

export default function PlayerBar() {
  const { playing, loading, isLive, nowPlaying, listenerCount, togglePlay } = useAudio();

  // Parse "Artist - Title" if possible
  const dashIdx = nowPlaying.indexOf(' - ');
  const artist  = dashIdx > -1 ? nowPlaying.slice(0, dashIdx)  : null;
  const title   = dashIdx > -1 ? nowPlaying.slice(dashIdx + 3) : nowPlaying;

  return (
    <View style={styles.bar}>
      {/* Station icon */}
      <View style={styles.artWrap}>
        <View style={styles.artFallback}>
          <Text style={styles.artEmoji}>📻</Text>
        </View>
        {isLive && <View style={styles.liveDot} />}
      </View>

      {/* Track info */}
      <View style={styles.info}>
        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>
        {artist
          ? <Text style={styles.artistText} numberOfLines={1}>{artist}</Text>
          : listenerCount > 0
            ? <Text style={styles.artistText}>🎧 {listenerCount} listening</Text>
            : <Text style={styles.artistText}>Hammer Radio</Text>
        }
        {artist && listenerCount > 0 && (
          <Text style={styles.listenersText}>🎧 {listenerCount}</Text>
        )}
      </View>

      {/* Play / Pause */}
      <TouchableOpacity
        style={[styles.btn, playing && styles.btnActive]}
        onPress={togglePlay}
        activeOpacity={0.75}
        accessibilityLabel={playing ? 'Pause stream' : 'Play stream'}
      >
        {loading
          ? <ActivityIndicator color={COLORS.WHITE} size="small" />
          : <Text style={styles.btnIcon}>{playing ? '⏸' : '▶'}</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const ART_SIZE = 54;

const styles = StyleSheet.create({
  bar: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  COLORS.SURFACE,
    borderTopWidth:   1,
    borderTopColor:   COLORS.BORDER,
    paddingHorizontal: 12,
    paddingVertical:  10,
    gap:              12,
  },

  artWrap: {
    position: 'relative',
  },
  artFallback: {
    width:           ART_SIZE,
    height:          ART_SIZE,
    borderRadius:    8,
    backgroundColor: COLORS.NAVY,
    borderWidth:     1,
    borderColor:     COLORS.BORDER,
    justifyContent:  'center',
    alignItems:      'center',
  },
  artEmoji: {
    fontSize: 22,
  },
  liveDot: {
    position:        'absolute',
    top:             -3,
    right:           -3,
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: '#FF3B30',
    borderWidth:     2,
    borderColor:     COLORS.SURFACE,
  },

  info: {
    flex:    1,
    gap:     1,
  },
  titleText: {
    color:      COLORS.WHITE,
    fontSize:   14,
    fontWeight: '700',
    lineHeight: 18,
  },
  artistText: {
    color:      COLORS.MUTED,
    fontSize:   12,
    lineHeight: 16,
  },
  listenersText: {
    color:    COLORS.MUTED,
    fontSize: 11,
  },

  btn: {
    width:           46,
    height:          46,
    borderRadius:    23,
    backgroundColor: COLORS.ORANGE,
    justifyContent:  'center',
    alignItems:      'center',
  },
  btnActive: {
    backgroundColor: COLORS.GOLD,
  },
  btnIcon: {
    fontSize: 18,
    color:    COLORS.WHITE,
  },
});