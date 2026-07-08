// src/components/ChatMessage.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, Pressable,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Video, Audio, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../theme/colors';

const HAMMER_LOGO = require('../../assets/hammer-logo.png');
const LEGACY_EMOJI = {
  heart: '❤️', laugh: '😂', wow: '😮',
  sad: '😢', thumbsup: '👍', fire: '🔥',
};

function keyToEmoji(key) {
  if (LEGACY_EMOJI[key]) return LEGACY_EMOJI[key];
  try {
    return key.split('-').map(cp => String.fromCodePoint(parseInt(cp, 16))).join('');
  } catch { return key; }
}

function isEmojiOnly(str) {
  if (!str || !str.trim()) return false;
  const stripped = str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]/gu, '');
  return stripped.length === 0;
}

function formatTimestamp(ts) {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return time;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;
  const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) return `${date.toLocaleDateString([], { weekday: 'short' })} · ${time}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`;
}

function formatDuration(ms) {
  const s  = Math.floor(ms / 1000);
  const m  = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}

function replyPreviewLabel(replyTo) {
  if (!replyTo) return '';
  switch (replyTo.type) {
    case 'image': return '🖼 Image';
    case 'gif':   return '🎬 GIF';
    case 'video': return '🎥 Video';
    case 'audio': return '🎙 Voice message';
    default:      return replyTo.text || '';
  }
}

