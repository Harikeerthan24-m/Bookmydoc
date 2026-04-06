import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../store/api/api';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import Constants from 'expo-constants';
import { useDispatch, useSelector } from 'react-redux';
import { unwrapResult } from '@reduxjs/toolkit';
import SelectDropdown from 'react-native-select-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import { Ionicons } from '@expo/vector-icons';
import {
  authSelector,
  fetchUserProfile,
  updateUserProfile,
} from './../store/slices';
import StickyButton from './../components/explore_components/doctorprofile_components/doctorappointmentbottom/BookAppointmentButton';
import {
  AlertNotification,
  ALERT_DIALOG,
  ALERT_DANGER,
  ALERT_TOAST,
  ALERT_SUCCESS,
} from './../components/AlertNotification';

const DropdownSelect = ({ placeholder, defaultValue, data, onSelect }) => {
  return (
    <SelectDropdown
      defaultValue={defaultValue}
      data={data}
      onSelect={(selectedItem, index) => {
        onSelect(selectedItem);
      }}
      renderButton={(selectedItem, isOpened) => {
        return (
          <View style={styles.dropdownButtonStyle}>
            <Text style={styles.dropdownButtonTxtStyle}>
              {(selectedItem && selectedItem.label) || placeholder}
            </Text>
            <Ionicons
              name={isOpened ? 'chevron-up' : 'chevron-down'}
              style={styles.dropdownButtonArrowStyle}
            />
          </View>
        );
      }}
      renderItem={(item, index, isSelected) => {
        return (
          <View
            style={{
              ...styles.dropdownItemStyle,
              ...(isSelected && { backgroundColor: '#D2D9DF' }),
            }}
          >
            <Text style={styles.dropdownItemTxtStyle}>{item.label}</Text>
          </View>
        );
      }}
      showsVerticalScrollIndicator={true}
      dropdownStyle={styles.dropdownMenuStyle}
    />
  );
};

