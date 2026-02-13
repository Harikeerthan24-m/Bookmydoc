import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import DoctorInfoBottom from '../components/explore_components/doctorprofile_components/doctorinfobottom/DoctorInfoBottom';
import DoctorInfoTop from '../components/explore_components/doctorprofile_components/DoctorInfoTop';
import AppointmentButton from '../components/explore_components/doctorprofile_components/AppointmentButton';
import DoctorAppointment from '../components/explore_components/doctorprofile_components/doctorappointmentbottom/DoctorApppointment';

import { useGetDoctorDetailsQuery } from './../store/slices';

const DoctorProfile = ({ navigation, route }) => {
  const doctor = route?.params?.doctor;
  const { data, isLoading } = useGetDoctorDetailsQuery({
    id: doctor?.uid,
    params: {},
  });
  const [showAppointment, setShowAppointment] = useState(false);

  const handleAppointmentPress = () => {
    setShowAppointment(true);
  };

  const handleBackPress = () => {
    setShowAppointment(false);
  };

  return (
    <View style={styles.container}>
      <DoctorInfoTop doctor={{ ...doctor, ...data }} />
      {!showAppointment ? (
        <DoctorInfoBottom
          doctor={{ ...doctor, ...data }}
          isLoading={isLoading}
        />
      ) : null}
      {!showAppointment && (
        <AppointmentButton onPress={handleAppointmentPress} />
      )}
      {showAppointment && (
        <DoctorAppointment
          doctor={{ ...doctor, ...data }}
          isLoading={isLoading}
          onPressBack={handleBackPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18A0FB',
    position: 'relative',
  },
});

export default DoctorProfile;
