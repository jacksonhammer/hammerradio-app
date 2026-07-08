import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const SPLASH_MIN_MS = 2500;

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AudioProvider }         from './src/context/AudioContext';
import { ChatProvider }          from './src/context/ChatContext';
import { auth }                  from './src/services/firebase';

import AppNavigator      from './src/navigation/AppNavigator';
import SignInScreen      from './src/screens/SignInScreen';
import SignUpScreen      from './src/screens/SignUpScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import COLORS            from './src/theme/colors';

const MainApp = () => (
  <AudioProvider>
    <ChatProvider>
      <AppNavigator />
    </ChatProvider>
  </AudioProvider>
);

function AuthGate() {
  const { user, loading } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  if (!auth) return <MainApp />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.NAVY, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.ORANGE} size="large" />
      </View>
    );
  }

  if (!user) {
    return showSignUp
      ? <SignUpScreen  onSignIn={()  => setShowSignUp(false)} />
      : <SignInScreen  onSignUp={() => setShowSignUp(true)}  />;
  }

  if (!user.emailVerified) {
    return <VerifyEmailScreen email={user.email} />;
  }

  return <MainApp />;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('[Splash] hideAsync error:', e);
      } finally {
        setSplashDone(true);
      }
    }, SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!splashDone) return null;

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AuthGate />
    </AuthProvider>
  );
}