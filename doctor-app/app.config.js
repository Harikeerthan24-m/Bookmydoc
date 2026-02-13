import 'react-native-dotenv';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    APP_ENV: process.env.APP_ENV,
    API_URL: process.env.API_URL,
    API_BASE_URL: process.env.API_BASE_URL,
    ANDROID_WEB_CLIENT_ID: process.env.ANDROID_WEB_CLIENT_ID,
    IOS_WEB_CLIENT_ID: process.env.IOS_WEB_CLIENT_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
});
