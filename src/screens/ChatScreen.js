// src/screens/ChatScreen.js
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import COLORS from '../theme/colors';
import ChatMessage from '../components/ChatMessage';
import GifPicker   from '../components/GifPicker';
import EulaModal   from '../components/EulaModal';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { uploadImage, uploadAudio, uploadVideo } from '../services/cloudinaryService';
import { reportMessage } from '../services/chatService';

const EULA_KEY        = '@hammerradio:eula_accepted';
const BLOCKED_KEY     = '@hammerradio:blocked_users';
const MAX_RECORD_SECS = 30;
const REPORT_REASONS  = ['Harassment', 'Spam', 'Hate speech', 'Inappropriate content', 'Other'];

function buildReplyTo(msg) {
  return {
    id:       msg.id,
    nickname: msg.nickname || 'Listener',
    text:     msg.text || '',
    type:     msg.type || 'text',
    imageUrl: msg.imageUrl || msg.gifUrl || msg.videoUrl || null,
  };
}

export default function ChatScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const {
    messages, nickname, userId, connected,
    sendChat, updateNickname, addReaction, deleteMessage, editMessage,
  } = useChat();

  const displayedName = profile?.displayName || nickname;

  const [text,          setText]          = useState('');
  const [nickModal,     setNickModal]     = useState(false);
  const [nickDraft,     setNickDraft]     = useState('');
  const [sending,       setSending]       = useState(false);
  const [gifVisible,    setGifVisible]    = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [uploadMsg,     setUploadMsg]     = useState('');
  const [reactionFor,   setReactionFor]   = useState(null);
  const [replyingTo,    setReplyingTo]    = useState(null);
  const [emojiDraft,    setEmojiDraft]    = useState('');
  const [eulaAccepted,  setEulaAccepted]  = useState(null);
  const [actionTarget,  setActionTarget]  = useState(null);
  const [reportTarget,  setReportTarget]  = useState(null);
  const [reportVisible, setReportVisible] = useState(false);
  const [blockedUsers,  setBlockedUsers]  = useState([]);
  const [showMentions,  setShowMentions]  = useState(false);
  const [mentionQuery,  setMentionQuery]  = useState('');
  const [editTarget,    setEditTarget]    = useState(null);
  const [editDraft,     setEditDraft]     = useState('');
  const [editVisible,   setEditVisible]   = useState(false);
  const [editSaving,    setEditSaving]    = useState(false);
  const editInputRef   = useRef(null);
  const [reactorModal, setReactorModal]  = useState(null);
  const [isRecording,  setIsRecording]   = useState(false);
  const [recSecs,      setRecSecs]       = useState(0);
  const recordingRef   = useRef(null);
  const recTimerRef    = useRef(null);
  const listRef        = useRef(null);
  const inputRef       = useRef(null);
  const nickInputRef   = useRef(null);
  const emojiTimerRef  = useRef(null);
  const shouldScrollRef = useRef(true);

  const chatters = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const m of messages) {
      if (m.nickname && m.userId !== userId && !seen.has(m.nickname)) {
        seen.add(m.nickname);
        result.push(m.nickname);
      }
    }
    return result;
  }, [messages, userId]);

  const mentionSuggestions = useMemo(() => {
    const q = mentionQuery.toLowerCase();
    const list = q ? chatters.filter(n => n.toLowerCase().startsWith(q)) : chatters;
    return list.slice(0, 5);
  }, [chatters, mentionQuery]);

  const filteredMessages = useMemo(
    () => messages.filter(m => !blockedUsers.includes(m.userId)),
    [messages, blockedUsers]
  );

  useEffect(() => {
    AsyncStorage.getItem(EULA_KEY).then(val => setEulaAccepted(val === 'true'));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(BLOCKED_KEY).then(val => {
      if (val) setBlockedUsers(JSON.parse(val));
    });
  }, []);

  useEffect(() => {
    if (!displayedName && eulaAccepted === true) setNickModal(true);
  }, [displayedName, eulaAccepted]);

  useEffect(() => {
    if (replyingTo) setTimeout(() => inputRef.current?.focus(), 100);
  }, [replyingTo]);

  /* ── EULA */
  const handleEulaAccept = async () => {
    await AsyncStorage.setItem(EULA_KEY, 'true');
    setEulaAccepted(true);
  };
  const handleEulaDecline = () => {
    Alert.alert('Terms Required', 'You must accept the Community Chat Terms to use live chat.', [{ text: 'OK' }]);
  };

  /* ── TEXT INPUT */
  const handleTextChange = (val) => {
    setText(val);
    const words = val.split(/\s/);
    const last  = words[words.length - 1];
    if (last.startsWith('@')) {
      setMentionQuery(last.slice(1));
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const handleMentionSelect = (nick) => {
    const words = text.split(/\s/);
    words[words.length - 1] = `@${nick}`;
    setText(words.join(' ') + ' ');
    setShowMentions(false);
    setMentionQuery('');
  };

  /* ── SEND */
  const handleSend = async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    setText('');
    setShowMentions(false);
    const replySnapshot = replyingTo;
    setReplyingTo(null);
    shouldScrollRef.current = true;
    try {
      await sendChat({
        type: 'text',
        text: msg,
        ...(replySnapshot ? { replyTo: buildReplyTo(replySnapshot) } : {}),
      });
    } catch (e) {
      console.error('Send failed:', e);
    } finally {
      setSending(false);
    }
  };

  /* ── GIF */
  const handleGifSelect = async (gif) => {
    setUploading(true); setUploadMsg('Sending GIF…');
    const replySnapshot = replyingTo;
    setReplyingTo(null);
    shouldScrollRef.current = true;
    try {
      await sendChat({
        type: 'gif',
        gifUrl: gif.url,
        text: gif.title || '',
        ...(replySnapshot ? { replyTo: buildReplyTo(replySnapshot) } : {}),
      });
    } catch (e) {
      console.error('GIF send failed:', e);
    } finally {
      setUploading(false);
      setUploadMsg('');
    }
  };

  /* ── IMAGE / VIDEO PICKER */
  const handleImagePress = () => {
    Alert.alert('Attach Media', 'Choose source', [
      {
        text: 'Camera',
        onPress: async () => {
          const { granted } = await ImagePicker.requestCameraPermissionsAsync();
          if (!granted) { Alert.alert('Camera permission required'); return; }
          const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false });
          if (!result.canceled) _uploadImage(result.assets[0].uri);
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!granted) { Alert.alert('Photo library permission required'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: false });
          if (!result.canceled) _uploadImage(result.assets[0].uri);
        },
      },
      {
        text: 'Video Clip',
        onPress: async () => {
          const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!granted) { Alert.alert('Photo library permission required'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            videoMaxDuration: 60,
            allowsEditing: false,
          });
          if (!result.canceled) {
            const asset = result.assets[0];
            _uploadVideo(asset.uri, asset.fileSize);
          }
        },
      },
    ]);
  };

  const _uploadImage = async (uri) => {
    setUploading(true); setUploadMsg('Uploading image…');
    try {
      const imageUrl = await uploadImage(uri);
      await sendChat({ type: 'image', imageUrl, text: '' });
    } catch (e) { Alert.alert('Upload failed', e.message); }
    finally { setUploading(false); setUploadMsg(''); }
  };

  const _uploadVideo = async (uri, fileSize) => {
    setUploading(true); setUploadMsg('Uploading video…');
    try {
      const videoUrl = await uploadVideo(uri, fileSize);
      await sendChat({ type: 'video', videoUrl, text: '' });
    } catch (e) { Alert.alert('Upload failed', e.message); }
    finally { setUploading(false); setUploadMsg(''); }
  };

  /* ── AUDIO RECORDING */
  const toggleRecording = async () => {
    if (isRecording) {
      clearInterval(recTimerRef.current);
      setIsRecording(false);
      const rec = recordingRef.current;
      recordingRef.current = null;
      if (!rec) return;
      try {
        await rec.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS:         false,
          staysActiveInBackground:    true,
          playsInSilentModeIOS:       true,
          shouldDuckAndroid:          true,
          playThroughEarpieceAndroid: false,
          interruptionModeIOS:        InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid:    InterruptionModeAndroid.DoNotMix,
        });
        const uri = rec.getURI();
        const duration = recSecs;
        if (!uri || duration < 1) return;
        _uploadAudio(uri, duration);
      } catch (e) { console.warn('[Recording stop]', e.message); }
    } else {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Microphone permission required'); return; }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, staysActiveInBackground: false });
        await new Promise(r => setTimeout(r, 150));
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const rec = new Audio.Recording();
        await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await rec.startAsync();
        recordingRef.current = rec;
        setIsRecording(true);
        setRecSecs(0);
        recTimerRef.current = setInterval(() => {
          setRecSecs(s => {
            if (s + 1 >= MAX_RECORD_SECS) { toggleRecording(); return MAX_RECORD_SECS; }
            return s + 1;
          });
        }, 1000);
      } catch (e) {
        if (e.message?.includes('background') || e.message?.includes('activated')) {
          try {
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
            await new Promise(r => setTimeout(r, 300));
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const rec = new Audio.Recording();
            await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await rec.startAsync();
            recordingRef.current = rec;
            setIsRecording(true);
            setRecSecs(0);
            recTimerRef.current = setInterval(() => {
              setRecSecs(s => {
                if (s + 1 >= MAX_RECORD_SECS) { toggleRecording(); return MAX_RECORD_SECS; }
                return s + 1;
              });
            }, 1000);
          } catch (e2) {
            Alert.alert('Could not start recording', e2.message);
          }
        } else {
          Alert.alert('Could not start recording', e.message);
        }
      }
    }
  };

  const _uploadAudio = async (uri, duration) => {
    setUploading(true); setUploadMsg('Uploading voice message…');
    try {
      const audioUrl = await uploadAudio(uri);
      await sendChat({ type: 'audio', audioUrl, audioDuration: duration, text: '' });
    } catch (e) { Alert.alert('Audio upload failed', e.message); }
    finally { setUploading(false); setUploadMsg(''); }
  };

  /* ── LONG PRESS */
  const handleLongPress = (message) => {
        setActionTarget(message);
  };

  const handleActionReply = () => {
    const target = actionTarget;
    setActionTarget(null);
    setReplyingTo(target);
  };

  const handleActionReact = () => { setReactionFor(actionTarget); setActionTarget(null); };

  const handleActionEdit = () => {
    const target = actionTarget;
    setActionTarget(null);
    setEditTarget(target);
    setEditDraft(target.text || '');
    setEditVisible(true);
  };

  const handleSaveEdit = async () => {
    const newText = editDraft.trim();
    if (!newText) { Alert.alert('Message cannot be empty'); return; }
    if (newText === editTarget?.text) { setEditVisible(false); return; }
    setEditSaving(true);
    try {
      await editMessage(editTarget.id, newText);
      setEditVisible(false);
    } catch (e) {
      Alert.alert('Could not save edit', e.message);
    } finally {
      setEditSaving(false);
      setEditTarget(null);
    }
  };

  const handleActionReport = () => {
    const target = actionTarget;
    setActionTarget(null);
    setReportTarget(target);
    setReportVisible(true);
  };

  const handleActionBlock = () => {
    const target = actionTarget;
    setActionTarget(null);
    Alert.alert('Block User', `Block messages from ${target.nickname || 'this user'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block', style: 'destructive',
        onPress: async () => {
          const updated = [...blockedUsers, target.userId];
          setBlockedUsers(updated);
          await AsyncStorage.setItem(BLOCKED_KEY, JSON.stringify(updated));
          try {
            await reportMessage({
              messageId:        target.id || 'block',
              messageText:      target.text || '',
              reportedUserId:   target.userId,
              reportedByUserId: userId,
              reason:           'User blocked',
            });
          } catch (e) {
            console.warn('[Block] report error:', e.message);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    const target = actionTarget;
    setActionTarget(null);
    Alert.alert('Delete Message', 'Remove this message for everyone?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(target.id) },
    ]);
  };

  /* ── REACTIONS */
  const handleReact = async (emoji) => {
    if (!reactionFor) return;
    setReactionFor(null);
    await addReaction(reactionFor.id, emoji);
  };

  /* ── REPORT */
  const handleReport = async (reason) => {
    setReportVisible(false);
    if (!reportTarget) return;
    try {
      await reportMessage({
        messageId: reportTarget.id, messageText: reportTarget.text || '',
        reportedUserId: reportTarget.userId, reportedByUserId: userId, reason,
      });
      Alert.alert('Report Submitted', 'Thank you. Our team will review this message.');
    } catch (e) { Alert.alert('Could not submit report', e.message); }
    setReportTarget(null);
  };

  /* ── NICKNAME */
  const handleSaveNick = async () => {
    const n = nickDraft.trim();
    if (!n) { Alert.alert('Enter a display name'); return; }
    try {
      await updateNickname(n);
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { displayName: n });
        if (typeof refreshProfile === 'function') await refreshProfile();
      }
    } catch (e) { console.warn('[Chat] nickname save error:', e.message); }
    setNickModal(false);
  };

  if (eulaAccepted === null) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={COLORS.ORANGE} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const isOwnAction   = actionTarget?.userId === userId;
  const isTextMessage = actionTarget?.type === 'text' ||
    (!actionTarget?.imageUrl && !actionTarget?.gifUrl &&
     !actionTarget?.videoUrl && !actionTarget?.audioUrl);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 80 : 90}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Live Chat</Text>
          <TouchableOpacity onPress={() => { setNickDraft(displayedName || ''); setNickModal(true); }}>
            <Text style={styles.nickBtn}>{displayedName || 'Set name'} ✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{connected ? '🟢 Connected' : '⚫ Connecting…'}</Text>
        </View>

        {uploading && (
          <View style={styles.uploadBanner}>
            <ActivityIndicator size="small" color={COLORS.ORANGE} />
            <Text style={styles.uploadTxt}>{uploadMsg}</Text>
          </View>
        )}

        {isRecording && (
          <View style={styles.recBanner}>
            <View style={styles.recDot} />
            <Text style={styles.recTxt}>Recording… {recSecs}s / {MAX_RECORD_SECS}s</Text>
            <Text style={styles.recHint}>Tap ⏹ to stop & send</Text>
          </View>
        )}

        {/* Messages */}
        {filteredMessages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>No messages yet — say hello! 👋</Text>
          </View>
        ) : (
          <ScrollView
            ref={listRef}
            style={styles.list}
            onScroll={(e) => {
              const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
              shouldScrollRef.current =
                contentSize.height - layoutMeasurement.height - contentOffset.y < 100;
            }}
            scrollEventThrottle={100}
            onContentSizeChange={() => {
              if (shouldScrollRef.current) {
                listRef.current?.scrollToEnd({ animated: false });
              }
            }}
          >
            {filteredMessages.map(item => (
              <ChatMessage
                key={item.id}
                message={item}
                isOwn={item.userId === userId}
                userId={userId}
                onLongPress={handleLongPress}
                onReactionPress={(emoji, users) => setReactorModal({ emoji, users })}
                onReactionToggle={(emoji) => addReaction(item.id, emoji)}
                currentNickname={displayedName}
              />
            ))}
          </ScrollView>
        )}

        {/* @Mention suggestions */}
        {showMentions && mentionSuggestions.length > 0 && (
          <View style={styles.mentionList}>
            {mentionSuggestions.map(nick => (
              <TouchableOpacity key={nick} style={styles.mentionItem} onPress={() => handleMentionSelect(nick)}>
                <Text style={styles.mentionAt}>@</Text>
                <Text style={styles.mentionName}>{nick}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input */}
        <View style={styles.inputWrap}>

          {/* Reply preview bar */}
          {replyingTo && (
            <View style={styles.replyPreviewBar}>
              <View style={styles.replyPreviewAccent} />
              <View style={styles.replyPreviewContent}>
                <Text style={styles.replyPreviewLabel}>
                  Replying to {replyingTo.nickname}
                </Text>
                <Text style={styles.replyPreviewText} numberOfLines={1}>
                  {replyingTo.type === 'image' ? '🖼 Image' :
                   replyingTo.type === 'gif'   ? '🎬 GIF' :
                   replyingTo.type === 'video' ? '🎥 Video' :
                   replyingTo.type === 'audio' ? '🎙 Voice message' :
                   replyingTo.text || ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReplyingTo(null)}
                style={styles.replyPreviewClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.replyPreviewCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.toolRow}>
            <TouchableOpacity style={styles.toolBtn} onPress={() => setGifVisible(true)}>
              <Text style={styles.toolTxt}>GIF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={handleImagePress}>
              <Text style={styles.toolTxt}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, isRecording && styles.toolBtnRec]}
              onPress={toggleRecording}
            >
              <Text style={styles.toolTxt}>{isRecording ? '⏹' : '🎙'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Say something… or type @ to mention"
              placeholderTextColor={COLORS.MUTED}
              value={text}
              onChangeText={handleTextChange}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={!sending && !isRecording}
              maxLength={280}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDis]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              <Text style={styles.sendIcon}>{sending ? '…' : '▲'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {!eulaAccepted && (
        <EulaModal visible={true} onAccept={handleEulaAccept} onDecline={handleEulaDecline} />
      )}

      {/* Action Menu */}
      <Modal visible={!!actionTarget} transparent animationType="fade" onRequestClose={() => setActionTarget(null)}>
        <TouchableOpacity style={styles.reactionOverlay} activeOpacity={1} onPress={() => setActionTarget(null)}>
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Message Options</Text>

            <TouchableOpacity style={styles.actionRow} onPress={handleActionReply}>
              <Text style={styles.actionIcon}>↩️</Text>
              <Text style={styles.actionTxt}>Reply</Text>
            </TouchableOpacity>

            {isOwnAction ? (
              <>
                {isTextMessage && (
                  <TouchableOpacity style={styles.actionRow} onPress={handleActionEdit}>
                    <Text style={styles.actionIcon}>✏️</Text>
                    <Text style={styles.actionTxt}>Edit Message</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
                  <Text style={styles.actionIcon}>🗑️</Text>
                  <Text style={[styles.actionTxt, styles.deleteText]}>Delete Message</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.actionRow} onPress={handleActionReact}>
                  <Text style={styles.actionIcon}>😀</Text>
                  <Text style={styles.actionTxt}>React with Emoji</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionRow} onPress={handleActionReport}>
                  <Text style={styles.actionIcon}>🚩</Text>
                  <Text style={styles.actionTxt}>Report Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionRow} onPress={handleActionBlock}>
                  <Text style={styles.actionIcon}>🚫</Text>
                  <Text style={styles.actionTxt}>Block User</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editVisible} transparent animationType="fade" onShow={() => editInputRef.current?.focus()} onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Message</Text>
            <TextInput
              ref={editInputRef}
              style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
              value={editDraft}
              onChangeText={setEditDraft}
              multiline
              maxLength={280}
              placeholderTextColor={COLORS.MUTED}
            />
            <View style={styles.editBtnRow}>
              <TouchableOpacity style={styles.editCancelBtn} onPress={() => setEditVisible(false)}>
                <Text style={styles.editCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { flex: 1 }, editSaving && styles.btnDisabled]}
                onPress={handleSaveEdit}
                disabled={editSaving}
              >
                <Text style={styles.modalBtnTxt}>{editSaving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report */}
      <Modal visible={reportVisible} transparent animationType="fade" onRequestClose={() => setReportVisible(false)}>
        <TouchableOpacity style={styles.reactionOverlay} activeOpacity={1} onPress={() => setReportVisible(false)}>
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Why are you reporting this?</Text>
            {REPORT_REASONS.map(reason => (
              <TouchableOpacity key={reason} style={styles.actionRow} onPress={() => handleReport(reason)}>
                <Text style={styles.actionTxt}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <GifPicker visible={gifVisible} onSelect={handleGifSelect} onClose={() => setGifVisible(false)} />

      {/* Emoji Reaction Picker */}
      <Modal
        visible={!!reactionFor}
        transparent
        animationType="slide"
        onRequestClose={() => { setReactionFor(null); setEmojiDraft(''); }}
      >
        <TouchableOpacity
          style={emojiStyles.backdrop}
          activeOpacity={1}
          onPress={() => { setReactionFor(null); setEmojiDraft(''); }}
        />
        <View style={emojiStyles.sheet}>
          <View style={emojiStyles.knob} />
          <Text style={emojiStyles.heading}>React</Text>
          <Text style={emojiStyles.hint}>Switch to your emoji keyboard and tap any emoji</Text>
          <TextInput
            style={emojiStyles.emojiInput}
            value={emojiDraft}
            onChangeText={(val) => {
              setEmojiDraft(val);
              if (emojiTimerRef.current) clearTimeout(emojiTimerRef.current);
              emojiTimerRef.current = setTimeout(() => {
                const trimmed = val.trim();
                if (!trimmed) return;
                const target = reactionFor;
                if (!target) return;
                setReactionFor(null);
                setEmojiDraft('');
                addReaction(target.id, trimmed);
              }, 500);
            }}
            placeholder="😊"
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoFocus
            maxLength={10}
            textAlign="center"
          />
          <Text style={emojiStyles.switchHint}>
            Tap 🌐 on your keyboard to switch to emojis
          </Text>
        </View>
      </Modal>

      {/* Who Reacted */}
      <Modal
        visible={!!reactorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setReactorModal(null)}
      >
        <TouchableOpacity
          style={styles.reactorOverlay}
          activeOpacity={1}
          onPress={() => setReactorModal(null)}
        >
          <View style={styles.reactorSheet}>
            <Text style={styles.reactorEmoji}>{reactorModal?.emoji}</Text>
            <Text style={styles.reactorTitle}>Reacted</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {reactorModal && Object.values(reactorModal.users).map((name, i) => (
                <Text key={i} style={styles.reactorName}>
                  {name === true ? 'Listener' : name}
                </Text>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Nickname */}
      <Modal visible={nickModal} transparent animationType="fade" onShow={() => nickInputRef.current?.focus()}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Your Display Name</Text>
            <TextInput
              ref={nickInputRef}
              style={styles.modalInput}
              placeholder="Enter nickname"
              placeholderTextColor={COLORS.MUTED}
              value={nickDraft}
              onChangeText={setNickDraft}
              maxLength={24}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleSaveNick}>
              <Text style={styles.modalBtnTxt}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.NAVY },
  kav:             { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  title:           { color: COLORS.WHITE, fontSize: 18, fontWeight: '700' },
  nickBtn:         { color: COLORS.ORANGE, fontSize: 13 },
  statusBar:       { paddingHorizontal: 14, paddingVertical: 4 },
  statusText:      { color: COLORS.MUTED, fontSize: 11 },
  uploadBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(232,101,10,0.08)' },
  uploadTxt:       { color: COLORS.ORANGE, fontSize: 12 },
  recBanner:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(192,57,43,0.12)' },
  recDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C0392B' },
  recTxt:          { color: COLORS.WHITE, fontSize: 13, fontWeight: '600', flex: 1 },
  recHint:         { color: COLORS.MUTED, fontSize: 11 },
  list:            { flex: 1 },
  empty:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTxt:        { color: COLORS.MUTED, fontSize: 14 },
  mentionList:     { backgroundColor: COLORS.SURFACE, borderTopWidth: 1, borderTopColor: COLORS.BORDER, maxHeight: 160 },
  mentionItem:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  mentionAt:       { color: COLORS.ORANGE, fontSize: 14, fontWeight: '700', marginRight: 2 },
  mentionName:     { color: COLORS.WHITE, fontSize: 14 },
  inputWrap:       { borderTopWidth: 1, borderTopColor: COLORS.BORDER, paddingTop: 8, paddingHorizontal: 8, paddingBottom: 8, gap: 8 },
  toolRow:         { flexDirection: 'row', gap: 8 },
  inputRow:        { flexDirection: 'row', gap: 8, alignItems: 'center' },
  toolBtn:         { width: 42, height: 38, borderRadius: 8, backgroundColor: COLORS.SURFACE, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.BORDER },
  toolBtnRec:      { backgroundColor: 'rgba(192,57,43,0.25)', borderColor: '#C0392B' },
  toolTxt:         { color: COLORS.WHITE, fontSize: 13, fontWeight: '700' },
  input:           { flex: 1, backgroundColor: COLORS.SURFACE, color: COLORS.WHITE, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 11, fontSize: 15, borderWidth: 1, borderColor: COLORS.BORDER },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.ORANGE, justifyContent: 'center', alignItems: 'center' },
  sendBtnDis:      { backgroundColor: COLORS.SURFACE },
  sendIcon:        { color: COLORS.WHITE, fontSize: 16, fontWeight: '700' },
  actionCard:      { backgroundColor: COLORS.SURFACE, borderRadius: 16, padding: 8, width: '80%', borderWidth: 1, borderColor: COLORS.BORDER },
  actionTitle:     { color: COLORS.MUTED, fontSize: 12, textAlign: 'center', paddingVertical: 12 },
  actionRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: COLORS.BORDER },
  actionIcon:      { fontSize: 20 },
  actionTxt:       { color: COLORS.WHITE, fontSize: 16 },
  deleteText:      { color: '#E74C3C' },
  reactionOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  reactionCard:    { backgroundColor: COLORS.SURFACE, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.BORDER },
  reactionHint:    { color: COLORS.MUTED, fontSize: 12, textAlign: 'center', marginBottom: 14 },
  emojiRow:        { flexDirection: 'row', gap: 8 },
  emojiBtn:        { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.NAVY, justifyContent: 'center', alignItems: 'center' },
  emojiTxt:        { fontSize: 26 },
  modalBg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modalCard:       { backgroundColor: COLORS.SURFACE, borderRadius: 16, padding: 24, width: '80%', borderWidth: 1, borderColor: COLORS.BORDER },
  modalTitle:      { color: COLORS.WHITE, fontSize: 17, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalInput:      { backgroundColor: COLORS.NAVY, color: COLORS.WHITE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: COLORS.BORDER, marginBottom: 16 },
  modalBtn:        { backgroundColor: COLORS.ORANGE, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalBtnTxt:     { color: COLORS.WHITE, fontWeight: '700', fontSize: 15 },
  btnDisabled:     { opacity: 0.5 },
  editBtnRow:      { flexDirection: 'row', gap: 10 },
  editCancelBtn:   { flex: 1, borderWidth: 1, borderColor: COLORS.BORDER, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  editCancelTxt:   { color: COLORS.MUTED, fontWeight: '600', fontSize: 15 },
  reactorOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  reactorSheet:    { backgroundColor: '#1e1e1e', borderRadius: 16, padding: 20, minWidth: 180, maxWidth: 280, alignItems: 'center' },
  reactorEmoji:    { fontSize: 36, marginBottom: 4 },
  reactorTitle:    { color: '#aaa', fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  reactorName:     { color: '#fff', fontSize: 15, paddingVertical: 5, textAlign: 'center' },
  replyPreviewBar:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(232,101,10,0.08)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(232,101,10,0.25)' },
  replyPreviewAccent:   { width: 2.5, height: 34, backgroundColor: COLORS.ORANGE, borderRadius: 2, marginRight: 10, flexShrink: 0 },
  replyPreviewContent:  { flex: 1 },
  replyPreviewLabel:    { color: COLORS.ORANGE, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  replyPreviewText:     { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  replyPreviewClose:    { paddingHorizontal: 6, paddingVertical: 4 },
  replyPreviewCloseTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '700' },
});

const emojiStyles = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:      { backgroundColor: COLORS.SURFACE, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center' },
  knob:       { width: 40, height: 4, backgroundColor: COLORS.ORANGE, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  heading:    { color: COLORS.WHITE, fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  hint:       { color: COLORS.MUTED, fontSize: 13, textAlign: 'center', marginBottom: 20, paddingHorizontal: 16 },
  emojiInput: { fontSize: 48, textAlign: 'center', width: 120, height: 90, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, marginBottom: 16, color: COLORS.WHITE },
  switchHint: { color: COLORS.MUTED, fontSize: 12, textAlign: 'center' },
});