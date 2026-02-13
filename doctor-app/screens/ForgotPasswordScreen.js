import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import ContainerView from '../components/ContainerView';
import {
  AlertNotification,
  ALERT_DIALOG,
  ALERT_DANGER,
  ALERT_SUCCESS,
} from './../components/AlertNotification';
import { sendPasswordResetEmailRequest } from './../store';
import { unwrapResult } from '@reduxjs/toolkit';

const ForgotPasswordScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: '',
    errors: {},
    loading: false,
    valid: true,
  });

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleValidation = () => {
    const errors = {};
    let valid = true;

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      valid = false;
    }

    return { valid, errors };
  };

  const handleSubmit = async () => {
    const { valid, errors } = handleValidation();

    if (!valid) {
      setFormData({
        ...formData,
        errors,
        loading: false,
        valid,
      });
      return;
    }

    try {
      setFormData({
        ...formData,
        errors: {},
        message: '',
        loading: true,
      });

      const response = await dispatch(
        sendPasswordResetEmailRequest({ email: formData.email?.trim() }),
      );
      unwrapResult(response);
      AlertNotification({
        title: 'Email successfully sent',
        textBody: 'Password reset email sent to your email.',
        variant: ALERT_DIALOG,
        type: ALERT_SUCCESS,
        button: 'Close',
      });
    } catch (err) {
      console.error('Password reset failed:', err);
      AlertNotification({
        title: err?.message || 'Email send failed',
        textBody:
          err?.error?.message || 'Password reset email send failed, try again.',
        variant: ALERT_DIALOG,
        type: ALERT_DANGER,
        button: 'Close',
      });
    } finally {
      setFormData({
        ...formData,
        errors: {},
        loading: false,
      });
    }
  };

  return (
    <ContainerView bgImage="true">
      <View style={styles.container}>
        <Text style={styles.title}>
          Forgot{'\n'}
          Password!
        </Text>

        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
          placeholder="Username or Email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {formData?.errors?.email ? (
          <Text style={[styles.error]}>{formData?.errors?.email}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.signinButton}
          disabled={formData.loading}
          onPress={handleSubmit}
        >
          {formData.loading && <ActivityIndicator size="small" color="white" />}
          <Text style={styles.signinButtonText}>Sent Reset Email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text>Already have an account?</Text>
          <Text style={styles.signupButtonText}> Sign In</Text>
        </TouchableOpacity>
      </View>
    </ContainerView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  error: {
    color: 'red',
    fontSize: 14,
    marginLeft: 5,
  },
  input: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginTop: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
  },
  eyeIcon: {
    padding: 10,
  },
  eyeImage: {
    width: 25,
    height: 25,
  },
  forgotPasswordButton: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#18A0FB',
    fontSize: 14,
  },
  signinButton: {
    backgroundColor: '#18A0FB',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 30,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  signupButtonText: {
    color: '#18A0FB',
    fontSize: 14,
    fontWeight: '500',
  },
});
