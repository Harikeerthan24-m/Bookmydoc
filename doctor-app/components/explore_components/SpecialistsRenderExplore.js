import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Global_Styles from '../../utils/Global_Styles';
import { availabilityFormat } from './../../utils/helpers';
import { useGetDoctorsQuery } from './../../store/slices';
import DoctorListCard from '../DoctorListCard';

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
    <DoctorListCard
      name={item?.display_name}
      subtitle={item?.expertiseList?.join(', ') || item?.title}
      detail={availabilityFormat(item?.availability)}
      photoUrl={item?.photoUrl}
      rating={item?.star_rating}
      experience={item?.experience}
      onPress={() => navigation.navigate('DoctorProfile', { doctor: item })}
    />
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
  flatListContent: {
    paddingLeft: 10,
    paddingBottom: 42,
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
