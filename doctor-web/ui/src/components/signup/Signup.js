import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Signup.css';
import signupBackground from '../../assets/images/doc_image.jpg';
import { useDispatch, useSelector } from 'react-redux';
import { authGoogleSignIn, authRegister } from '../../store/slices/auth.slice';
import { ToastErrorMessage } from './../common/ToastMessageWrapper';
import GoogleLogo from '../common/GoogleLogo';
import Loading from '../common/Loading';

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', email: '', password: '' });
  const [role] = useState('doctor');
  const [showPassword, setShowPassword] = useState(false);

  const { isAuthenticated, loading, error, providerLoading, isVerifyNeeded } =
    useSelector((state) => state.auth);

  const [formValidation, setFormValidation] = useState({
    errors: {},
    message: '',
    loading: false,
    valid: true,
  });

  useEffect(() => {
    const isTokenError = (error?.message || error?.error?.message || '')
      .toLowerCase()
      .includes('invalid token');
    if (!isAuthenticated && !loading && error?.message && !isTokenError) {
      let errorTitle = 'Registration Failed';
      let errorMessage = error?.error?.message || error?.message;

      if (error?.statusCode === 409) {
        if (errorMessage?.toLowerCase().includes('email already exists')) {
          errorTitle = 'Email Already Registered';
          errorMessage =
            'This email is already registered. Please try logging in instead or use a different email address.';
        } else if (errorMessage?.toLowerCase().includes('role')) {
          errorTitle = 'Account Role Mismatch';
          errorMessage = `${error.message}. ${error.suggestion || 'Please contact support to change your role.'}`;
        }
      } else if (error?.statusCode === 400) {
        if (errorMessage?.toLowerCase().includes('weak password')) {
          errorTitle = 'Weak Password';
          errorMessage =
            'Password is too weak. Please choose a stronger password with at least 6 characters.';
        } else if (errorMessage?.toLowerCase().includes('invalid role')) {
          errorTitle = 'Invalid Role';
          errorMessage =
            'The selected role is invalid. Please choose either Doctor or Customer.';
        }
      } else if (error?.statusCode === 401) {
        errorTitle = 'Authentication Failed';
        errorMessage =
          'Invalid credentials provided. Please check your information and try again.';
      } else if (error?.statusCode >= 500) {
        errorTitle = 'Server Error';
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
    setUser({ ...user, [field]: event.target.value });
    if (formValidation.errors[field]) {
      setFormValidation((prev) => ({
        ...prev,
        errors: { ...prev.errors, [field]: '' },
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { valid, errors } = handleValidation();
    if (!valid) {
      setFormValidation({ ...formValidation, errors, loading: false, valid });
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

  return (
    <div className="signup-container">
      <div className="container-fluid">
        <div className="row no-gutters">
          {/* ── Left: image panel ── */}
          <div className="col-lg-6 d-none d-lg-flex signup-image-container">
            <div
              className="signup-image"
              style={{ backgroundImage: `url(${signupBackground})` }}
            />
          </div>

          {/* ── Right: form panel ── */}
          <div className="col-lg-6 d-flex align-items-center justify-content-center">
            <div className="signup-form">
              <ToastContainer />
              <h1>Create Account</h1>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    placeholder="Dr. John Smith"
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
                    placeholder="you@example.com"
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
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      id="password"
                      name="password"
                      placeholder="Min. 6 characters"
                      onChange={(e) => handleChange('password', e)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((p) => !p)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="1"
                            y1="1"
                            x2="23"
                            y2="23"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formValidation.errors.password && (
                    <small className="text-danger">
                      {formValidation.errors.password}
                    </small>
                  )}
                  {!formValidation.errors.password && user.password && (
                    <small
                      className={
                        user.password.length >= 6
                          ? 'text-success'
                          : 'text-warning'
                      }
                    >
                      {user.password.length >= 6
                        ? 'Strong password'
                        : 'Too weak — min 6 characters'}
                    </small>
                  )}
                </div>

                {!loading ? (
                  <button
                    type="submit"
                    className="custom-btn-block"
                    disabled={loading}
                  >
                    Create Account
                  </button>
                ) : (
                  <Loading type="inline" size="default" />
                )}
              </form>

              <div className="signup-option">
                Already have an account?
                <Link to="/login" className="signup-link">
                  Log in
                </Link>
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
                <Loading type="inline" size="default" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
