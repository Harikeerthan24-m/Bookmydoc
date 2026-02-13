import { createSlice, createAsyncThunk, current } from '@reduxjs/toolkit';
import apiClient from '../api/api';
import { sendPasswordResetEmail } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  auth,
  signInWithCustomToken,
  signInWithPopup,
  googleProvider,
  sendEmailVerification,
  signOut,
} from '../../firebaseConfig';
import { APP_URL } from '../../types/const';

// Async action for signup
export const authSignup = createAsyncThunk(
  'auth/signup',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.request({
        method: 'post',
        url: 'api/auth/register',
        data: payload,
      });
      return response.data;
    } catch (error) {
      if (error?.data || error?.statusCode) {
        return rejectWithValue(error);
      } else {
        return rejectWithValue({
          error: error,
          message: error?.message,
          data: null,
          statusCode: error?.code || 500,
        });
      }
    }
  },
);

/**
 * AUTH REGISTER WITH CREDENTIALS...
 */
export const authRegister = createAsyncThunk(
  'auth/signup',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.request({
        method: 'post',
        url: 'api/auth/register',
        data: payload,
      });

      // Handle conflict errors (409) - Email already exists
      if (response?.data?.statusCode === 409) {
        return rejectWithValue({
          statusCode: 409,
          message: response?.data?.message || 'Registration failed',
          error: {
            message:
              response?.data?.error?.message ||
              response?.data?.message ||
              'Email already exists',
          },
          data: response?.data?.data,
        });
      }

      // Handle success (201)
      if (response?.data?.statusCode === 201) {
        if (response?.data?.data?.idToken) {
          const singInToken = await signInWithCustomToken(
            auth,
            response?.data?.data?.idToken,
          );

          if (singInToken?.user) {
            await sendEmailVerification(singInToken.user, {
              url: APP_URL + '/verify?state=' + response?.data?.data?.idToken,
            });
            return singInToken?.user;
          }
        }
      }

      // Handle other non-success status codes
      if (response?.data?.statusCode && response?.data?.statusCode !== 201) {
        return rejectWithValue({
          statusCode: response?.data?.statusCode,
          message: response?.data?.message || 'Registration failed',
          error: {
            message:
              response?.data?.error?.message ||
              response?.data?.message ||
              'Registration failed',
          },
          data: response?.data?.data,
        });
      }
    } catch (error) {
      console.log('🚨 [FRONTEND] Registration error:', error);

      // Handle HTTP error responses
      if (error?.response?.data) {
        const errorData = error.response.data;
        return rejectWithValue({
          statusCode: errorData?.statusCode || error?.response?.status || 500,
          message: errorData?.message || 'Registration failed',
          error: {
            message:
              errorData?.error?.message ||
              errorData?.message ||
              error?.message ||
              'Registration failed',
          },
          data: errorData?.data,
        });
      }

      // Handle network or other errors
      return rejectWithValue({
        statusCode: error?.code || 500,
        message: error?.message || 'Network error occurred',
        error: {
          message: error?.message || 'Network error occurred',
        },
        data: null,
      });
    }
  },
);

/**
 * AUTH LOGIN WITH EMAIL AND PASSWORD..
 */
