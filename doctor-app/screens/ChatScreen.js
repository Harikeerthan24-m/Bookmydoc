import React, { useState, useRef, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatMutation } from '../store/slices/ai.slice';

const WELCOME_TEXT = 'Your AI Health care Assistant';

const ChatScreen = () => {
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const [chatMutation] = useChatMutation();
  const showWelcome = messages.length === 0;

  const handleSend = useCallback(async () => {
    const trimmed = messageText.trim();
    if (!trimmed || isLoading) return;

    // Add user message to UI
    const userMessage = {
      id: Date.now().toString(),
      text: trimmed,
      isUser: true,
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

    try {
      const response = await chatMutation({
        message: trimmed,
        conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
      }).unwrap();

      // Add assistant response to UI
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        isUser: false,
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
  }, [messageText, isLoading, conversationHistory, chatMutation]);

  const renderMessage = useCallback(({ item }) => {
    const isUser = item.isUser;
    return (
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
          ]}
        >
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
    );
  }, []);

  const renderThinkingIndicator = useCallback(() => {
    if (!isLoading) return null;
    
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
        <View style={[styles.bubble, styles.bubbleAssistant, styles.thinkingBubble]}>
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.thinkingText}>AI is thinking...</Text>
          </View>
        </View>
      </View>
    );
  }, [isLoading]);

  const canSend = messageText.trim().length > 0 && !isLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            ListFooterComponent={renderThinkingIndicator}
          />
        )}
      </View>

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
});

export default ChatScreen;
