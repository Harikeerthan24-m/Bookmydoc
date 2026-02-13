import React, { useState } from 'react';
import { Container, Card, Button, Badge, Alert } from 'react-bootstrap';
import { NotificationsSlice } from '../../store/slices/notifications.slice';
import { useUpdateBookingMutation } from '../../store/slices';
import Loading from '../common/Loading';
import './NotificationsPage.css';

// Helper function to extract booking ID from notification
const extractBookingId = (notification) => {
  // Try multiple sources for booking ID
  return (
    notification.context?.booking_id ||
    notification.booking_id ||
    notification.data?.booking_id ||
    notification.context?.bookingId ||
    notification.bookingId ||
    null
  );
};

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [loadingNotifications, setLoadingNotifications] = useState(new Set());

  // Get notifications data
  const { data: notifications, isLoading: notificationsLoading } =
    NotificationsSlice.useGetNotificationsQuery();
  const [markAsRead] = NotificationsSlice.useMarkAsReadMutation();
  const [markAllAsRead] = NotificationsSlice.useMarkAllAsReadMutation();
  const [updateBooking] = useUpdateBookingMutation();

  // Filter notifications
  const allNotifications = notifications || [];
  const unreadNotifications = allNotifications.filter((n) => !n.read);

  // Check for reschedule requests - look for multiple indicators
  const rescheduleRequests = allNotifications.filter((n) => {
    // Debug: Log notification structure
    console.log('Notification structure:', n);

    const notificationText = (
      typeof n.notification === 'string'
        ? n.notification
        : n.notification?.body || ''
    ).toLowerCase();

    // Check if it's a reschedule request notification
    const isReschedule =
      n.context?.actions?.includes('approve_reschedule') ||
      notificationText.includes('reschedule') ||
      notificationText.includes('rescheduled') ||
      n.type === 'reschedule_request';

    console.log(
      'Is reschedule notification:',
      isReschedule,
      'Text:',
      notificationText,
    );
    return isReschedule;
  });

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return unreadNotifications;
      case 'reschedule':
        return rescheduleRequests;
      default:
        return allNotifications;
    }
  };

  // Handle reschedule approval
  const handleApproveReschedule = async (bookingId, notificationId) => {
    console.log('🟢 APPROVE CLICKED:', { bookingId, notificationId });
    try {
      // Add to loading set
      setLoadingNotifications((prev) => new Set(prev).add(notificationId));

      console.log('🚀 Sending approve request:', {
        bookingId,
        data: { approve_reschedule: true },
      });

      const result = await updateBooking({
        id: bookingId,
        data: {
          approve_reschedule: true,
        },
      }).unwrap();

      console.log('✅ Approve response:', result);

      // Mark notification as read
      await markAsRead(notificationId);

      // Show success message
      alert('Reschedule request approved successfully!');
    } catch (error) {
      console.error('Error approving reschedule:', error);
      alert('Error approving reschedule request. Please try again.');
    } finally {
      // Remove from loading set
      setLoadingNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Handle reschedule rejection
  const handleRejectReschedule = async (bookingId, notificationId) => {
    console.log('🔴 REJECT CLICKED:', { bookingId, notificationId });
    try {
      // Add to loading set
      setLoadingNotifications((prev) => new Set(prev).add(notificationId));

      console.log('🚀 Sending reject request:', {
        bookingId,
        data: {
          reject_reschedule: true,
          rejection_reason: 'Not available at requested time',
        },
      });

      const result = await updateBooking({
        id: bookingId,
        data: {
          reject_reschedule: true,
          rejection_reason: 'Not available at requested time',
        },
      }).unwrap();

      console.log('✅ Reject response:', result);

      // Mark notification as read
      await markAsRead(notificationId);

      // Show success message
      alert('Reschedule request rejected successfully!');
    } catch (error) {
      console.error('Error rejecting reschedule:', error);
      alert('Error rejecting reschedule request. Please try again.');
    } finally {
      // Remove from loading set
      setLoadingNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_created':
        return '📅';
      case 'booking_updated':
        return '🔄';
      default:
        return '🔔';
    }
  };

  if (notificationsLoading) {
    return (
      <Container className="mt-4">
        <Loading type="overlay" text="Loading notifications..." />
      </Container>
    );
  }

  return (
    <Container fluid className="notifications-page">
      <div className="notifications-header">
        <h2>Notifications</h2>
        <div className="header-actions">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={unreadNotifications.length === 0}
          >
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="notifications-tabs">
        <Button
          variant={activeTab === 'all' ? 'primary' : 'outline-primary'}
          onClick={() => setActiveTab('all')}
          className="tab-button"
        >
          All ({allNotifications.length})
        </Button>
        <Button
          variant={activeTab === 'unread' ? 'primary' : 'outline-primary'}
          onClick={() => setActiveTab('unread')}
          className="tab-button"
        >
          Unread ({unreadNotifications.length})
        </Button>
        <Button
          variant={activeTab === 'reschedule' ? 'primary' : 'outline-primary'}
          onClick={() => setActiveTab('reschedule')}
          className="tab-button"
        >
          Reschedule Requests ({rescheduleRequests.length})
        </Button>
      </div>

      {/* Notifications List */}
      <div className="notifications-content">
        {getFilteredNotifications().length === 0 ? (
          <Card className="text-center py-5">
            <Card.Body>
              <h5>No notifications found</h5>
              <p className="text-muted">
                {activeTab === 'reschedule'
                  ? 'No reschedule requests at the moment.'
                  : "You're all caught up!"}
              </p>
            </Card.Body>
          </Card>
        ) : (
          getFilteredNotifications().map((notification) => (
            <Card
              key={notification.id}
              className={`notification-card ${!notification.read ? 'unread' : ''}`}
            >
              <Card.Body>
                <div className="notification-item">
                  <div className="notification-icon-large">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="notification-content-full">
                    <div className="notification-header">
                      <h6 className="notification-title">
                        {notification.notification?.title || 'Notification'}
                        {!notification.read && (
                          <Badge bg="primary" className="ms-2">
                            New
                          </Badge>
                        )}
                      </h6>
                      <span className="notification-time">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>

                    <p className="notification-text">
                      {typeof notification.notification === 'string'
                        ? notification.notification
                        : notification.notification?.body ||
                          notification.title ||
                          'No message'}
                    </p>

                    {/* Reschedule Request Actions */}
                    {(() => {
                      const isRescheduleRequest =
                        notification.context?.actions?.includes(
                          'approve_reschedule',
                        ) || notification.type === 'reschedule_request';

                      const bookingId = extractBookingId(notification);

                      // Don't show buttons if notification is already read (means it was processed)
                      const isPending = !notification.read;

                      // Show buttons only if it's a reschedule request, has booking ID, and is still pending
                      return isRescheduleRequest && bookingId && isPending;
                    })() && (
                      <div className="reschedule-actions">
                        <Alert variant="info" className="mb-3">
                          <strong>Reschedule Request</strong>
                          <br />
                          Patient has requested to reschedule their appointment.
                          Please approve or reject this request.
                        </Alert>

                        <div className="action-buttons">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                              const bookingId = extractBookingId(notification);
                              if (!bookingId) {
                                alert(
                                  'Error: Booking ID not found. Cannot process request.',
                                );
                                return;
                              }
                              // Approving reschedule
                              handleApproveReschedule(
                                bookingId,
                                notification.id,
                              );
                            }}
                            disabled={loadingNotifications.has(notification.id)}
                            className="me-2"
                          >
                            {loadingNotifications.has(notification.id)
                              ? 'Approving...'
                              : '✓ Approve Reschedule'}
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              const bookingId = extractBookingId(notification);
                              if (!bookingId) {
                                alert(
                                  'Error: Booking ID not found. Cannot process request.',
                                );
                                return;
                              }
                              // Rejecting reschedule
                              handleRejectReschedule(
                                bookingId,
                                notification.id,
                              );
                            }}
                            disabled={loadingNotifications.has(notification.id)}
                          >
                            {loadingNotifications.has(notification.id)
                              ? 'Rejecting...'
                              : '✗ Reject Reschedule'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Mark as Read Button */}
                    {!notification.read &&
                      !notification.context?.actions?.includes(
                        'approve_reschedule',
                      ) && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="mt-2"
                        >
                          Mark as Read
                        </Button>
                      )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))
        )}
      </div>
    </Container>
  );
};

export default NotificationsPage;
