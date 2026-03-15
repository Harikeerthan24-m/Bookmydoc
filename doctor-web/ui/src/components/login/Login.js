import React, { useEffect, useState } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import loginBackground from '../../assets/images/doc_image.jpg';
import 'bootstrap/dist/css/bootstrap.min.css';
import { authLogin, authGoogleSignIn } from '../../store/slices/auth.slice';
import Loading from '../common/Loading';
import { ToastErrorMessage } from './../common/ToastMessageWrapper';
import GoogleLogo from '../common/GoogleLogo';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // STORES FOR LOGIN..
  const { isAuthenticated, loading, error, providerLoading } = useSelector(
    (state) => state.auth,
  );

  const [user, setUser] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const [formValidation, setFormValidation] = useState({
    errors: {},
    message: '',
    loading: false,
    valid: true,
  });

  const [role] = useState('doctor');

  // REDUX ACTIONS EFFECTS WITH LOGIN USER..
  useEffect(() => {
    const isTokenError = (error?.message || error?.error?.message || '')
      .toLowerCase()
      .includes('invalid token');
    if (!isAuthenticated && !loading && error?.message && !isTokenError) {
      // Handle role mismatch error specifically
      if (
        error?.error?.message?.includes(
          'Account Already Exists with Different Role',
        )
      ) {
        ToastErrorMessage({
          title: '⚠️ Account Role Mismatch',
          message: `${error.message}. ${error.suggestion || 'Please contact support to change your role.'}`,
          duration: 6000,
        });
      } else {
        ToastErrorMessage({
          title: error?.message,
          message: error?.error?.message,
        });
      }
    }

    if (isAuthenticated && (!loading || !providerLoading) && !error) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, loading, error, navigate, providerLoading]);

  // FRONTEND FORM VALIDATION..
  const handleValidation = () => {
    const errors = {};
    let valid = true;

    if (!user?.email?.trim()) {
      errors.email = 'Email is required';
      valid = false;
    }
    if (!user?.password?.trim()) {
      errors.password = 'Password is required';
      valid = false;
    }

    return { valid, errors };
  };

  const handleChange = (field, event) => {
    setUser({
      ...user,
      [field]: event.target.value,
    });
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

    dispatch(authLogin({ email: user?.email, password: user?.password, role }));
  };

  // HANDLE LOGIN WITH GOOGLE PROVIDER
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    try {
      dispatch(authGoogleSignIn({ role }));
    } catch (error) {
      ToastErrorMessage({
        title: 'Google sign-in failed',
        message: error?.message,
      });
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <div className="container-fluid">
        <div className="row no-gutters">
          <div className="col-lg-6 d-none d-lg-flex login-image-container">
            <div
              className="login-image"
              style={{ backgroundImage: `url(${loginBackground})` }}
            ></div>
          </div>
          <div className="col-lg-6 d-flex align-items-center justify-content-center">
            <div className="login-form">
              <ToastContainer />
              {error?.statusCode === 403 ? (
                <>
                  <h1>Email is not verify</h1>{' '}
                  <p>
                    Please verify your email address{' '}
                    <Link to="/verify">
                      <strong>here</strong>
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <h1>Welcome Back</h1>
                </>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="username">Email</label>
                  <input
                    type="text"
                    className="form-control"
                    id="email"
                    name="email"
                    onChange={(e) => handleChange('email', e)}
                  />
                  {formValidation?.errors?.email && (
                    <small className="text-danger">
                      {formValidation?.errors?.email}
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
                      onChange={(e) => handleChange('password', e)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((p) => !p)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                      )}
                    </button>
                  </div>
                  {formValidation?.errors?.password && (
                    <small className="text-danger">
                      {formValidation?.errors?.password}
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <Link to="/forgotPassword" className="forgot-password">
                    Forgot Password?
                  </Link>
                </div>
                {!loading ? (
                  <button
                    disabled={loading}
                    type="submit"
                    className="custom-btn-block"
                  >
                    {!loading ? 'Login' : 'Loading...'}
                  </button>
                ) : (
                  <Loading type="inline" size="default" />
                )}
              </form>
              <div className="signup-option">
                Don't have an account?
                <Link to="/Signup" className="signup-link">Sign up</Link>
              </div>

              {!providerLoading ? (
                <div className="alternative-login mt-3">
                  <button className="btn btn-light mr-2" onClick={handleGoogleSignIn}>
                    <GoogleLogo width={20} height={20} />
                  </button>
                </div>
              ) : (
                <Loading
                  type="inline"
                  size="small"
                  text="Connecting to Google..."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
