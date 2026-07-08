import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signUp } from '../services/authService';
import COLORS from '../theme/colors';

export default function SignUpScreen({ onSignIn }) {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [displayName, setDisplayName] = useState('');
  const [instagram,   setInstagram]   = useState('');
  const [facebook,    setFacebook]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);

  const handleSignUp = async () => {
    if (!email.trim())       return Alert.alert('Required', 'Please enter your email.');
    if (!displayName.trim()) return Alert.alert('Required', 'Please enter a display name.');
    if (password.length < 6) return Alert.alert('Weak password', 'Password must be at least 6 characters.');
    if (password !== confirm) return Alert.alert('Mismatch', 'Passwords do not match.');

    setLoading(true);
    try {
      await signUp({ email, password, displayName, instagram, facebook });
      // AuthContext listener will detect the new user and show VerifyEmailScreen
    } catch (e) {
      let msg = e.message;
      if (e.code === 'auth/email-already-in-use') msg = 'That email is already registered. Try signing in.';
      if (e.code === 'auth/invalid-email')         msg = 'Please enter a valid email address.';
      Alert.alert('Sign up failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* header */}
          <Text style={styles.brand}>HAMMER RADIO</Text>
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.sub}>Join the listener community</Text>

          {/* required fields */}
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.MUTED}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="How you appear in chat"
            placeholderTextColor={COLORS.MUTED}
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={30}
          />

          <Text style={styles.label}>Password *</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, styles.passInput]}
              placeholder="6+ characters"
              placeholderTextColor={COLORS.MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(v => !v)}>
              <Text style={styles.eyeText}>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat password"
            placeholderTextColor={COLORS.MUTED}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showPass}
          />

          {/* optional social */}
          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>OPTIONAL — for your avatar</Text>
            <View style={styles.divLine} />
          </View>

          <Text style={styles.label}>Instagram Handle</Text>
          <TextInput
            style={styles.input}
            placeholder="@yourhandle"
            placeholderTextColor={COLORS.MUTED}
            value={instagram}
            onChangeText={setInstagram}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Facebook Username</Text>
          <TextInput
            style={styles.input}
            placeholder="your.name"
            placeholderTextColor={COLORS.MUTED}
            value={facebook}
            onChangeText={setFacebook}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.avatarNote}>
            We use your social handle to pull in your profile photo. Nothing else is accessed.
          </Text>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDis]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchRow} onPress={onSignIn}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.NAVY },
  kav:        { flex: 1 },
  scroll:     { padding: 24, paddingBottom: 48 },
  brand:      { color: COLORS.ORANGE, fontSize: 13, fontWeight: '800', letterSpacing: 3, textAlign: 'center', marginBottom: 20, marginTop: 8 },
  heading:    { color: COLORS.WHITE, fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  sub:        { color: COLORS.MUTED, fontSize: 14, textAlign: 'center', marginBottom: 28 },
  label:      { color: COLORS.GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6, marginTop: 14 },
  input:      { backgroundColor: COLORS.SURFACE, color: COLORS.WHITE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, borderWidth: 1, borderColor: COLORS.BORDER },
  passRow:    { flexDirection: 'row', alignItems: 'center' },
  passInput:  { flex: 1 },
  eyeBtn:     { padding: 10, marginLeft: 8 },
  eyeText:    { fontSize: 18 },
  divider:    { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 8 },
  divLine:    { flex: 1, height: 1, backgroundColor: COLORS.BORDER },
  divText:    { color: COLORS.MUTED, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  avatarNote: { color: COLORS.MUTED, fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 16 },
  btn:        { backgroundColor: COLORS.ORANGE, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnDis:     { backgroundColor: COLORS.SURFACE },
  btnText:    { color: COLORS.WHITE, fontWeight: '800', fontSize: 16 },
  switchRow:  { marginTop: 20, alignItems: 'center' },
  switchText: { color: COLORS.MUTED, fontSize: 14 },
  switchLink: { color: COLORS.ORANGE, fontWeight: '700' },
});
