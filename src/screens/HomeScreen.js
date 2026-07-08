import React from 'react';
import {
  Image, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../theme/colors';
import OnAirBadge from '../components/OnAirBadge';
import { useAudio } from '../context/AudioContext';

const FEATURES = [
  { icon: '💬', title: 'Live Chat',     desc: 'Chat with other listeners in real time' },
  { icon: '🎵', title: 'Song Requests', desc: 'Request your favourite tracks'           },
  { icon: '📞', title: 'Call In',       desc: 'Join the conversation on air'            },
  { icon: '📡', title: 'News',          desc: 'Updates, giveaways & announcements'      },
  { icon: '🎙', title: 'Archive',       desc: 'Catch up on past shows'                  },
];

export default function HomeScreen() {
  const { playing, loading, isLive, nowPlaying, listenerCount, togglePlay } = useAudio();

  // Parse "Artist - Title"
  const dashIdx = nowPlaying.indexOf(' - ');
  const artist  = dashIdx > -1 ? nowPlaying.slice(0, dashIdx)  : null;
  const title   = dashIdx > -1 ? nowPlaying.slice(dashIdx + 3) : nowPlaying;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ── Header ───────────────────────────────────── */}
        <LinearGradient colors={['#1A0A00', COLORS.NAVY]} style={styles.header}>
          <Text style={styles.brand}>HAMMER RADIO</Text>
          <Text style={styles.tagline}>Your Signal in the Static</Text>
        </LinearGradient>

        {/* ── Now Playing Hero ─────────────────────────── */}
        <View style={styles.heroCard}>
          {/* Tower icon — tappable play/pause */}
          <TouchableOpacity onPress={togglePlay} activeOpacity={0.85} style={styles.artWrap}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.art}
            />
            {/* Overlay play/pause on icon */}
            <View style={styles.artOverlay}>
              <Text style={styles.artOverlayIcon}>
                {loading ? '···' : playing ? '⏸' : '▶'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Track info */}
          <View style={styles.heroInfo}>
            <View style={styles.heroBadgeRow}>
              <OnAirBadge isLive={isLive} />
              {listenerCount > 0 && (
                <Text style={styles.listeners}>🎧 {listenerCount} listening</Text>
              )}
            </View>
            <Text style={styles.nowLabel}>NOW PLAYING</Text>
            <Text style={styles.trackTitle} numberOfLines={2}>{title}</Text>
            {artist && (
              <Text style={styles.trackArtist} numberOfLines={1}>{artist}</Text>
            )}
          </View>
        </View>

        {/* ── Features ─────────────────────────────────── */}
        <Text style={styles.sectionTitle}>FEATURES</Text>
        {FEATURES.map(f => (
          <View key={f.title} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>hammerradio.live</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const ART_SIZE = 130;

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.NAVY },
  scroll:  { flex: 1 },
  content: { paddingBottom: 40 },

  // Header
  header:  { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24, alignItems: 'center' },
  brand:   { fontSize: 28, fontWeight: '900', color: COLORS.ORANGE, letterSpacing: 2 },
  tagline: { fontSize: 13, color: COLORS.GOLD, marginTop: 4, letterSpacing: 0.8, fontStyle: 'italic' },

  // Hero card
  heroCard: {
    flexDirection:    'row',
    alignItems:       'center',
    marginHorizontal: 16,
    marginBottom:     20,
    backgroundColor:  COLORS.SURFACE,
    borderRadius:     16,
    borderWidth:      1,
    borderColor:      COLORS.BORDER,
    padding:          16,
    gap:              16,
  },

  // Icon / art
  artWrap: {
    position: 'relative',
  },
  art: {
    width:        ART_SIZE,
    height:       ART_SIZE,
    borderRadius: 10,
  },
  artOverlay: {
    position:        'absolute',
    bottom:          6,
    right:           6,
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  artOverlayIcon: { fontSize: 16, color: COLORS.WHITE },

  // Hero info
  heroInfo: { flex: 1, gap: 4 },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  2,
  },
  listeners:    { color: COLORS.MUTED, fontSize: 11 },
  nowLabel:     { color: COLORS.MUTED, fontSize: 10, letterSpacing: 2, fontWeight: '600' },
  trackTitle:   { color: COLORS.WHITE, fontSize: 16, fontWeight: '800', lineHeight: 22 },
  trackArtist:  { color: COLORS.GOLD,  fontSize: 13, fontWeight: '500', marginTop: 2 },

  // Features
  sectionTitle: {
    color: COLORS.MUTED, fontSize: 11, letterSpacing: 2,
    fontWeight: '600', marginHorizontal: 16, marginTop: 8, marginBottom: 8,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  featureIcon:  { fontSize: 22, width: 32 },
  featureTitle: { color: COLORS.WHITE, fontSize: 15, fontWeight: '600' },
  featureDesc:  { color: COLORS.MUTED, fontSize: 12, marginTop: 2 },

  footer: { color: COLORS.MUTED, textAlign: 'center', marginTop: 32, fontSize: 12 },
});
