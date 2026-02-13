import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import Constants from 'expo-constants';
import { useDispatch, useSelector } from 'react-redux';
import Ratings from './Ratings';
import Reschedule from './Reschedule';
import Loading from './../Loading';
import BlueIcon from '../../assets/icons/calendar-blue.png';
import OrangeIcon from '../../assets/icons/calendar-orange.png';
import Global_Styles from '../../utils/Global_Styles';
import { notificationsSelector, useUpdateBookingMutation } from './../../store';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import {
  AlertNotification,
  ALERT_DIALOG,
  ALERT_WARNING,
  ALERT_DANGER,
  ALERT_TOAST,
  ALERT_SUCCESS,
} from './../AlertNotification';
import DeleteActionModal from './../ConfirmDialog';

const Notifications = () => {
  const [updateBooking, updateBookingResult] = useUpdateBookingMutation();
  const notificationsData = useSelector(notificationsSelector);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedReschedule, setSelectedReschedule] = useState(null);
  const [cancelBooking, setCancelBooking] = useState(null);

  const handleRating = (item) => {
    setSelectedRating(item?.data?.context);
  };

  const handleReschedule = (item) => {
    setSelectedReschedule(item?.data?.context);
  };

  const handleCancel = async () => {
    const result = await updateBooking({
      id: cancelBooking?.booking_id,
      data: {
        status: 'canceled',
      },
    });

    if (result.data?.success && result.data?.statusCode === 200) {
      AlertNotification({
        title: 'Booking Canceled Success',
        textBody: 'Your booking successfully canceled',
        variant: ALERT_DIALOG,
        type: ALERT_SUCCESS,
        button: 'Close',
      });
    }
  };

  const renderNotificationItem = ({ item }) => {
    const actions = item?.data?.context?.actions ?? [];
    const isRate = actions.includes('rate');
    const isSchedule = actions.includes('reschedule');
    const isCancel = actions.includes('cancel');

    return (
      <View style={styles.notificationContainer}>
        <Image source={!isRate ? BlueIcon : OrangeIcon} style={styles.icon} />
        <View style={styles.textContainer}>
          <View style={styles.message}>
            <Text>
              {item.notification?.body}{' '}
              {isRate && (
                <Text onPress={() => handleRating(item)}>
                  <Text style={styles.link}>Rate Us</Text>
                </Text>
              )}
            </Text>
          </View>
          {(isSchedule || isCancel) && (
            <View style={styles.actionButtonsContainer}>
              {isSchedule && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleReschedule(item)}
                >
                  <Text style={styles.actionButtonText}>Reschedule</Text>
                </TouchableOpacity>
              )}
              {isCancel && (
                <TouchableOpacity
                  onPress={() => setCancelBooking(item?.data?.context)}
                >
                  <Text style={styles.cancelLink}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <Text style={styles.time}>{item?.time}</Text>
        </View>
      </View>
    );
  };

  const renderSection = ({ item }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.date}>{item?.display_date}</Text>
      <FlatList
        data={item?.results}
        renderItem={renderNotificationItem}
        keyExtractor={(singleItem) => singleItem?.messageId}
      />
    </View>
  );

  return (
    <AlertNotificationRoot
      colors={[
        {
          card: 'white',
          label: 'black',
          warning: Global_Styles.PrimaryColour,
        },
      ]}
    >
      <View style={styles.container}>
        {updateBookingResult.isLoading && <Loading />}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {notificationsData?.length > 0 ? (
          <FlatList
            data={notificationsData}
            renderItem={renderSection}
            keyExtractor={(item) => item?.group_id}
          />
        ) : (
          <View style={styles.header}>
            <Text>Notifications is Empty</Text>
          </View>
        )}
        {selectedRating &&
          selectedRating?.doctor_id &&
          selectedRating?.booking_id && (
            <Ratings
              onClose={() => {
                setSelectedRating(null);
              }}
              item={selectedRating}
            />
          )}
        {selectedReschedule &&
          selectedReschedule?.doctor_id &&
          selectedReschedule?.booking_id && (
            <Reschedule
              onClose={() => {
                setSelectedReschedule(null);
              }}
              item={selectedReschedule}
            />
          )}
        {cancelBooking && (
          <DeleteActionModal
            show={cancelBooking ? true : false}
            button="Yes, Cancel"
            onClose={() => setCancelBooking(null)}
            onSubmit={handleCancel}
          />
        )}
      </View>
    </AlertNotificationRoot>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Constants.statusBarHeight,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
  },
  link: {
    color: '#007BFF',
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: '#999999',
    marginTop: 5,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  actionButton: {
    marginRight: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: Global_Styles.PrimaryColour,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
  },
  cancelLink: {
    color: '#007BFF',
    fontSize: 12,
    marginTop: 5,
  },
});

export default Notifications;
