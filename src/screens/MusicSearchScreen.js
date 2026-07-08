// src/screens/MusicSearchScreen.js
// Apple MusicKit catalog search — tap a song to prefill the request form

import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  Image, ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import COLORS from '../theme/colors';
import { searchMusic, getTopSongs } from '../services/musicKitService';

function SongRow({ song, onPress }) {
  const durationSec = Math.round((song.durationMs || 0) / 1000);
  const dur = durationSec
    ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}`
    : '';
  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(song)} activeOpacity={0.75}>
      {song.artwork ? (
        <Image source={{ uri: song.artwork }} style={styles.art} />
      ) : (
        <View style={[styles.art, styles.artPlaceholder]}>
          <Text style={styles.artPlaceholderText}>♪</Text>
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.sub} numberOfLines={1}>{song.artist}{song.album ? ` • ${song.album}` : ''}</Text>
      </View>
      {!!dur && <Text style={styles.dur}>{dur}</Text>}
    </TouchableOpacity>
  );
}

export default function MusicSearchScreen({ onSelect, onClose }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [topSongs, setTopSongs] = useState([]);
  const [topLoading, setTopLoading] = useState(false);
  const debounceRef = useRef(null);

  // Load top songs on mount
  React.useEffect(() => {
    setTopLoading(true);
    getTopSongs(10).then(songs => {
      setTopSongs(songs);
      setTopLoading(false);
    });
  }, []);

  const handleChange = useCallback((text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text || text.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const songs = await searchMusic(text);
      setResults(songs);
      setLoading(false);
      setHasSearched(true);
    }, 500);
  }, []);

  const showTop = query.trim().length < 2;
  const listData = showTop ? topSongs : results;
  const listLoading = showTop ? topLoading : loading;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>🎵 Song Request</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search songs, artists, albums…"
          placeholderTextColor={COLORS.MUTED}
          value={query}
          onChangeText={handleChange}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Section label */}
      <Text style={styles.section}>
        {showTop ? '🔥 Top Songs Right Now' : hasSearched ? `Results for "${query}"` : 'Searching…'}
      </Text>

      {/* Results */}
      {listLoading ? (
        <ActivityIndicator color={COLORS.ORANGE} style={{ marginTop: 32 }} size="large" />
      ) : listData.length === 0 && hasSearched ? (
        <Text style={styles.empty}>No results found. Try a different search.</Text>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <SongRow song={item} onPress={onSelect} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.NAVY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  heading: {
    color: COLORS.ORANGE,
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    color: COLORS.MUTED,
    fontSize: 18,
    fontWeight: '600',
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    color: COLORS.WHITE,
    fontSize: 15,
  },
  section: {
    color: COLORS.GOLD,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  art: {
    width: 52,
    height: 52,
    borderRadius: 6,
    marginRight: 12,
  },
  artPlaceholder: {
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  artPlaceholderText: {
    fontSize: 22,
    color: COLORS.ORANGE,
  },
  rowInfo: {
    flex: 1,
  },
  title: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  sub: {
    color: COLORS.MUTED,
    fontSize: 12,
  },
  dur: {
    color: COLORS.MUTED,
    fontSize: 12,
    marginLeft: 8,
  },
  sep: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginLeft: 80,
  },
  empty: {
    color: COLORS.MUTED,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
