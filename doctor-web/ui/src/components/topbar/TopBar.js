import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './TopBar.css';
import { useDispatch, useSelector } from 'react-redux';
import { unwrapResult } from '@reduxjs/toolkit';
import { useNavigate } from 'react-router-dom';
import { authLogout, fetchUserProfile } from '../../store/slices/auth.slice';
import { NotificationsSlice } from '../../store/slices/notifications.slice';
import { useUpdateBookingMutation } from '../../store/slices';
import Loading from '../common/Loading';

const TopBar = () => {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const isAuthenticated = localStorage.getItem('accessToken');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get user data from Redux store
  const { user, loading } = useSelector((state) => state.auth);

  // Get notifications data - only fetch if user is authenticated
  const { data: notifications, isLoading: notificationsLoading } =
    NotificationsSlice.useGetNotificationsQuery(
      undefined, // no parameters needed, backend gets user ID from JWT token
      { skip: !isAuthenticated || !user?.uid }, // skip if not authenticated or no user ID
    );
  const [markAsRead] = NotificationsSlice.useMarkAsReadMutation();
  const [markAllAsRead] = NotificationsSlice.useMarkAllAsReadMutation();
  const [updateBooking, { isLoading: isUpdatingBooking }] =
    useUpdateBookingMutation();

  const unreadCount = notifications?.filter((n) => !n.read)?.length || 0;

  // Handle reschedule approval
  const handleApproveReschedule = async (bookingId, e) => {
    e.stopPropagation(); // Prevent notification click
    try {
      await updateBooking({
        id: bookingId,
        data: {
          approve_reschedule: true,
        },
      }).unwrap();
      // Refresh notifications
      dispatch(NotificationsSlice.util.invalidateTags(['Notifications']));
    } catch (error) {
      console.error('Error approving reschedule:', error);
    }
  };

  // Handle reschedule rejection
  const handleRejectReschedule = async (bookingId, e) => {
    e.stopPropagation(); // Prevent notification click
    try {
      await updateBooking({
        id: bookingId,
        data: {
          reject_reschedule: true,
          rejection_reason: 'Not available at requested time',
        },
      }).unwrap();
      // Refresh notifications
      dispatch(NotificationsSlice.util.invalidateTags(['Notifications']));
    } catch (error) {
      console.error('Error rejecting reschedule:', error);
    }
  };

  // Handle click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Fetch user profile when component mounts if authenticated and user data not available
  useEffect(() => {
    if (isAuthenticated && !user && !loading) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated, user, loading]);

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      unwrapResult(await dispatch(authLogout()));
      navigate('/login');
    }
  };

  // Map routes to display names
  const getPageTitle = (pathname) => {
    const routes = {
      '/': 'Dashboard',
      '/availability': 'Availability',
      '/bookings': 'Appointments',
      '/profile': 'Profile',
      '/login': 'Login',
      '/signup': 'Sign Up',
    };

    return routes[pathname] || 'Dashboard';
  };

  // Get user display information with fallbacks
  const getUserDisplayInfo = () => {
    if (user) {
      return {
        name: user.user_name || user.name || 'Dr. User', // Try user_name first, fall back to name
        role: user.title || 'Doctor',
        photo: user.photoUrl || '/avatar-default.svg',
      };
    }
    return {
      name: 'Dr. User',
      role: 'Doctor',
      photo: '/avatar-default.svg',
    };
  };

  const userInfo = getUserDisplayInfo();

  return (
    <div className="topbar">
      {/* Left Section - Current Page */}
      <div className="topbar-left">
        <div className="page-info">
          <div className="page-details">
            <h1 className="page-title">{getPageTitle(location.pathname)}</h1>
            <p className="page-subtitle">
              Manage your {getPageTitle(location.pathname).toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - User Profile & Actions */}
      <div className="topbar-right">
        {isAuthenticated ? (
          <div className="user-section">
            {/* Notifications */}
            <div className="notification-container">
              <button
                className="action-btn notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.89 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
                    fill="currentColor"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    <button
                      className="mark-all-read"
                      onClick={() => markAllAsRead()}
                      disabled={notificationsLoading || !unreadCount}
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="notifications-list">
                    {notificationsLoading ? (
                      <div className="notification-loading">
                        <Loading
                          type="inline"
                          size="small"
                          text="Loading notifications..."
                        />
                      </div>
                    ) : notifications?.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`notification-item ${!notification.read ? 'unread' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="notification-icon">
                            {notification.type === 'booking_created' && (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7-.25c.22 0 .41.1.55.25.12.13.2.31.2.5 0 .41-.34.75-.75.75s-.75-.34-.75-.75c0-.19.08-.37.2-.5.14-.15.33-.25.55-.25zM19 19H5V5h14v14z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M12 6c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-6 6h12v2H6z"
                                  fill="currentColor"
                                />
                              </svg>
                            )}
                            {notification.type === 'booking_updated' && (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"
                                  fill="currentColor"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="notification-content">
                            <p className="notification-text">
                              {typeof notification.notification === 'string'
                                ? notification.notification
                                : notification.notification?.body ||
                                  notification.notification?.title ||
                                  notification.title ||
                                  'Notification'}
                            </p>

                            {/* Show approve/reject buttons for reschedule requests */}
                            {notification.context?.booking_id &&
                              notification.context?.actions?.includes(
                                'approve_reschedule',
                              ) && (
                                <div className="notification-actions">
                                  <button
                                    className="notification-btn approve-btn"
                                    onClick={(e) =>
                                      handleApproveReschedule(
                                        notification.context.booking_id,
                                        e,
                                      )
                                    }
                                    disabled={isUpdatingBooking}
                                  >
                                    {isUpdatingBooking
                                      ? 'Approving...'
                                      : 'Approve'}
                                  </button>
                                  <button
                                    className="notification-btn reject-btn"
                                    onClick={(e) =>
                                      handleRejectReschedule(
                                        notification.context.booking_id,
                                        e,
                                      )
                                    }
                                    disabled={isUpdatingBooking}
                                  >
                                    {isUpdatingBooking
                                      ? 'Rejecting...'
                                      : 'Reject'}
                                  </button>
                                </div>
                              )}

                            <span className="notification-time">
                              {new Date(
                                notification.createdAt,
                              ).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-notifications">
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                  <div className="notifications-footer">
                    <button
                      className="view-all"
                      onClick={() => {
                        navigate('/notifications');
                        setShowNotifications(false);
                      }}
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            {/* <button className="action-btn settings-btn">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
                  fill="currentColor"
                />
              </svg>
            </button> */}

            {/* User Profile Dropdown */}
            <div className="user-profile-section">
              <div className="user-profile">
                <div className="user-avatar">
                  {userInfo.photo &&
                  userInfo.photo !== '/avatar-default.svg' ? (
                    <img
                      src={userInfo.photo}
                      alt="Profile"
                      className="profile-avatar-image"
                      onError={(e) => {
                        // Fallback to SVG icon if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      display:
                        userInfo.photo &&
                        userInfo.photo !== '/avatar-default.svg'
                          ? 'none'
                          : 'block',
                    }}
                  >
                    <path
                      d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="user-info">
                  <div className="user-name">{userInfo.name}</div>
                  <div className="user-role">{userInfo.role}</div>
                </div>
                <div className="dropdown-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M7 10L12 15L17 10H7Z" fill="currentColor" />
                  </svg>
                </div>
              </div>

              {/* Dropdown Menu */}
              <div className="user-dropdown">
                {/* <div className="dropdown-item">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>My Profile</span>
                </div> */}
                {/* <div className="dropdown-item">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Settings</span>
                </div> */}
                {/* <div className="dropdown-divider"></div> */}
                <button
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="auth-buttons">
            <button
              className="auth-btn login-btn"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button
              className="auth-btn signup-btn"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
