import React from 'react';
import {
  Modal, View, Text, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import COLORS from '../theme/colors';

const EULA_TEXT = `HAMMER RADIO — COMMUNITY CHAT TERMS OF USE

Last updated: June 2026

By using Hammer Radio's live chat feature, you agree to these Terms of Use.

1. ELIGIBILITY
You must be at least 13 years old to participate in chat.

2. YOUR RESPONSIBILITIES
You are solely responsible for all messages, images, audio clips, and GIFs you post. Do not share personal information such as your address, phone number, or passwords.

3. PROHIBITED CONTENT
You may not post content that is hateful, harassing, threatening, explicit, discriminatory, or illegal. Spam, advertisements, and impersonation are also prohibited.

4. MODERATION
Hammer Radio reserves the right to remove any message and suspend or ban any user at any time, without prior notice, for any reason.

5. REPORTING & BLOCKING
You may report any message by pressing and holding it and selecting "Report." You may block any user by pressing and holding their message and selecting "Block." Blocked users' messages will no longer be visible to you.

6. NO LIABILITY
Hammer Radio is not responsible for content posted by users. Use the chat at your own discretion.

7. CHANGES
These terms may be updated at any time. Continued use of chat constitutes acceptance of the updated terms.

For questions, contact us at support@hammerradio.live`;

export default function EulaModal({ visible, onAccept, onDecline }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Community Chat Terms</Text>
          <Text style={styles.subtitle}>Please read and accept before chatting</Text>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.body}>{EULA_TEXT}</Text>
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
              <Text style={styles.acceptText}>I Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent:  'center',
    alignItems:      'center',
    padding:         20,
  },
  container: {
    backgroundColor: COLORS.SURFACE,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     COLORS.BORDER,
    width:           '100%',
    maxHeight:       '85%',
    padding:         20,
  },
  title: {
    color:        COLORS.ORANGE,
    fontSize:     20,
    fontWeight:   '700',
    marginBottom: 4,
    textAlign:    'center',
  },
  subtitle: {
    color:        COLORS.MUTED,
    fontSize:     13,
    marginBottom: 16,
    textAlign:    'center',
  },
  scroll: {
    maxHeight:    380,
    marginBottom: 20,
  },
  body: {
    color:      COLORS.WHITE,
    fontSize:   13,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap:           12,
  },
  declineBtn: {
    flex:            1,
    paddingVertical: 14,
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     COLORS.BORDER,
    alignItems:      'center',
  },
  declineText: {
    color:      COLORS.MUTED,
    fontSize:   15,
    fontWeight: '600',
  },
  acceptBtn: {
    flex:            1,
    paddingVertical: 14,
    borderRadius:    8,
    backgroundColor: COLORS.ORANGE,
    alignItems:      'center',
  },
  acceptText: {
    color:      COLORS.WHITE,
    fontSize:   15,
    fontWeight: '700',
  },
});