import { View, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import Search from '../components/home_components/Search/Search';
import SpecialistsRender from '../components/explore_components/SpecialistsRenderExplore';

const ExploreScreen = () => {
  const [query, setQuery] = useState({ limit: 50, search: '' });

  const handleSearch = (search) => {
    if (search?.length > 2) {
      setQuery((state) => ({
        ...state,
        search,
        expertise: undefined,
        specialists: undefined,
        aiResults: undefined,
      }));
    } else {
      setQuery({ limit: 50 });
    }
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
});
