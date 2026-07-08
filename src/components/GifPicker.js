import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, TextInput, FlatList, Image, TouchableOpacity,
  Text, ActivityIndicator, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchGifs } from '../services/giphyService';
import COLORS from '../theme/colors';

const { width } = Dimensions.get('window');
const ITEM_SIZE = Math.floor((width - 4) / 3);

export default function GifPicker({ visible, onSelect, onClose }) {
  const [query,   setQuery]   = useState('');
  const [gifs,    setGifs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (visible) loadGifs('');
  }, [visible]);

  async function loadGifs(q) {
    setLoading(true);
    try {
      const results = await fetchGifs(q);
      setGifs(results);
    } catch (e) {
      console.warn('[GifPicker]', e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(val) {
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => loadGifs(val), 500);
  }

  function handleClose() {
    setQuery('');
    setGifs([]);
    onClose();
  }

  function handleSelect(gif) {
    onSelect(gif);
    handleClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>

        {/* Search bar */}
        <View style={styles.topBar}>
          <TextInput
            style={styles.search}
            placeholder="Search GIFs…"
            placeholderTextColor={COLORS.MUTED}
            value={query}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* GIPHY attribution — above GIFs, keyboard can't cover it */}
        <View style={styles.attribution}>
          <Image
            source={require('../../assets/PoweredBy_200px-White_HorizLogo.png')}
            style={styles.giphyLogo}
            resizeMode="contain"
          />
        </View>

        {/* Scrollable content area */}
        <View style={styles.content}>
          {loading && (
            <ActivityIndicator
              color={COLORS.ORANGE}
              size="large"
              style={{ marginTop: 40 }}
            />
          )}
          {!loading && (
            <FlatList
              data={gifs}
              numColumns={3}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.75}
                >
                  <Image
                    source={{ uri: item.previewUrl }}
                    style={styles.gifThumb}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
              columnWrapperStyle={{ gap: 2 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <Text style={styles.empty}>No GIFs found</Text>
              }
            />
          )}
        </View>

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.NAVY },
  topBar:      { flexDirection: 'row', padding: 10, gap: 8, alignItems: 'center' },
  search:      {
    flex: 1, backgroundColor: COLORS.SURFACE, color: COLORS.WHITE,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, borderWidth: 1, borderColor: COLORS.BORDER,
  },
  closeBtn:    {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.SURFACE, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.BORDER,
  },
  closeTxt:    { color: COLORS.WHITE, fontSize: 16 },
  gifThumb:    { width: ITEM_SIZE, height: ITEM_SIZE, backgroundColor: COLORS.SURFACE },
  empty:       { color: COLORS.MUTED, textAlign: 'center', marginTop: 40, fontSize: 14 },
  content:     { flex: 1 },
  attribution: { paddingVertical: 8, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  giphyLogo:   { width: 160, height: 24 },
});