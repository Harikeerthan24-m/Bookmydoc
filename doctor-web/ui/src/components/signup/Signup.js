import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Signup.css';
import signupBackground from '../../assets/images/doc_image.jpg'; // Ensure the image exists
import { useDispatch, useSelector } from 'react-redux';
// import { auth, signInWithPopup, appleProvider } from '../../firebaseConfig';
import { authGoogleSignIn, authRegister } from '../../store/slices/auth.slice';
import { ScaleLoader } from 'react-spinners';
import { ToastErrorMessage } from './../common/ToastMessageWrapper';
import GoogleLogo from '../common/GoogleLogo';

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: '',
    email: '',
    password: '',
  });

  // STORES FOR LOGIN..
  const { isAuthenticated, loading, error, providerLoading, isVerifyNeeded } =
    useSelector((state) => state.auth);

  const [role] = useState('doctor');

  const [formValidation, setFormValidation] = useState({
    errors: {},
    message: '',
    loading: false,
    valid: true,
  });

  // REDUX ACTIONS EFFECTS WITH LOGIN USER..
  useEffect(() => {
    if (!isAuthenticated && !loading && error?.message) {
      // Handle specific error types with clear messages
      let errorTitle = 'Registration Failed';
      let errorMessage = error?.error?.message || error?.message;

      // Handle specific error cases
      if (error?.statusCode === 409) {
        if (errorMessage?.toLowerCase().includes('email already exists')) {
          errorTitle = '📧 Email Already Registered';
          errorMessage =
            'This email is already registered. Please try logging in instead or use a different email address.';
        } else if (errorMessage?.toLowerCase().includes('role')) {
          errorTitle = '⚠️ Account Role Mismatch';
          errorMessage = `${error.message}. ${error.suggestion || 'Please contact support to change your role.'}`;
        }
      } else if (error?.statusCode === 400) {
        if (errorMessage?.toLowerCase().includes('weak password')) {
          errorTitle = '🔒 Weak Password';
          errorMessage =
            'Password is too weak. Please choose a stronger password with at least 6 characters.';
        } else if (errorMessage?.toLowerCase().includes('invalid role')) {
          errorTitle = '👤 Invalid Role';
          errorMessage =
            'The selected role is invalid. Please choose either Doctor or Customer.';
        }
      } else if (error?.statusCode === 401) {
        errorTitle = '🔐 Authentication Failed';
        errorMessage =
          'Invalid credentials provided. Please check your information and try again.';
      } else if (error?.statusCode >= 500) {
        errorTitle = '🔧 Server Error';
        errorMessage =
          'A server error occurred. Please try again later or contact support if the problem persists.';
      }

      ToastErrorMessage({
        title: errorTitle,
        message: errorMessage,
        duration: 6000,
      });
    }

    if (
      isAuthenticated &&
      !isVerifyNeeded &&
      (!loading || !providerLoading) &&
      !error
    ) {
      navigate('/profile', { replace: true });
    }

    if (
      isAuthenticated &&
      isVerifyNeeded &&
      (!loading || !providerLoading) &&
      !error
    ) {
      navigate('/verify', { replace: true });
    }
  }, [
    isAuthenticated,
    loading,
    error,
    navigate,
    providerLoading,
    isVerifyNeeded,
  ]);

  const handleChange = (field, event) => {
    setUser({
      ...user,
      [field]: event.target.value,
    });

    // Clear form validation errors when user starts typing
    if (formValidation.errors[field]) {
      setFormValidation((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: '',
        },
      }));
    }
  };

  const handleValidation = () => {
    const errors = {};
    let valid = true;

    if (!user.name.trim()) {
      errors.name = 'Name is required';
      valid = false;
    }
    if (!user.email.trim()) {
      errors.email = 'Email is required';
      valid = false;
    }
    if (!user.password.trim()) {
      errors.password = 'Password is required';
      valid = false;
    }

    return { valid, errors };
  };

  // HANDLE LOGIN WITH CREDENTIALS..
  const handleSubmit = async (e) => {
    e.preventDefault();
    // dispatch(userLogin(user, role));
    const { valid, errors } = handleValidation();

    if (!valid) {
      setFormValidation({
        ...formValidation,
        errors,
        loading: false,
        valid,
      });
      return;
    }

    setFormValidation({
      ...formValidation,
      errors: {},
      message: '',
      loading: true,
    });

    dispatch(authRegister({ ...user, role }));
  };

  // HANDLE LOGIN WITH GOOGLE PROVIDER
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    try {
      dispatch(authGoogleSignIn({ role }));
    } catch (error) {
      ToastErrorMessage({
        title: error?.message,
        message: error?.error?.message,
      });
    }
  };

  // const AppleSignIn = async () => {
  //   try {
  //     const result = await signInWithPopup(auth, appleProvider);
  //     console.log(result.user); // User is signed in
  //   } catch (error) {
  //     console.error(error); // Handle errors here
  //   }
  // };

  return (
    <div className="signup-container">
      <div className="container-fluid">
        <div className="row no-gutters">
          <div className="col-lg-6 d-none d-lg-flex signup-image-container">
            <div
              className="signup-image"
              style={{ backgroundImage: `url(${signupBackground})` }}
            ></div>
          </div>
          <div className="col-lg-6 d-flex align-items-center justify-content-center">
            <div className="signup-form">
              <ToastContainer />
              <h1 className="text-center">Signup</h1>

              {/* Global Error Message Display */}
              {error && !loading && (
                <div className="alert alert-danger" role="alert">
                  <strong>
                    {error?.statusCode === 409 &&
                    error?.error?.message
                      ?.toLowerCase()
                      .includes('email already exists')
                      ? '📧 Email Already Registered'
                      : error?.statusCode === 400 &&
                          error?.error?.message
                            ?.toLowerCase()
                            .includes('weak password')
                        ? '🔒 Weak Password'
                        : error?.statusCode === 401
                          ? '🔐 Authentication Failed'
                          : error?.statusCode >= 500
                            ? '🔧 Server Error'
                            : 'Registration Failed'}
                  </strong>
                  <br />
                  <small>
                    {error?.statusCode === 409 &&
                    error?.error?.message
                      ?.toLowerCase()
                      .includes('email already exists') ? (
                      <>
                        This email is already registered.
                        <Link to="/login" className="alert-link">
                          {' '}
                          Click here to login instead
                        </Link>{' '}
                        or use a different email.
                      </>
                    ) : (
                      error?.error?.message ||
                      error?.message ||
                      'Please try again.'
                    )}
                  </small>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    onChange={(e) => handleChange('name', e)}
                  />
                  {formValidation.errors.name && (
                    <small className="text-danger">
                      {formValidation.errors.name}
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    onChange={(e) => handleChange('email', e)}
                  />
                  {formValidation.errors.email && (
                    <small className="text-danger">
                      {formValidation.errors.email}
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    onChange={(e) => handleChange('password', e)}
                  />
                  {formValidation.errors.password && (
                    <small className="text-danger">
                      {formValidation.errors.password}
                    </small>
                  )}
                  {!formValidation.errors.password && user.password && (
                    <small
                      className={`text-${user.password.length >= 6 ? 'success' : 'warning'}`}
                    >
                      Password strength:{' '}
                      {user.password.length >= 6
                        ? '✅ Good'
                        : '⚠️ Too weak (min 6 characters)'}
                    </small>
                  )}
                </div>

                {!loading ? (
                  <button
                    disabled={loading}
                    type="submit"
                    className="btn custom-btn-block"
                  >
                    {!loading ? 'Signup' : 'Loading...'}
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      width: '100%',
                    }}
                  >
                    <ScaleLoader
                      size={150}
                      color={'#18A0FB'}
                      loading={loading}
                    />
                  </div>
                )}
              </form>

              <div className="text-center mt-3">
                <span>Already have an account? </span>
                <Link to="/login">Login</Link>
              </div>

              {!providerLoading ? (
                <div className="alternative-login mt-3">
                  <button
                    className="btn btn-light mr-2"
                    onClick={handleGoogleSignIn}
                  >
                    <GoogleLogo width={20} height={20} />
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    width: '100%',
                  }}
                >
                  <ScaleLoader
                    size={50}
                    color={'#18A0FB'}
                    loading={providerLoading}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
