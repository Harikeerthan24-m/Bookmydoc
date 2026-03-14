import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { unwrapResult } from '@reduxjs/toolkit';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState, useEffect, useRef } from 'react';
import ContainerView from './../components/ContainerView';
import {
  authSelector,
  resetAuthError,
  authLogin,
  sendVerifyEmail,
  authGoogleSignIn,
} from './../store';
import {
  AlertNotification,
  ALERT_DIALOG,
  ALERT_DANGER,
  ALERT_TOAST,
  ALERT_SUCCESS,
} from './../components/AlertNotification';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'customer',
  });
  const [formValidation, setFormValidation] = useState({
    errors: {},
    message: '',
    loading: false,
    valid: true,
  });

  const { isAuthenticated, loading, error, providerLoading } =
    useSelector(authSelector);
  const lastHandledErrorRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated || loading || !error?.message) {
      if (!error?.message) lastHandledErrorRef.current = null;
      return;
    }
    if (lastHandledErrorRef.current === error.message) return;
    lastHandledErrorRef.current = error.message;

    setFormValidation((prev) => ({
      ...prev,
      errors: error,
      message: error?.message,
      loading: false,
    }));
    AlertNotification({
      title: error?.message,
      textBody: error?.error?.message,
      variant: ALERT_DIALOG,
      type: ALERT_DANGER,
      button: 'Close',
    });
    dispatch(resetAuthError());
  }, [isAuthenticated, loading, error, providerLoading, dispatch]);

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
    if (!formData.email.trim()) {
      errors.email = 'email is required';
    }
    if (!formData.password.trim()) {
      errors.password = 'password is required';
    }

    if (Object.keys(errors).length) {
      valid = false;
    }

    return { valid, errors };
  };

  const handleSubmit = async () => {
    const { valid, errors } = handleValidation();
    if (!valid) {
      setFormValidation({
        ...formValidation,
        errors,
        message: '',
        loading: false,
        valid,
      });
      return;
    }

    try {
      setFormValidation({
        ...formValidation,
        errors: {},
        message: '',
        loading: true,
      });
      dispatch(authLogin({ ...formData }));
    } catch (error) {
      console.error('login failed: ', error);
      AlertNotification({
        title: 'Login failed. Try again.',
        textBody: error?.message,
        variant: ALERT_TOAST,
        type: ALERT_DANGER,
        button: 'Close',
      });
    }
  };

  const handleSendVerifyEmail = async () => {
    try {
      setFormValidation({
        ...formValidation,
        errors: {},
        message: '',
        loading: true,
      });
      const response = unwrapResult(
        await dispatch(sendVerifyEmail({ ...formData })),
      );
      if (response?.statusCode == 200) {
        AlertNotification({
          title: 'Success!',
          textBody: response?.message,
          variant: ALERT_DIALOG,
          type: ALERT_SUCCESS,
          button: 'Close',
        });
      }
      setFormValidation({
        ...formValidation,
        errors: {},
        message: '',
        loading: false,
      });
    } catch (error) {
      console.error('failed send email', error);
      setFormValidation({
        ...formValidation,
        errors: {},
        message:
          typeof error === 'string'
            ? error
            : error?.message || 'Failed to send verification email',
        loading: false,
      });
    }
  };

  return (
    <ContainerView bgImage="true">
      <View style={styles.container}>
        <Text style={styles.title}>
          Welcome{'\n'}
          Back!
        </Text>
        <Text style={[styles.errorText]}>{formValidation?.message}</Text>
        {formValidation?.errors?.statusCode == 403 && (
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ fontSize: 14, marginTop: 5 }}>
              Don't get verification email?
            </Text>
            <TouchableOpacity
              style={{ fontSize: 14, marginTop: 5 }}
              onPress={handleSendVerifyEmail}
            >
              <Text style={styles.signupButtonText}> Click here.</Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Enter Email"
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {formValidation?.errors?.email ? (
          <Text style={[styles.error]}>{formValidation?.errors?.email}</Text>
        ) : null}

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
            placeholder="Enter Password"
            placeholderTextColor="#aaa"
            secureTextEntry={!passwordVisible}
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
        {formValidation.errors?.password ? (
          <Text style={[styles.error]}>{formValidation.errors?.password}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => navigation.navigate('Forgot')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signinButton}
          onPress={handleSubmit}
          disabled={formValidation.loading || loading}
        >
          {(formValidation.loading || loading) && (
            <ActivityIndicator size="small" color="white" />
          )}
          <Text style={styles.signinButtonText}> Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signinButton, { marginTop: 0, paddingVertical: 10 }]}
          onPress={handleGoogleSignIn}
          disabled={providerLoading}
        >
          {providerLoading && <ActivityIndicator size="small" color="white" />}
          <Ionicons name="logo-google" size={28} color="white" />
          <Text style={styles.signinButtonText}>oogle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text> {`Don't have an account?`}</Text>
          <Text style={styles.signupButtonText}> Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ContainerView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  title: {
    fontSize: 34,
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
  eyeImage: {
    width: 25,
    height: 25,
  },
  forgotPasswordButton: {
    alignItems: 'flex-end',
    marginVertical: 10,
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
