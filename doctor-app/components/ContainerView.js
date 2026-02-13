import React from 'react';
import {
  View,
  Platform,
  StatusBar,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { DismissKeyboard } from './DismissKeyboard';

const ContainerView = ({ children, ...rest }) => {
  const { customStyles, dismissKeyboard = false, bgImage = false } = rest;

  if (dismissKeyboard) {
    return (
      <DismissKeyboard>
        <View style={[styles.container, customStyles]}>{children}</View>
      </DismissKeyboard>
    );
  }

  if (bgImage) {
    return (
      <ImageBackground
        source={require('./../assets/splash.png')}
        resizeMode="stretch"
        style={styles.bgImage}
      >
        <View style={[styles.container, styles.overlay, customStyles]}>
          {children}
        </View>
      </ImageBackground>
    );
  }

  return <View style={[styles.container, customStyles]}>{children}</View>;
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(249,249,249,.9)',
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
  },
  bgImage: {
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    width: '100%',
    height: '100%',
  },
});

export default ContainerView;
