import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn, resetPassword } from '../services/authService';
import COLORS from '../theme/colors';

export default function SignInScreen({ onSignUp }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) return Alert.alert('Required', 'Please enter your email and password.');
    setLoading(true);
    try {
      await signIn(email, password);
      // AuthContext picks up the change automatically
    } catch (e) {
      let msg = e.message;
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        msg = 'Incorrect email or password. Please try again.';
      }
      if (e.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      if (e.code === 'auth/too-many-requests') msg = 'Too many attempts. Please try again later.';
      Alert.alert('Sign in failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) return Alert.alert('Enter email', 'Type your email above and tap Forgot Password.');
    try {
      await resetPassword(email);
      Alert.alert('Email sent', 'Check your inbox for a password reset link.');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.brand}>HAMMER RADIO</Text>
          <Text style={styles.heading}>Welcome Back</Text>
          <Text style={styles.sub}>Sign in to join the conversation</Text>

          <Text style={styles.label}>Email</Text>
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

          <Text style={styles.label}>Password</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, styles.passInput]}
              placeholder="Your password"
              placeholderTextColor={COLORS.MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              returnKeyType="go"
              onSubmitEditing={handleSignIn}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(v => !v)}>
              <Text style={styles.eyeText}>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleForgot} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDis]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchRow} onPress={onSignUp}>
            <Text style={styles.switchText}>
              New listener? <Text style={styles.switchLink}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.NAVY },
  kav:        { flex: 1 },
  content:    { flex: 1, padding: 28, justifyContent: 'center' },
  brand:      { color: COLORS.ORANGE, fontSize: 13, fontWeight: '800', letterSpacing: 3, textAlign: 'center', marginBottom: 24 },
  heading:    { color: COLORS.WHITE, fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  sub:        { color: COLORS.MUTED, fontSize: 14, textAlign: 'center', marginBottom: 32 },
  label:      { color: COLORS.GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6, marginTop: 14 },
  input:      { backgroundColor: COLORS.SURFACE, color: COLORS.WHITE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, borderWidth: 1, borderColor: COLORS.BORDER },
  passRow:    { flexDirection: 'row', alignItems: 'center' },
  passInput:  { flex: 1 },
  eyeBtn:     { padding: 10, marginLeft: 8 },
  eyeText:    { fontSize: 18 },
  forgotRow:  { alignItems: 'flex-end', marginTop: 8 },
  forgotText: { color: COLORS.ORANGE, fontSize: 13 },
  btn:        { backgroundColor: COLORS.ORANGE, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  btnDis:     { backgroundColor: COLORS.SURFACE },
  btnText:    { color: COLORS.WHITE, fontWeight: '800', fontSize: 16 },
  switchRow:  { marginTop: 20, alignItems: 'center' },
  switchText: { color: COLORS.MUTED, fontSize: 14 },
  switchLink: { color: COLORS.ORANGE, fontWeight: '700' },
});