export const authLogin = createAsyncThunk(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    console.log('🔐 [FRONTEND] Email/Password login started');
    console.log('📋 [FRONTEND] Login payload:', {
      email: payload?.email,
      hasPassword: !!payload?.password,
      role: payload?.role,
    });

    try {
      console.log('🔍 [FRONTEND] Authenticating with Firebase...');
      const userCredential = await signInWithEmailAndPassword(
        auth,
        payload?.email,
        payload?.password,
      );

      console.log('✅ [FRONTEND] Firebase authentication successful:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        emailVerified: userCredential.user.emailVerified,
      });

      const idToken = await userCredential.user.getIdToken();
      console.log('🎫 [FRONTEND] ID token obtained:', {
        tokenLength: idToken?.length,
      });

      if (!userCredential?.user?.emailVerified) {
        console.log('❌ [FRONTEND] Email not verified');
        return rejectWithValue({
          statusCode: 403,
          message: 'Your email is not verified.',
          error: {
            message: 'Please verify you email address.',
          },
        });
      }

      console.log('📤 [FRONTEND] Sending login request to backend...');
      const response = await apiClient.request({
        method: 'post',
        url: 'api/auth/login',
        data: {
          token: idToken,
          role: payload?.role,
        },
      });

      console.log('📋 [FRONTEND] Backend login response:', {
        statusCode: response?.data?.statusCode,
        hasIdToken: !!response?.data?.data?.idToken,
        message: response?.data?.message,
      });

      if (response?.data?.statusCode === 200) {
        if (response?.data?.data?.idToken) {
          console.log(
            '🎫 [FRONTEND] Signing in with custom token from backend...',
          );
          const singInToken = await signInWithCustomToken(
            auth,
            response?.data?.data?.idToken,
          );

          console.log('✅ [FRONTEND] Custom token sign-in successful:', {
            hasUser: !!singInToken?.user,
            uid: singInToken?.user?.uid,
            email: singInToken?.user?.email,
          });

          if (singInToken?.user) {
            // Store the access token for future API calls
            const finalToken = await singInToken.user.getIdToken();
            localStorage.setItem('accessToken', finalToken);
            console.log('💾 [FRONTEND] Access token stored in localStorage');
            return singInToken?.user;
          }
        }
      }

      console.log('❌ [FRONTEND] Login failed or incomplete');
    } catch (error) {
      console.log('💥 [FRONTEND] Login error:', {
        message: error?.message,
        code: error?.code,
        statusCode: error?.statusCode,
        data: error?.data,
      });

      if (error?.data || error?.statusCode) {
        return rejectWithValue(error);
      } else {
        return rejectWithValue({
          error: error,
          message: error?.message,
          data: null,
          statusCode: error?.code || 500,
        });
      }
    }
  },
);

/**
 * AUTH LOGIN WITH GOOGLE PROVIDER FIREBSAE AND NEST.JS FIREBASE-ADMIN..
 */
export const authGoogleSignIn = createAsyncThunk(
  'auth/google-signin',
  async (payload, { rejectWithValue }) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result?.user?.getIdToken();

      const response = await apiClient.request({
        method: 'post',
        url: 'api/auth/login',
        data: {
          token,
          role: payload?.role,
          provider: 'google',
        },
      });

      if (response?.data?.statusCode === 200) {
        if (response?.data?.data?.idToken) {
          const singInToken = await signInWithCustomToken(
            auth,
            response?.data?.data?.idToken,
          );
          if (singInToken?.user) {
            // Persist access token for subsequent API calls
            const finalToken = await singInToken.user.getIdToken();
            localStorage.setItem('accessToken', finalToken);
            return singInToken?.user;
          }
        }
      }
    } catch (error) {
      if (error?.data || error?.statusCode) {
        return rejectWithValue(error);
      } else {
        return rejectWithValue({
          error: error,
          message: error?.message,
          data: null,
          statusCode: error?.code || 500,
        });
      }
    }
  },
);

export const authChecker = createAsyncThunk(
  'auth/checker',
  async (_, { rejectWithValue }) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return rejectWithValue({
        statusCode: 401,
        error: {},
        data: null,
        message: '',
      });
    }
    try {
      const response = await apiClient.request({
        method: 'get',
        url: 'api/user/auth-check',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response?.data?.data?.statusCode === 500) {
        return rejectWithValue(response?.data?.data);
      }

      return response;
    } catch (error) {
      if (error?.data || error?.statusCode) {
        return rejectWithValue(error);
      } else {
        return rejectWithValue({
          error: error,
          message: error?.message,
          data: null,
          statusCode: error?.code || 500,
        });
      }
    }
  },
);

/**
 * AUTH REGISTER WITH CREDENTIALS...
 */
