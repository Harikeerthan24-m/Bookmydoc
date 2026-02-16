import React, { useEffect, useCallback, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import { useSelector, useDispatch } from 'react-redux';
import Navigation from './navigation/Navigation';
import AuthNavigator from './navigation/AuthNavigator';
import { auth } from './utils/firebaseConfig';
import {
  isAuthenticatedSelector,
  isAccessTokenExpiredSelector,
  logout,
  refreshAuth,
  addNotifications,
  resetNotifications,
} from './store/slices';
import {
  AppDispatch
} from './store';
import SplashScreen from './screens/SplashScreen';
import { navigate } from './navigation/navigation-ref';

// const sampleMessage = {"notification":{"android":{},"body":"Tarek Development your booking with Tarek Ahammed has been rescheduled to 2024-11-08","title":"Booking Schedule Updated"},"originalPriority":1,"priority":1,"sentTime":1732967538261,"data":{"receiver":"{\"uid\":\"2GROMwHBmqYSJl137jvkmoj0kF13\",\"display_name\":\"Tarek Development\",\"role\":\"customer\"}","context":"{\"booking_id\":\"0192ab19-900f-7114-9aa8-cd72a47e17fe\",\"doctor_id\":\"UcdN5WY2JQdSzVK6cOXtIcAlA2n1\",\"customer_id\":\"2GROMwHBmqYSJl137jvkmoj0kF13\",\"type\":\"booking_updated\",\"actions\":[\"reschedule\",\"cancel\"]}","sender":"{\"uid\":\"UcdN5WY2JQdSzVK6cOXtIcAlA2n1\",\"display_name\":\"Tarek Ahammed\",\"role\":\"doctor\"}"},"from":"982069634557","messageId":"0:1730875059651592%c0cc0f90c0cc0f93","ttl":2419200,"collapseKey":"com.doctor.appointment.app"};
// const sampleMessage = {"notification":{"android":{},"body":"Tarek Development your booking with Tarek Ahammed has been completed. Please let us know how the check-up went.","title":"Booking Status Updated"},"originalPriority":1,"priority":1,"sentTime":1731243769037,"data":{"receiver":"{\"uid\":\"2GROMwHBmqYSJl137jvkmoj0kF13\",\"display_name\":\"Tarek Development\",\"role\":\"customer\"}","context":"{\"booking_id\":\"0192ab19-900f-7114-9aa8-cd72a47e17fe\",\"doctor_id\":\"UcdN5WY2JQdSzVK6cOXtIcAlA2n1\",\"customer_id\":\"2GROMwHBmqYSJl137jvkmoj0kF13\",\"type\":\"booking_updated\",\"actions\":[\"rate\"]}","sender":"{\"uid\":\"UcdN5WY2JQdSzVK6cOXtIcAlA2n1\",\"display_name\":\"Tarek Ahammed\",\"role\":\"doctor\"}"},"from":"982069634557","messageId":"0:1731243769045926%c0cc0f90c0cc0f93","ttl":2419200,"collapseKey":"com.doctor.appointment.app"};

export default function Layout() {
  // const [test, setTest] = useState(sampleMessage);
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(isAuthenticatedSelector);
  const isAccessTokenExpired = useSelector(isAccessTokenExpiredSelector);

  // Initialize Firebase messaging handlers
  useEffect(() => {
    // Handle notification that opened the app from quit state
    messaging()
      .getInitialNotification()
      .then(async (remoteMessage) => {
        console.log('getInitialNotification---out', JSON.stringify(remoteMessage));
        if (!remoteMessage) {
          return;
        }
        AppDispatch(addNotifications(remoteMessage));
        const timeoutId = setTimeout(() => {
          clearTimeout(timeoutId);
          navigate('Notifications');
        }, 500);
      })
      .catch((error) => {
        console.error('❌ [FIREBASE] Error in getInitialNotification:', error);
      });

    // Handle notification that opened the app from background state
    const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(
      async (remoteMessage) => {
        console.log('onNotificationOpenedApp---out', JSON.stringify(remoteMessage));
        if (!remoteMessage) {
          return;
        }
        AppDispatch(addNotifications(remoteMessage));
        const timeoutId = setTimeout(() => {
          clearTimeout(timeoutId);
          navigate('Notifications');
        }, 500);
      }
    );

    // Set background message handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('setBackgroundMessageHandler----out', JSON.stringify(remoteMessage));
      if (!remoteMessage) {
        return;
      }
      AppDispatch(addNotifications(remoteMessage));
    });

    return () => {
      unsubscribeOnNotificationOpenedApp();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isAccessTokenExpired) {
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        if (isAccessTokenExpired) {
          const refreshUser = await user.getIdTokenResult(true);
          if (refreshUser?.token) {
            await dispatch(
              refreshAuth({
                accessToken: refreshUser?.token,
                expirationTime: refreshUser?.expirationTime,
                stsTokenManager: user?.stsTokenManager,
              }),
            );
          } else {
            dispatch(logout());
          }
        }
      } else {
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated, isAccessTokenExpired, dispatch]);

  useEffect(() => {
    // Listen for foreground messages
    // messaging().subscribeToTopic('booking').then(() => console.log('booking subscribe'));
    dispatch(resetNotifications());

    // Listen for foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('onMessage', JSON.stringify(remoteMessage));
      if (!remoteMessage) {
        return;
      }
      dispatch(addNotifications(remoteMessage));
    });

    // if (test) {
    //   console.log('test', test);
    //   dispatch(addNotifications(sampleMessage));
    //   setTest('');
    // }

    return unsubscribe;
  }, []);

  if (!isAuthenticated) {
    return (
      <>
        <AuthNavigator />
      </>
    );
  }

  if (isAccessTokenExpired) {
    return <SplashScreen loading={true} />;
  }

  return <Navigation />;
}
