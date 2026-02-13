/**
 * @format
 */
import Constants from 'expo-constants';
const { APP_ENV, ANDROID_WEB_CLIENT_ID, IOS_WEB_CLIENT_ID } =
  Constants.expoConfig.extra || {};
const __DEV__ = (APP_ENV || 'development') === 'development';
import React, { StrictMode, useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import 'react-native-devsettings';
import 'react-native-devsettings/withAsyncStorage';
import 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import Layout from './Layout';
import SplashScreen from './screens/SplashScreen';
import { persistedStore, store } from './store';
import Global_Styles from './utils/Global_Styles';

const WEB_CLIENT_ID =
  Platform.OS === 'android' ? ANDROID_WEB_CLIENT_ID : IOS_WEB_CLIENT_ID;

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
    <>
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
              </>
            </AlertNotificationRoot>
          </PersistGate>
        </Provider>
      </StrictMode>
    </>
  );
}
