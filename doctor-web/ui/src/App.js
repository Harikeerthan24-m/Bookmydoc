import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ConsultationProvider } from './contexts/ConsultationContext';

import Logout from './components/Logout';
import LoginPage from './components/login/Login';
import Signup from './components/signup/Signup';
import ProtectedRoute from './lib/ProtectedRoute';
import ForgotPassword from './components/login/ForgotPassword';
import Verify from './components/Verify';
const Dashboard = React.lazy(() => import('./components/dashboard/dashboard'));
const Profile = React.lazy(() => import('./components/profile/Profile'));
const Availability = React.lazy(
  () => import('./components/availability/Availability'),
);
const Bookings = React.lazy(() => import('./components/bookings/Bookings'));
const Service = React.lazy(() => import('./components/services/Service'));
const NotificationsPage = React.lazy(
  () => import('./components/notifications/NotificationsPage'),
);

function App() {
  return (
    <ConsultationProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage> </LoginPage>} />
          <Route path="/signup" element={<Signup> </Signup>} />

          <Route
            path="/forgotPassword"
            element={<ForgotPassword> </ForgotPassword>}
          />

          <Route path="/verify" element={<Verify />} />
          <Route path="/" element={<Layout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/availability"
              element={
                <ProtectedRoute>
                  <Availability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <Service />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logout"
              element={<ProtectedRoute element={<Logout />} />}
            />
            <Route
              path="/"
              element={<ProtectedRoute element={<Dashboard />} />}
            />
          </Route>
        </Routes>
      </Router>
    </ConsultationProvider>
  );
}

export default App;
