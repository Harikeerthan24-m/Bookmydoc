import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import Global_Styles from '../../../utils/Global_Styles';
import {
  useClassifySymptomsMutation,
  useTranscribeAudioMutation,
} from '../../../store/slices';

const ASK_AI_PLACEHOLDERS = [
  'e.g. Headache and fever for 2 days...',
  'e.g. Persistent cough and breathing difficulty...',
  'e.g. Skin rash and itching...',
  'e.g. Joint pain and stiffness...',
  'e.g. Stomach ache and digestion issues...',
  'e.g. Anxiety and difficulty sleeping...',
];

const TOP_SPECIALISTS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Gynecologist',
  'ENT Specialist',
  'Psychiatrist',
  'Orthopedist',
  'Dentist',
  'Ayurveda Specialist',
];

const Search = ({ onSearch, onSpecialistsSelected }) => {
  const [inputText, setInputText] = useState('');
  const [isAskAIMode, setIsAskAIMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [error, setError] = useState(null);

  // Filters State
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [classifySymptoms, { isLoading }] = useClassifySymptomsMutation();
  const [transcribeAudio, { isLoading: isTranscribing }] =
    useTranscribeAudioMutation();
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
  const LINE_HEIGHT = 22;

  useEffect(() => {
    if (!isAskAIMode) return;

    const interval = setInterval(() => {
      const current = indexRef.current;
      const next = current >= ASK_AI_PLACEHOLDERS.length - 1 ? 0 : current + 1;

      Animated.timing(slideAnim, {
        toValue: -next * LINE_HEIGHT,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        indexRef.current = next;
        setPlaceholderIndex(next);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isAskAIMode]);

  // Debounced live search
  useEffect(() => {
    if (isAskAIMode) return;

    const timer = setTimeout(() => {
      if (
        inputText.trim().length >= 2 ||
        (inputText.trim().length === 0 && hasSearched)
      ) {
        handleSearchSubmit();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputText, isAskAIMode]);

  // Reset AI animations ONLY when leaving AI mode
  useEffect(() => {
    if (!isAskAIMode) {
      slideAnim.setValue(0);
      indexRef.current = 0;
      setPlaceholderIndex(0);
    }
  }, [isAskAIMode]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleSearchSubmit = (textToSearch = inputText) => {
    if (isAskAIMode) {
      handleAnalyze();
    } else {
      // Map 'M' to 'male' and 'F' to 'female' for the backend
      const genderValue =
        selectedGender === 'M'
          ? 'male'
          : selectedGender === 'F'
            ? 'female'
            : '';

      onSearch?.({
        search: textToSearch,
        expertise: selectedSpecialty,
        location: filterLocation,
        gender: genderValue,
      });
      setHasSearched(true);
      if (showFilters) setShowFilters(false);
    }
  };


  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please describe your symptoms or problem');
      return;
    }

    setError(null);
    setAiResults(null);

    try {
      const response = await classifySymptoms({
        message: inputText,
      }).unwrap();

      const classificationData = response?.data ?? response;
      const specialistNames = Array.isArray(classificationData?.specialists)
        ? classificationData.specialists
        : [classificationData?.specialist || 'General Physician'];

      const processedResults = {
        specialists: specialistNames.map((name) => ({
          name,
          priority: 'high',
          reason: 'Recommended based on your symptoms',
        })),
        urgency: classificationData?.urgency || 'routine',
        summary: classificationData?.summary || '',
      };

      setAiResults(processedResults);
    } catch (err) {
      console.error('Ask AI (search) error:', err);
      setError('Classification failed. Please try again or use manual search.');
    }
  };

  const handleFindDoctors = () => {
    if (aiResults?.specialists) {
      const specialistNames = aiResults.specialists.map((s) => s.name);
      onSpecialistsSelected?.(specialistNames, aiResults);
      handleClearAskAI();
    }
  };

  const handleClearAskAI = () => {
    setIsAskAIMode(false);
    setInputText('');
    setAiResults(null);
    setError(null);
    setSelectedSpecialty('');
    setFilterLocation('');
    setSelectedGender('');
  };

  const toggleAskAIMode = () => {
    if (isAskAIMode && !aiResults) {
      handleClearAskAI();
    } else if (!isAskAIMode) {
      setIsAskAIMode(true);
      setInputText('');
      setAiResults(null);
      setError(null);
      setPlaceholderIndex(0);
      if (showFilters) setShowFilters(false);
    } else {
      handleClearAskAI();
    }
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return setError('Permission needed');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
      startPulse();
    } catch (err) {
      setError('Recording failed');
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      setIsRecording(false);
      if (!recordingRef.current) return;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });
      const response = await transcribeAudio(formData).unwrap();
      const transcribedText = response?.text || response?.data?.text;
      if (transcribedText) setInputText(transcribedText);
    } catch (err) {
      setError('Transcription failed');
    }
  };

  const handleMicPress = () =>
    isRecording ? stopRecordingAndTranscribe() : startRecording();

  return (
    <View style={styles.container}>
      <View style={[styles.searchBar, isAskAIMode && styles.searchBarAskAI]}>
        <Ionicons
          name="search"
          size={22}
          color={isAskAIMode ? Global_Styles.Colors.primary : '#979797'}
        />
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder={isAskAIMode ? '' : 'Name, specialist, or location'}
            placeholderTextColor="#979797"
            style={styles.input}
            value={inputText}
            onChangeText={(value) => {
              setInputText(value);
              setError(null);
              if (!value.trim()) setHasSearched(false);
            }}
            onSubmitEditing={() => handleSearchSubmit()}
            multiline={isAskAIMode}
            numberOfLines={isAskAIMode ? 2 : 1}
            textAlignVertical={isAskAIMode ? 'top' : 'center'}
          />
          {isAskAIMode && !inputText && (
            <View style={styles.placeholderOverlay} pointerEvents="none">
              <View style={[styles.placeholderClip, { height: LINE_HEIGHT }]}>
                <Animated.View
                  style={{ transform: [{ translateY: slideAnim }] }}
                >
                  {ASK_AI_PLACEHOLDERS.map((text, i) => (
                    <Text
                      key={i}
                      style={[styles.placeholderText, { height: LINE_HEIGHT }]}
                    >
                      {text}
                    </Text>
                  ))}
                </Animated.View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.rightActions}>
          {isAskAIMode ? (
            <>
              <TouchableOpacity
                style={styles.micButton}
                onPress={handleMicPress}
              >
                {isTranscribing ? (
                  <ActivityIndicator
                    size="small"
                    color={Global_Styles.Colors.primary}
                  />
                ) : (
                  <Ionicons
                    name={isRecording ? 'stop-circle' : 'mic'}
                    size={24}
                    color={
                      isRecording ? '#FF3B30' : Global_Styles.Colors.primary
                    }
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleSearchSubmit()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={Global_Styles.Colors.primary}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeAIButton}
                onPress={toggleAskAIMode}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.filterToggle}
                onPress={toggleFilters}
              >
                <Ionicons
                  name="options-outline"
                  size={22}
                  color={showFilters ? Global_Styles.Colors.primary : '#979797'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.askAIOnBar}
                onPress={toggleAskAIMode}
              >
                <Ionicons
                  name="sparkles"
                  size={20}
                  color={Global_Styles.Colors.primary}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {showFilters && !isAskAIMode && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Specialist</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {['All', ...TOP_SPECIALISTS].map((spec) => (
              <TouchableOpacity
                key={spec}
                style={[
                  styles.filterChip,
                  selectedSpecialty === (spec === 'All' ? '' : spec) &&
                    styles.filterChipActive,
                ]}
                onPress={() => setSelectedSpecialty(spec === 'All' ? '' : spec)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedSpecialty === (spec === 'All' ? '' : spec) &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {spec}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.filterRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterLabel}>Location (City)</Text>
              <TextInput
                placeholder="e.g. Mumbai"
                style={styles.filterInput}
                value={filterLocation}
                onChangeText={setFilterLocation}
              />
            </View>
            <View style={{ width: 100, marginLeft: 12 }}>
              <Text style={styles.filterLabel}>Gender</Text>
              <View style={styles.genderContainer}>
                {['M', 'F'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderChip,
                      selectedGender === g && styles.genderChipActive,
                    ]}
                    onPress={() =>
                      setSelectedGender(selectedGender === g ? '' : g)
                    }
                  >
                    <Text
                      style={[
                        styles.genderText,
                        selectedGender === g && styles.genderTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.filterActionRow}>
            <TouchableOpacity
              style={styles.cancelFiltersButton}
              onPress={toggleFilters}
            >
              <Text style={styles.cancelFiltersText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => handleSearchSubmit()}
            >
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={18} color="#FF9500" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {aiResults && (
        <View style={styles.resultsCard}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>AI Recommendations</Text>
            <TouchableOpacity onPress={handleClearAskAI}>
              <Ionicons name="close-circle" size={22} color="#999" />
            </TouchableOpacity>
          </View>
          <Text style={styles.summaryText}>{aiResults.summary}</Text>
          <View style={styles.specialistChips}>
            {aiResults.specialists?.map((s, i) => (
              <View key={i} style={styles.specialistChip}>
                <Text style={styles.specialistChipText}>{s.name}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.findDoctorsButton}
            onPress={handleFindDoctors}
          >
            <Text style={styles.findDoctorsButtonText}>
              Find Matching Doctors
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    marginTop: Constants.statusBarHeight,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  searchBarAskAI: {
    alignItems: 'flex-start',
    minHeight: 60,
    paddingVertical: 12,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 15,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: 10,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  placeholderClip: {
    overflow: 'hidden',
  },
  placeholderText: {
    fontSize: 15,
    color: '#979797',
    lineHeight: 22,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterToggle: {
    padding: 8,
    marginRight: 4,
  },
  actionButton: {
    paddingHorizontal: 8,
    marginLeft: 4,
  },
  askAIOnBar: {
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    marginLeft: 4,
  },
  closeAIButton: {
    padding: 8,
    marginLeft: 4,
  },
  micButton: {
    padding: 8,
    marginRight: 4,
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  suggestionSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  clearText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  historyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
    gap: 6,
  },
  historyChipText: {
    fontSize: 13,
    color: '#444',
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#D1EAFF',
    gap: 6,
    width: '48%',
  },
  trendingText: {
    fontSize: 13,
    color: '#18A0FB',
    fontWeight: '600',
  },
  filterPanel: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  filterChipActive: {
    backgroundColor: '#18A0FB',
    borderColor: '#18A0FB',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderChipActive: {
    backgroundColor: '#18A0FB',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  genderTextActive: {
    color: 'white',
  },
  filterActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  cancelFiltersText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  applyFiltersButton: {
    flex: 2,
    backgroundColor: '#18A0FB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
  },
  resultsCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 15,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  summaryText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
    lineHeight: 18,
  },
  specialistChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  specialistChip: {
    backgroundColor: '#18A0FB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialistChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFF',
  },
  findDoctorsButton: {
    backgroundColor: '#18A0FB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  findDoctorsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  closeAIButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
});
