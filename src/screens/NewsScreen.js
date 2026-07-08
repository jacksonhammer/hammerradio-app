// src/screens/NewsScreen.js  (now serves as Updates — Notifications + News)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Linking, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import COLORS from '../theme/colors';

const DISMISSED_KEY = '@hr_dismissed_notifs';
const READ_KEY      = '@hr_read_notifs';

const NEWS_TYPE = {
  announcement: { label: 'Announcement', color: '#E8650A', bg: 'rgba(232,101,10,0.12)' },
  show:         { label: 'Show Alert',   color: '#4A9EFF', bg: 'rgba(74,158,255,0.12)' },
  giveaway:     { label: 'Giveaway 🎁',  color: '#6DC96D', bg: 'rgba(109,201,109,0.12)' },
  watcher:      { label: '👁 The Watcher', color: '#9B59B6', bg: 'rgba(155,89,182,0.12)' },
  news:         { label: 'News',         color: '#E8650A', bg: 'rgba(232,101,10,0.12)' },
  alert:        { label: 'Alert 🚨',     color: '#FF4444', bg: 'rgba(255,68,68,0.12)'  },
  promo:        { label: 'Promo 🎉',     color: '#9B59B6', bg: 'rgba(155,89,182,0.12)' },
};

// ── Notification card ──────────────────────────────────────────────
function NotifCard({ item, isRead, onDismiss, onMarkRead }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onMarkRead(item.id)}
      style={[styles.notifCard, isRead && styles.notifCardRead]}
    >
      <View style={styles.notifRow}>
        {!isRead && <View style={styles.unreadDot} />}
        <View style={{ flex: 1 }}>
          <Text style={[styles.notifTitle, isRead && styles.mutedText]}>{item.title}</Text>
          <Text style={[styles.notifBody,  isRead && styles.mutedText]}>{item.body}</Text>
          <Text style={styles.notifTime}>
            {new Date(item.ts).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onDismiss(item.id)} style={styles.dismissBtn}>
          <Text style={styles.dismissX}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── News card ──────────────────────────────────────────────────────
