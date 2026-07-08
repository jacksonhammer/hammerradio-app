import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Alert, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import COLORS from '../theme/colors';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import MusicSearchScreen from './MusicSearchScreen';

export default function RequestScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth ? useAuth() : {};
  const { nickname } = useChat();

  const [song,       setSong]       = useState('');
  const [artist,     setArtist]     = useState('');
  const [message,    setMessage]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  function handleSongSelect(selectedSong) {
    setSong(selectedSong.title);
    setArtist(selectedSong.artist);
    setShowSearch(false);
  }

  async function handleSubmit() {
    const songTrimmed   = song.trim();
    const artistTrimmed = artist.trim();
    if (!songTrimmed) {
      Alert.alert('Missing Info', 'Please enter a song name or browse the catalog first.');
      return;
    }
    if (!db) {
      Alert.alert('Error', 'Database not available. Please try again.');
      return;
    }
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      const displayName = profile?.displayName || nickname || 'Anonymous';
      await addDoc(collection(db, 'requests'), {
        song:        songTrimmed,
        artist:      artistTrimmed,
        message:     message.trim(),
        requestedBy: displayName,
        uid:         user?.uid || null,
        status:      'pending',
        createdAt:   serverTimestamp(),
      });
      setSubmitted(true);
      setSong('');
      setArtist('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 4000);
    } catch (e) {
      Alert.alert('Error', 'Could not submit request. Please try again.');
      console.warn('[RequestScreen] submit error:', e.message);
    }
    setSubmitting(false);
  }

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.heading}>🎵 Request a Song</Text>
            <Text style={styles.sub}>
              Browse the Apple Music catalog or type a song title and artist.
              Jackson picks requests live on air!
            </Text>

            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => setShowSearch(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.browseBtnText}>🔍  Browse Apple Music Catalog</Text>
            </TouchableOpacity>

            <Text style={styles.orDivider}>— or type it in —</Text>

            <Text style={styles.label}>Song Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Back In Black"
              placeholderTextColor={COLORS.MUTED}
              value={song}
              onChangeText={setSong}
              returnKeyType="next"
            />

            <Text style={styles.label}>Artist</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. AC/DC"
              placeholderTextColor={COLORS.MUTED}
              value={artist}
              onChangeText={setArtist}
              returnKeyType="next"
            />

            <View style={styles.labelRow}>
              <Text style={styles.label}>
                Message for Jackson{'  '}
                <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TouchableOpacity onPress={Keyboard.dismiss}>
                <Text style={styles.doneBtn}>Done</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Anything you want to say on air?"
              placeholderTextColor={COLORS.MUTED}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
            />

            {submitted ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  ✅ Request submitted! Jackson will see it live.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.note}>
              Requests are visible to Jackson in the admin panel during the show.
              Not all requests can be played — it depends on the set!
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <Modal
        visible={showSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearch(false)}
      >
        <MusicSearchScreen
          onSelect={handleSongSelect}
          onClose={() => setShowSearch(false)}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.NAVY,
    paddingHorizontal: 20,
  },
  heading: {
    color: COLORS.ORANGE,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  sub: {
    color: COLORS.MUTED,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: COLORS.ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  browseBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  orDivider: {
    color: COLORS.MUTED,
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 12,
  },
  label: {
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  doneBtn: {
    color: COLORS.ORANGE,
    fontSize: 14,
    fontWeight: '600',
  },
  optional: {
    color: COLORS.MUTED,
    fontWeight: '400',
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
    marginBottom: 14,
  },
  messageInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  submitBtn: {
    backgroundColor: COLORS.GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: COLORS.NAVY,
    fontSize: 16,
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: 'rgba(100,200,100,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(100,200,100,0.4)',
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  successText: {
    color: '#6DC96D',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  note: {
    color: COLORS.MUTED,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});