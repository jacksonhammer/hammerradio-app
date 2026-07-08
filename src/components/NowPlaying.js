import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import COLORS from '../theme/colors';
import OnAirBadge from './OnAirBadge';
import { useAudio } from '../context/AudioContext';

export default function NowPlaying({ compact = false }) {
  const { isLive, nowPlaying, listenerCount } = useAudio();

  if (compact) {
    return (
      <View style={styles.compact}>
        <Text style={styles.compactText} numberOfLines={1}>{nowPlaying}</Text>
        <OnAirBadge isLive={isLive} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <OnAirBadge isLive={isLive} />
      <Text style={styles.label}>NOW PLAYING</Text>
      <Text style={styles.track} numberOfLines={2}>{nowPlaying}</Text>
      {listenerCount > 0 && (
        <Text style={styles.listeners}>{listenerCount} listening</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: COLORS.MUTED,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    marginTop: 4,
  },
  track: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  listeners: {
    color: COLORS.MUTED,
    fontSize: 12,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  compactText: {
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
