import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../theme/colors';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SCHEDULE = [
  { day: 'Monday',    time: '5:00 PM – 8:00 PM',  show: "Hammer's Hit Mix",        host: 'Jackson Hammer', desc: 'The best hits from every decade — non-stop!' },
  { day: 'Wednesday', time: '6:00 PM – 9:00 PM',  show: "Hammer's Time Machine",   host: 'Jackson Hammer', desc: 'A deep dive into the music that defined the era.' },
  { day: 'Friday',    time: '7:00 PM – 11:00 PM', show: 'Friday Night Drive',       host: 'Jackson Hammer', desc: 'Kick off your weekend with live mixes and call-ins.' },
  { day: 'Saturday',  time: '2:00 PM – 5:00 PM',  show: 'Weekend Rewind',           host: 'Jackson Hammer', desc: 'Your favourite classic hits, every Saturday afternoon.' },
  { day: 'Sunday',    time: '8:00 PM – 10:00 PM', show: 'The Hammer Countdown',     host: 'Jackson Hammer', desc: 'The top-10 countdown of the week, voted by listeners.' },
];

function todayName() {
  return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}

export default function ScheduleScreen() {
  const today = todayName();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>📅 Show Schedule</Text>
        <Text style={styles.subtitle}>All times Eastern (ET)</Text>

        {SCHEDULE.map((item, i) => {
          const isToday = item.day === today;
          return (
            <View key={i} style={[styles.card, isToday && styles.cardToday]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.day, isToday && styles.dayToday]}>{item.day}</Text>
                {isToday && <Text style={styles.todayBadge}>TODAY</Text>}
              </View>
              <Text style={styles.time}>{item.time}</Text>
              <Text style={styles.show}>{item.show}</Text>
              <Text style={styles.host}>hosted by {item.host}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
          );
        })}

        <View style={styles.note}>
          <Text style={styles.noteText}>
            📻 Schedule may vary. Tune in live at hammerradio.live for the latest updates.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.NAVY },
  scroll:      { flex: 1 },
  content:     { padding: 16, paddingBottom: 60 },
  title:       { color: COLORS.ORANGE, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subtitle:    { color: COLORS.MUTED, fontSize: 12, marginBottom: 20, letterSpacing: 0.5 },
  card:        { backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.BORDER },
  cardToday:   { borderColor: COLORS.ORANGE, borderWidth: 2 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  day:         { color: COLORS.MUTED, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  dayToday:    { color: COLORS.ORANGE },
  todayBadge:  { backgroundColor: COLORS.ORANGE, color: COLORS.WHITE, fontSize: 9, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, letterSpacing: 1 },
  time:        { color: COLORS.GOLD, fontSize: 13, marginBottom: 6 },
  show:        { color: COLORS.WHITE, fontSize: 17, fontWeight: '700', marginBottom: 2 },
  host:        { color: COLORS.MUTED, fontSize: 12, marginBottom: 6, fontStyle: 'italic' },
  desc:        { color: '#888', fontSize: 13, lineHeight: 18 },
  note:        { backgroundColor: COLORS.SURFACE, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: COLORS.BORDER },
  noteText:    { color: COLORS.MUTED, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
