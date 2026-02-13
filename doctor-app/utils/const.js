import APP from './../app.json';
import { APP_URL } from './../store/api/api';
export const CURRENCY_SYMBOL = '$';

export const actionCodeSettings = {
  url: APP_URL,
  // This must be true.
  handleCodeInApp: true,
  // iOS: {
  //   bundleId: APP.expo.ios.bundleIdentifier
  // },
  // android: {
  //   packageName: APP.expo.android.package,
  //   installApp: true,
  //   minimumVersion: '12'
  // },
  // dynamicLinkDomain: 'doctor-appointment-c7a6c.web.app'
};
