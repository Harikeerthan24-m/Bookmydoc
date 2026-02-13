import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Global_Styles from './../utils/Global_Styles';

const DeleteActionModal = ({
  title,
  message,
  button,
  show,
  onSubmit,
  onClose,
}) => {
  const [modalVisible, setModalVisible] = useState(show);

  const handleSubmit = () => {
    setModalVisible(false);
    const timeoutID = setTimeout(() => {
      clearTimeout(timeoutID);
      onClose && onClose();
      onSubmit && onSubmit();
    }, 500);
  };

  useEffect(() => {
    console.log({ show });
    setModalVisible(show);
  }, [show]);

  return (
    <View style={styles.container}>
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {title || 'Delete Confirmation'}
            </Text>
            <Text style={styles.modalMessage}>
              {message || 'Are you sure you want to delete this item?'}
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  onClose && onClose();
                }}
              >
                <Text style={styles.cancelText}>No, Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSubmit}
              >
                <Text style={styles.confirmText}>
                  {button || 'Yes, Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Global_Styles.PrimaryColour,
  },
  modalMessage: {
    fontSize: 14,
    color: 'black',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    padding: 10,
    backgroundColor: 'green',
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  confirmButton: {
    padding: 10,
    backgroundColor: Global_Styles.PrimaryColour,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  cancelText: {
    color: 'white',
    fontWeight: 'bold',
  },
  confirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DeleteActionModal;
