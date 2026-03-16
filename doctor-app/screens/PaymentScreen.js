import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import Constants from 'expo-constants';
import { useSelector } from 'react-redux';
import RazorpayCheckout from 'react-native-razorpay';
import { Ionicons } from '@expo/vector-icons';
import Global_Styles, { headerShadow } from '../utils/Global_Styles';
import PaymentButton from '../components/payment_component/PaymentButton';
import {
  bookingSelector,
  useGeneratePaymentSecretMutation,
  useCreateBookingMutation,
} from './../store/slices';
import ProfileImage from './../assets/images/doc1.png';
import { formatTime } from './../utils/helpers';
import {
  AlertNotification,
  ALERT_DIALOG,
  ALERT_WARNING,
  ALERT_DANGER,
  ALERT_TOAST,
  ALERT_SUCCESS,
} from './../components/AlertNotification';
import Loading from '../components/Loading';
import { API_URL } from '@env';

const Payment = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const booking = useSelector(bookingSelector);
  const [generatePayment, generatePaymentResult] =
    useGeneratePaymentSecretMutation();
  const [placeBooking, placeBookingResult] = useCreateBookingMutation();

  const validateBooking = () => {
    const doctorId = booking?.doctor?.uid;
    const serviceId = booking?.service?.service_id;
    const slotId = booking?.slot?.slot_id;
    const date = booking?.date;
    if (!doctorId || !serviceId || !slotId || !date) {
      AlertNotification({
        title: 'Required field missing',
        textBody: 'Required doctor, service, slot and date.',
        variant: ALERT_DIALOG,
        type: ALERT_DANGER,
      });
      navigation.goBack();
      return false;
    }
    return true;
  };

  useEffect(() => {
    validateBooking();
    return () => {
      if (generatePaymentResult?.reset) {
        generatePaymentResult.reset();
      }
    };
  }, [booking]);

  const handleBooking = async () => {
    if (!validateBooking()) {
      return;
    }
    const result = await generatePayment({
      doctor_id: booking?.doctor?.uid,
      service_id: booking?.service?.service_id,
    });
    if (!result?.data) {
      return;
    }
    // console.log('Generated Payment Option', result?.data);
    setLoading(true);
    const timeoutId1 = setTimeout(() => {
      clearTimeout(timeoutId1);
      setLoading(false);
      RazorpayCheckout.open({
        ...result?.data,
        image: `${API_URL}/favicon.ico`,
      })
        .then(async (data) => {
          // handle success
          AlertNotification({
            title: 'Payment Success!!',
            textBody: 'Placing your booking now.',
            variant: ALERT_TOAST,
            type: ALERT_SUCCESS,
          });
          // console.log('Payment Success', data);
          const response = await placeBooking({
            doctor_id: booking?.doctor?.uid,
            service_id: booking?.service?.service_id,
            slot_id: booking?.slot?.slot_id,
            date: `${booking?.year}-${String(booking?.month).padStart(2, '0')}-${booking?.date}`,
            payment: {
              transaction_id: data?.razorpay_payment_id || '',
              order_id: data?.razorpay_order_id || '',
              signature: data?.razorpay_signature || '',
            },
          });
          // console.log('Booking Success', response);

          const timeoutID2 = setTimeout(() => {
            clearTimeout(timeoutID2);
            navigation.navigate('Notifications');
          }, 1000);
        })
        .catch((error) => {
          if (error?.code > 0) {
            // handle failure
            AlertNotification({
              title: error?.error.code || error?.code,
              textBody: error?.error.description || error.description,
              variant: ALERT_DIALOG,
              type: ALERT_DANGER,
            });
          }
          generatePaymentResult.reset();
          // console.error('Payment Error', error);
        });
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {(placeBookingResult?.isLoading ||
        generatePaymentResult.isLoading ||
        loading) && <Loading />}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment & Booking</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.doctorInfo}>
          {booking?.doctor.photoUrl ? (
            <Image
              style={styles.doctorImage}
              source={{ uri: booking?.doctor?.photoUrl }}
              resizeMode="cover"
            />
          ) : (
            <Image
              style={styles.doctorImage}
              source={ProfileImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>
              {booking?.doctor?.display_name}
            </Text>
            <Text style={styles.doctorSpecialty}>{booking?.doctor?.title}</Text>
            <Text style={styles.doctorSpecialty}>
              {booking?.doctor?.expertiseList?.join(', ')}
            </Text>
            <Text style={styles.doctorSpecialty}>
              {booking?.doctor?.location?.address},{' '}
              {booking?.doctor?.location?.city}
            </Text>
            <View style={styles.appointmentButton}>
              <Text style={styles.appointmentButtonText}>
                {booking?.service?.name}
              </Text>
            </View>
          </View>
          <Text style={styles.price}>${booking?.service?.price_amount}</Text>
        </View>

        <View style={styles.paymentMethod}>
          <Text style={styles.paymentLabel}>Booking Day : </Text>
          <Text style={styles.paymentText}>
            {booking?.day_name?.toUpperCase()}
          </Text>
        </View>

        <View style={styles.paymentMethod}>
          <Text style={styles.paymentLabel}>Booking Date : </Text>
          <Text style={styles.paymentText}>
            {booking?.date} {booking?.month_name} {booking?.year}
          </Text>
        </View>

        <View style={styles.paymentMethod}>
          <Text style={styles.paymentLabel}>Booking Time : </Text>
          <Text style={styles.paymentText}>
            {formatTime(booking?.slot?.start_time)}
          </Text>
        </View>
        <View style={styles.paymentMethod}>
          <Text style={styles.paymentText}>
            {booking?.service?.description}
          </Text>
        </View>
      </ScrollView>
      <PaymentButton
        disabled={
          loading ||
          placeBookingResult?.isLoading ||
          generatePaymentResult?.isLoading
        }
        title="Payment & Book"
        onPress={handleBooking}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Constants.statusBarHeight + 8,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    ...headerShadow,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    marginVertical: 50,
  },
  doctorImage: {
    width: 70,
    height: 80,
    borderRadius: 20,
    borderTopRightRadius: 0,
    padding: 20,
    backgroundColor: Global_Styles.PrimaryColour,
  },
  doctorDetails: {
    flex: 1,
    marginLeft: 10,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '500',
  },
  doctorSpecialty: {
    fontSize: 13,
    color: '#777',
  },
  appointmentButton: {
    backgroundColor: '#2CAAFF',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '55%',
  },
  appointmentButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '400',
  },
  price: {
    fontSize: 14,
    padding: 3,
    fontWeight: '500',
    color: 'white',
    borderRadius: 10,
    backgroundColor: Global_Styles.PrimaryColour,
    marginTop: 60,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  paymentIcon: {
    width: 24,
    height: 24,
    marginRight: 20,
  },
  paymentLabel: {
    flex: 1,
    fontSize: 16,
  },
  paymentText: {
    fontSize: 16,
    borderColor: '#18A0FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#18A0FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#18A0FB',
  },
  paymentButton: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
});

export default Payment;
