/**
 * @format
 */
import Constants from 'expo-constants';
import {
  APP_ENV as ENV_APP_ENV,
  ANDROID_WEB_CLIENT_ID as ENV_ANDROID_WEB_CLIENT_ID,
  IOS_WEB_CLIENT_ID as ENV_IOS_WEB_CLIENT_ID,
} from '@env';

// Try to get from Constants first (production builds), fall back to @env (development)
const APP_ENV = Constants.expoConfig?.extra?.APP_ENV || ENV_APP_ENV || 'development';
const ANDROID_WEB_CLIENT_ID = Constants.expoConfig?.extra?.ANDROID_WEB_CLIENT_ID || ENV_ANDROID_WEB_CLIENT_ID;
const IOS_WEB_CLIENT_ID = Constants.expoConfig?.extra?.IOS_WEB_CLIENT_ID || ENV_IOS_WEB_CLIENT_ID;

const __DEV__ = (APP_ENV || 'development') === 'development';

if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};
}

import React, { StrictMode, useEffect, Component } from 'react';
import { Platform, StatusBar, Text, View } from 'react-native';
import 'react-native-devsettings';
import 'react-native-gesture-handler';
import 'react-native-devsettings/withAsyncStorage';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import firebase from '@react-native-firebase/app';
import Layout from './Layout';
import OfflineBanner from './components/OfflineBanner';
import SplashScreen from './screens/SplashScreen';
import { persistedStore, store } from './store';
import Global_Styles from './utils/Global_Styles';

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#333' }}>Something went wrong. Please restart the app.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const WEB_CLIENT_ID =
  Platform.OS === 'android' ? ANDROID_WEB_CLIENT_ID : IOS_WEB_CLIENT_ID;

// Initialize Firebase (React Native Firebase auto-initializes from google-services.json/GoogleService-Info.plist)
// This import ensures Firebase is available before any other modules try to use it
if (!firebase.apps.length) {
  console.log('⚠️ [FIREBASE] No Firebase app initialized. Check google-services.json configuration.');
} else {
  console.log('✅ [FIREBASE] Firebase app initialized successfully:', firebase.app().name);
}

export default function APP() {
  useEffect(() => {
    // Validate Web Client ID before configuration
    if (!WEB_CLIENT_ID) {
      console.error(
        `❌ [GOOGLE SIGN-IN] Missing Web Client ID for ${Platform.OS}. ` +
          `Please set ${Platform.OS === 'android' ? 'ANDROID_WEB_CLIENT_ID' : 'IOS_WEB_CLIENT_ID'} in your .env file.`,
      );
      return;
    }

    if (!WEB_CLIENT_ID.includes('.apps.googleusercontent.com')) {
      console.warn(
        `⚠️ [GOOGLE SIGN-IN] Web Client ID format may be incorrect: ${WEB_CLIENT_ID?.substring(0, 20)}...`,
      );
    }

    console.log(
      `✅ [GOOGLE SIGN-IN] Configuring with Web Client ID: ${WEB_CLIENT_ID?.substring(0, 30)}...`,
    );
    console.log(
      `🔍 [GOOGLE SIGN-IN] Full Web Client ID length: ${WEB_CLIENT_ID?.length} characters`,
    );
    console.log(
      `🔍 [GOOGLE SIGN-IN] Web Client ID format valid: ${WEB_CLIENT_ID?.includes('.apps.googleusercontent.com')}`,
    );

    try {
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        offlineAccess: true,
      });
      console.log('✅ [GOOGLE SIGN-IN] Configuration completed successfully');
    } catch (configError) {
      console.error('❌ [GOOGLE SIGN-IN] Configuration error:', configError);
    }
  }, []);

  return (
    <ErrorBoundary>
      <StrictMode>
        <Provider store={store}>
          <PersistGate loading={<SplashScreen />} persistor={persistedStore}>
            <AlertNotificationRoot
              colors={[
                {
                  card: 'white',
                  label: 'black',
                  warning: Global_Styles.PrimaryColour,
                },
              ]}
            >
              <>
              <StatusBar
                animated={true}
                barStyle='default'
                backgroundColor={Global_Styles.PrimaryColour}
              />
               <Layout />
               <OfflineBanner />
              </>
            </AlertNotificationRoot>
          </PersistGate>
        </Provider>
      </StrictMode>
    </ErrorBoundary>
  );
}