function NewsCard({ item }) {
  const type     = NEWS_TYPE[item.type] || NEWS_TYPE.announcement;
  const isWatcher = item.type === 'watcher';
  const ts = item.ts ?? item.createdAt ?? Date.now();

  return (
    <View style={[
      styles.newsCard,
      { borderColor: type.color + '40', backgroundColor: type.bg },
      isWatcher && styles.watcherCard,
    ]}>
      {item.pinned && <Text style={styles.pinnedLabel}>📌 PINNED</Text>}
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: type.color + '25', borderColor: type.color + '50' }]}>
          <Text style={[styles.typeBadgeText, { color: type.color }]}>{type.label}</Text>
        </View>
        <Text style={[styles.timestamp, isWatcher && styles.watcherText]}>
          {new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
      <Text style={[styles.newsTitle, isWatcher && styles.watcherTitle]}>
        {item.headline || item.title}
      </Text>
      {item.body && (
        <Text style={[styles.newsBody, isWatcher && styles.watcherText]}>{item.body}</Text>
      )}
      {item.link && (
        <TouchableOpacity
          onPress={() => Linking.openURL(item.link)}
          style={[styles.linkBtn, { borderColor: type.color + '60' }]}
        >
          <Text style={[styles.linkBtnText, { color: type.color }]}>Read more →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Section header ─────────────────────────────────────────────────
function SectionHeader({ title, right }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────
export default function NewsScreen() {
  const insets = useSafeAreaInsets();

  const [notifs,    setNotifs]    = useState([]);
  const [news,      setNews]      = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [readSet,   setReadSet]   = useState(new Set());
  const [loading,   setLoading]   = useState(true);

  // Load dismissed + read from AsyncStorage
  useEffect(() => {
    async function loadLocal() {
      try {
        const d = await AsyncStorage.getItem(DISMISSED_KEY);
        const r = await AsyncStorage.getItem(READ_KEY);
        if (d) setDismissed(new Set(JSON.parse(d)));
        if (r) setReadSet(new Set(JSON.parse(r)));
      } catch (_) {}
    }
    loadLocal();
  }, []);

  // Subscribe to notifications collection
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'notifications'), orderBy('ts', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  // Subscribe to news collection
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'news'), orderBy('ts', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        ts: d.data().ts ?? d.data().createdAt?.toMillis?.() ?? Date.now(),
      }));
      items.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.ts - a.ts;
      });
      setNews(items);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const handleDismiss = useCallback(async (id) => {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    const readNext = new Set(readSet).add(id);
    setReadSet(readNext);
    try {
      await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
      await AsyncStorage.setItem(READ_KEY,      JSON.stringify([...readNext]));
    } catch (_) {}
  }, [dismissed, readSet]);

  const handleMarkRead = useCallback(async (id) => {
    const next = new Set(readSet).add(id);
    setReadSet(next);
    try {
      await AsyncStorage.setItem(READ_KEY, JSON.stringify([...next]));
    } catch (_) {}
  }, [readSet]);

  const handleMarkAllRead = useCallback(async () => {
    const next = new Set(notifs.map(n => n.id));
    setReadSet(next);
    try {
      await AsyncStorage.setItem(READ_KEY, JSON.stringify([...next]));
    } catch (_) {}
  }, [notifs]);

  const visibleNotifs = notifs.filter(n => !dismissed.has(n.id));
  const unreadCount   = visibleNotifs.filter(n => !readSet.has(n.id)).length;

  // Build flat list data
  const listData = [
    { _type: 'notif-header' },
    ...(loading
      ? [{ _type: 'loading' }]
      : visibleNotifs.length === 0
        ? [{ _type: 'notif-empty' }]
        : visibleNotifs.map(n => ({ _type: 'notif', ...n }))
    ),
    { _type: 'news-header' },
    ...(news.length === 0
      ? [{ _type: 'news-empty' }]
      : news.map(n => ({ _type: 'news', ...n }))
    ),
  ];

  function renderItem({ item }) {
    if (item._type === 'loading') {
      return <ActivityIndicator color={COLORS.ORANGE} style={{ marginTop: 20 }} />;
    }
    if (item._type === 'notif-header') {
      return (
        <SectionHeader
          title={`🔔 Notifications${unreadCount > 0 ? `  (${unreadCount} new)` : ''}`}
          right={unreadCount > 0
            ? <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.markAllBtn}>Mark all read</Text>
              </TouchableOpacity>
            : null}
        />
      );
    }
    if (item._type === 'notif-empty') {
      return <Text style={styles.emptyText}>No notifications yet.</Text>;
    }
    if (item._type === 'notif') {
      return (
        <NotifCard
          item={item}
          isRead={readSet.has(item.id)}
          onDismiss={handleDismiss}
          onMarkRead={handleMarkRead}
        />
      );
    }
    if (item._type === 'news-header') {
      return <SectionHeader title="📰 News" />;
    }
    if (item._type === 'news-empty') {
      return <Text style={styles.emptyText}>No news yet — check back soon!</Text>;
    }
    if (item._type === 'news') {
      return <NewsCard item={item} />;
    }
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>📡 Updates</Text>
        <Text style={styles.sub}>Notifications & News from Hammer Radio</Text>
      </View>
      <FlatList
        data={listData}
        keyExtractor={(item, i) => item.id ?? item._type + i}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.NAVY },
  header:         { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  heading:        { color: COLORS.ORANGE, fontSize: 22, fontWeight: '700' },
  sub:            { color: COLORS.MUTED, fontSize: 13, marginTop: 2 },
  list:           { padding: 16, paddingBottom: 40 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 10 },
  sectionTitle:   { color: COLORS.WHITE, fontSize: 16, fontWeight: '700' },
  markAllBtn:     { color: COLORS.ORANGE, fontSize: 12, fontWeight: '600' },
  emptyText:      { color: COLORS.MUTED, fontSize: 13, textAlign: 'center', paddingVertical: 16 },

  // Notification cards
  notifCard:      { backgroundColor: 'rgba(232,101,10,0.08)', borderWidth: 1, borderColor: 'rgba(232,101,10,0.3)', borderRadius: 12, padding: 14, marginBottom: 10 },
  notifCardRead:  { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' },
  notifRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  unreadDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.ORANGE, marginTop: 5 },
  notifTitle:     { color: COLORS.WHITE, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  notifBody:      { color: '#CCCCCC', fontSize: 13, lineHeight: 19 },
  notifTime:      { color: COLORS.MUTED, fontSize: 11, marginTop: 6 },
  mutedText:      { color: COLORS.MUTED },
  dismissBtn:     { padding: 4, marginLeft: 8 },
  dismissX:       { color: COLORS.MUTED, fontSize: 14, fontWeight: '700' },

  // News cards
  newsCard:       { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  watcherCard:    { borderStyle: 'dashed' },
  pinnedLabel:    { color: '#FFD700', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge:      { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  typeBadgeText:  { fontSize: 11, fontWeight: '700' },
  timestamp:      { color: COLORS.MUTED, fontSize: 11 },
  newsTitle:      { color: COLORS.WHITE, fontSize: 17, fontWeight: '700', marginBottom: 6, lineHeight: 22 },
  watcherTitle:   { color: '#CE99ED', fontStyle: 'italic', letterSpacing: 0.5 },
  newsBody:       { color: '#BBBBBB', fontSize: 14, lineHeight: 21 },
  watcherText:    { color: '#9B7AB0', fontStyle: 'italic' },
  linkBtn:        { marginTop: 12, borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' },
  linkBtnText:    { fontSize: 13, fontWeight: '600' },
});