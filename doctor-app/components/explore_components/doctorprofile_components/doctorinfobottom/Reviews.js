import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const Reviews = ({ bookings }) => {
  return (
    <View style={styles.reviewsContainer}>
      <Text style={styles.reviewsTitle}>Recent Reviews</Text>

      {(bookings || []).map((booking, index) => (
        <View key={'review' + index} style={styles.reviewItem}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewName}>
              {booking?.customer?.display_name}
            </Text>
            <View style={styles.ratingContainer}>
              {Array.from({ length: booking?.review?.rating }).map(
                (_, index) => (
                  <Ionicons
                    key={'star' + index}
                    name="star"
                    size={14}
                    color="#ffd700"
                  />
                ),
              )}
            </View>
            <Text style={styles.reviewTime}>
              {new Date(booking?.review?.datetime).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.reviewText}>{booking?.review?.comment}</Text>
        </View>
      ))}
    </View>
  );
};

export default Reviews;

const styles = StyleSheet.create({
  reviewsContainer: {
    paddingHorizontal: 20,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  reviewItem: {
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  reviewTime: {
    fontSize: 12,
    color: 'gray',
    justifyContent: 'flex-end',
  },
  reviewText: {
    fontSize: 14,
    color: 'gray',
    lineHeight: 20,
    marginTop: 5,
  },
});
