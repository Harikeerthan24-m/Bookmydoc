import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import {
  useChatMutation,
  useGetChatHistoryQuery,
  useLazyGetChatHistoryQuery,
} from '../store/slices/ai.slice';
import Global_Styles, { headerShadow } from '../utils/Global_Styles';
import DoctorListCard from '../components/DoctorListCard';

const PAGE_SIZE = 25;

function getDateLabel(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();
  const tD = today.getDate();
  const tM = today.getMonth();
  const tY = today.getFullYear();
  const yD = yesterday.getDate();
  const yM = yesterday.getMonth();
  const yY = yesterday.getFullYear();
  if (y === tY && m === tM && d === tD) return 'Today';
  if (y === yY && m === yM && d === yD) return 'Yesterday';
  const day = String(d).padStart(2, '0');
  const month = String(m + 1).padStart(2, '0');
  return `${day}/${month}/${y}`;
}

function buildListWithDateSections(messages) {
  const list = [];
  let lastDateKey = null;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const iso = msg.createdAt;
    const date = iso ? new Date(iso) : new Date();
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (dateKey !== lastDateKey) {
      lastDateKey = dateKey;
      const label = getDateLabel(iso || date.toISOString());
      if (label) {
        list.push({ type: 'date', id: `date-${dateKey}`, label });
      }
    }
    list.push({ ...msg, type: 'message' });
  }
  return list;
}

