import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const GuestRoute = ({ element }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? <Navigate to="/profile" replace /> : element;
};

export default GuestRoute;
