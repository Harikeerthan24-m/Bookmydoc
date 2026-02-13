import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { unwrapResult } from '@reduxjs/toolkit';
import Ionicons from '@expo/vector-icons/Ionicons';
import ContainerView from './../components/ContainerView';
import {
  authRegister,
  authSelector,
  resetAuthError,
  authGoogleSignIn,
} from './../store';
import {
  AlertNotification,
  ALERT_DIALOG,
  ALERT_TOAST,
  ALERT_DANGER,
  ALERT_SUCCESS,
} from './../components/AlertNotification';

const SignupScreen = ({ navigation }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: 'tarek',
    email: 'tarekmonjur@gmail.com',
    password: 'tarekmonjur',
    role: 'customer',
  });
  const [formValidation, setFormValidation] = useState({
    errors: {},
    message: '',
    loading: false,
    valid: true,
  });
  const { isAuthenticated, loading, error, providerLoading, isVerifyNeeded } =
    useSelector(authSelector);

  useEffect(() => {
    if (!isAuthenticated && !loading && error?.message) {
      AlertNotification({
        title: error?.message,
        textBody: error?.error?.message,
        variant: ALERT_TOAST,
        type: ALERT_DANGER,
      });
      dispatch(resetAuthError());
    }
  }, [isAuthenticated, loading, error]);

  const handleGoogleSignIn = () => {
    try {
      dispatch(authGoogleSignIn({ role: formData.role }));
    } catch (error) {
      console.error('Google failed', error);
      AlertNotification({
        title: 'Google sign-in failed. Try again.',
        textBody: error?.message,
        variant: ALERT_TOAST,
        type: ALERT_DANGER,
        button: 'Close',
      });
    }
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleValidation = () => {
    const errors = {};
    let valid = true;

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      valid = false;
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      valid = false;
    }
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
      valid = false;
    }

    return { valid, errors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { valid, errors } = handleValidation();

    if (!valid) {
      setFormValidation((state) => ({
        ...state,
        errors,
        loading: false,
        valid,
      }));
      return;
    }

    setFormValidation((state) => ({
      ...state,
      errors: {},
      message: '',
      loading: true,
    }));

    try {
      const response = unwrapResult(
        await dispatch(authRegister({ ...formData })),
      );
      // console.log('response', response);
      if (response?.success && response?.statusCode === 201) {
        AlertNotification({
          title: 'Registration Success!',
          textBody: 'We send a verification email. Please verify your email.',
          variant: ALERT_DIALOG,
          type: ALERT_SUCCESS,
        });
      }
      setFormValidation((state) => ({
        ...state,
        errors: {},
        message: '',
        loading: false,
      }));
    } catch (err) {
      const message = err?.message ?? '';
      console.log('signup failed: ', err);
      setFormValidation({
        errors: err?.error ? err?.error : {},
        message: message ?? 'Signup failed',
        loading: false,
      });
    }
  };

  return (
    <ContainerView bgImage={true}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Create
          {'\n'}
          Account!
        </Text>

        <Text style={[styles.errorText]}>{formValidation.message}</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Name"
          placeholderTextColor="#aaa"
          value={formData.name}
          onChangeText={(value) => handleChange('name', value)}
        />
        {formValidation?.errors?.name ? (
          <Text style={[styles.error]}>{formValidation?.errors?.name}</Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Enter Email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
        />
        {formValidation?.errors?.email ? (
          <Text style={[styles.error]}>{formValidation?.errors?.email}</Text>
        ) : null}

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter Password"
            placeholderTextColor="#aaa"
            secureTextEntry={!passwordVisible}
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            {passwordVisible ? (
              <Ionicons name="eye" size={32} color="gray" />
            ) : (
              <Ionicons name="eye-off" size={32} color="gray" />
            )}
          </TouchableOpacity>
        </View>
        {formValidation?.errors?.password ? (
          <Text style={[styles.error]}>{formValidation?.errors?.password}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.signupButton}
          onPress={handleSubmit}
          disabled={formValidation.loading}
        >
          {formValidation.loading && (
            <ActivityIndicator size="small" color="white" />
          )}
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.signupButton,
            { marginTop: 0, paddingVertical: 10, gap: 0 },
          ]}
          onPress={handleSubmit}
          disabled={formValidation.loading}
        >
          <Ionicons name="logo-google" size={28} color="white" />
          <Text style={styles.signupButtonText}>oogle</Text>
        </TouchableOpacity>

        <View style={styles.loginPromptContainer}>
          <Text style={styles.loginPromptText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ContainerView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textShadowColor: 'black',
  },
  errorText: {
    color: 'red',
    fontWeight: '600',
    fontSize: 16,
    marginTop: 10,
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
    marginTop: 20,
  },
  passwordInput: {
    flex: 1,
    height: 50,
  },
  eyeIcon: {
    padding: 10,
  },
  signupButton: {
    backgroundColor: '#18A0FB',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 30,
    elevation: 5,
    flexDirection: 'row',
    gap: 5,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginPromptContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginPromptText: {
    color: '#333',
    fontSize: 14,
  },
  loginLink: {
    color: '#18A0FB',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
