import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import Global_Styles from '../../../utils/Global_Styles';
import { useNavigation } from '@react-navigation/native';
import ProfileImage from './../../../assets/images/doc1.png';
import {
  useGetDoctorsQuery,
  appRefreshSelector,
} from './../../../store/slices';
import { availabilityFormat } from './../../../utils/helpers';

const AvailableDoctors = () => {
  const navigation = useNavigation();
  const appRefresh = useSelector(appRefreshSelector);
  const { data, isLoading } = useGetDoctorsQuery({
    limit: 10,
    availability: true,
    refresh: appRefresh,
  });

  // Render item function for FlatList
  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.item}
      onPress={() => navigation.navigate('DoctorProfile', { doctor: item })}
    >
      <View style={styles.topContainer}>
        <Text
          style={styles.specialty}
        >{`Looking For Your ${item?.expertiseList?.join(', ')} Doctors`}</Text>
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.bottomLeftContainer}>
          <Text style={styles.name}>{item?.display_name}</Text>
          <Text style={styles.details}>
            {availabilityFormat(item?.availability)}
          </Text>
          <Text
            style={styles.details}
          >{`Star Rating: ${item?.star_rating}`}</Text>
          <TouchableOpacity style={styles.bookNowButton}>
            <Text style={styles.bookNowText}>BOOK NOW</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomRightContainer}>
          {item.photoUrl ? (
            <Image style={styles.image} src={item?.photoUrl} />
          ) : (
            <Image style={styles.image} source={ProfileImage} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={{ justifyContent: 'center', padding: 10 }}>
        <Text style={styles.title}>Available Doctor</Text>
        <ActivityIndicator size="small" color={Global_Styles.PrimaryColour} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Doctor</Text>
      <FlatList
        data={data ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item?.uid}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ListEmptyComponent={
          <View style={{ padding: 20 }}>
            <Text style={{ textAlign: 'center' }}>Doctor not available </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 10,
    color: Global_Styles.TextColour,
    paddingHorizontal: Global_Styles.MarginHorizontal,
  },
  item: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#18A0FB',
    padding: 15,
    width: 305,
    marginRight: 10,
  },
  topContainer: {
    marginBottom: 10,
  },
  specialty: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginRight: 82,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomLeftContainer: {
    flex: 1,
    marginLeft: 8,
    // backgroundColor:"red"
  },
  name: {
    fontSize: 16,
    fontWeight: '400',
    color: 'white',
    paddingTop: 5,
    marginBottom: 5,
  },
  details: {
    fontSize: 13,
    fontWeight: '400',
    color: 'white',
    marginBottom: 5,
  },
  bookNowButton: {
    backgroundColor: '#2CAAFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginRight: 60,
  },
  bookNowText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bottomRightContainer: {
    // backgroundColor:"red",
    marginRight: 20,
  },
  image: {
    width: 100,
    height: 100,

    // borderRadius: 50,
  },
});

export default AvailableDoctors;
