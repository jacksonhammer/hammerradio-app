import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import COLORS from '../theme/colors';

export default function OnAirBadge({ isLive }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLive) { pulse.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isLive]);

  if (!isLive) return null;

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.dot, { opacity: pulse }]} />
      <Text style={styles.label}>ON AIR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  label: { color: '#FF3B30', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
});
