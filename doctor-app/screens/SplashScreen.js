import React from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    width: '100%',
    height: '100%',
  },
  text: { color: '' },
});

export default function SplashScreen({ loading }) {
  const isDarkMode = useColorScheme() === 'dark';
  styles.text.color = isDarkMode ? Colors.lighter : Colors.darker;
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('./../assets/splash.png')}
        resizeMode="stretch"
        style={styles.item}
      >
        {loading && (
          <ActivityIndicator size="large" color={styles.text.color} />
        )}
      </ImageBackground>
    </View>
  );
}
