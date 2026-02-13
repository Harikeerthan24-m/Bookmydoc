import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Global_Styles from '../../../../utils/Global_Styles';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { bookingSelector, setBooking } from './../../../../store/slices';

const FeesInformation = ({ services }) => {
  const dispatch = useDispatch();
  const booking = useSelector(bookingSelector);

  const renderIcon = (name = '') => {
    if (!!Ionicons?.glyphMap[name]) {
      return <Ionicons name={name} size={45} />;
    }
    if (!!MaterialIcons?.glyphMap[name]) {
      return <MaterialIcons name={name} size={45} />;
    }
    return <></>;
  };

  return (
    <View style={styles.container}>
      {(services || []).map((item) => {
        const isActive = booking?.service?.service_id === item?.service_id;
        return (
          <TouchableOpacity
            key={item.service_id}
            style={[styles.itemContainer, isActive && styles.active]}
            onPress={() => dispatch(setBooking({ service: item }))}
          >
            {renderIcon(item?.icon_name)}
            <View style={styles.textContainer}>
              <Text style={[styles.title, isActive && styles.active]}>
                {item?.name}
              </Text>
              <Text style={[styles.subtext, isActive && styles.active]}>
                {item?.description}
              </Text>
            </View>
            <Text style={[styles.amount, isActive && styles.active]}>
              ${item?.price_amount}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingHorizontal: 0,
    width: '100%',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    width: '100%',
  },
  icon: {
    marginRight: 15,
    width: 45,
    height: 45,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtext: {
    fontSize: 12,
    color: 'gray',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Global_Styles.PrimaryColour,
  },
  active: {
    color: '#eee',
    backgroundColor: '#18A0FB',
  },
});

export default FeesInformation;
