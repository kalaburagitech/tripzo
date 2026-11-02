import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TripzoHeader } from '../components/TripzoHeader';
import { FAQS } from '../data/dummyData';
import { Colors, Shadows, Radii } from '../constants/theme';
import { useToast } from '../components/Toast';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: string;
}

export default function SupportScreen() {
  const { showToast } = useToast();

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [activeSection, setActiveSection] = useState<'faq' | 'chat'>('faq');

  // Interactive chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'agent',
      text: 'Hello! I am your Tripzo Assistant. How can I help you with your bus journey or ticket today?',
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    const query = inputText.toLowerCase();
    setInputText('');

    // Generate intelligent assistant response
    setTimeout(() => {
      let reply = 'Thank you for reaching out. Our support team is available 24/7. Is there anything else you need help with?';

      if (query.includes('cancel') || query.includes('refund')) {
        reply = 'You can cancel any upcoming ticket under "My Bookings" tab. Demo refunds are calculated per operator policy and credited back immediately!';
      } else if (query.includes('track') || query.includes('gps') || query.includes('where')) {
        reply = 'Live tracking is available on all confirmed tickets. Tap "Live Track" on your digital boarding pass to see current simulated location and ETA.';
      } else if (query.includes('coupon') || query.includes('discount') || query.includes('offer')) {
        reply = 'Use code TRIPZO10 for 10% instant off, or WELCOME100 for flat ₹100 off on your first bus ride!';
      } else if (query.includes('seat') || query.includes('female')) {
        reply = 'Pink seats in our interactive seat selector are reserved exclusively for solo female travelers.';
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          sender: 'agent',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 700);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <TripzoHeader title="Tripzo Support Center" subtitle="24/7 Traveler Assistance" />

      {/* Mode Switcher: FAQs or Live Chat */}
      <View style={styles.segmentStrip}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === 'faq' && styles.segmentBtnActive]}
          onPress={() => setActiveSection('faq')}
        >
          <Ionicons
            name="help-circle"
            size={16}
            color={activeSection === 'faq' ? Colors.white : Colors.navy}
          />
          <Text style={[styles.segmentText, activeSection === 'faq' && styles.segmentTextActive]}>
            Frequently Asked Questions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === 'chat' && styles.segmentBtnActive]}
          onPress={() => setActiveSection('chat')}
        >
          <MaterialCommunityIcons
            name="chat-processing"
            size={16}
            color={activeSection === 'chat' ? Colors.white : Colors.navy}
          />
          <Text style={[styles.segmentText, activeSection === 'chat' && styles.segmentTextActive]}>
            Support Chat
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === 'faq' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Quick Contact Cards */}
          <View style={styles.quickContactsRow}>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => showToast('Calling Tripzo Hotline: 1800-TRIPZO (Demo)', { type: 'info' })}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="call" size={20} color={Colors.white} />
              </View>
              <Text style={styles.contactTitle}>Toll Free</Text>
              <Text style={styles.contactSub}>1800-TRIPZO</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => showToast('Email sent to support@tripzo.app (Demo)', { type: 'info' })}
            >
              <View style={[styles.contactIcon, { backgroundColor: Colors.navy }]}>
                <Ionicons name="mail" size={20} color={Colors.white} />
              </View>
              <Text style={styles.contactTitle}>Email Us</Text>
              <Text style={styles.contactSub}>support@tripzo.app</Text>
            </TouchableOpacity>
          </View>

          {/* FAQs Accordion */}
          <View style={styles.faqList}>
            <Text style={styles.faqListHeading}>Top Questions</Text>
            {FAQS.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.faqItem}
                  onPress={() => setExpandedFaq(isExpanded ? null : idx)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqQuestionRow}>
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.navy}
                    />
                  </View>

                  {isExpanded && <Text style={styles.faqAnswer}>{faq.a}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* Live Demo Chat */
        <View style={styles.chatContainer}>
          <ScrollView contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <View
                  key={msg.id}
                  style={[styles.messageBubble, isUser ? styles.userBubble : styles.agentBubble]}
                >
                  <Text style={[styles.messageText, isUser ? styles.userText : styles.agentText]}>
                    {msg.text}
                  </Text>
                  <Text style={[styles.messageTime, isUser ? styles.userTime : styles.agentTime]}>
                    {msg.time}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Chat Input Bar */}
          <View style={styles.chatInputBar}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask a question (e.g., How to cancel?)..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
              <Ionicons name="send" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  segmentStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: Colors.navy,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navy,
  },
  segmentTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  quickContactsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.navy,
  },
  contactSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  faqList: {
    gap: 8,
  },
  faqListHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.navy,
    marginBottom: 8,
  },
  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  chatContainer: {
    flex: 1,
  },
  chatScroll: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: Radii.lg,
  },
  userBubble: {
    backgroundColor: Colors.orange,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  agentBubble: {
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  userText: {
    color: Colors.white,
    fontWeight: '600',
  },
  agentText: {
    color: Colors.navy,
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  agentTime: {
    color: Colors.textMuted,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.background,
    borderRadius: Radii.pill,
    paddingHorizontal: 16,
    fontSize: 13,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
