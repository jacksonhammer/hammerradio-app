// src/screens/CallInScreen.js
// Listener call-in via Daily.co WebRTC

import React, { useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import COLORS from '../theme/colors';
import { createGuestToken } from '../services/dailyService';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { icon: '🎙️', text: 'Tap "Request to Call In" below' },
  { icon: '⏳', text: 'A call room opens in your browser' },
  { icon: '📻', text: 'Jackson admits you live on air' },
  { icon: '🎵', text: 'You chat live with the host!' },
];

export default function CallInScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth ? useAuth() : {};
  const [loading, setLoading] = useState(false);

  async function handleCallIn() {
    setLoading(true);
    try {
      const displayName = profile?.displayName || 'Listener';
      const url = await createGuestToken(displayName);
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: '#080D1A',
        controlsColor: '#E8650A',
      });
    } catch (e) {
      Alert.alert('Error', 'Could not open the call room. Please try again.');
      console.warn('[CallIn]', e.message);
    }
    setLoading(false);
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
    >
      {/* Header */}
      <Text style={styles.heading}>📞 Call In Live</Text>
      <Text style={styles.sub}>
        Join Jackson on air! Your voice goes live to all Hammer Radio listeners.
      </Text>

      {/* How it works */}
      <View style={styles.stepsCard}>
        <Text style={styles.stepsHeading}>How it works</Text>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepIcon}>{step.icon}</Text>
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
        ))}
      </View>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsHeading}>📋 Before you call in</Text>
        <Text style={styles.tip}>• Use headphones to avoid audio feedback</Text>
        <Text style={styles.tip}>• Find a quiet spot with no background noise</Text>
        <Text style={styles.tip}>• Make sure your mic is enabled in your browser</Text>
        <Text style={styles.tip}>• Audio only — no video required</Text>
      </View>

      {/* Call In Button */}
      <TouchableOpacity
        style={[styles.callBtn, loading && styles.callBtnDisabled]}
        onPress={handleCallIn}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.WHITE} size="small" />
        ) : (
          <Text style={styles.callBtnText}>🎙️  Request to Call In</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        By calling in you agree that your voice may be broadcast live and recorded.
        Jackson controls who goes on air — not all requests will be admitted.
      </Text>
    </ScrollView>
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
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  sub: {
    color: COLORS.MUTED,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  stepsCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: 16,
    marginBottom: 14,
  },
  stepsHeading: {
    color: COLORS.GOLD,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  stepIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  stepText: {
    color: COLORS.WHITE,
    fontSize: 14,
    flex: 1,
  },
  tipsCard: {
    backgroundColor: 'rgba(201,162,39,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.2)',
    padding: 16,
    marginBottom: 28,
  },
  tipsHeading: {
    color: COLORS.GOLD,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  tip: {
    color: COLORS.WHITE,
    fontSize: 13,
    lineHeight: 22,
    opacity: 0.8,
  },
  callBtn: {
    backgroundColor: COLORS.ORANGE,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  callBtnDisabled: {
    opacity: 0.6,
  },
  callBtnText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimer: {
    color: COLORS.MUTED,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
});
