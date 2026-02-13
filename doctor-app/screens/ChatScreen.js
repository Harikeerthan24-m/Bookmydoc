import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Screen</Text>
      </View>

      <View style={styles.chatContainer}>
        <View style={styles.messageBubble}>
          <Image
            style={styles.backgroundimage}
            source={require('../assets/images/chat.png')}
          />
          <Text style={styles.messageText}>
            AI-powered Chat System Coming Soon!
          </Text>
        </View>
      </View>
    </View>
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
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#009EFF',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  messageBubble: {
    // backgroundColor: '#f0f8ff',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    height: '90%',
  },
  messageText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  backgroundimage: {
    width: '100%',
    height: '50%',
  },
});

export default ChatScreen;
