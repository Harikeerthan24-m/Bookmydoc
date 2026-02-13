import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useDispatch } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  sendPasswordResetEmailRequest,
  resetPassword,
} from '../../store/slices/auth.slice';
import { unwrapResult } from '@reduxjs/toolkit';
import loginBackground from '../../assets/images/doc_image.jpg';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1); // 1: Enter email, 2: Reset password
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formValidation, setFormValidation] = useState({
    errors: {},
    loading: false,
    valid: true,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleValidation = () => {
    const errors = {};
    let valid = true;

    if (step === 1 && !formData.email.trim()) {
      errors.email = 'Email is required';
      valid = false;
    }

    if (step === 2) {
      if (!formData.newPassword.trim()) {
        errors.newPassword = 'New password is required';
        valid = false;
      }
      if (!formData.confirmPassword.trim()) {
        errors.confirmPassword = 'Confirm password is required';
        valid = false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
        valid = false;
      }
    }

    return { valid, errors };
  };

  const notify = (message) => toast(message);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    try {
      setFormValidation({
        ...formValidation,
        errors: {},
        message: '',
        loading: true,
      });

      if (step === 1) {
        // Dispatch action to send password reset email
        const response = await dispatch(
          sendPasswordResetEmailRequest({ email: formData.email }),
        );
        unwrapResult(response);
        notify('Password reset email sent successfully');
        setStep(2); // Move to the next step
      } else {
        // Dispatch action to reset password
        const response = await dispatch(
          resetPassword({ newPassword: formData.newPassword }),
        );
        unwrapResult(response);
        notify('Password reset successfully');
        setFormData({
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      console.error('Password reset failed:', err);
      setFormValidation({
        ...formValidation,
        loading: false,
        errors: { submit: 'Password reset failed' },
      });
    } finally {
      setFormValidation({
        ...formValidation,
        loading: false,
      });
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
              <div className="card-body">
                <h3 className="card-title text-center">
                  {step === 1
                    ? 'Forgot Password'
                    : 'Please check your email address.'}
                </h3>
                <form onSubmit={handleSubmit}>
                  {step === 1 && (
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                      {formValidation.errors.email && (
                        <small className="text-danger">
                          {formValidation.errors.email}
                        </small>
                      )}
                    </div>
                  )}
                  {formValidation.errors.submit && (
                    <div className="alert alert-danger" role="alert">
                      {formValidation.errors.submit}
                    </div>
                  )}
                  <button
                    disabled={formValidation.loading || step === 2}
                    type="submit"
                    className="btn btn-primary w-100"
                  >
                    {formValidation.loading
                      ? 'Loading...'
                      : step === 1
                        ? 'Send Reset Email'
                        : 'Reset Email Sent'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
