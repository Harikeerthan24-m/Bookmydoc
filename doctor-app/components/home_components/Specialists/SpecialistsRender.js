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
import {
  useGetDoctorsQuery,
  appRefreshSelector,
} from './../../../store/slices';

import { useNavigation } from '@react-navigation/native';
import ProfileImage from './../../../assets/images/doc1.png';

const SpecialistsRender = () => {
  const navigation = useNavigation();
  const appRefresh = useSelector(appRefreshSelector);
  const { data, isLoading } = useGetDoctorsQuery({
    limit: 10,
    refresh: appRefresh,
  });

  // Render item function for FlatList
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('DoctorProfile', { doctor: item })}
    >
      <View style={styles.imageContainer}>
        {item.photoUrl ? (
          <Image
            style={{ width: '100%', height: '100%' }}
            src={item?.photoUrl}
          />
        ) : (
          <Image
            style={{ width: '100%', height: '100%' }}
            source={ProfileImage}
          />
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.display_name}</Text>
        <Text style={styles.designation}>
          {item?.expertiseList?.join(', ') || item?.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={{ justifyContent: 'center', padding: 10 }}>
        <Text style={styles.title}>Specialists</Text>
        <ActivityIndicator size="small" color={Global_Styles.PrimaryColour} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Specialists</Text>
      <FlatList
        data={data ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item?.uid}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
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
    marginHorizontal: Global_Styles.MarginHorizontal,
  },
  item: {
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'white',
    height: 'auto',
    width: 112,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Global_Styles.TextColour,
    textAlign: 'center',
  },
  designation: {
    fontSize: 12,
    color: Global_Styles.TextColour,
  },
  flatListContent: {
    paddingLeft: 10,
  },
  imageContainer: {
    width: 112,
    height: 130,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Global_Styles.PrimaryColour,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 10,
    fontSize: 15,
  },
});

export default SpecialistsRender;
