import React, { useEffect, useState } from 'react';
import { Container, Nav, Tab, Card } from 'react-bootstrap';
import './Bookings.css';
import { ToastContainer } from 'react-toastify';
import BookingCard from './BookingCard';
import Loading from './../common/Loading';
import { useGetBookingsQuery } from './../../store/slices';

const Bookings = () => {
  const [key, setKey] = useState('all');
  const [bookings, setBookings] = useState({
    all: [],
    upcoming: [],
    completed: [],
    canceled: [],
    rescheduleRequests: [],
  });
  const { data, isLoading, isFetching } = useGetBookingsQuery({});

  useEffect(() => {
    if (data) {
      const upcoming = data.filter((item) =>
        ['confirmed', 'reschedule_pending'].includes(item?.status),
      );
      const completed = data.filter((item) => item?.status === 'completed');
      const canceled = data.filter((item) => item?.status === 'canceled');
      const rescheduleRequests = data.filter(
        (item) => item?.status === 'reschedule_pending',
      );
      setBookings({
        all: data,
        upcoming,
        completed,
        canceled,
        rescheduleRequests,
      });
    }
  }, [data]);

  const tabData = [
    {
      key: 'all',
      label: 'All',
      count: bookings?.all?.length || 0,
      data: bookings?.all,
    },
    {
      key: 'upcoming',
      label: 'Upcoming',
      count: bookings?.upcoming?.length || 0,
      data: bookings?.upcoming,
    },
    {
      key: 'past',
      label: 'Completed',
      count: bookings?.completed?.length || 0,
      data: bookings?.completed,
    },
    {
      key: 'canceled',
      label: 'Canceled',
      count: bookings?.canceled?.length || 0,
      data: bookings?.canceled,
    },
    {
      key: 'rescheduleRequests',
      label: 'Reschedule Requests',
      count: bookings?.rescheduleRequests?.length || 0,
      data: bookings?.rescheduleRequests,
    },
  ];

  return (
    <div id="booking" className="bookings-container">
      <Container fluid className="bookings-wrapper">
        <ToastContainer />
        {(isLoading || isFetching) && (
          <Loading type="overlay" text="Loading Appointments..." />
        )}

        {/* Main Content */}
        <div className="bookings-content">
          <Tab.Container
            id="bookings-tabs"
            activeKey={key}
            onSelect={(k) => setKey(k)}
          >
            {/* Navigation Tabs */}
            <div className="tabs-wrapper">
              <Nav variant="pills" className="bookings-nav">
                {tabData.map((tab) => (
                  <Nav.Item key={tab.key} className="nav-item-custom">
                    <Nav.Link eventKey={tab.key} className="nav-link-custom">
                      <div className="tab-content">
                        <span className="tab-label">{tab.label}</span>
                        <span className="tab-count">{tab.count}</span>
                      </div>
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </div>

            {/* Tab Content */}
            <div className="tab-content-wrapper">
              <Tab.Content>
                {tabData.map((tab) => (
                  <Tab.Pane key={tab.key} eventKey={tab.key}>
                    <div className="bookings-section">
                      {/* <div className="section-header">
                        <h3 className="section-title">{tab.label}</h3>
                      </div> */}
                      <div className="bookings-grid">
                        {tab.data && tab.data.length > 0 ? (
                          tab.data.map((booking) => (
                            <div
                              key={booking.booking_id}
                              className="booking-item"
                            >
                              <BookingCard booking={booking} />
                            </div>
                          ))
                        ) : (
                          <NoBookingsMessage title={tab.label.toLowerCase()} />
                        )}
                      </div>
                    </div>
                  </Tab.Pane>
                ))}
              </Tab.Content>
            </div>
          </Tab.Container>
        </div>
      </Container>
    </div>
  );
};

const NoBookingsMessage = ({ title }) => (
  <Card className="no-bookings-card">
    <Card.Body className="no-bookings-body">
      <div className="no-bookings-icon">📅</div>
      <Card.Title className="no-bookings-title">
        No appointments found
      </Card.Title>
      <Card.Text className="no-bookings-text">
        {title === 'all'
          ? 'Create your availability to start accepting bookings'
          : 'New appointments will appear here'}
      </Card.Text>
    </Card.Body>
  </Card>
);

export default Bookings;
