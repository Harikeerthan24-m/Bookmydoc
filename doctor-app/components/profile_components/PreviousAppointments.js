import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Global_Styles from '../../utils/Global_Styles';
import { useGetBookingsQuery } from './../../store/slices';
import ProfileImage from './../../assets/images/doc1.png';
import Loading from '../Loading';

const PreviousAppointments = ({ onClose }) => {
  const [refresh, setRefresh] = useState(false);
  const { data, isLoading } = useGetBookingsQuery({
    order_by: 'desc',
    refresh,
  });
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.imageContainer}>
        {item?.doctor?.photoUrl ? (
          <Image
            style={styles.image}
            src={item?.doctor?.photoUrl}
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
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item?.doctor?.display_name}</Text>
        <Text style={styles.designation}>
          {item?.doctor?.title || item?.doctor?.expertiseList?.join(', ')}
        </Text>
        <Text
          style={{ ...styles.designation, color: Global_Styles.PrimaryColour }}
        >
          Date: {item?.date} (
          <Text style={{ fontWeight: 'bold' }}>{item?.status}</Text>)
        </Text>
      </View>
    </View>
  );

  return (
    <Modal transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Previous Appointments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data ?? []}
            ListEmptyComponent={
              <View style={{ paddingVertical: 20 }}>
                {isLoading ? (
                  <Loading bgColor="white" />
                ) : (
                  <Text style={{ textAlign: 'center' }}>No Booking</Text>
                )}
              </View>
            }
            renderItem={renderItem}
            keyExtractor={(item) => item?.booking_id}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => setRefresh(!refresh)}
                tintColor={Global_Styles.PrimaryColour}
                colors={[Global_Styles.PrimaryColour]}
              />
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    elevation: 10,
    maxHeight: '90%', // Adjust the height to your preference
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Global_Styles.PrimaryColour,
    paddingTop: 20,
    paddingBottom: 20,
    height: 80,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'white',
    height: 'auto',
    width: '100%',
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    padding: 10,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  name: {
    fontSize: 18,
    fontWeight: '500',
    color: 'black',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  designation: {
    fontSize: 12,
    color: Global_Styles.TextColour,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  flatListContent: {
    padding: 10,
  },
  imageContainer: {
    width: 70,
    height: 80,
    borderRadius: 20,
    borderTopRightRadius: 0,
    overflow: 'hidden',
    backgroundColor: Global_Styles.PrimaryColour,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
});

export default PreviousAppointments;
