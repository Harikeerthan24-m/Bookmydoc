import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import Search from '../components/home_components/Search/Search';
import SpecialistsRender from '../components/explore_components/SpecialistsRenderExplore';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Global_Styles from '../utils/Global_Styles';

const ExploreScreen = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState({ limit: 50, search: '' });
  const isDefaultView = !query.search && !query.expertise && !query.aiResults;

  const handleSearch = (filterData) => {
    // If it's a legacy string search
    if (typeof filterData === 'string') {
      if (filterData.length > 2) {
        setQuery({
          limit: 50,
          search: filterData,
        });
      } else {
        setQuery({ limit: 50 });
      }
      return;
    }

    // New object-based filter
    const { search, expertise, location, gender } = filterData;

    setQuery({
      limit: 50,
      search: search?.length > 2 ? search : undefined,
      expertise: expertise || undefined,
      location: location || undefined,
      gender: gender || undefined,
      specialists: expertise ? [expertise] : undefined,
    });
  };

  const handleSpecialistsSelected = (specialistNames, results) => {
    setQuery({
      limit: 50,
      expertise: specialistNames.join(','),
      specialists: specialistNames,
      aiResults: results,
    });
  };

  return (
    <View style={Styles.container}>
      <Search
        onSearch={handleSearch}
        onSpecialistsSelected={handleSpecialistsSelected}
      />
      {isDefaultView && (
        <TouchableOpacity
          style={Styles.ctaBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Main', { screen: 'Chat' })}
        >
          <View style={Styles.ctaLeft}>
            <Text style={Styles.ctaTitle}>Not sure who to see?</Text>
            <Text style={Styles.ctaSubtitle}>
              Describe your symptoms and let our AI match you with the right
              doctor.
            </Text>
          </View>
          <View style={Styles.ctaIconWrap}>
            <Ionicons name="sparkles" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
      <SpecialistsRender query={query} setQuery={setQuery} />
    </View>
  );
};

export default ExploreScreen;
const Styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9F9F9',
  },
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Global_Styles.Colors.primary,
    marginHorizontal: Global_Styles.Spacing.xl,
    marginBottom: Global_Styles.Spacing.md,
    borderRadius: Global_Styles.Radius.lg,
    padding: Global_Styles.Spacing.lg,
  },
  ctaLeft: {
    flex: 1,
    marginRight: Global_Styles.Spacing.md,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  ctaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Global_Styles.Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
