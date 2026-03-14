import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { userSelector, profileSelector } from './../../../store';
import Global_Styles, { headerShadow } from '../../../utils/Global_Styles';
import DefaultProfile from '../../../assets/images/default_profile.png';

const TopBar = ({ navigation }) => {
  const user = useSelector(userSelector);
  const profile = useSelector(profileSelector);

  return (
    <View style={homeStyles.welcome_container}>
      <TouchableOpacity style={homeStyles.logoContainer}>
        <View style={homeStyles.logo}>
          {(profile?.photoUrl || user?.photoURL) &&
          String(profile?.photoUrl || user?.photoURL || '').trim() !== '' ? (
            <Image
              source={{ uri: profile?.photoUrl || user?.photoURL }}
              style={homeStyles.profileImage}
            />
          ) : (
            <Image
              source={DefaultProfile}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
          )}
        </View>
      </TouchableOpacity>

      <View style={homeStyles.textContainer}>
        <TouchableOpacity>
          <Text style={homeStyles.welcome_container_Text1}>
            {profile?.user_name || user?.user_name}
          </Text>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => dispatch(authLogout())}>
          <Text style={homeStyles.welcome_container_Text2}>Sign Out!</Text>
        </TouchableOpacity> */}
      </View>

      <TouchableOpacity
        style={homeStyles.notificationIconContainer}
        onPress={() => navigation.navigate('Main', { screen: 'Chat' })}
      >
        <Ionicons name="chatbubbles-outline" size={30} />
      </TouchableOpacity>
    </View>
  );
};

export default TopBar;

const homeStyles = StyleSheet.create({
  welcome_container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Constants.statusBarHeight + 10,
    paddingBottom: 12,
    paddingHorizontal: Global_Styles.MarginHorizontal,
    backgroundColor: '#ffffff',
    ...headerShadow,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logo: {
    width: 50, // Adjust size as needed
    height: 50, // Adjust size as needed
    borderRadius: 25, // Make it circular
    overflow: 'hidden', // Clip the image to the border radius
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 3,
  },
  welcome_container_Text1: {
    fontSize: 22,
    fontWeight: '600',
  },
  welcome_container_Text2: {
    fontSize: 14,
    fontWeight: '600',
  },
  notificationIconContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 6,
  },
});
