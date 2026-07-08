import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getAvatarUrl, generatedAvatar } from '../services/avatarService';
import COLORS from '../theme/colors';

export default function Avatar({ profile, size = 44, style }) {
  const [errored, setErrored] = useState(false);

  const primaryUrl  = profile ? getAvatarUrl(profile) : null;
  const fallbackUrl = generatedAvatar(profile?.displayName || '?');
  const uri         = (errored || !primaryUrl) ? fallbackUrl : primaryUrl;

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setErrored(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow:        'hidden',
    backgroundColor: COLORS.SURFACE,
    borderWidth:     1,
    borderColor:     COLORS.BORDER,
  },
});
