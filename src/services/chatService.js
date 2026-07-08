// src/services/chatService.js
import {
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp,
  doc, getDoc, updateDoc, deleteField, deleteDoc, setDoc
} from 'firebase/firestore';
import { db, configured } from './firebase';
import Storage from './storage';

const CHAT_COL = 'chatMessages';
const MAX_MSGS = 80;
const NICK_KEY = 'hammer_nickname';
const UID_KEY  = 'hammer_uid';

function emojiToKey(emoji) {
  return [...emoji].map(c => c.codePointAt(0).toString(16)).join('-');
}

export async function getOrCreateUserId() {
  let uid = await Storage.getItem(UID_KEY);
  if (!uid) {
    uid = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await Storage.setItem(UID_KEY, uid);
  }
  return uid;
}

export async function getNickname() {
  return (await Storage.getItem(NICK_KEY)) ?? '';
}

export async function setNickname(name) {
  await Storage.setItem(NICK_KEY, name.trim());
}

export function subscribeMessages(onUpdate) {
  if (!configured || !db) { onUpdate([]); return () => {}; }
  const q = query(collection(db, CHAT_COL), orderBy('ts', 'desc'), limit(MAX_MSGS));
  const unsub = onSnapshot(q, snap => {
    const msgs = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const aTime = a.ts?.toMillis?.() ?? Date.now();
        const bTime = b.ts?.toMillis?.() ?? Date.now();
        return aTime - bTime;
      });
    onUpdate(msgs);
  }, err => {
    console.warn('[ChatService] snapshot error:', err.message);
    onUpdate([]);
  });
  return unsub;
}

export async function postMessage({
  type = 'text', text = '', nickname, userId,
  source = 'app', isAdmin = false,
  gifUrl = null, imageUrl = null,
  audioUrl = null, audioDuration = null,
  videoUrl = null, profilePicUrl = null,
  replyTo = null,
}) {
  if (!configured || !db) return false;
  try {
    const payload = {
      type, text: text.trim(),
      nickname: nickname || 'Listener',
      userId, source, isAdmin,
      ts: serverTimestamp(),
    };
    if (gifUrl)        payload.gifUrl        = gifUrl;
    if (imageUrl)      payload.imageUrl      = imageUrl;
    if (audioUrl)      payload.audioUrl      = audioUrl;
    if (audioDuration) payload.audioDuration = audioDuration;
    if (videoUrl)      payload.videoUrl      = videoUrl;
    if (profilePicUrl) payload.profilePicUrl = profilePicUrl;
    if (replyTo)       payload.replyTo       = replyTo;
    await addDoc(collection(db, CHAT_COL), payload);
    return true;
  } catch (e) {
    console.warn('[ChatService] post error:', e.message);
    return false;
  }
}

export async function addMessageReaction(messageId, emoji, userId, nickname) {
  if (!configured || !db || !messageId || !emoji) return false;
  const key = emojiToKey(emoji);
  try {
    const ref  = doc(db, CHAT_COL, messageId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const reactions     = snap.data().reactions || {};
    const emojiReactors = reactions[key] || {};
    const update        = {};
    if (emojiReactors[userId]) {
      update[`reactions.${key}.${userId}`] = deleteField();
    } else {
      update[`reactions.${key}.${userId}`] = nickname || 'Listener';
    }
    await updateDoc(ref, update);
    return true;
  } catch (e) {
    console.warn('[ChatService] reaction error:', e.message);
    return false;
  }
}

export async function reportMessage({ messageId, messageText, reportedUserId, reportedByUserId, reason }) {
  if (!configured || !db) return false;
  try {
    await addDoc(collection(db, 'chatReports'), {
      messageId, messageText: messageText || '',
      reportedUserId, reportedByUserId, reason,
      ts: serverTimestamp(), status: 'pending',
    });
    return true;
  } catch (e) {
    console.warn('[ChatService] report error:', e.message);
    return false;
  }
}

export async function deleteMessage(messageId) {
  if (!configured || !db || !messageId) return false;
  try {
    await deleteDoc(doc(db, CHAT_COL, messageId));
    return true;
  } catch (e) {
    console.warn('[ChatService] delete error:', e.message);
    return false;
  }
}

export async function updateMessage(messageId, newText) {
  if (!configured || !db || !messageId) return false;
  try {
    await updateDoc(doc(db, CHAT_COL, messageId), {
      text:     newText.trim(),
      edited:   true,
      editedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.warn('[ChatService] update error:', e.message);
    return false;
  }
}

export async function updatePresence(userId, nickname, active) {
  if (!configured || !db || !userId) return;
  try {
    await setDoc(doc(db, 'presence', userId), {
      userId,
      nickname: nickname || 'Listener',
      lastSeen: serverTimestamp(),
      active,
    }, { merge: true });
  } catch (e) {
    console.warn('[Presence]', e.message);
  }
}