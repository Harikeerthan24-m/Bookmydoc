import { createSlice, createSelector } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  loading: false,
  error: null,
  notifications: [],
};

const isNotificationExist = (notifications, newMessageId) => {
  if (notifications?.length <= 0) {
    return false;
  }
  return notifications.some((i) => i?.messageId === newMessageId);
};

const clearOldNotifications = (notifications) => {
  if (Array.isArray(notifications) && notifications?.length > 1) {
    const date = new Date();
    const preDateTime = date.setDate(date.getDate() - 15);
    notifications = [...notifications];
    notifications = notifications.reduce((result, current) => {
      if (preDateTime < current?.sentTime) {
        result.push(current);
      }
      return result;
    }, []);
  }
  return notifications;
};

// region Crate Slice
export const NotificationsSlice = createSlice({
  name: 'notificationsSlice',
  initialState,
  reducers: {
    addNotifications(state, action) {
      const results = [];
      const stateNotifications =
        state.notifications && Array.isArray(state.notifications)
          ? state.notifications
          : [];
      if (
        (action?.payload?.notification || action?.payload?.data) &&
        !isNotificationExist(stateNotifications, action?.payload?.messageId)
      ) {
        const notification = { ...action?.payload };
        let toDate = '';
        if (notification?.sentTime) {
          toDate = new Date(notification.sentTime);
        } else {
          toDate = new Date();
        }
        if (notification.data?.context) {
          try {
            notification.data.context = JSON.parse(notification.data.context);
          } catch (err) {
            console.log(err);
          }
        }
        notification.group_id = toDate.toISOString().split('T')?.[0];
        notification.date = toDate;
        notification.display_date = toDate.toDateString();
        results.push(notification);
      }

      state.notifications = [...stateNotifications, ...results];
    },
    resetNotifications(state, action) {
      const notifications = clearOldNotifications(state.notifications);
      state.notifications = notifications;
    },
  },
  extraReducers: (builder) => {},
});

const notificationsSlice = (state) => state.notificationsSlice;
export const notificationSelector = createSelector(
  notificationsSlice,
  (notifications) => ({ ...notifications }),
);

function formatTimeAgo(date) {
  try {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    const seconds = diffInSeconds;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) {
      return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`;
    } else if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (hours < 24) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (days < 7) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (weeks < 4) {
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (months < 12) {
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  } catch (error) {
    return '';
  }
}

function groupNotificationsByDate(notifications) {
  notifications = [...notifications];
  const notificationsData = notifications.sort(
    (a, b) => b.sentTime - a.sentTime,
  );
  const groupedData = notificationsData.reduce((acc, item) => {
    item = { ...item };
    const { group_id } = item;

    // Find if a date group already exists
    let dateGroup = acc.find((group) => group.group_id === group_id);

    // If no group for this date exists, create one
    if (!dateGroup) {
      dateGroup = {
        group_id,
        display_date: item.display_date,
        results: [],
      };
      acc.push(dateGroup);
    }

    // Add the notification to the date group
    item.time = formatTimeAgo(item.date);
    dateGroup.results.push(item);

    return acc;
  }, []);

  return groupedData;
}

export const notificationsSelector = createSelector(
  notificationsSlice,
  (notification) => groupNotificationsByDate(notification.notifications),
);

export const { addNotifications, resetNotifications } =
  NotificationsSlice.actions;
