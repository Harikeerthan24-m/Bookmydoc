// No need to import types in JavaScript

// The ISignupInput interface can be represented as a plain object structure in JavaScript
export const ISignupInput = {
  name: '',
  email: '',
  password: '',
  secure: false,
  verification_code: '',
};

// The IAuthSliceState interface can be represented as a plain object structure in JavaScript
export const IAuthSliceState = {
  user: null,
  userDetails: null,
  isLoading: false,
  errors: null,
};

// The EAuthProvider enum can be represented as a plain object in JavaScript
export const EAuthProvider = {
  SPEAKNIX: 'speaknix.com',
  GOOGLE: 'google.com',
};

// The EAuthAction enum can be represented as a plain object in JavaScript
export const EAuthAction = {
  LOGIN: 'login',
  SIGNUP: 'signup',
};

// The IAuthProvider interface can be represented as a plain object structure in JavaScript
export const IAuthProvider = {
  authAction: '',
  firebaseToken: '',
  provider: '',
};

// Example usage of these structures
export const signupInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'securepassword123',
  secure: true,
  verification_code: '123456',
};

export const authSliceState = {
  user: null,
  userDetails: null,
  isLoading: false,
  errors: null,
};

export const authProvider = {
  authAction: EAuthAction.SIGNUP,
  firebaseToken: process.env.firebaseToken,
  provider: EAuthProvider.GOOGLE,
};