export const sendVerifyEmail = createAsyncThunk(
  'auth/sendVerifyEmail',
  async (payload, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        payload?.email,
        payload?.password,
      );

      if (userCredential?.user?.emailVerified) {
        return {
          data: userCredential?.user,
          statusCode: 200,
          error: null,
          message: 'Email already verified.',
        };
      }

      const idToken = await userCredential.user.getIdToken();

      if (idToken) {
        await sendEmailVerification(userCredential.user, {
          url: APP_URL + '/verify?state=' + idToken,
        });
        return {
          data: null,
          statusCode: 200,
          error: null,
          message: 'Your email verification code successfully send.',
        };
      }

      return rejectWithValue({
        error: {
          message: 'Something was wrong! Please try again',
        },
        message: 'Could not send verification email.',
        data: null,
        statusCode: 500,
      });
    } catch (error) {
      if (error?.data || error?.statusCode) {
        return rejectWithValue(error);
      } else {
        return rejectWithValue({
          error: error,
          message: error?.message,
          data: null,
          statusCode: error?.code || 500,
        });
      }
    }
  },
);

export const verifyEmail = createAsyncThunk(
  'user/verifyEmail',
  async (stateCode, { rejectWithValue }) => {
    console.log('📧 [FRONTEND] Email verification started');
    console.log('🔍 [FRONTEND] State code:', {
      hasStateCode: !!stateCode,
      length: stateCode?.length,
    });

    try {
      console.log('📤 [FRONTEND] Sending verification request to backend...');
      const response = await apiClient.request({
        method: 'post',
        url: 'api/auth/verify-email',
        data: { state_code: stateCode },
      });

      console.log('✅ [FRONTEND] Verification response received:', {
        statusCode: response?.data?.statusCode,
        message: response?.data?.message,
      });

      if (response?.data?.statusCode === 200) {
        console.log('🔑 [FRONTEND] Email verified, attempting auto-login...');
        const loginResponse = await apiClient.request({
          method: 'post',
          url: 'api/auth/login',
          data: {
            token: stateCode,
            role: 'doctor',
          },
        });

        console.log('📋 [FRONTEND] Login response received:', {
          statusCode: loginResponse?.data?.statusCode,
          hasIdToken: !!loginResponse?.data?.data?.idToken,
          message: loginResponse?.data?.message,
        });

        if (
          loginResponse?.data?.statusCode === 200 &&
          loginResponse?.data?.data?.idToken
        ) {
          console.log('🎫 [FRONTEND] Signing in with custom token...');
          const singInToken = await signInWithCustomToken(
            auth,
            loginResponse?.data?.data?.idToken,
          );

          console.log('✅ [FRONTEND] Custom token sign-in successful:', {
            hasUser: !!singInToken?.user,
            uid: singInToken?.user?.uid,
            email: singInToken?.user?.email,
          });

          if (singInToken?.user) {
            // Store the access token for future API calls
            if (loginResponse?.data?.data?.idToken) {
              localStorage.setItem(
                'accessToken',
                await singInToken.user.getIdToken(),
              );
              console.log('💾 [FRONTEND] Access token stored in localStorage');
            }
            return singInToken?.user;
          }
        }
      }

      console.log('❌ [FRONTEND] Email verification failed or incomplete');
      return response?.data;
    } catch (error) {
      console.log('💥 [FRONTEND] Email verification error:', {
        message: error?.message,
        statusCode: error?.statusCode,
        data: error?.data,
      });

      if (error?.data || error?.statusCode) {
        return rejectWithValue(error);
      } else {
        return rejectWithValue({
          error: error,
          message: error?.message,
          data: null,
          statusCode: error?.code || 500,
        });
      }
    }
  },
);

