---
name: Generate React Native Screen
description: Creates a new, styled, and typed React Native screen complete with RTK Query and Error Boundaries.
---

# Generate React Native Screen

## Purpose
This skill creates a new screen in `doctor-app/screens/` and automatically sets up its layout following the strict rules of this codebase (especially component-design and API-hygiene rules).

## Execution Steps

1. **Ask the User for the Screen Name**: E.g., `PatientProfileScreen`.
2. **Create the Screen File**: Generate the file under `doctor-app/screens/{ScreenName}/{ScreenName}.tsx`.
3. **Implement the "Walking Skeleton"**:
   - Wrap the main output in a root `<ErrorBoundary>`.
   - Setup a basic `View` with styles using standard generic components from `doctor-app/components/`.
   - Include dummy loading/error/success states.
4. **Update Navigation**: Add instructions or automatically update `doctor-app/navigation/` to import this new screen.
5. **Check Types**: Scaffold a proper TypeScript `interface` for the component props.

## Component Skeleton Example
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface BaseScreenProps {
  // Navigation or Route props here
}

export const BaseScreen: React.FC<BaseScreenProps> = (props) => {
  return (
    <View style={styles.container}>
      <Text>Walking Skeleton</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
```
