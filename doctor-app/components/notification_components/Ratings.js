import React, { useState, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
} from 'react-native';
import { Rating } from 'react-native-elements';
import Global_Styles from '../../utils/Global_Styles';
import { Ionicons } from '@expo/vector-icons';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import Loading from './../Loading';
import {
  useGetDoctorDetailsQuery,
  useReviewBookingMutation,
} from './../../store/slices';
import {
  AlertNotification,
  ALERT_DIALOG,
  ALERT_WARNING,
  ALERT_SUCCESS,
} from './../AlertNotification';

const RatingBooking = ({ item, onClose }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState(null);
  const [reviewBooking, reviewBookingResult] = useReviewBookingMutation();
  const { data: doctor, isLoading: doctorLoading } = useGetDoctorDetailsQuery({
    id: item?.doctor_id,
    params: {},
  });

  const handleRating = async () => {
    if (rating <= 0) {
      AlertNotification({
        title: 'Select Star Rating',
        textBody: 'Please select start to rate the doctor.',
        variant: ALERT_DIALOG,
        type: ALERT_WARNING,
        button: 'Close',
        autoClose: false,
      });
      return;
    }

    if (review && review?.length > 1000) {
      AlertNotification({
        title: 'Review is too long.',
        textBody: 'Please write your review under 1000 characters.',
        variant: ALERT_DIALOG,
        type: ALERT_WARNING,
        button: 'Close',
        autoClose: false,
      });
      return;
    }

    const result = await reviewBooking({
      id: item?.booking_id,
      data: {
        comment: review,
        rating,
      },
    });

    if (result.data?.success && result.data?.statusCode === 201) {
      AlertNotification({
        title: 'Booking Rated Success',
        textBody: 'Thank you for your valuable feedback',
        variant: ALERT_DIALOG,
        type: ALERT_SUCCESS,
        button: 'Close',
        autoClose: false,
        onHide: () => {
          onClose();
        },
      });
    }

    if ([404, 421, 422].includes(result.error?.statusCode)) {
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        onClose();
      }, 1000 * 5);
    }
  };

  return (
    <View
      style={{
        ...styles.modalContent,
        height: doctorLoading ? '40%' : '70%',
      }}
    >
      {(doctorLoading || reviewBookingResult.isLoading) && (
        <Loading color="black" style={{ backgroundColor: 'none', top: 60 }} />
      )}
      <View style={styles.modalHeader}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close-outline" size={28} color={'white'}></Ionicons>
        </TouchableOpacity>
        <View style={styles.doctorInfoContainer}>
          {doctor?.photoUrl && (
            <View style={styles.doctorImageContainer}>
              <Image
                style={styles.doctorImage}
                src={doctor?.photoUrl}
                resizeMode="cover"
              />
            </View>
          )}
          <Text style={styles.doctorName}>{doctor?.display_name}</Text>
          <Text style={styles.designation}>
            {doctor?.expertiseList?.join(', ') || doctor?.title}
          </Text>
        </View>
      </View>

      <View style={styles.ratingContainer}>
        <Text style={styles.modalTitle}>Let us know how it went!</Text>
        <Rating
          startingValue={rating}
          imageSize={30}
          onFinishRating={setRating}
          style={{ paddingVertical: 10 }}
        />
        <TextInput
          style={styles.reviewInput}
          placeholder="Write your review here..."
          value={review}
          onChangeText={setReview}
        />
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleRating}
          disabled={doctorLoading || reviewBookingResult.isLoading}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Ratings = ({ onClose, item }) => {
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
          <RatingBooking item={item} onClose={onClose} />
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
    height: '40%',
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
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    color: 'white',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  doctorInfoContainer: {
    paddingTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  doctorImageContainer: {
    width: 110, // Adjust size as needed
    height: 110, // Adjust size as needed
    borderRadius: 30, // Make it circular
    overflow: 'hidden', // Clip the image to the border radius
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'white',
  },
  doctorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: 'white',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
  },
  designation: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    alignSelf: 'center',
  },
  ratingContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  reviewInput: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 20,
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  submitButton: {
    backgroundColor: Global_Styles.PrimaryColour,
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default memo(Ratings);
