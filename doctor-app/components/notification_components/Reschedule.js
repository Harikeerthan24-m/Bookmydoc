import React, { useEffect, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
} from 'react-native';
import { useDispatch } from 'react-redux';
import DoctorAppointment from './../explore_components/doctorprofile_components/doctorappointmentbottom/DoctorApppointment';
import Global_Styles from '../../utils/Global_Styles';
import { Ionicons } from '@expo/vector-icons';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import {
  setBooking,
  useGetDoctorDetailsQuery,
  useGetBookingQuery,
  useUpdateBookingMutation,
} from './../../store/slices';
import {
  AlertNotification,
  ALERT_DIALOG,
  ALERT_WARNING,
  ALERT_SUCCESS,
} from './../AlertNotification';

const RescheduleBooking = ({ item, onClose }) => {
  const dispatch = useDispatch();
  const [updateBooking, updateBookingResult] = useUpdateBookingMutation();
  const { data: doctor, isLoading: doctorLoading } = useGetDoctorDetailsQuery({
    id: item?.doctor_id,
    params: {},
  });
  const { data: booking, isLoading: bookingLoading } = useGetBookingQuery(
    item?.booking_id,
  );

  useEffect(() => {
    if (booking?.booking_id) {
      if (booking?.status == 'completed') {
        AlertNotification({
          title: 'This booking is completed',
          textBody: "Its already completed. So you can't reschedule it",
          variant: ALERT_DIALOG,
          type: ALERT_WARNING,
          button: 'Close',
          autoClose: false,
          onHide: () => {
            onClose();
          },
        });
      }

      const bookingDate = new Date(booking?.date);
      dispatch(
        setBooking({
          ...booking,
          year: bookingDate.getFullYear(),
          month: +bookingDate.getMonth() + 1,
          date: bookingDate.getDate(),
          day_name: booking?.slot?.day?.toLowerCase(),
        }),
      );
    }

    return () => dispatch(setBooking({ reset: true }));
  }, [booking]);

  const handleReschedule = async (bookingPayload) => {
    const payload = {
      doctor_id: bookingPayload?.doctor?.uid,
      service_id: bookingPayload?.service?.service_id,
      slot_id: bookingPayload?.slot?.slot_id,
      date: `${bookingPayload?.year}-${String(bookingPayload?.month).padStart(2, '0')}-${bookingPayload?.date}`,
    };

    if (bookingPayload?.status !== 'completed') {
      const result = await updateBooking({
        id: bookingPayload?.booking_id,
        data: payload,
      });

      if (result.data?.success && result.data?.statusCode === 200) {
        AlertNotification({
          title: 'Booking Reschedule Success',
          textBody: 'Your booking successfully reschedule',
          variant: ALERT_DIALOG,
          type: ALERT_SUCCESS,
          button: 'Close',
          autoClose: false,
          onHide: () => {
            onClose();
          },
        });
      }
    }
  };

  return (
    <View
      style={{
        ...styles.modalContent,
        height:
          doctorLoading || bookingLoading || updateBookingResult.isLoading
            ? '30%'
            : '90%',
      }}
    >
      <View style={styles.modalHeader}>
        <View style={styles.doctorInfoContainer}>
          <Text style={styles.doctorName}>{doctor?.display_name}</Text>
          <Text style={styles.designation}>
            {doctor?.expertiseList?.join(', ') || doctor?.title}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close-outline" size={28} color={'white'}></Ionicons>
        </TouchableOpacity>
      </View>

      <DoctorAppointment
        isLoading={
          doctorLoading || bookingLoading || updateBookingResult.isLoading
        }
        doctor={{ ...(item?.doctor || {}), ...doctor }}
        onReschedule={handleReschedule}
      />
    </View>
  );
};

const Reschedule = ({ onClose, item }) => {
  return (
    <Modal transparent={true} animationType="slide">
      <AlertNotificationRoot
        colors={[
          {
            card: 'white',
            label: 'black',
            warning: Global_Styles.PrimaryColour,
          },
        ]}
      >
        <View style={styles.modalContainer}>
          <RescheduleBooking item={item} onClose={onClose} />
        </View>
      </AlertNotificationRoot>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    height: '30%',
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Global_Styles.PrimaryColour,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 15,
    height: 90,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 1,
  },
  doctorInfoContainer: {
    paddingTop: 20,
    width: 'auto',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'white',
  },
  designation: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
});

export default memo(Reschedule);
