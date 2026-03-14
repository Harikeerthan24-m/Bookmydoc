import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { sendPasswordResetEmailRequest } from '../../store/slices/auth.slice';
import { unwrapResult } from '@reduxjs/toolkit';
import loginBackground from '../../assets/images/doc_image.jpg';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1); // 1: Enter email, 2: Success
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    setEmailError('');

    try {
      setLoading(true);
      const response = await dispatch(sendPasswordResetEmailRequest({ email }));
      unwrapResult(response);
      setStep(2);
    } catch (err) {
      toast.error(
        err?.message || 'Failed to send reset email. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <ToastContainer />
      <div className="container-fluid">
        <div className="row no-gutters">
          <div className="col-lg-6 d-none d-lg-flex login-image-container">
            <div
              className="login-image"
              style={{ backgroundImage: `url(${loginBackground})` }}
            ></div>
          </div>
          <div className="col-lg-6 d-flex align-items-center justify-content-center">
            <div className="card shadow-sm" style={{ width: '80%' }}>
              <div className="card-body p-4">
                {step === 1 ? (
                  <>
                    <h3 className="card-title text-center mb-1">
                      Forgot Password
                    </h3>
                    <p
                      className="text-center text-muted mb-4"
                      style={{ fontSize: '0.9rem' }}
                    >
                      Enter your email and we'll send you a reset link.
                    </p>
                    <form onSubmit={handleSubmit}>
                      <div className="form-group mb-3">
                        <label htmlFor="email">Email address</label>
                        <input
                          type="email"
                          className={`form-control ${emailError ? 'is-invalid' : ''}`}
                          id="email"
                          name="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                        />
                        {emailError && (
                          <small className="text-danger">{emailError}</small>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary w-100 mb-3"
                        disabled={loading}
                      >
                        {loading ? 'Sending...' : 'Send Reset Email'}
                      </button>
                      <div className="text-center">
                        <Link to="/login" className="signup-link">
                          Back to Login
                        </Link>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-3">
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: '#e8f5e9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        fontSize: 32,
                      }}
                    >
                      ✓
                    </div>
                    <h4 className="mb-2">Check your email</h4>
                    <p className="text-muted mb-4">
                      We've sent a password reset link to{' '}
                      <strong>{email}</strong>. Click the link in the email to
                      reset your password.
                    </p>
                    <p
                      className="text-muted mb-4"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Didn't receive it? Check your spam folder or{' '}
                      <button
                        className="btn btn-link p-0"
                        style={{ fontSize: '0.85rem' }}
                        onClick={() => setStep(1)}
                      >
                        try again
                      </button>
                      .
                    </p>
                    <Link to="/login" className="btn btn-primary w-100">
                      Back to Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