const MyProfile = ({ navigation }) => {
  const dispatch = useDispatch();
  const { profile, error, loading } = useSelector(authSelector);
  const [profileInfo, setProfileInfo] = useState({});
  const [showDate, setShowDate] = useState(false);

  useEffect(() => {
    console.log('🔵 [MyProfile] Mounting — fetching user profile...');
    console.log('🔵 [MyProfile] Resolved BASE_URL:', BASE_URL);
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (!loading && error) {
      const title =
        typeof error?.message === 'string' ? error.message : 'Error';
      const detail = error?.error?.message;
      const textBody = Array.isArray(detail)
        ? detail.join(', ')
        : typeof detail === 'string'
          ? detail
          : '';
      AlertNotification({
        title,
        textBody: textBody || 'Something went wrong. Please try again.',
        variant: ALERT_DIALOG,
        type: ALERT_DANGER,
        button: 'Close',
      });
    }

    if (profile && !error && !loading) {
      const isValidDate = !isNaN(Date.parse(profile?.dob));
      const dob = isValidDate ? profile?.dob : new Date().toISOString();
      setProfileInfo({
        ...profile,
        dob,
      });
    }
  }, [profile, error, loading]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const file = result?.assets[0];
      console.log('🖼️ [MyProfile] Image picked:', {
        uri: file?.uri,
        type: file?.type,
        fileName: file?.fileName,
        fileSize: file?.fileSize,
      });
      setProfileInfo((state) => ({
        ...state,
        file: {
          uri: file?.uri,
          type: file?.type,
          name: file?.fileName ?? profile?.uid,
        },
        photoUrl: file?.uri,
      }));
    }
  };

  const handleSave = async () => {
    console.log('💾 [MyProfile] handleSave — building FormData...');
    console.log('💾 [MyProfile] profileInfo snapshot:', {
      display_name: profileInfo.display_name,
      phone: profileInfo.phone,
      height: profileInfo.height,
      weight: profileInfo.weight,
      gender: profileInfo.gender,
      dob: profileInfo.dob,
      hasFile: !!profileInfo?.file,
      fileUri: profileInfo?.file?.uri,
      fileType: profileInfo?.file?.type,
      fileName: profileInfo?.file?.name,
    });

    const formData = new FormData();
    // ⚠️ All values must be Strings for React Native's native networking layer.
    // Passing numbers causes TypeError: Network request failed on Android.
    formData.append('display_name', String(profileInfo.display_name ?? ''));
    formData.append('phone', String(profileInfo.phone ?? ''));
    formData.append('height', String(Number(profileInfo.height ?? 0)));
    formData.append('weight', String(Number(profileInfo.weight ?? 0)));
    formData.append('gender', String(profileInfo.gender ?? ''));
    formData.append('dob', String(profileInfo.dob ?? ''));

    if (profileInfo?.file) {
      console.log('💾 [MyProfile] Appending file to FormData:', profileInfo.file);
      formData.append(
        'file',
        profileInfo?.file,
        profileInfo?.file?.fileName ?? profile?.uid,
      );
    }

    console.log('🌐 [MyProfile] Target URL:', `${BASE_URL}/profile`);

    try {
      console.log('🚀 [MyProfile] Dispatching updateUserProfile...');
      const response = unwrapResult(
        await dispatch(updateUserProfile(formData)),
      );
      console.log('✅ [MyProfile] updateUserProfile response:', response);
      if (response?.statusCode == 200) {
        AlertNotification({
          title: 'Save Success!',
          textBody: response?.message,
          variant: ALERT_TOAST,
          type: ALERT_SUCCESS,
        });
      }
    } catch (error) {
      console.error('❌ [MyProfile] updateUserProfile FAILED');
      console.error('❌ [MyProfile] Error type:', typeof error);
      console.error('❌ [MyProfile] Error message:', error?.message);
      console.error('❌ [MyProfile] Error statusCode:', error?.statusCode);
      console.error('❌ [MyProfile] Error code:', error?.error?.code);
      console.error('❌ [MyProfile] Full error object:', JSON.stringify(error, null, 2));
      // Always show error to user — normalised network errors have statusCode 500,
      // so the old `if (!error?.statusCode)` guard was silently swallowing them.
      const errTitle =
        typeof error?.message === 'string' ? error.message : 'Something went wrong.';
      const errBody =
        typeof error?.error?.message === 'string'
          ? error.error.message
          : 'An error occurred while updating your profile. Please try again.';
      AlertNotification({
        title: errTitle,
        textBody: errBody,
        variant: ALERT_TOAST,
        type: ALERT_DANGER,
      });
    }
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <DateTimePicker
          testID="dateTimePicker"
          value={new Date(profileInfo?.dob || null)}
          mode={'date'}
          onChange={(event, date) => {
            date = date.toISOString();
            setProfileInfo((state) => ({ ...state, dob: date }));
          }}
        />
      );
    }

    if (showDate) {
      return (
        <DateTimePicker
          testID="dateTimePicker"
          value={new Date(profileInfo?.dob || null)}
          mode={'date'}
          onChange={(event, date) => {
            date = date.toISOString();
            setProfileInfo((state) => ({ ...state, dob: date }));
            setShowDate(false);
          }}
        />
      );
    } else {
      return (
        <TouchableOpacity
          style={{ backgroundColor: '#E9ECEF', padding: 10, borderRadius: 10 }}
          onPress={() => setShowDate(true)}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
            {new Date(profileInfo?.dob).toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchUserProfile())}
            tintColor={'#009EFF'}
            colors={['#009EFF']}
          />
        }
      >
        {/* {loading && <Loading />} */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <View style={styles.profileContainer}>
          {profileInfo?.photoUrl ? (
            <Image style={styles.profileImage} src={profileInfo?.photoUrl} />
          ) : (
            <Ionicons
              style={[styles.profileImage, { borderWidth: 0, marginBottom: 0 }]}
              name="person-circle-outline"
              size={100}
            />
          )}
          <TouchableOpacity style={styles.editButton} onPress={pickImage}>
            <Text style={styles.editButtonText}>Edit Picture</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={profileInfo?.display_name}
              onChangeText={(value) => {
                setProfileInfo((state) => ({ ...state, display_name: value }));
              }}
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={profileInfo?.email}
              editable={false}
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Contact</Text>
            <TextInput
              style={styles.input}
              value={profileInfo?.phone}
              onChangeText={(value) => {
                setProfileInfo((state) => ({ ...state, phone: value }));
              }}
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={profileInfo?.height}
              onChangeText={(value) => {
                setProfileInfo((state) => ({ ...state, height: value }));
              }}
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={profileInfo?.weight}
              onChangeText={(value) => {
                setProfileInfo((state) => ({ ...state, weight: value }));
              }}
            />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Date of Birth</Text>
            {renderDatePicker()}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Gender</Text>
            <DropdownSelect
              placeholder="Select Gender"
              defaultValue={{ label: profileInfo?.gender }}
              data={[{ label: 'Male' }, { label: 'Female' }]}
              onSelect={(item) => {
                setProfileInfo((state) => ({ ...state, gender: item?.label }));
              }}
            />
          </View>
        </View>
      </ScrollView>
      <StickyButton title="Save Profile" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    marginBottom: 50,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Constants.statusBarHeight,
    paddingBottom: 100,
    paddingHorizontal: 20,
    backgroundColor: '#009EFF',
    borderBottomEndRadius: 40,
    borderBottomLeftRadius: 40,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '31%',
  },
  profileContainer: {
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    marginTop: -55,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  editButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#009EFF',
    borderRadius: 5,
  },
  editButtonText: {
    color: '#ffffff',
  },
  infoContainer: {
    padding: 20,
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333333',
    width: 100,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    padding: 10,
    flex: 1,
  },

  dropdownButtonStyle: {
    flex: 1,
    padding: 10,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  dropdownButtonArrowStyle: {
    fontSize: 18,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
});

export default MyProfile;
