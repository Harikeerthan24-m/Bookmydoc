import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const PaymentButton = ({ onPress, disabled, title }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.appointmentButton}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  appointmentButton: {
    backgroundColor: '#18A0FB',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default PaymentButton;
