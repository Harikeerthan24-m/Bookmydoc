import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Global_Styles from './../utils/Global_Styles';

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
    backgroundColor: 'black',
    zIndex: 99,
  },
});

export default function Loading({
  size,
  color = Global_Styles.PrimaryColour,
  bgColor = 'black',
  style = {},
}) {
  return (
    <View
      style={[styles.loading, { backgroundColor: bgColor }, style]}
      pointerEvents="auto"
    >
      <ActivityIndicator size={size ?? 'large'} color={color} />
    </View>
  );
}
