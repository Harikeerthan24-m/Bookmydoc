import { useEffect, useRef } from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

export const DismissKeyboard = ({ children }) => {
  const keyboardStatus = useRef(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        keyboardStatus.current = true;
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        keyboardStatus.current = false;
      },
    );

    return () => {
      keyboardStatus.current = false;
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <TouchableWithoutFeedback
      accessible={false}
      onPress={() => {
        if (keyboardStatus?.current) {
          Keyboard.dismiss();
        }
      }}
    >
      {children}
    </TouchableWithoutFeedback>
  );
};
