import { Dialog, Toast } from 'react-native-alert-notification';
export const ALERT_DIALOG = 'dialog';
export const ALERT_TOAST = 'toast';
export const ALERT_SUCCESS = 'SUCCESS';
export const ALERT_DANGER = 'DANGER';
export const ALERT_WARNING = 'WARNING';
export const ALERT_INFO = 'INFO';

export function AlertNotification({
  title,
  textBody,
  variant,
  type,
  button,
  onPress,
  onShow,
  onHide,
  autoClose = true,
}) {
  switch (variant) {
    case ALERT_DIALOG:
      Dialog.show({
        type: type ?? ALERT_SUCCESS,
        title,
        textBody,
        button,
        onPressButton: () => {
          if (button && button.toLocaleLowerCase() === 'close') {
            Dialog.hide();
          }
          if (onPress) {
            onPress();
          }
        },
        onHide,
        autoClose,
        onShow,
      });
      break;
    case ALERT_TOAST:
      Toast.show({
        type: type ?? ALERT_SUCCESS,
        title,
        textBody,
        onPress: () => {
          if (button && button.toLocaleLowerCase() === 'close') {
            Dialog.hide();
          }
          if (onPress) {
            onPress();
          }
        },
        onHide,
        autoClose,
      });
      break;
    default:
      Toast.show({
        type: type ?? ALERT_SUCCESS,
        title,
        textBody,
        onPress: () => {
          if (button && button.toLocaleLowerCase() === 'close') {
            Dialog.hide();
          }
          if (onPress) {
            onPress();
          }
        },
        onHide,
        autoClose,
      });
      break;
  }
}
