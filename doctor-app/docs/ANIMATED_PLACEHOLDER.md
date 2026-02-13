# Animated Rotating Placeholder

A guide to creating a smooth, vertical slide-up rotating placeholder for text inputs. Use this pattern anywhere you need animated hint text (search bars, chat inputs, hero sections, etc.).

---

## Overview

**What we're building:** Placeholder text that cycles through multiple examples with a smooth upward slide animation, instead of an abrupt swap.

**Key idea:** Native `placeholder` props don't support animations. We overlay an absolutely positioned `Animated.View` on top of the input and animate `translateY` to slide between stacked text items.

---

## Architecture

```
┌─────────────────────────────────────┐
│  TextInput (placeholder="")         │
│  ┌───────────────────────────────┐  │
│  │  Overlay (pointerEvents=none) │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Clip (overflow: hidden) │  │  │
│  │  │ ┌─────────────────────┐ │  │  │
│  │  │ │ Animated.View       │ │  │  │
│  │  │ │ [Text 1]            │ │  │  │  ← translateY slides this
│  │  │ │ [Text 2]            │ │  │  │
│  │  │ │ [Text 3]            │ │  │  │
│  │  │ └─────────────────────┘ │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

- **Overlay:** Covers the input, `pointerEvents="none"` so taps reach the input.
- **Clip:** `overflow: 'hidden'` + fixed height; only one line visible.
- **Animated.View:** Holds stacked texts; `translateY` moves them vertically.
- **TextInput:** Uses empty placeholder; overlay provides the visible hint.

---

## Step-by-Step Implementation

### 1. Define Placeholders & Constants

```javascript
const PLACEHOLDERS = [
  'e.g. First example...',
  'e.g. Second example...',
  'e.g. Third example...',
];

const LINE_HEIGHT = 22;
```

### 2. State & Refs

```javascript
const [placeholderIndex, setPlaceholderIndex] = useState(0);
const slideAnim = useRef(new Animated.Value(0)).current;
const indexRef = useRef(0);
```

- `placeholderIndex`: for re-renders if needed
- `slideAnim`: drives the `translateY` animation
- `indexRef`: tracks current index in interval (avoids stale closure)

### 3. Animation Loop (useEffect)

```javascript
useEffect(() => {
  if (!isActive) return; // e.g. only when input is focused or in a certain mode

  const interval = setInterval(() => {
    const current = indexRef.current;
    const next = current >= PLACEHOLDERS.length - 1 ? 0 : current + 1;

    Animated.timing(slideAnim, {
      toValue: -next * LINE_HEIGHT,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      indexRef.current = next;
      setPlaceholderIndex(next);
    });
  }, 3000);

  return () => clearInterval(interval);
}, [isActive]);
```

- `toValue: -next * LINE_HEIGHT`: negative Y = upward motion
- `Easing.out(Easing.cubic)`: decelerate at the end

### 4. Reset When Disabled

```javascript
useEffect(() => {
  if (!isActive) {
    slideAnim.setValue(0);
    indexRef.current = 0;
    setPlaceholderIndex(0);
  }
}, [isActive]);
```

### 5. JSX Structure

```jsx
<View style={styles.inputWrapper}>
  <TextInput
    placeholder={showAnimatedPlaceholder ? '' : 'Default placeholder'}
    placeholderTextColor="#999"
    value={value}
    onChangeText={setValue}
    style={styles.input}
  />

  {showAnimatedPlaceholder && !value && (
    <View style={styles.placeholderOverlay} pointerEvents="none">
      <View style={[styles.placeholderClip, { height: LINE_HEIGHT }]}>
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
          }}
        >
          {PLACEHOLDERS.map((text, i) => (
            <Text
              key={i}
              style={[styles.placeholderText, { height: LINE_HEIGHT }]}
              numberOfLines={1}
            >
              {text}
            </Text>
          ))}
        </Animated.View>
      </View>
    </View>
  )}
</View>
```

### 6. Styles

```javascript
inputWrapper: {
  flex: 1,
  position: 'relative',
},
placeholderOverlay: {
  ...StyleSheet.absoluteFillObject,
  marginHorizontal: 8,
  paddingVertical: 4,
  justifyContent: 'flex-start',
},
placeholderClip: {
  overflow: 'hidden',
},
placeholderText: {
  fontSize: 15,
  color: '#979797',
  lineHeight: 22,
  justifyContent: 'center',
},
```

---

## Reusable Component

Extract into a standalone component:

```jsx
// AnimatedPlaceholder.js
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';

const LINE_HEIGHT = 22;

export const AnimatedPlaceholder = ({
  placeholders,
  intervalMs = 3000,
  duration = 450,
  lineHeight = LINE_HEIGHT,
  style,
  textStyle,
  visible = true,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);

  useEffect(() => {
    if (!visible || !placeholders?.length) return;

    const interval = setInterval(() => {
      const current = indexRef.current;
      const next = current >= placeholders.length - 1 ? 0 : current + 1;

      Animated.timing(slideAnim, {
        toValue: -next * lineHeight,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        indexRef.current = next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [visible, placeholders?.length, intervalMs, duration, lineHeight]);

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(0);
      indexRef.current = 0;
    }
  }, [visible]);

  if (!visible || !placeholders?.length) return null;

  return (
    <View
      style={[styles.clip, { height: lineHeight }, style]}
      pointerEvents="none"
    >
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
        }}
      >
        {placeholders.map((text, i) => (
          <Text
            key={i}
            style={[styles.text, { height: lineHeight }, textStyle]}
            numberOfLines={1}
          >
            {text}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  text: {
    fontSize: 15,
    color: '#979797',
    lineHeight: 22,
  },
});
```

**Usage:**

```jsx
<View style={{ position: 'relative', flex: 1 }}>
  <TextInput placeholder="" value={value} onChangeText={setValue} />
  {!value && (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <AnimatedPlaceholder
        placeholders={['Type here...', 'Another hint...']}
        intervalMs={3000}
        visible={isFocused}
      />
    </View>
  )}
</View>
```

---

## Customization

| Parameter    | Effect                                               |
| ------------ | ---------------------------------------------------- |
| `intervalMs` | Time between rotations (e.g. 2000, 3000, 5000)       |
| `duration`   | Animation length (e.g. 300–600)                      |
| `lineHeight` | Height per text line; must match `LINE_HEIGHT` style |
| `easing`     | `Easing.linear`, `Easing.inOut(Easing.ease)`, etc.   |

---

## Tips

1. **Direction:** Use positive `translateY` for downward slide.
2. **Multiple lines:** Increase `lineHeight` and clip height for multi-line placeholders.
3. **Delay first rotation:** Start the interval after a short delay if needed.
4. **Visibility:** Hide the overlay when `value.length > 0` or when input is focused and has content.

---

## Files Reference

- Implementation: `doctor-app/components/home_components/Search/Search.js`
- Pattern used in: Ask AI mode search bar
