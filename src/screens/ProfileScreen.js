// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  Alert, Image, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import COLORS from '../theme/colors';
import { useChat } from '../context/ChatContext';
import { uploadImage } from '../services/cloudinaryService';

export const PROFILE_PIC_KEY = '@hammerradio:profile_pic';

export default function ProfileScreen() {
  const { nickname, updateNickname } = useChat();
  const [displayName, setDisplayName] = useState('');
  const [profilePic,  setProfilePic]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [uploading,   setUploading]   = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_PIC_KEY).then(pic => {
      if (pic) setProfilePic(pic);
    });
  }, []);

  useEffect(() => {
    if (nickname) setDisplayName(nickname);
  }, [nickname]);

  const initials = displayName
    ? displayName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handlePickPhoto = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Required', 'Allow photo library access to upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      const url = await uploadImage(result.assets[0].uri);
      setProfilePic(url);
      await AsyncStorage.setItem(PROFILE_PIC_KEY, url);
    } catch (e) {
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const name = displayName.trim();
      if (name) await updateNickname(name);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      Alert.alert('Error', 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete My Data',
      'This will erase your display name, profile picture, and all saved preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                '@hammer_radio_uid',
                '@hammer_radio_nickname',
                PROFILE_PIC_KEY,
              ]);
              setDisplayName('');
              setProfilePic(null);
            } catch (e) {
              Alert.alert('Error', 'Could not delete data.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Avatar */}
        <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto} activeOpacity={0.8} disabled={uploading}>
          {uploading ? (
            <View style={styles.avatarCircle}>
              <ActivityIndicator color={COLORS.WHITE} size="large" />
            </View>
          ) : profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatarCircle} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={styles.editIcon}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to change photo</Text>

        {/* Display Name */}
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="How you appear in chat"
          placeholderTextColor={COLORS.MUTED}
          maxLength={30}
          autoCapitalize="words"
        />

        {/* Save */}
        <TouchableOpacity
          style={[styles.btn, (saving || uploading) && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving || uploading}
        >
          <Text style={styles.btnText}>
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Profile'}
          </Text>
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteData}>
          <Text style={styles.deleteText}>Delete My Data</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.NAVY },
  container:      { padding: 24, alignItems: 'center' },

  avatarWrap:     { marginTop: 24, marginBottom: 8 },
  avatarCircle:   {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.ORANGE,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: { color: COLORS.WHITE, fontSize: 42, fontWeight: 'bold' },
  editBadge:      {
    position: 'absolute', bottom: 2, right: 2,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 2, borderColor: COLORS.NAVY,
    alignItems: 'center', justifyContent: 'center',
  },
  editIcon:       { fontSize: 15 },
  avatarHint:     { color: COLORS.MUTED, fontSize: 12, marginBottom: 32 },

  label:          { color: COLORS.GOLD, fontSize: 13, marginBottom: 4, marginTop: 4, alignSelf: 'flex-start' },
  input:          {
    backgroundColor: COLORS.SURFACE,
    color: COLORS.WHITE,
    borderWidth: 1, borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, alignSelf: 'stretch',
  },
  btn:            {
    backgroundColor: COLORS.ORANGE,
    borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', marginTop: 32, alignSelf: 'stretch',
  },
  btnDisabled:    { opacity: 0.5 },
  btnText:        { color: COLORS.WHITE, fontSize: 16, fontWeight: '700' },
  deleteBtn:      { alignItems: 'center', marginTop: 20, paddingVertical: 10 },
  deleteText:     { color: COLORS.MUTED, fontSize: 13, textDecorationLine: 'underline' },
});