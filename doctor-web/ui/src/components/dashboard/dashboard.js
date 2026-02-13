import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useGetBookingsQuery } from '../../store/slices/bookings.slice';
import { useGetAvailabilitySlotsQuery } from '../../store/slices/availability.slice';
import { fetchUserProfile } from '../../store/slices/auth.slice';
import { formatDate } from '../../lib/utils';

import Loading from '../common/Loading';
import './dashboard.css';

const Dashboard = () => {
  const dispatch = useDispatch();
  const {
    user,
    isAuthenticated,
    loading: authLoading,
  } = useSelector((state) => state.auth);

  // Fetch user profile on component mount
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated, user]);

  // Fetch bookings data
  const { data: bookingsData, isLoading: bookingsLoading } =
    useGetBookingsQuery({
      doctor_id: user?.uid,
      order_by: 'desc',
    });

  // Fetch availability slots
  const { data: availabilityData, isLoading: availabilityLoading } =
    useGetAvailabilitySlotsQuery({});

  const bookings = bookingsData || [];
  const availabilitySlots = availabilityData || [];

  // Calculate dashboard statistics
  const calculateStats = () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= startOfDay && bookingDate <= endOfDay;
    });

    const confirmedBookings = bookings.filter(
      (booking) => booking.status === 'confirmed',
    );

    const remainingBookings = bookings.filter(
      (booking) => booking.status === 'confirmed',
    );

    return {
      totalBookings: bookings.length,
      todayBookings: todayBookings.length,
      confirmedBookings: confirmedBookings.length,
      remainingBookings: remainingBookings.length,
      availableSlots: availabilitySlots.length,
    };
  };

  const stats = calculateStats();

  // Get recent bookings (last 5)
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Get upcoming appointments
  const upcomingAppointments = [...bookings]
    .filter((booking) => {
      const now = new Date();
      const appointmentDate = new Date(booking.date);
      // Include today's appointments that haven't passed yet
      if (appointmentDate.toDateString() === now.toDateString()) {
        return true; // Show all of today's appointments
      }
      // For future dates, show confirmed appointments
      return appointmentDate > now && booking.status === 'confirmed';
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return '';
      }
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (err) {
      console.error('Error formatting time:', err);
      return '';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'badge-success';

      case 'completed':
        return 'badge-info';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  if (!isAuthenticated) {
    return <div>Please log in to view the dashboard</div>;
  }

  if (bookingsLoading || availabilityLoading || authLoading) {
    return <Loading type="fullscreen" text="Loading dashboard..." />;
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1>
            Welcome back, Dr. {user?.user_name || user?.firstName || 'Doctor'}!
          </h1>
          <p className="welcome-subtitle">
            Here's what's happening with your practice today
          </p>
        </div>
        <div className="welcome-date">
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-success">
          <div className="stat-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalBookings}</h3>
            <p>Total Bookings</p>
          </div>
        </div>

        <div className="stat-card stat-card-primary">
          <div className="stat-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.todayBookings}</h3>
            <p>Today's Appointments</p>
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.remainingBookings}</h3>
            <p>Remaining</p>
          </div>
        </div>
        {/* 
        <div className="stat-card stat-card-info">
          <div className="stat-icon">
            <i className="fas fa-calendar-plus"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.availableSlots}</h3>
            <p>Available Slots</p>
          </div>
        </div> */}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Upcoming Appointments */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Upcoming Appointments</h3>
            <span className="card-count">{upcomingAppointments.length}</span>
          </div>
          <div className="card-content">
            {upcomingAppointments.length > 0 ? (
              <div className="appointments-list">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="appointment-item">
                    <div className="appointment-time">
                      <span className="time">
                        {formatTime(appointment.date)}
                      </span>
                      <span className="date">
                        {formatDate(appointment.date)}
                      </span>
                    </div>
                    <div className="appointment-details">
                      <h4>{appointment.customer?.user_name || 'Patient'}</h4>
                      <p>
                        {appointment.service?.name || 'General Consultation'}
                      </p>
                    </div>
                    <div className="appointment-status">
                      <span
                        className={`status-badge ${getStatusBadgeClass(appointment.status)}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-calendar-times"></i>
                <p>No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Bookings</h3>
            <span className="card-count">{recentBookings.length}</span>
          </div>
          <div className="card-content">
            {recentBookings.length > 0 ? (
              <div className="bookings-list">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-info">
                      <h4>{booking.customer?.user_name || 'Patient'}</h4>
                      <p>
                        {formatDate(booking.date)} at {formatTime(booking.date)}
                      </p>
                      <span className="booking-service">
                        {booking.service?.name || 'General Consultation'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>No recent bookings</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