export const authLogout = createAsyncThunk(
  'auth/logout',
  async (_, thunkAPI) => {
    const accessToken = localStorage.getItem('accessToken');
    try {
      if (accessToken) {
        const response = await apiClient.request({
          method: 'get',
          url: 'api/user/logout',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        await signOut(auth);
        return response.data;
      }
    } catch (error) {
      if (error?.data || error?.statusCode) {
        return thunkAPI.rejectWithValue(error);
      } else {
        return thunkAPI.rejectWithValue({
          error: error,
          message: error?.message,
          data: null,
          statusCode: error?.code || 500,
        });
      }
    }
  },
);

export const fetchUserProfile = createAsyncThunk(
  'api/profile',
  async (_, thunkAPI) => {
    const accessToken = localStorage.getItem('accessToken');
    try {
      if (accessToken) {
        const response = await apiClient.request({
          method: 'get',
          url: 'api/profile',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        return response.data;
      } else {
        throw new Error('Access token not found.');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      if (error?.data || error?.statusCode) {
        return thunkAPI.rejectWithValue(error);
      } else {
        return thunkAPI.rejectWithValue({
          error: error,
          message: error?.message,
          data: null,
          statusCode: error?.code || 500,
        });
      }
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  'api/profileUpdate',
  async (payload, thunkAPI) => {
    const accessToken = localStorage.getItem('accessToken');
    try {
      if (accessToken) {
        const response = await apiClient.request({
          method: 'put',
          url: 'api/profile',
          data: payload,
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        return response.data;
      } else {
        throw new Error('Access token not found.');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      if (error?.data || error?.statusCode) {
        return thunkAPI.rejectWithValue(error);
      } else {
        return thunkAPI.rejectWithValue({
          error: error,
          message: error?.message,
          data: null,
          statusCode: error?.code || 500,
        });
      }
    }
  },
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ newPassword }, { rejectWithValue }) => {
    try {
      const user = auth.currentUser;
      await user.updatePassword(newPassword); // Assuming you are using Firebase Auth
      return { success: true };
    } catch (error) {
      if (error?.data || error?.statusCode) {
        return rejectWithValue(error);
      } else {
        return rejectWithValue({
          error: error,
          message: error?.message,
          data: null,
          statusCode: error?.code || 500,
        });
      }
    }
  },
);

export const sendPasswordResetEmailRequest = createAsyncThunk(
  'auth/sendPasswordResetEmail',
  async ({ email }, { rejectWithValue }) => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: APP_URL + '/login',
      });
      return { message: 'Password reset email sent successfully' };
    } catch (error) {
      if (error?.data || error?.statusCode) {
        return rejectWithValue(error);
      } else {
        return rejectWithValue({
          error: error,
          message: error?.message,
          data: null,
          statusCode: error?.code || 500,
        });
      }
    }
  },
);

// Initial state
const initialState = {
  loading: false,
  providerLoading: false,
  user: null,
  error: null,
  isVerifyNeeded: false,
  isAuthenticated: localStorage.getItem('accessToken') ? true : false,
};

// Slice
const AuthSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(authChecker.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authChecker.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action?.payload?.data?.statusCode === 500) {
          state.isAuthenticated = false;
          localStorage.removeItem('accessToken');
        } else {
          if (action?.payload?.status === 200) {
            state.isAuthenticated = true;
          } else {
            state.isAuthenticated = false;
            localStorage.removeItem('accessToken');
          }
        }
      })
      .addCase(authChecker.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        if (action?.payload?.statusCode === 401) {
          localStorage.removeItem('accessToken');
        }
        state.error = action.payload;
      })

      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;

        if (action?.payload?.statusCode === 200) {
          state.user = action?.payload?.data;
          state.error = null;
          state.isAuthenticated = true;
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(authRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authRegister.fulfilled, (state, action) => {
        state.loading = false;

        if (action?.payload?.error && action?.payload?.statusCode === 409) {
          state.error = {
            error: {
              message: 'Please try with using another email address',
            },
            message: 'Email already exists.',
          };
          state.isAuthenticated = false;
          return state;
        }

        if (action?.payload) {
          state.error = null;
          localStorage.setItem('accessToken', action?.payload?.accessToken);
          state.isAuthenticated = true;
          state.isVerifyNeeded = true;
        }
      })
      .addCase(authRegister.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.isVerifyNeeded = false;
        state.loading = false;
        const serverErrorObj = action?.payload;
        let message;
        let errorMessage;
        const code =
          serverErrorObj?.error?.code || serverErrorObj?.error?.statusCode;
        if (code === 'auth/invalid-credential') {
          message = 'Invalid Credentials.';
          errorMessage = 'Please try again with valid credentials';
        } else if (code === 'auth/user-not-found') {
          message = 'User not found.';
          errorMessage = 'Please sign up with new account';
        } else if (code === 'auth/too-many-requests') {
          message = 'Too many requests.';
          errorMessage =
            'Your account is suspended. Please reset your password.';
        } else if (code === 'auth/network-request-failed') {
          message = 'Network request failed.';
          errorMessage = 'Please check your internet connection.';
        } else {
          message = 'Something went wrong';
        }

        state.error = {
          ...serverErrorObj,
          error: {
            message: errorMessage,
          },
          message,
        };
      })

      .addCase(authGoogleSignIn.pending, (state) => {
        state.providerLoading = true;
        state.error = null;
      })
      .addCase(authGoogleSignIn.fulfilled, (state, action) => {
        state.providerLoading = false;

        if (action?.payload) {
          localStorage.setItem('accessToken', action?.payload?.accessToken);
          state.isAuthenticated = true;
          state.error = null;
        }
      })
      .addCase(authGoogleSignIn.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.providerLoading = false;

        const serverErrorObj = action?.payload;

        // Handle role mismatch error specifically
        if (serverErrorObj?.error?.type === 'ROLE_MISMATCH') {
          state.error = {
            ...serverErrorObj,
            error: {
              message: `Account Already Exists with Different Role`,
              details: serverErrorObj.message,
            },
            message: `This email is registered as a ${serverErrorObj.data?.existingRole}`,
            suggestion: serverErrorObj.data?.suggestion,
          };
        } else {
          state.error = action.payload;
        }
      })

      .addCase(authLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authLogin.fulfilled, (state, action) => {
        state.loading = false;

        if (action?.payload) {
          localStorage.setItem('accessToken', action?.payload?.accessToken);
          state.isAuthenticated = true;
          state.error = null;
        }
      })
      .addCase(authLogin.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.loading = false;
        const serverErrorObj = action?.payload;
        let message;
        let title;
        const code =
          serverErrorObj?.error?.code ||
          serverErrorObj?.statusCode ||
          serverErrorObj?.error?.statusCode;
        if (code === 403) {
          // email not verified
          state.error = serverErrorObj;
        } else {
          if (code === 'auth/invalid-credential') {
            message = 'Invalid Credentials.';
            title = 'Please try again with valid credentials';
          } else if (code === 'auth/user-not-found') {
            message = 'User not found.';
            title = 'Please sign up with new account';
          } else if (code === 'auth/too-many-requests') {
            message = 'Too many requests.';
            title = 'Your account is suspended. Please reset your password.';
          } else if (code === 'auth/network-request-failed') {
            message = 'Network request failed.';
            title = 'Please check your internet connection.';
          } else {
            message = 'Something went wrong';
          }

          state.error = {
            ...serverErrorObj,
            error: {
              message: title,
            },
            message,
          };
        }
      })

      .addCase(authLogout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authLogout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.error = null;
        // Delete the token..
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          localStorage.removeItem('accessToken');
          state.isAuthenticated = false;
        }
      })
      .addCase(authLogout.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      })

      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        const placeholderData = current(state.user);
        const actionData = action?.payload?.data;
        state.loading = false;
        state.user = {
          ...placeholderData,
          ...actionData,
          services: actionData?.services || placeholderData?.services || [],
          expertiseList:
            actionData?.expertiseList || placeholderData?.expertiseList || [],
        };
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(sendVerifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendVerifyEmail.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(sendVerifyEmail.rejected, (state, action) => {
        state.loading = false;
        const serverErrorObj = action?.payload;
        let message;
        let errorMessage;
        const code =
          serverErrorObj?.error?.code ||
          serverErrorObj?.statusCode ||
          serverErrorObj?.error?.statusCode;

        if (code === 'auth/invalid-credential') {
          message = 'Invalid Credentials.';
          errorMessage = 'Please try again with valid credentials';
        } else if (code === 'auth/user-not-found') {
          message = 'User not found.';
          errorMessage = 'Please sign up with new account';
        } else if (code === 'auth/too-many-requests') {
          message = 'Too many requests.';
          errorMessage =
            'Your account is suspended. Please reset your password.';
        } else if (code === 'auth/network-request-failed') {
          message = 'Network request failed.';
          errorMessage = 'Please check your internet connection.';
        } else {
          if (code === 500) {
            state.error = serverErrorObj;
            return;
          } else {
            message = 'Something went wrong';
            errorMessage = 'Pleas try again later.';
          }
        }

        state.error = {
          ...serverErrorObj,
          error: {
            message: errorMessage,
          },
          message,
        };
      })

      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action?.payload && action?.payload?.accessToken) {
          localStorage.setItem('accessToken', action?.payload?.accessToken);
          state.isAuthenticated = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export default AuthSlice.reducer;
