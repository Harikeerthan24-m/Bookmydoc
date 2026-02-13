import { unwrapResult } from '@reduxjs/toolkit';
import React, { useEffect, useState } from 'react';
import { sendVerifyEmail, verifyEmail } from '../store/slices/auth.slice';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import loginBackground from './../assets/images/doc_image.jpg';
import { ScaleLoader } from 'react-spinners';
import {
  ToastSuccessMessage,
  ToastErrorMessage,
} from './common/ToastMessageWrapper';

const Verify = () => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stateCode = searchParams.get('state');

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

  const fetchData = async () => {
    try {
      const response = unwrapResult(await dispatch(verifyEmail(stateCode)));
      if (response?.data?.statusCode !== 200) {
        setMessage(response?.data?.message ?? '');
        ToastErrorMessage({
          title: response?.data?.message,
          message: response?.data?.error?.message ?? '',
        });

        setTimeout(() => {
          navigate('/verify', { replace: true });
          setMessage('');
        }, 2000);
      }
      if (response?.data?.statusCode === 200) {
        ToastSuccessMessage({
          title: response?.data?.message,
        });
        // After 2 second we will navigate user to profile page..
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (_error) {
      ToastErrorMessage({
        title: 'Something wrong!',
        message: 'Please send verification email again.',
      });
      setMessage('Something wrong!. Please send verification email again.');
      setTimeout(() => {
        navigate('/verify', { replace: true });
        setMessage('');
      }, 2000);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }

    if (!isAuthenticated && error) {
      ToastErrorMessage({
        title: error?.message,
        message: error?.error?.message,
      });
    }

    if (isAuthenticated && (!loading || !providerLoading) && !error) {
      navigate('/profile');
    }

    if (!isAuthenticated && !error && stateCode) {
      fetchData();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [stateCode, error]);

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

    try {
      const response = unwrapResult(await dispatch(sendVerifyEmail(user)));
      if (response?.statusCode === 200) {
        setMessage(response?.message);
        ToastSuccessMessage({
          title: response?.message,
        });

        if (response?.data?.emailVerified) {
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      }
    } catch (_error) {}
  };

  if (stateCode) {
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
                <h1>Verifying Your Email</h1>
                <p style={{ fontWeight: 'bold' }}>
                  {message
                    ? message
                    : 'We are verifying your email, please wait.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <h1>Verify Your Email</h1>
              <p style={{ fontWeight: 'bold' }}>
                {message
                  ? message
                  : 'Enter your credentials and we will send you a verification email.'}
              </p>
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

                {!loading ? (
                  <button
                    disabled={loading}
                    type="submit"
                    className="btn custom-btn-block"
                  >
                    {!loading ? 'Send Verify Email' : 'Loading...'}
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
              <div className="signup-option mt-3">
                <span>
                  Already Verified? <Link to="/login">Login</Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
