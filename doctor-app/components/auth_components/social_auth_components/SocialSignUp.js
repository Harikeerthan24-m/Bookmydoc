import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React from 'react';

const SocialSignUp = () => {
  return (
    <View style={styles.container}>
      <View style={styles.orContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>or continue with</Text>
        <View style={styles.line} />
      </View>
      <View style={styles.logoContainer}>
        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={require('../../../assets/icons/google-logo.png')}
            style={styles.googlelogo}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={require('../../../assets/icons/apple-logo.png')}
            style={styles.applelogo}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SocialSignUp;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    top: 100,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#333',
  },

  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '80%',
  },
  socialButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
    marginHorizontal: 10,
    paddingHorizontal: 20,
  },
  googlelogo: {
    width: 30,
    height: 30,
  },
  applelogo: {
    width: 35,
    height: 35,
  },
});
