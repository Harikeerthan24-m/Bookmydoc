import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const StickyButton = ({ onPress, title, disabled, style = {} }) => {
  return (
    <View style={{ ...styles.container, ...style }}>
      <TouchableOpacity
        disabled={disabled}
        style={styles.button}
        onPress={onPress}
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
  button: {
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
  disabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StickyButton;
