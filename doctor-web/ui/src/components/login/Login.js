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

  const [formValidation, setFormValidation] = useState({
    errors: {},
    message: '',
    loading: false,
    valid: true,
  });

  const [role] = useState('doctor');

  // REDUX ACTIONS EFFECTS WITH LOGIN USER..
  useEffect(() => {
    if (!isAuthenticated && !loading && error?.message) {
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
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    onChange={(e) => handleChange('password', e)}
                  />
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
                    className="btn custom-btn-block"
                  >
                    {!loading ? 'Login' : 'Loading...'}
                  </button>
                ) : (
                  <Loading type="inline" size="default" />
                )}
              </form>
              <div className="signup-option mt-3">
                <span>
                  Don't have an account?? <Link to="/Signup">Signup</Link>
                </span>
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
