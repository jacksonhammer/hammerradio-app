// src/services/notificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db } from './firebase';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(userId, nickname) {
  if (!Device.isDevice) {
    console.log('[Push] Skipping — not a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:             'Hammer Radio',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#E8650A',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'e3b06c89-f7d3-403a-bf50-243e4799e522',
  });

  const token = tokenData.data;
  console.log('[Push] Token:', token);

  try {
    await setDoc(doc(db, 'pushTokens', token), {
      token,
      userId,
      nickname:      nickname || 'Listener',
      nicknameLower: (nickname || 'Listener').toLowerCase(),
      platform:      Platform.OS,
      updatedAt:     Date.now(),
    });
    console.log('[Push] Token saved to Firestore');
  } catch (e) {
    console.warn('[Push] Failed to save token:', e.message);
  }

  return token;
}

// Called when user changes their display name so mentions still find them
export async function updatePushTokenNickname(userId, newNickname) {
  if (!userId || !newNickname) return;
  try {
    const q    = query(collection(db, 'pushTokens'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const updates = snap.docs.map(d =>
      updateDoc(d.ref, {
        nickname:      newNickname,
        nicknameLower: newNickname.toLowerCase(),
        updatedAt:     Date.now(),
      })
    );
    await Promise.all(updates);
    console.log('[Push] Nickname updated in pushTokens');
  } catch (e) {
    console.warn('[Push] Failed to update nickname:', e.message);
  }
}