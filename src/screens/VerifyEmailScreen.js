import React, { useState } from 'react';
import {
  Alert, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resendVerification, reloadUser, logOut } from '../services/authService';
import COLORS from '../theme/colors';

export default function VerifyEmailScreen({ email }) {
  const [checking,  setChecking]  = useState(false);
  const [resending, setResending] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const user = await reloadUser();
      if (!user?.emailVerified) {
        Alert.alert(
          'Not verified yet',
          'We have not received your verification yet. Check your inbox (and spam folder) and click the link.'
        );
      }
      // If verified, AuthContext will re-render automatically and show the main app
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      Alert.alert('Sent!', 'Verification email resent. Check your inbox.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.icon}>📬</Text>
        <Text style={styles.brand}>HAMMER RADIO</Text>
        <Text style={styles.heading}>Check Your Inbox</Text>
        <Text style={styles.body}>
          We sent a verification link to:
        </Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.body}>
          Click the link in that email, then come back here and tap the button below.
        </Text>

        <TouchableOpacity
          style={[styles.btn, checking && styles.btnDis]}
          onPress={handleCheck}
          disabled={checking}
        >
          <Text style={styles.btnText}>
            {checking ? 'Checking…' : 'I verified my email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineBtn, resending && styles.btnDis]}
          onPress={handleResend}
          disabled={resending}
        >
          <Text style={styles.outlineText}>
            {resending ? 'Sending…' : 'Resend verification email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutRow} onPress={logOut}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.NAVY },
  content:    { flex: 1, padding: 28, justifyContent: 'center', alignItems: 'center' },
  icon:       { fontSize: 56, marginBottom: 16 },
  brand:      { color: COLORS.ORANGE, fontSize: 11, fontWeight: '800', letterSpacing: 3, marginBottom: 16 },
  heading:    { color: COLORS.WHITE, fontSize: 26, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  body:       { color: COLORS.MUTED, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  email:      { color: COLORS.GOLD, fontWeight: '700', fontSize: 15, marginBottom: 16 },
  btn:        { backgroundColor: COLORS.ORANGE, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', marginTop: 24, width: '100%' },
  outlineBtn: { borderWidth: 1, borderColor: COLORS.BORDER, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', marginTop: 12, width: '100%' },
  btnDis:     { opacity: 0.5 },
  btnText:    { color: COLORS.WHITE, fontWeight: '800', fontSize: 16 },
  outlineText:{ color: COLORS.MUTED, fontSize: 14 },
  logoutRow:  { marginTop: 32 },
  logoutText: { color: COLORS.MUTED, fontSize: 13 },
});