const ChatScreen = () => {
  const navigation = useNavigation();
  const user = useSelector((state) => state.authSlice?.user);
  const profile = useSelector((state) => state.authSlice?.profile);
  const userName =
    profile?.display_name || user?.displayName || user?.display_name || '';
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const flatListRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const RATE_LIMIT_MS = 2000;
  const [chatMutation] = useChatMutation();
  const chatHistoryQueryArg = useMemo(() => ({ limit: PAGE_SIZE }), []);
  const { data: chatHistoryData, isLoading: isLoadingHistory, refetch: refetchHistory } =
    useGetChatHistoryQuery(chatHistoryQueryArg, { skip: !user?.uid });
  const [fetchOlderHistory] = useLazyGetChatHistoryQuery();
  const lastSyncedHistoryRef = useRef(null);

  // Force refetch from Firestore every time ChatScreen gets focused
  // This ensures that when returning from VoiceScreen, the AI's transcription is fully loaded!
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        refetchHistory();
      }
    }, [refetchHistory, user?.uid])
  );

  useEffect(() => {
    if (!chatHistoryData) return;

    const history = chatHistoryData.conversationHistory || [];
    const msgs = chatHistoryData.messages || [];
    const msgCount = msgs.length;
    const cursor = chatHistoryData.nextCursor ?? null;
    const firstId = msgs[0]?.id;
    const syncKey = `${msgCount}-${cursor}-${firstId}`;
    
    if (lastSyncedHistoryRef.current === syncKey) return;
    lastSyncedHistoryRef.current = syncKey;

    setConversationHistory(history);
    const uiMessages = msgs.map((m) => ({
      id: m.id || m.content?.slice(0, 8) || String(Math.random()),
      text: m.content || '',
      isUser: m.role === 'user',
      doctors: m.doctors,
      createdAt: m.createdAt,
      inputType: m.inputType || 'text',
      outputType: m.outputType || 'text',
    }));
    setMessages(uiMessages);
    setNextCursor(cursor);
    const t = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(t);
  }, [chatHistoryData]);

  const hasMore = nextCursor != null;

  const loadOlderMessages = useCallback(async () => {
    if (!nextCursor || loadingMore || !user?.uid) return;
    setLoadingMore(true);
    try {
      const result = await fetchOlderHistory({
        limit: 25,
        before: nextCursor,
      }).unwrap();
      if (!result?.messages?.length) {
        setNextCursor(null);
        return;
      }
      const olderHistory = result.conversationHistory || [];
      const olderUiMessages = (result.messages || []).map((m) => ({
        id: m.id || m.content?.slice(0, 8) || String(Math.random()),
        text: m.content || '',
        isUser: m.role === 'user',
        doctors: m.doctors,
        createdAt: m.createdAt,
        inputType: m.inputType || 'text',
        outputType: m.outputType || 'text',
      }));
      setConversationHistory((prev) => [...olderHistory, ...prev]);
      setMessages((prev) => [...olderUiMessages, ...prev]);
      setNextCursor(result.nextCursor ?? null);
    } catch (e) {
      console.warn('[Chat] Load older history failed:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, user?.uid, fetchOlderHistory]);

  const handleScroll = useCallback(
    (e) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        e?.nativeEvent ?? {};
      const y = contentOffset?.y ?? 0;
      if (y < 80 && hasMore && !loadingMore) loadOlderMessages();
      const distanceFromBottom =
        (contentSize?.height ?? 0) - y - (layoutMeasurement?.height ?? 0);
      setShowScrollToBottom(distanceFromBottom > 120);
    },
    [hasMore, loadingMore, loadOlderMessages],
  );

  const listWithDateSections = useMemo(
    () => buildListWithDateSections(messages),
    [messages],
  );

  const scrollToBottom = useCallback(() => {
    setShowScrollToBottom(false);
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const showWelcome = messages.length === 0;

  const sendMessage = useCallback(
    async (text) => {
      // 1. trim the user given text
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // 2. Add user message to UI
      const nowIso = new Date().toISOString();
      const userMessage = {
        id: Date.now().toString(),
        text: trimmed,
        isUser: true,
        createdAt: nowIso,
        inputType: 'text',
      };
      setMessages((prev) => [...prev, userMessage]);
      setMessageText('');
      setIsLoading(true);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Update conversation history for API
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: trimmed },
      ];

      const lastMessage = messages[messages.length - 1];
      const previousTurnHadDoctors =
        lastMessage &&
        !lastMessage.isUser &&
        (lastMessage.doctors?.length ?? 0) > 0;

      try {
        const response = await chatMutation({
          message: trimmed,
          conversationHistory:
            conversationHistory.length > 0 ? conversationHistory : undefined,
          previousTurnHadDoctorRecommendations:
            previousTurnHadDoctors || undefined,
          userName: userName || undefined,
          inputType: 'text',
        }).unwrap();

        // Add assistant response to UI
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          isUser: false,
          doctors: Array.isArray(response?.doctorRecommendations)
            ? response.doctorRecommendations
            : [],
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update conversation history
        setConversationHistory(response.conversationHistory || updatedHistory);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error('[Chat] Error:', error);
        // Add error message
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          text: 'I apologize, but I encountered an error. Please try again or check your connection.',
          isUser: false,
        };
        setMessages((prev) => [...prev, errorMessage]);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } finally {
        setIsLoading(false);
      }
    },
    [chatMutation, conversationHistory, isLoading, messages, userName],
  );

  const handleSend = useCallback(() => {
    if (!messageText.trim()) return;
    if (Date.now() - lastSentAtRef.current < RATE_LIMIT_MS) return;
    lastSentAtRef.current = Date.now();
    sendMessage(messageText);
  }, [messageText, sendMessage]);

  const renderDoctorCard = useCallback(
    (doctor) => {
      const docForProfile = {
        uid: doctor?.doctorId,
        display_name: doctor?.name,
        star_rating: doctor?.rating,
        expertiseList: doctor?.specialization ? [doctor.specialization] : [],
        location: { city: doctor?.location },
      };

      return (
        <DoctorListCard
          key={doctor?.doctorId || `${doctor?.name}-${doctor?.specialization}`}
          name={doctor?.name}
          subtitle={doctor?.specialization}
          detail={doctor?.location ? String(doctor.location) : ''}
          onPress={() =>
            navigation.navigate('DoctorProfile', { doctor: docForProfile })
          }
        />
      );
    },
    [navigation],
  );

  const renderMessage = useCallback(
    ({ item }) => {
      if (item.type === 'date') {
        return (
          <View style={styles.dateSeparatorWrap}>
            <View style={styles.dateSeparator}>
              <Text style={styles.dateSeparatorText}>{item.label}</Text>
            </View>
          </View>
        );
      }
      const isUser = item.isUser;
      const isVoiceInput = isUser && item.inputType === 'voice';
      const isVoiceOutput = !isUser && item.outputType === 'voice';
      const showVoiceIcon = isVoiceInput || isVoiceOutput;
      return (
        <View>
          <View
            style={[
              styles.bubbleRow,
              isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
            ]}
          >
            <View
              style={[
                styles.bubble,
                isUser ? styles.bubbleUser : styles.bubbleAssistant,
                showVoiceIcon && styles.bubbleContentRow,
              ]}
            >
              {showVoiceIcon && (
                <Ionicons
                  name="mic"
                  size={14}
                  color={isUser ? 'rgba(255,255,255,0.9)' : '#666'}
                  style={styles.bubbleVoiceIcon}
                />
              )}
              <Text
                style={[
                  styles.bubbleText,
                  isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                ]}
              >
                {item.text}
              </Text>
            </View>
          </View>

          {!isUser &&
            Array.isArray(item?.doctors) &&
            item.doctors.length > 0 && (
              <View style={styles.doctorsWrap}>
                {item.doctors.map(renderDoctorCard)}
              </View>
            )}
        </View>
      );
    },
    [renderDoctorCard],
  );

  const renderThinkingIndicator = useCallback(() => {
    if (!isLoading) return null;

    return (
      <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
        <View
          style={[styles.bubble, styles.bubbleAssistant, styles.thinkingBubble]}
        >
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.thinkingText}>AI is thinking...</Text>
          </View>
        </View>
      </View>
    );
  }, [isLoading]);

  const canSend =
    messageText.trim().length > 0 &&
    !isLoading &&
    Date.now() - lastSentAtRef.current >= RATE_LIMIT_MS;

  if (isLoadingHistory) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={Global_Styles.PrimaryColour} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <TouchableOpacity
          style={styles.clearChatBtn}
          onPress={() => {
            setMessages([]);
            setConversationHistory([]);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.clearChatText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chatContainer}>
        {showWelcome ? (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIconWrap}>
              <Ionicons
                name="sparkles"
                size={36}
                color={Global_Styles.Colors.primary}
              />
            </View>
            <Text style={styles.welcomeGreeting}>
              Hey{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
            </Text>
            <Text style={styles.welcomeSubtitle}>
              How are you feeling today?{'\n'}I'm here to help you find the
              right care.
            </Text>
            <View style={styles.promptChips}>
              {[
                "I'm not feeling well",
                'I have a fever and chills',
                'I have a headache',
                'I feel tired and dizzy',
              ].map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  style={styles.promptChip}
                  activeOpacity={0.75}
                  onPress={() => {
                    setMessageText(prompt);
                  }}
                >
                  <Text style={styles.promptChipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={listWithDateSections}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onScroll={handleScroll}
            scrollEventThrottle={200}
            ListHeaderComponent={
              loadingMore ? (
                <View style={styles.loadMoreWrap}>
                  <ActivityIndicator
                    size="small"
                    color={Global_Styles.PrimaryColour}
                  />
                </View>
              ) : null
            }
            ListFooterComponent={renderThinkingIndicator}
          />
        )}
      </View>

      {showScrollToBottom && !showWelcome && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-down" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <View style={styles.inputBar}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="How are you feeling today!!"
            placeholderTextColor="#999"
            value={messageText}
            onChangeText={setMessageText}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            activeOpacity={0.7}
            disabled={!canSend}
          >
            <Ionicons
              name="send"
              size={22}
              color={canSend ? '#ffffff' : '#999'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.waveformButton}
            onPress={() => navigation.navigate('Voice')}
          >
            <Ionicons name="mic" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Constants.statusBarHeight + 12,
    paddingBottom: 12,
    paddingHorizontal: Global_Styles.Spacing.xl,
    backgroundColor: '#ffffff',
    ...headerShadow,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Global_Styles.Colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  clearChatBtn: {
    width: 44,
    alignItems: 'flex-end',
  },
  clearChatText: {
    fontSize: 14,
    color: Global_Styles.Colors.primary,
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  welcomeIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Global_Styles.Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeGreeting: {
    fontSize: 26,
    fontWeight: '700',
    color: Global_Styles.Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: Global_Styles.Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  promptChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  promptChip: {
    backgroundColor: Global_Styles.Colors.primaryLight,
    borderWidth: 1,
    borderColor: Global_Styles.Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Global_Styles.Radius.xl,
  },
  promptChipText: {
    fontSize: 13,
    color: Global_Styles.Colors.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 24,
  },
  loadMoreWrap: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSeparatorWrap: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateSeparator: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 72,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(90, 90, 90, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  bubbleRow: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  bubbleRowUser: {
    alignSelf: 'flex-end',
  },
  bubbleRowAssistant: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubbleVoiceIcon: {
    marginRight: 8,
  },
  bubbleUser: {
    backgroundColor: '#009EFF',
  },
  bubbleAssistant: {
    backgroundColor: '#f0f4f8',
  },
  bubbleText: {
    fontSize: 16,
  },
  bubbleTextUser: {
    color: '#ffffff',
  },
  bubbleTextAssistant: {
    color: '#333',
  },
  doctorsWrap: {
    marginTop: 10,
    gap: 10,
  },
  thinkingBubble: {
    minWidth: 120,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Global_Styles.Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },

  waveformButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
