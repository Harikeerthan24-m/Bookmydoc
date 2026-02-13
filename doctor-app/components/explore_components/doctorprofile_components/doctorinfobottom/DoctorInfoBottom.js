import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import Reviews from './Reviews';
import Global_Styles from '../../../../utils/Global_Styles';

const DoctorInfoBottom = ({ doctor, isLoading }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.doctorName}>{doctor?.display_name}</Text>
        {doctor?.title && (
          <Text style={styles.designation}>{doctor?.title}</Text>
        )}
        {doctor?.expertiseList && (
          <Text style={styles.designation}>
            {doctor?.expertiseList?.join(', ')}
          </Text>
        )}
        {(doctor?.location?.address || doctor?.location?.city) && (
          <Text style={styles.designation}>
            {doctor?.location?.address}, {doctor?.location?.city}
          </Text>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.aboutContainer}>
          <Text style={styles.aboutTitle}>About Doctor</Text>
          <Text style={styles.aboutText}>{doctor?.bio}</Text>
        </View>

        {!isLoading ? (
          <Reviews bookings={doctor?.bookings} />
        ) : (
          <View style={{ justifyContent: 'center' }}>
            <ActivityIndicator
              size="small"
              color={Global_Styles.PrimaryColour}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default DoctorInfoBottom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopRightRadius: 65,
    borderTopLeftRadius: 65,
    backgroundColor: 'white',
  },
  headerContainer: {
    alignItems: 'center',
    margin: 15,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  designation: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 5,
  },
  aboutContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 14,
    color: 'gray',
    lineHeight: 20,
  },
  scrollContainer: {
    paddingBottom: 62,
  },
});
