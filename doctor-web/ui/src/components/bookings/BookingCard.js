import React, { useState } from 'react';
import { Card, Button, Row, Col, Badge } from 'react-bootstrap';
import './Bookings.css';
import { CURRENCY_SYMBOL } from './../../types/const';
import ConfirmModal from '../common/ConfirmModal';
import Loading from './../common/Loading';
import Reschedule from './Reschedule';
import { useUpdateBookingMutation } from './../../store/slices';
import { formatTime, isExpireDate, formatDate } from './../../lib/utils';

const BookingCard = ({ booking }) => {
  const [updateBooking, updateBookingResult] = useUpdateBookingMutation();
  const [confirmModal, setConfirmModal] = useState({
    title: '',
    open: false,
    action: '',
  });

  const handleBooking = (status, additionalData = {}) => {
    const payload = {
      id: booking?.booking_id,
      data: {
        status,
        ...additionalData,
      },
    };
    updateBooking(payload);
    setConfirmModal((state) => ({ ...state, open: false }));
  };

  const RenderActions = () => {
    let buttonAction = null;
    switch (booking?.status) {
      case 'confirmed':
        const isDatePassed = isExpireDate(booking?.date);
        if (isDatePassed) {
          buttonAction = (
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => handleBooking('completed')}
            >
              {updateBookingResult?.isLoading &&
              confirmModal?.action === 'completed' ? (
                <Loading type="inline" size="small" text="Completing..." />
              ) : (
                'Complete'
              )}
            </Button>
          );
        }
        break;
      case 'canceled':
        buttonAction = (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleBooking('pending')}
          >
            {updateBookingResult?.isLoading &&
            confirmModal?.action === 'pending' ? (
              <Loading type="inline" size="small" text="Resuming..." />
            ) : (
              'Resume'
            )}
          </Button>
        );
        break;
      default:
        buttonAction = null;
    }
    return buttonAction || <></>;
  };

  return (
    <Card className="mb-3" style={{ width: '100%' }}>
      {confirmModal?.action === 'reschedule' ? (
        <Reschedule booking={booking}></Reschedule>
      ) : (
        <ConfirmModal
          {...confirmModal}
          onClose={() => setConfirmModal({ open: false })}
        >
          {confirmModal?.children}
        </ConfirmModal>
      )}

      <Card.Body>
        <Row>
          <Col xs={8}>
            <Card.Title className="card-title">
              {booking?.customer.user_name}
            </Card.Title>
            <Card.Text className="card-text">
              {formatDate(booking.date)},{' '}
              {formatTime(booking?.slot?.start_time)} -{' '}
              {formatTime(booking?.slot?.end_time)}
            </Card.Text>
            <Card.Text className="card-text">
              {booking?.service?.name} - {CURRENCY_SYMBOL}{' '}
              {booking?.service?.price || booking?.service?.price_amount}
              <br />
              Payment: <Badge>{booking?.payment?.status}</Badge>
            </Card.Text>
          </Col>
          <Col
            xs={4}
            className="text-right d-flex flex-column align-items-end gap-2"
          >
            <div className="d-flex gap-2">
              {booking?.status === 'reschedule_pending' && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() =>
                      setConfirmModal({
                        open: true,
                        title: 'Approve Reschedule Request',
                        confirmButton: 'Yes, Approve',
                        children: `Patient has requested to reschedule to ${new Date(
                          booking?.reschedule_request?.requested_date,
                        ).toLocaleDateString()}. Do you want to approve this request?`,
                        onConfirm: () => {
                          handleBooking('approved', {
                            approve_reschedule: true,
                          });
                          setConfirmModal({ open: false });
                        },
                      })
                    }
                  >
                    {updateBookingResult?.isLoading &&
                    confirmModal?.action === 'approve' ? (
                      <Loading type="inline" size="small" text="Approving..." />
                    ) : (
                      'Approve Reschedule'
                    )}
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() =>
                      setConfirmModal({
                        open: true,
                        title: 'Reject Reschedule Request',
                        confirmButton: 'Yes, Reject',
                        children:
                          'Are you sure you want to reject this reschedule request?',
                        onConfirm: () => {
                          handleBooking('rejected', {
                            reject_reschedule: true,
                            rejection_reason: 'Not available at requested time',
                          });
                          setConfirmModal({ open: false });
                        },
                      })
                    }
                  >
                    {updateBookingResult?.isLoading &&
                    confirmModal?.action === 'reject' ? (
                      <Loading type="inline" size="small" text="Rejecting..." />
                    ) : (
                      'Reject Reschedule'
                    )}
                  </Button>
                </>
              )}
              {['pending', 'confirmed'].includes(booking?.status) && (
                <>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() =>
                      setConfirmModal({
                        open: true,
                        title: 'Reschedule Booking',
                        confirmButton: 'Yes, Reschedule',
                        children:
                          'Are you sure want to reschedule this booking?',
                        onConfirm: () =>
                          setConfirmModal({
                            open: false,
                            action: 'reschedule',
                          }),
                      })
                    }
                  >
                    {updateBookingResult?.isLoading &&
                    confirmModal?.action === 'reschedule' ? (
                      <Loading
                        type="inline"
                        size="small"
                        text="Rescheduling..."
                      />
                    ) : (
                      'Reschedule'
                    )}
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleBooking('canceled')}
                  >
                    {updateBookingResult?.isLoading &&
                    confirmModal?.action === 'canceled' ? (
                      <Loading type="inline" size="small" text="Canceling..." />
                    ) : (
                      'Cancel'
                    )}
                  </Button>
                </>
              )}
            </div>
            <RenderActions />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default BookingCard;
