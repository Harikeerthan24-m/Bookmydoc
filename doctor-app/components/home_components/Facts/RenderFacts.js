import React, { useMemo, useCallback } from 'react';
import {
  FlatList,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useGetFactsQuery, appRefreshSelector } from './../../../store';
import Global_Styles from '../../../utils/Global_Styles';

const windowWidth = Dimensions.get('window').width;

const RenderFacts = () => {
  const appRefresh = useSelector(appRefreshSelector);
  const { data, isLoading } = useGetFactsQuery({
    seed: true,
    refresh: appRefresh,
  });

  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.item}>
        <Text style={styles.fact}>{item.fact}</Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item) => item?.id, []);

  const factsData = useMemo(() => data ?? [], [data]);

  if (isLoading) {
    return (
      <View style={{ justifyContent: 'center' }}>
        <ActivityIndicator size="small" color="black" />
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={factsData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        nestedScrollEnabled
        scrollEventThrottle={16}
      />
    </View>
  );
};

const HORIZONTAL_LIST_HEIGHT = 120;

const styles = StyleSheet.create({
  listContainer: {
    height: HORIZONTAL_LIST_HEIGHT,
  },
  item: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 30,
    borderRadius: Global_Styles.BorderRadius,
    width: windowWidth - 80,
    backgroundColor: '#2CAAFF',
    justifyContent: 'center',
    marginLeft: 10,
    marginRight: 5,
  },
  fact: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
    color: 'white',
  },
});

export default RenderFacts;
