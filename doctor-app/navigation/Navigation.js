import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants';

// Import your screens here
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ExploreScreen from '../screens/ExploreScreen';
import DoctorProfile from '../screens/DoctorProfile';
import NotificationsScreen from '../screens/NotificationsScreen';
import ChatScreen from '../screens/ChatScreen';
import Payment from '../screens/PaymentScreen';
// import DoctorAppointment from '../components/explore_components/doctorprofile_components/doctorappointmentbottom/DoctorApppointment';
import MyProfile from '../screens/MyProfile';

import Stethoscope_Selected from '../assets/icons/Stethoscope_Selected';
import Stethoscope_Icon from '../assets/icons/Stethoscope_Icon';
import Home_Icon from '../assets/icons/Home_Icon';
import Menu_Icon from '../assets/icons/Menu_Icon';
import Bell_Icon from '../assets/icons/Bell_Icon';
import Home_Selected_Icon from '../assets/icons/Home_Selected_Icon';
import Menu_Selected from '../assets/icons/Menu_Selected';
import Notification_Icon from '../assets/icons/Notification_Icon';
import Notification_Selected from '../assets/icons/Notification_Selected';
import expoApp from './../app.json';
import { navigationRef } from './navigation-ref';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function buildDeepLinkFromNotificationData(data) {
  if (data) {
    return `${Constants.expoConfig.scheme}://notifications`;
  }
  return null;
}

const linking = {
  prefixes: [`${Constants.expoConfig.scheme}://`],
  config: {
    initialRouteName: 'home',
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Notifications: 'notifications',
        },
      },
      MyProfile: 'profile',
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (typeof url === 'string') {
      return url;
    }
    //getInitialNotification: When the application is opened from a quit state.
    const message = await messaging().getInitialNotification();
    const deeplinkURL = buildDeepLinkFromNotificationData(message?.data);
    if (typeof deeplinkURL === 'string') {
      return deeplinkURL;
    }
  },
  subscribe(listener) {
    const onReceiveURL = ({ url }) => listener(url ?? '');
    // Listen to incoming links from deep linking
    const linkingSubscription = Linking.addEventListener('url', onReceiveURL);

    //onNotificationOpenedApp: When the application is running, but in the background.
    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      const url = buildDeepLinkFromNotificationData(remoteMessage.data);
      if (typeof url === 'string') {
        listener(url);
      }
    });

    return () => {
      linkingSubscription.remove();
      unsubscribe();
    };
  },
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconComponent;

          // Check the route name and set the appropriate icon
          if (route.name === 'Home') {
            iconComponent = focused ? (
              <Home_Selected_Icon color={color} />
            ) : (
              <Home_Icon color={color} />
            );
          } else if (route.name === 'Explore') {
            iconComponent = focused ? (
              <Stethoscope_Selected color={color} />
            ) : (
              <Stethoscope_Icon color={color} />
            );
          } else if (route.name === 'Profile') {
            iconComponent = focused ? (
              <Menu_Selected color={color} />
            ) : (
              <Menu_Icon color={color} />
            );
          } else if (route.name === 'Notifications') {
            iconComponent = focused ? (
              <Notification_Selected color={color} />
            ) : (
              <Notification_Icon color={color} />
            );
          }

          return iconComponent;
        },
        tabBarActiveTintColor: '#18A0FB',
        tabBarInactiveTintColor: '#000',
        tabBarLabelStyle: {
          display: 'none', // Hide the tab bar label
        },
        tabBarStyle: {
          display: 'flex',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          elevation: 1,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ headerShown: false, tabBarHideOnKeyboard: true }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false, tabBarHideOnKeyboard: true }}
      />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      style={Styles.container}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="DoctorProfile" component={DoctorProfile} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        {/* <Stack.Screen name="DoctorAppointment" component={DoctorAppointment} /> */}
        <Stack.Screen name="Payment" component={Payment} />
        <Stack.Screen name="MyProfile" component={MyProfile} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const Styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9F9F9',
  },
});

export default Navigation;