function MentionText({ text, currentNickname }) {
  const emojiOnly = isEmojiOnly(text);
  const parts = text.split(/(@\S+)/g);
  return (
    <Text style={emojiOnly ? styles.textEmoji : styles.text}>
      {parts.map((part, i) => {
        if (emojiOnly) return <React.Fragment key={i}>{part}</React.Fragment>;
        if (!part.startsWith('@')) return <React.Fragment key={i}>{part}</React.Fragment>;
        const isMe = currentNickname &&
          part.slice(1).toLowerCase() === currentNickname.toLowerCase();
        return (
          <Text key={i} style={isMe ? styles.mentionSelf : styles.mentionOther}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

function AudioPlayer({ uri }) {
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition]   = useState(0);
  const [duration, setDuration]   = useState(0);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const toggle = async () => {
    try {
      if (!soundRef.current) {
        setLoading(true);
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (s) => {
            if (s.isLoaded) {
              setIsPlaying(s.isPlaying);
              setPosition(s.positionMillis || 0);
              setDuration(s.durationMillis || 0);
              if (s.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
              }
            }
          }
        );
        soundRef.current = sound;
        setLoading(false);
      } else {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
        } else {
          if (position >= duration - 100 && duration > 0)
            await soundRef.current.setPositionAsync(0);
          await soundRef.current.playAsync();
        }
      }
    } catch (e) {
      console.error('AudioPlayer error:', e);
      setLoading(false);
    }
  };

  const progress  = duration > 0 ? position / duration : 0;
  const remaining = duration > 0 ? duration - position : 0;

  return (
    <View style={styles.audioWrapper}>
      <TouchableOpacity onPress={toggle} style={styles.audioPlayBtn} activeOpacity={0.7}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#fff" />}
      </TouchableOpacity>
      <View style={styles.audioTrack}>
        <View style={[styles.audioFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.audioDuration}>
        {formatDuration(remaining || duration)}
      </Text>
    </View>
  );
}

function VideoPlayer({ uri }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const isPlaying = status.isPlaying;

  const toggle = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      if (status.positionMillis >= (status.durationMillis ?? 0) - 100) {
        await videoRef.current.replayAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  return (
    <View style={styles.videoWrapper}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        onPlaybackStatusUpdate={s => { setStatus(s); if (s.isLoaded) setLoading(false); }}
        onError={() => { setLoading(false); setError(true); }}
        useNativeControls={false}
        isLooping={false}
      />
      {loading && !error && (
        <View style={styles.videoOverlay}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
      {error && (
        <View style={styles.videoOverlay}>
          <Ionicons name="alert-circle-outline" size={28} color="#fff" />
          <Text style={styles.videoErrorText}>Could not load video</Text>
        </View>
      )}
      {!loading && !error && (
        <TouchableOpacity style={styles.videoPlayBtn} onPress={toggle} activeOpacity={0.7}>
          {!isPlaying && (
            <View style={styles.videoPlayIcon}>
              <Ionicons name="play" size={22} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      )}
      {!loading && !error && status.durationMillis > 0 && (
        <View style={styles.videoDurationBadge}>
          <Text style={styles.videoDurationText}>
            {formatDuration(status.durationMillis)}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ChatMessage({
  message, isOwn, userId, onLongPress,
  onReactionPress, onReactionToggle, currentNickname,
}) {
  const {
  text, nickname, imageUrl, videoUrl, gifUrl,
  audioUrl, reactions, profilePicUrl, ts, edited, replyTo, isAdmin,
} = message;

  const isMentioned = currentNickname && text &&
    text.toLowerCase().includes(`@${currentNickname.toLowerCase()}`);

  const bubbleStyle = [
    styles.bubble,
    isOwn ? styles.ownBubble : styles.otherBubble,
    isMentioned && !isOwn && styles.bubbleMentioned,
  ];

  const timeLabel = formatTimestamp(ts);

  return (
    <Pressable
      onLongPress={() => onLongPress && onLongPress(message)}
      delayLongPress={350}
      unstable_pressDelay={50}
      style={({ pressed }) => [
        styles.row,
        isOwn ? styles.rowOwn : styles.rowOther,
        { opacity: pressed ? 0.85 : 1 }
      ]}
    >
     {!isOwn && (
       isAdmin
         ? <Image source={HAMMER_LOGO} style={styles.avatarImg} />
         : profilePicUrl
           ? <Image source={{ uri: profilePicUrl }} style={styles.avatarImg} />
           : <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(nickname || '?')[0].toUpperCase()}
          </Text>
        </View>
)}

      <View style={styles.bubbleCol}>
        {!isOwn && (
          <Text style={styles.nicknameText}>{nickname || 'Listener'}</Text>
        )}
        <View style={bubbleStyle}>
          {isMentioned && !isOwn && (
            <View style={styles.mentionBadge}>
              <Text style={styles.mentionBadgeText}>@ you</Text>
            </View>
          )}

          {/* ── Quoted reply block ── */}
          {replyTo && (
            <View style={[styles.replyBlock, isOwn ? styles.replyBlockOwn : styles.replyBlockOther]}>
              <View style={styles.replyBar} />
              <View style={styles.replyContent}>
                <Text style={styles.replyNickname} numberOfLines={1}>
                  {replyTo.nickname}
                </Text>
                <Text style={styles.replyPreview} numberOfLines={1}>
                  {replyPreviewLabel(replyTo)}
                </Text>
              </View>
            </View>
          )}

          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.chatImage} resizeMode="cover" />
          ) : null}
          {gifUrl ? (
            <Image source={{ uri: gifUrl }} style={styles.chatImage} resizeMode="cover" />
          ) : null}
          {videoUrl ? <VideoPlayer uri={videoUrl} /> : null}
          {audioUrl ? <AudioPlayer uri={audioUrl} /> : null}
          {text ? (
            <MentionText text={text} currentNickname={currentNickname} />
          ) : null}
        </View>

        {reactions && Object.keys(reactions).length > 0 && (
          <View style={styles.reactionsRow}>
            {Object.entries(reactions).map(([key, users]) =>
              users && Object.keys(users).length > 0 ? (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.reactionBadge,
                    users[userId] ? styles.reactionBadgeOwn : null,
                  ]}
                  onPress={() => {
                    if (users[userId]) {
                      onReactionToggle && onReactionToggle(keyToEmoji(key));
                    } else {
                      onReactionPress && onReactionPress(keyToEmoji(key), users);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionText}>
                    {keyToEmoji(key)} {Object.keys(users).length}
                  </Text>
                </TouchableOpacity>
              ) : null
            )}
          </View>
        )}

        <View style={styles.metaRow}>
          {edited && <Text style={styles.editedLabel}>edited</Text>}
          {timeLabel ? <Text style={styles.timestamp}>{timeLabel}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row:      { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 10, alignItems: 'flex-end' },
  rowOwn:   { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },

  avatar:     { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.ORANGE || '#E85D04', alignItems: 'center', justifyContent: 'center', marginRight: 6, marginBottom: 2 },
  avatarImg:  { width: 32, height: 32, borderRadius: 16, marginRight: 6, marginBottom: 2 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  bubbleCol:    { maxWidth: '78%' },
  nicknameText: { color: '#aaa', fontSize: 11, marginBottom: 2, marginLeft: 4 },

  bubble:          { borderRadius: 14, padding: 10, paddingBottom: 6 },
  ownBubble:       { backgroundColor: COLORS.PRIMARY || '#1a1a2e', borderBottomRightRadius: 4 },
  otherBubble:     { backgroundColor: '#2a2a2a', borderBottomLeftRadius: 4 },
  bubbleMentioned: { backgroundColor: '#3a2a00', borderColor: '#c8860a', borderWidth: 1 },

  mentionBadge:     { alignSelf: 'flex-start', backgroundColor: '#c8860a', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginBottom: 4 },
  mentionBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  replyBlock:      { flexDirection: 'row', borderRadius: 8, marginBottom: 6, padding: 6, overflow: 'hidden' },
  replyBlockOwn:   { backgroundColor: 'rgba(0,0,0,0.25)' },
  replyBlockOther: { backgroundColor: 'rgba(0,0,0,0.20)' },
  replyBar:        { width: 2.5, backgroundColor: COLORS.ORANGE || '#E85D04', borderRadius: 2, marginRight: 8, flexShrink: 0 },
  replyContent:    { flex: 1 },
  replyNickname:   { color: COLORS.ORANGE || '#E85D04', fontSize: 11, fontWeight: '700', marginBottom: 2 },
  replyPreview:    { color: 'rgba(255,255,255,0.5)', fontSize: 12 },

  text:         { color: '#fff', fontSize: 14, lineHeight: 20 },
  textEmoji:    { fontSize: 42, lineHeight: 52 },
  mentionSelf:  { color: '#FFD700', fontWeight: '700' },
  mentionOther: { color: '#E85D04', fontWeight: '600' },

  chatImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 4 },

  audioWrapper:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, width: 210 },
  audioPlayBtn:  { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.ORANGE, alignItems: 'center', justifyContent: 'center' },
  audioTrack:    { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  audioFill:     { height: '100%', backgroundColor: COLORS.ORANGE, borderRadius: 2 },
  audioDuration: { color: 'rgba(255,255,255,0.5)', fontSize: 10, minWidth: 30, textAlign: 'right' },

  videoWrapper:       { width: 220, height: 165, borderRadius: 10, overflow: 'hidden', marginBottom: 4, backgroundColor: '#000' },
  video:              { width: '100%', height: '100%' },
  videoOverlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  videoErrorText:     { color: '#fff', fontSize: 11 },
  videoPlayBtn:       { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  videoPlayIcon:      { backgroundColor: 'rgba(0,0,0,0.55)', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  videoDurationBadge: { position: 'absolute', bottom: 6, right: 8, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  videoDurationText:  { color: '#fff', fontSize: 10 },

  reactionsRow:     { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 4 },
  reactionBadge:    { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  reactionText:     { fontSize: 12, color: '#fff' },
  reactionBadgeOwn: { borderColor: COLORS.ORANGE || '#E85D04', borderWidth: 1 },

  metaRow:     { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 4 },
  editedLabel: { color: 'rgba(255,255,255,0.25)', fontSize: 9, fontStyle: 'italic' },
  timestamp:   { color: 'rgba(255,255,255,0.35)', fontSize: 9 },
});