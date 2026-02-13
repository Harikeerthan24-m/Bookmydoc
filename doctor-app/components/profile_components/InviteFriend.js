import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Clipboard,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { profileSelector } from './../../store/slices';

const InviteFriend = ({ onClose }) => {
  const profile = useSelector(profileSelector);
  const inviteText = 'Join this amazing app using my invite code: ';

  const copyToClipboard = () => {
    Clipboard.setString(profile?.user_name);
  };

  return (
    <Modal transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Invite a Friend</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.content}>
            Invite your friends to join the app!
          </Text>
          <TouchableOpacity
            style={styles.inviteContainer}
            onPress={copyToClipboard}
          >
            <Text style={styles.inviteText}>
              {inviteText} {profile?.user_name}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    paddingTop: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#009EFF',
    height: 80,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    fontSize: 16,
    fontWeight: '500',
    margin: 20,
  },
  inviteContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  inviteText: {
    fontSize: 16,
  },
});

export default InviteFriend;
