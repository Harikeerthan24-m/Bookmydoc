import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params = {}) {
  const clearIntervalID = setInterval(() => {
    if (navigationRef.isReady()) {
      clearInterval(clearIntervalID);
      navigationRef.navigate(name, params);
    }
  }, 500);
}
