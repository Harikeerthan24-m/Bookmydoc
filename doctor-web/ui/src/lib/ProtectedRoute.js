import React, { useCallback, useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { authChecker } from '../store/slices/auth.slice';
import { auth } from './../firebaseConfig';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const refreshToken = useCallback(
    (isAuthenticated) => {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }

      auth.onAuthStateChanged(async (user) => {
        if (user) {
          const expirationTime = user.stsTokenManager.expirationTime;
          const currentTime = new Date().getTime() + 1000 * 60 * 5;

          if (currentTime >= expirationTime) {
            user
              .getIdTokenResult(true) // Force refresh token
              .then((refreshUser) => {
                // Handle your refreshed token
                localStorage.setItem('accessToken', refreshUser?.token);
              })
              .catch((error) => {
                console.error('Error refreshing token: ', error);
              });
          }
        } else {
          localStorage.removeItem('accessToken');
          navigate('/login', { replace: true });
        }
      });
    },
    [navigate],
  );

  useEffect(() => {
    dispatch(authChecker());
  }, [dispatch]);

  useEffect(() => {
    refreshToken(isAuthenticated);
  }, [isAuthenticated, refreshToken]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
