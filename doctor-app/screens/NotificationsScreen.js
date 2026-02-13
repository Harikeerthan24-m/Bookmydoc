import React from 'react';
import { View, StyleSheet } from 'react-native';
import Notifications from '../components/notification_components/Notifications';

const NotificationsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Notifications navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default NotificationsScreen;
