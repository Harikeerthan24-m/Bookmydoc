// Mandatory polyfills (must be before any LiveKit/WebRTC code)
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'fast-text-encoding';
import 'events';

// Register the App component
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
