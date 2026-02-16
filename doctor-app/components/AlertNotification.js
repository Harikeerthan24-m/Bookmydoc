import { Dialog, Toast } from 'react-native-alert-notification';
export const ALERT_DIALOG = 'dialog';
export const ALERT_TOAST = 'toast';
export const ALERT_SUCCESS = 'SUCCESS';
export const ALERT_DANGER = 'DANGER';
export const ALERT_WARNING = 'WARNING';
export const ALERT_INFO = 'INFO';

function toAlertString(value, fallback) {
  const def = fallback ?? 'Something went wrong.';
  if (value == null) return fallback ?? '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value))
      return value
        .map((v) => (typeof v === 'string' ? v : String(v)))
        .join(', ');
    if (typeof value.message === 'string') return value.message;
    if (Array.isArray(value.message))
      return value.message
        .map((v) => (typeof v === 'string' ? v : String(v)))
        .join(', ');
    return def;
  }
  return String(value);
}

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
  // #region agent log
  const titleType = typeof title;
  const textBodyType = typeof textBody;
  if (titleType !== 'string' || textBodyType !== 'string') {
    fetch('http://127.0.0.1:7243/ingest/1eb53b69-292c-46db-8a7f-0aa5f80285a1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'AlertNotification.js:AlertNotification',
        message: 'AlertNotification received non-string title or textBody',
        data: {
          titleType,
          textBodyType,
          titleKeys:
            title && typeof title === 'object' ? Object.keys(title) : null,
          textBodyKeys:
            textBody && typeof textBody === 'object'
              ? Object.keys(textBody)
              : null,
        },
        timestamp: Date.now(),
        hypothesisId: 'A',
      }),
    }).catch(() => {});
  }
  // #endregion
  const safeTitle = toAlertString(title, 'Notification');
  const safeTextBody = toAlertString(textBody, '');
  switch (variant) {
    case ALERT_DIALOG:
      Dialog.show({
        type: type ?? ALERT_SUCCESS,
        title: safeTitle,
        textBody: safeTextBody,
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
        title: safeTitle,
        textBody: safeTextBody,
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
        title: safeTitle,
        textBody: safeTextBody,
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
