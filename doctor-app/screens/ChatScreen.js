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
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  useChatMutation,
  useGetChatHistoryQuery,
  useLazyGetChatHistoryQuery,
} from '../store/slices/ai.slice';
import Global_Styles from '../utils/Global_Styles';
import ProfileImage from '../assets/images/doc1.png';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WELCOME_TEXT = 'Your AI Health care Assistant';

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
  const [chatMutation] = useChatMutation();
  const chatHistoryQueryArg = useMemo(() => ({ limit: PAGE_SIZE }), []);
  const { data: chatHistoryData, isLoading: isLoadingHistory } =
    useGetChatHistoryQuery(chatHistoryQueryArg, { skip: !user?.uid });
  const [fetchOlderHistory] = useLazyGetChatHistoryQuery();
  const lastSyncedHistoryRef = useRef(null);
  const prevLoadingRef = useRef(true);

  useEffect(() => {
    const justFinishedLoading =
      prevLoadingRef.current && !isLoadingHistory;
    prevLoadingRef.current = isLoadingHistory;

    if (isLoadingHistory) return;
    if (!chatHistoryData) return;

    const history = chatHistoryData.conversationHistory || [];
    const msgs = chatHistoryData.messages || [];
    const msgCount = msgs.length;
    const cursor = chatHistoryData.nextCursor ?? null;
    const firstId = msgs[0]?.id;
    const syncKey = `${msgCount}-${cursor}-${firstId}`;
    if (!justFinishedLoading && lastSyncedHistoryRef.current === syncKey) return;
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
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 150);
    return () => clearTimeout(t);
  }, [isLoadingHistory]);

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
    sendMessage(messageText);
  }, [messageText, sendMessage]);

  const renderDoctorCard = useCallback(
    (doctor) => {
      const docForProfile = {
        uid: doctor?.doctorId,
        display_name: doctor?.name,
        star_rating: doctor?.rating,
        expertiseList: doctor?.specialization ? [doctor.specialization] : [],
        location: {
          city: doctor?.location,
        },
      };

      return (
        <TouchableOpacity
          key={doctor?.doctorId || `${doctor?.name}-${doctor?.specialization}`}
          style={styles.docItem}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('DoctorProfile', { doctor: docForProfile })
          }
        >
          <View style={styles.docImageContainer}>
            <Image style={styles.photoUrl} source={ProfileImage} />
          </View>
          <View style={styles.docTextContainer}>
            <Text style={styles.docName}>{doctor?.name}</Text>
            <Text style={styles.docDesignation}>
              {doctor?.specialization || ''}
            </Text>
            <View style={styles.docBottomContainer}>
              <View style={styles.docTimingContainer}>
                <Text style={styles.docTiming}>
                  {doctor?.location ? String(doctor.location) : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.docPlusIconContainer}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('DoctorProfile', {
                    doctor: docForProfile,
                  })
                }
              >
                <FontAwesome name="plus" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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

  const canSend = messageText.trim().length > 0 && !isLoading;

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
      <View style={styles.chatContainer}>
        {showWelcome ? (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeBubble}>
              <Text style={styles.welcomeText}>{WELCOME_TEXT}</Text>
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
            <MaterialCommunityIcons name="waveform" size={24} color="#000" />
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
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBubble: {
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
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
    backgroundColor: '#009EFF',
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

  // Doctor card styles (match Explore search card pattern)
  docItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  docImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F3F3F3',
  },
  docImage: {
    width: '100%',
    height: '100%',
  },
  docTextContainer: {
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  docDesignation: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: Global_Styles.PrimaryColour,
  },
  docBottomContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docTimingContainer: {
    flex: 1,
    paddingRight: 10,
  },
  docTiming: {
    fontSize: 12,
    color: '#6B7280',
  },
  docPlusIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Global_Styles.PrimaryColour,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
