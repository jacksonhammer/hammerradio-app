// src/context/ChatContext.js
import React, {
  createContext, useContext, useEffect, useRef, useState, useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  subscribeMessages, postMessage, addMessageReaction,
  deleteMessage as deleteChatMessage,
  updateMessage as updateChatMessage,
} from '../services/chatService';
import {
  registerForPushNotifications,
  updatePushTokenNickname,
} from '../services/notificationService';
import { AppState } from 'react-native';
import { updatePresence } from '../services/chatService';

const UID_KEY         = '@hammer_radio_uid';
const NICK_KEY        = '@hammer_radio_nickname';
const PROFILE_PIC_KEY = '@hammerradio:profile_pic';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

async function getOrCreateUserId() {
  try {
    let uid = await AsyncStorage.getItem(UID_KEY);
    if (!uid) { uid = generateId(); await AsyncStorage.setItem(UID_KEY, uid); }
    return uid;
  } catch (_) { return generateId(); }
}

const ChatCtx = createContext(null);

export function ChatProvider({ children }) {
  const [messages,  setMessages]  = useState([]);
  const [connected, setConnected] = useState(false);
  const [userId,    setUserId]    = useState('');
  const [nickname,  setNickname]  = useState('');
  const unsubRef = useRef(null);

  useEffect(() => {
    async function init() {
      const uid  = await getOrCreateUserId();
      const nick = (await AsyncStorage.getItem(NICK_KEY)) || '';
      setUserId(uid);
      setNickname(nick);
      registerForPushNotifications(uid, nick).catch(e =>
        console.warn('[Push] Registration error:', e.message)
      );
    }
    init();
  }, []);

  useEffect(() => {
    unsubRef.current = subscribeMessages(msgs => {
      setMessages(msgs);
      setConnected(true);
    });
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  useEffect(() => {
    if (!userId) return;
    updatePresence(userId, nickname, true);
    const subscription = AppState.addEventListener('change', nextState => {
      updatePresence(userId, nickname, nextState === 'active');
    });
    return () => {
      subscription.remove();
      updatePresence(userId, nickname, false);
    };
  }, [userId, nickname]);

  const sendChat = useCallback(async (payload) => {
  if (!userId) return false;
  const profilePicUrl = (await AsyncStorage.getItem(PROFILE_PIC_KEY)) || null;
  if (typeof payload === 'string') {
    if (!payload.trim()) return false;
    return postMessage({
      type: 'text', text: payload,
      nickname: nickname || 'Listener',
      userId, source: 'app', profilePicUrl,
    });
  }
  // ↓ add replyTo here
  const { type = 'text', text = '', gifUrl, imageUrl, audioUrl, audioDuration, videoUrl, replyTo } = payload;
  if (type === 'text' && !text.trim()) return false;
  return postMessage({
    type, text,
    nickname:      nickname || 'Listener',
    userId, source: 'app',
    gifUrl:        gifUrl        || null,
    imageUrl:      imageUrl      || null,
    audioUrl:      audioUrl      || null,
    audioDuration: audioDuration || null,
    videoUrl:      videoUrl      || null,
    profilePicUrl,
    replyTo:       replyTo       || null,   // ← add this line
  });
}, [userId, nickname]);

   const addReaction = useCallback(async (messageId, emoji) => {
  if (!userId) return false;
  return addMessageReaction(messageId, emoji, userId, nickname || 'Listener');
}, [userId, nickname]);

  const updateNickname = useCallback(async (newNick) => {
    setNickname(newNick);
    try {
      await AsyncStorage.setItem(NICK_KEY, newNick);
      // Keep push token nickname in sync so @mentions still reach this user
      await updatePushTokenNickname(userId, newNick);
    } catch (_) {}
  }, [userId]);

  const deleteMessage = useCallback(async (messageId) => {
    return deleteChatMessage(messageId);
  }, []);

  const editMessage = useCallback(async (messageId, newText) => {
    return updateChatMessage(messageId, newText);
  }, []);

  const value = {
    messages, nickname, userId, connected,
    sendChat, updateNickname, addReaction, deleteMessage, editMessage,
  };
  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}