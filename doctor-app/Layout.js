import React, { useEffect } from 'react';
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
import { AppDispatch } from './store';
import SplashScreen from './screens/SplashScreen';
import { navigate } from './navigation/navigation-ref';

export default function Layout() {
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
      } else {
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated, isAccessTokenExpired, dispatch]);

  useEffect(() => {
    dispatch(resetNotifications());

    // Listen for foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('onMessage', JSON.stringify(remoteMessage));
      if (!remoteMessage) {
        return;
      }
      dispatch(addNotifications(remoteMessage));
    });

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
