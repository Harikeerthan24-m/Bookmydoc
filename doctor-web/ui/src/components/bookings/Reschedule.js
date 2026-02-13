import { useEffect, useState } from 'react';
import {
  useGetAvailabilitySlotsQuery,
  useUpdateBookingMutation,
} from './../../store/slices';
import { formatTime } from './../../lib/utils';
import { Modal, Form, Alert, Button } from 'react-bootstrap';
import Loading from './../common/Loading';

const TimeSlot = ({ slot, isSelected }) => {
  return (
    <Button
      variant={isSelected ? 'primary' : 'outline-secondary'}
      className="time-slot-button w-100"
    >
      <div className="d-flex align-items-center justify-content-center gap-2">
        <span>{formatTime(slot?.start_time)}</span>
        <span>-</span>
        <span>{formatTime(slot?.end_time)}</span>
      </div>
    </Button>
  );
};

const Reschedule = ({ booking }) => {
  const [show, setShow] = useState(true);
  const [validation, setValidation] = useState({ valid: true });
  const [formData, setFormData] = useState({
    booking_id: booking?.booking_id,
    date: booking?.date,
    slot_id: booking?.slot?.slot_id,
  });

  const { data, isLoading, isFetching } = useGetAvailabilitySlotsQuery({
    date: formData?.date,
  });
  const [updateBooking, updateBookingResult] = useUpdateBookingMutation();

  useEffect(() => {
    if (Array.isArray(data) && data?.length) {
      const slot = data.find(
        (item) => item?.slot_id === booking?.slot?.slot_id,
      );
      setFormData((prev) => ({
        ...prev,
        slot_id: slot?.slot_id,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        slot_id: null,
      }));
    }
  }, [data, booking?.slot?.slot_id]);

  const handleChange = (field, event) => {
    let newData;
    if (event?.target?.value) {
      // For date picker
      newData = { ...formData, [field]: event.target.value };
    } else if (field === 'slot_id' && event) {
      // For slot selection
      newData = { ...formData, slot_id: event };
    } else {
      newData = { ...formData, ...field };
    }
    setFormData(newData);
    handleValidation(newData);
  };

  const handleValidation = ({ ...payload }) => {
    let valid = true;
    setValidation({
      valid,
    });

    if (!payload?.date) {
      valid = false;
      setValidation({
        ...validation,
        valid,
        date: 'Please select booking date',
      });
    } else {
      const toDate = new Date();
      const isValidDate =
        new Date(payload?.date) >=
        new Date(
          toDate.getUTCFullYear(),
          toDate.getUTCMonth(),
          toDate.getUTCDate(),
          0,
          0,
          0,
        );
      if (!isValidDate) {
        valid = false;
        setValidation({
          ...validation,
          valid,
          date: 'Please select valid date',
        });
      }
    }
    if (Array.isArray(data) && data?.length && !payload?.slot_id) {
      valid = false;
      setValidation({
        ...validation,
        valid,
        slot: 'Please select booking slot',
      });
    }

    return valid;
  };

  const handleSubmit = async () => {
    const valid = handleValidation(formData);
    if (valid) {
      try {
        const { booking_id, ...bookingData } = formData;
        await updateBooking({
          id: booking_id,
          data: bookingData,
        }).unwrap();
        setShow(false);
      } catch (error) {
        setValidation((prev) => ({
          ...prev,
          valid: false,
          error: 'Failed to reschedule appointment. Please try again.',
        }));
      }
    }
  };

  return (
    <>
      <Modal
        show={show}
        onHide={() => setShow(false)}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Reschedule Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate validated={validation.valid}>
            <Form.Group className="mb-4">
              <Form.Label>Select New Date</Form.Label>
              <Form.Control
                type="date"
                value={formData?.date}
                onChange={(event) => handleChange('date', event)}
                isInvalid={!!validation?.date}
                className="date-picker"
              />
              {validation?.date && (
                <Form.Control.Feedback type="invalid">
                  {validation.date}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {isLoading || isFetching ? (
              <div className="text-center py-4">
                <Loading
                  loading={isLoading || isFetching}
                  children="Loading available slots..."
                />
              </div>
            ) : (
              <>
                <Form.Group>
                  <Form.Label className="d-flex justify-content-between align-items-center">
                    <span className="text-capitalize fw-bold">
                      {data?.length
                        ? `Available Slots for ${data?.[0].day}`
                        : null}
                    </span>
                  </Form.Label>

                  {!data?.length && (
                    <Alert variant="warning" className="mb-0">
                      No availability slots found for this date. Please select a
                      different date or check availability settings.
                    </Alert>
                  )}

                  <div className="time-slots-grid mt-3">
                    {(data || []).map((slot) => (
                      <div
                        key={slot.slot_id}
                        onClick={() => handleChange('slot_id', slot?.slot_id)}
                      >
                        <TimeSlot
                          slot={slot}
                          isSelected={formData?.slot_id === slot?.slot_id}
                        />
                      </div>
                    ))}
                  </div>

                  {(validation?.slot || validation?.error) && (
                    <div
                      className="text-danger mt-2"
                      style={{ fontSize: '.87rem' }}
                    >
                      {validation.slot || validation.error}
                    </div>
                  )}
                </Form.Group>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            className="px-4"
            disabled={
              isLoading ||
              isFetching ||
              updateBookingResult?.isLoading ||
              !formData?.slot_id
            }
            onClick={handleSubmit}
          >
            {updateBookingResult?.isLoading ? (
              <div className="d-flex align-items-center gap-2">
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                <span>Saving...</span>
              </div>
            ) : (
              'Reschedule'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Reschedule;
