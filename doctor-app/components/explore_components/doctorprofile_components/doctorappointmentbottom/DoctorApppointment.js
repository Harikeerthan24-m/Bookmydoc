import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons from expo-icons
import FeesInformation from './FeesInformation';
import BookAppointmentButton from './BookAppointmentButton';
import { getNextDayOfWeek, formatTime } from './../../../../utils/helpers';
import { bookingSelector, setBooking } from './../../../../store/slices';
import {
  AlertNotification,
  ALERT_DIALOG,
  ALERT_WARNING,
  ALERT_INFO,
  ALERT_DANGER,
  ALERT_TOAST,
  ALERT_SUCCESS,
} from './../../../AlertNotification';
import Global_Styles from '../../../../utils/Global_Styles';

function generateDateSlot(slotDays, slots) {
  if (!slotDays?.length || !slots?.length) {
    return { months: [], dateSlots: {} };
  }

  const availableSlots = {};
  const slotDates = [];
  const months = {};
  let nextDay = 0;
  let dayIndex = 0;
  let dayRepeat = 0;
  let startDate = new Date();
  while (nextDay < 7) {
    if (!slotDays[dayIndex]) {
      dayIndex = 0;
      dayRepeat++;
      const today = new Date();
      startDate = new Date(today.setDate(today.getDate() + dayRepeat * 7));
    }
    const dayName = slotDays[dayIndex]?.toLowerCase();
    const nextDateInfo = getNextDayOfWeek(dayName, startDate);
    const daySlots = slots.filter((item) => item?.day === dayName);
    availableSlots[nextDateInfo?.day] = {
      ...nextDateInfo,
      slots: daySlots,
    };
    slotDates.push(nextDateInfo);
    months[nextDateInfo?.month_name] = nextDateInfo?.month_name;
    dayIndex++;
    nextDay++;
  }
  return { months, availableSlots, slotDates };
}

