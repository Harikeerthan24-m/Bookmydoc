import React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import Profile from '../components/profile_components/Profile';

const profileScreenData = [{ id: '1', component: 'Profile' }];

const ProfileScreen = ({ navigation }) => {
  const renderItem = ({ item }) => {
    switch (item.component) {
      case 'Profile':
        return <Profile navigation={navigation} />;

      default:
        return null;
    }
  };

  return (
    <FlatList
      data={profileScreenData}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default ProfileScreen;
