import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Global_Styles from '../../../utils/Global_Styles';
import ProfileImage from './../../../assets/images/doc1.png';

const DoctorInfoTop = ({ doctor }) => {
  const navigation = useNavigation();

  const resetBookingAndBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={resetBookingAndBack} style={styles.backButton}>
        <View>
          <Ionicons name="arrow-back-outline" size={25} />
        </View>
      </TouchableOpacity>
      {/* Doctor Image */}
      <View style={styles.imageContainer}>
        {doctor.photoUrl ? (
          <Image
            style={styles.image}
            src={doctor?.photoUrl}
            resizeMode="cover"
          />
        ) : (
          <Image
            style={styles.image}
            source={ProfileImage}
            resizeMode="cover"
          />
        )}
      </View>
      {/* Icons Section */}
      <View style={styles.iconsContainer}>
        <View style={styles.iconWrapper}>
          <TouchableOpacity style={styles.iconItem1}>
            <Ionicons name="heart" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.captionText}>{doctor?.ratings?.length}</Text>
          <Text style={styles.captionText1}>Patients</Text>
        </View>
        <View style={styles.iconWrapper}>
          <TouchableOpacity style={styles.iconItem2}>
            <Ionicons name="calendar" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.captionText}>{doctor?.experience || 0} +</Text>
          <Text style={styles.captionText1}>Experience</Text>
        </View>
        <View style={styles.iconWrapper}>
          <TouchableOpacity style={styles.iconItem3}>
            <Ionicons name="star" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.captionText}>{doctor?.star_rating}</Text>
          <Text style={styles.captionText1}>Rating</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#18A0FB',
  },
  backButton: {
    position: 'absolute',
    top: Constants.statusBarHeight,
    left: 20,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    width: 110,
    height: 120,
    borderRadius: Global_Styles.BorderRadius,
    padding: 10,
    marginTop: Constants.statusBarHeight,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  iconsContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingBottom: 20,
  },
  iconWrapper: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  iconItem1: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 100,
    backgroundColor: '#39B0FF',
  },
  iconItem2: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 100,
    backgroundColor: '#39B0FF',
  },
  iconItem3: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 100,
    backgroundColor: '#39B0FF',
  },
  iconCaption: {
    color: '#fff',
    fontSize: 16,
  },
  captionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  captionText1: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
});

export default DoctorInfoTop;