const DoctorAppointment = ({
  onPressBack,
  doctor,
  isLoading,
  onReschedule,
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const booking = useSelector(bookingSelector);
  const [slotData, setSlotData] = useState({
    months: [],
    availableSlots: {},
    slotsData: [],
    slotDates: [],
    slotParts: [],
  });

  useEffect(() => {
    const { availableSlots, months, slotDates } = generateDateSlot(
      doctor?.availability,
      doctor?.availabilitySlots,
    );

    if (availableSlots && months) {
      setSlotData({
        months: Object.values(months),
        availableSlots,
        slotsData: booking?.day
          ? [availableSlots[booking?.day] || []]
          : Object.values(availableSlots),
        slotDates: slotDates,
      });

      // Auto-select first service if available
      if (doctor?.providingServices?.length > 0 && !booking?.service) {
        dispatch(setBooking({ service: doctor.providingServices[0] }));
      }
    }

    return () => dispatch(setBooking({ reset: true }));
  }, [doctor?.availabilitySlots]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        {onPressBack && (
          <View style={styles.header}>
            <TouchableOpacity onPress={onPressBack} style={styles.backButton}>
              <Ionicons name="arrow-back-outline" size={22} />
            </TouchableOpacity>
          </View>
        )}
        <ScrollView contentContainerStyle={styles.content}>
          <View style={{ justifyContent: 'center' }}>
            <ActivityIndicator
              size="small"
              color={Global_Styles.PrimaryColour}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  const selectSlotDate = (slotDate) => {
    const daySlots = slotData?.availableSlots[slotDate?.day];
    const slotsData = {};
    daySlots?.slots?.forEach((item) => {
      let dayPart = '';
      const hours = item?.start_time?.split(':')[0];
      if (hours < 11) {
        dayPart = 'Morning';
      }
      if (hours >= 11) {
        dayPart = 'Noon';
      }
      if (hours >= 15) {
        dayPart = 'Afternoon';
      }
      if (hours >= 18) {
        dayPart = 'Evening';
      }
      if (hours >= 21) {
        dayPart = 'Night';
      }
      slotsData[dayPart] = {
        day_part: dayPart,
      };
      if (!slotsData[dayPart]?.slots) {
        slotsData[dayPart]['slots'] = [];
      }
      slotsData[dayPart]['slots'].push(item);
    });

    setSlotData((state) => ({
      ...state,
      slotsData: Object.values(slotsData),
    }));
    dispatch(
      setBooking({
        ...booking,
        ...slotDate,
        day_name: slotDate?.day_name?.toLowerCase(),
        doctor,
      }),
    );
  };

  const handleBooking = () => {
    if (!booking?.slot?.slot_id || !booking?.day_name) {
      AlertNotification({
        title: 'Slot date is required.',
        textBody: 'Please select a slot day/date.',
        variant: ALERT_DIALOG,
        type: ALERT_WARNING,
        button: 'Close',
      });
      return;
    }

    if (booking?.day_name !== booking?.slot?.day) {
      AlertNotification({
        title: 'You selected different slot.',
        textBody: 'Please select a slot from the same day.',
        variant: ALERT_DIALOG,
        type: ALERT_WARNING,
        button: 'Close',
      });
      return;
    }

    if (!booking?.service?.service_id) {
      AlertNotification({
        title: 'Service is required.',
        textBody: 'Please select a service.',
        variant: ALERT_DIALOG,
        type: ALERT_WARNING,
        button: 'Close',
      });
      return;
    }

    if (onReschedule) {
      onReschedule(booking);
    } else {
      navigation.navigate('Payment');
    }
  };

  const renderDateItem = ({ item }) => {
    const isActive = booking?.date === item?.date;
    return (
      <TouchableOpacity
        style={[styles.dateItem, isActive && styles.active]}
        onPress={() => selectSlotDate(item)}
      >
        <Text
          style={[styles.dateText, isActive && styles.active]}
        >{`${item.day}\n${item.date}`}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {onPressBack && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onPressBack} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={22} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.monthText}>{slotData?.months?.join(', ')}</Text>
        <FlatList
          horizontal
          data={slotData?.slotDates}
          keyExtractor={(item) => item.month_name + item.date}
          renderItem={renderDateItem}
          contentContainerStyle={styles.dateList}
          showsHorizontalScrollIndicator={false}
        />

        {(slotData?.slotsData || []).map((slotItem, index) => {
          if (!slotItem?.slots?.length) return null;
          return (
            <View key={'day_part' + index} style={styles.slotGroup}>
              <View style={styles.slotGroupHeader}>
                <Ionicons 
                  name={slotItem.day_part === 'Morning' ? 'sunny-outline' : 'moon-outline'} 
                  size={18} 
                  color={Global_Styles.PrimaryColour} 
                />
                <Text style={styles.dayPartText}> {slotItem?.day_part} Slots</Text>
              </View>
              <View style={styles.timeSlotsGrid}>
                {slotItem?.slots.map((slot, sIdx) => {
                  const isActive = booking?.slot?.slot_id === slot?.slot_id;
                  return (
                    <TouchableOpacity
                      key={'slot' + sIdx}
                      style={[styles.timeSlotChip, isActive && styles.activeChip]}
                      onPress={() => dispatch(setBooking({ slot }))}
                    >
                      <Text
                        style={[styles.timeSlotChipText, isActive && styles.activeChipText]}
                      >
                        {formatTime(slot?.start_time)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {!onReschedule && (
          <View>
            <Text style={styles.slotsText}>Service Fees</Text>
            <FeesInformation services={doctor?.providingServices} />
          </View>
        )}
      </ScrollView>
      <BookAppointmentButton
        title={onReschedule ? 'Reschedule Appointment' : 'Book Appointment'}
        onPress={handleBooking}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 4,
    borderTopRightRadius: 65,
    borderTopLeftRadius: 65,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    padding: 10,
    // backgroundColor: 'grey',
    borderRadius: 5,
  },
  backButtonText: {
    color: 'blue',
    fontSize: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  dateList: {
    marginTop: 20,
    height: 55, // Adjusted height
  },
  dateItem: {
    paddingVertical: 1,
    backgroundColor: '#eee',
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: 60,
    borderRadius: 20,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
  },
  dateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  active: {
    color: '#eee',
    backgroundColor: '#18A0FB',
  },
  slotsText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'left',
    marginTop: 25,
    color: '#333',
  },
  slotGroup: {
    marginTop: 20,
  },
  slotGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayPartText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  timeSlotChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  activeChip: {
    backgroundColor: '#18A0FB',
    borderColor: '#18A0FB',
  },
  timeSlotChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activeChipText: {
    color: 'white',
    fontWeight: '700',
  },
});

export default DoctorAppointment;
