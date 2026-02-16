import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    APP_ENV: process.env.APP_ENV,
    LOCAL_IP: process.env.LOCAL_IP,
    API_PORT: process.env.API_PORT,
    ANDROID_WEB_CLIENT_ID: process.env.ANDROID_WEB_CLIENT_ID,
    IOS_WEB_CLIENT_ID: process.env.IOS_WEB_CLIENT_ID,
    API_URL: process.env.API_URL,
    API_BASE_URL: process.env.API_BASE_URL,
    APP_FIREBASE_API_KEY: process.env.APP_FIREBASE_API_KEY,
    APP_FIREBASE_AUTH_DOMAIN: process.env.APP_FIREBASE_AUTH_DOMAIN,
    APP_FIREBASE_PROJECT_ID: process.env.APP_FIREBASE_PROJECT_ID,
    APP_FIREBASE_STORAGE_BUCKET: process.env.APP_FIREBASE_STORAGE_BUCKET,
    APP_FIREBASE_MESSAGING_SENDER_ID: process.env.APP_FIREBASE_MESSAGING_SENDER_ID,
    APP_FIREBASE_APP_ID: process.env.APP_FIREBASE_APP_ID,
    APP_FIREBASE_MEASUREMENT_ID: process.env.APP_FIREBASE_MEASUREMENT_ID,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  },
});
