import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Global_Styles from '../../utils/Global_Styles';
import ProfileImage from './../../assets/images/doc1.png';
import { availabilityFormat } from './../../utils/helpers';
import { useGetDoctorsQuery } from './../../store/slices';

const SpecialistsRenderExplore = ({ query, setQuery }) => {
  const navigation = useNavigation();
  const { data, isLoading } = useGetDoctorsQuery({ ...query });

  const renderAIHeader = () => {
    if (!query?.aiResults) return null;

    const { aiResults } = query;

    return (
      <View style={styles.aiHeaderContainer}>
        <View style={styles.aiHeaderTop}>
          <View style={styles.aiHeaderLeft}>
            <Ionicons
              name="sparkles"
              size={20}
              color={Global_Styles.PrimaryColour}
            />
            <Text style={styles.aiHeaderTitle}>AI Recommendations</Text>
          </View>
          <TouchableOpacity onPress={() => setQuery({ limit: 50 })}>
            <Ionicons name="close-circle" size={22} color="#999" />
          </TouchableOpacity>
        </View>

        {aiResults.summary && (
          <Text style={styles.aiSummary}>
            {typeof aiResults.summary === 'string'
              ? aiResults.summary
              : String(aiResults.summary ?? '')}
          </Text>
        )}

        <View style={styles.specialistsChips}>
          {aiResults.specialists?.map((specialist, index) => (
            <View key={index} style={styles.specialistChip}>
              <Text style={styles.specialistChipText}>
                {typeof specialist?.name === 'string'
                  ? specialist.name
                  : String(specialist?.name ?? '')}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.aiHelpText}>
          Showing doctors matching these specialties
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('DoctorProfile', { doctor: item })}
      contentContainerStyle
    >
      <View style={styles.imageContainer}>
        {item.photoUrl ? (
          <Image style={styles.image} src={item?.photoUrl} />
        ) : (
          <Image style={styles.image} source={ProfileImage} />
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item?.display_name}</Text>
        <Text style={styles.designation}>
          {item?.expertiseList?.join(', ') || item?.title}
        </Text>
        <View style={styles.bottomContainer}>
          <View style={styles.timingContainer}>
            <Text style={styles.timing}>
              {availabilityFormat(item?.availability)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.plusIconContainer}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('DoctorProfile', { doctor: item })
            }
          >
            <FontAwesome name="plus" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Specialists</Text>
      <FlatList
        vertical
        data={data ?? []}
        ListHeaderComponent={renderAIHeader}
        ListEmptyComponent={
          <View style={{ paddingVertical: 20 }}>
            {isLoading ? (
              <Text style={{ textAlign: 'center' }}>Loading...</Text>
            ) : (
              <Text style={{ textAlign: 'center' }}>Doctor not found</Text>
            )}
          </View>
        }
        renderItem={renderItem}
        keyExtractor={(item) => item.uid}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => setQuery((state) => ({ ...state, refresh: true }))}
            tintColor={Global_Styles.PrimaryColour}
            colors={[Global_Styles.PrimaryColour]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    marginHorizontal: 10,
    marginBottom: 1,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 10,
    color: Global_Styles.TextColour,
    marginHorizontal: 10,
  },
  item: {
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'white',
    height: 'auto',
    width: '100%',
    borderRadius: 10,
    marginBottom: 15,
    flex: 1,
    flexDirection: 'row',
    padding: 10,
  },
  image: {
    width: '100%',
    height: '100%',
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
    paddingLeft: 10,
    paddingBottom: 42,
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
  bottomContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  timingContainer: {
    backgroundColor: '#E1F6FF',
    borderRadius: 10,
    padding: 5,
    marginRight: 10,
  },
  timing: {
    fontSize: 12,
    color: Global_Styles.PrimaryColour,
  },
  plusIconContainer: {
    backgroundColor: Global_Styles.PrimaryColour,
    borderRadius: 10,
    padding: 8,
  },
  // AI Header Styles
  aiHeaderContainer: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  aiHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Global_Styles.TextColour,
  },
  aiSummary: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
    lineHeight: 18,
  },
  specialistsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  specialistChip: {
    backgroundColor: Global_Styles.PrimaryColour,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialistChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFF',
  },
  aiHelpText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default SpecialistsRenderExplore;
