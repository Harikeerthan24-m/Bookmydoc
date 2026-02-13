import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Button,
  Form,
  Dropdown,
  DropdownButton,
  Card,
  Row,
  Col,
} from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import { FaPlus, FaTrash, FaClone } from 'react-icons/fa';
import './Availability.css';
import {
  useGetAvailabilitySlotsQuery,
  useSaveAvailabilitySlotsMutation,
} from './../../store/slices';
import Loading from './../common/Loading';
import { ToastMessage } from '../../components/common/ToastMessageWrapper';
import {
  generateTimeOptions,
  prepareAvailabilitySlots,
  formatTime,
} from './../../lib/utils';

const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const predefinedTimeSlots = [
  {
    start_time: '09:00',
    start: { value: '09:00', label: '09:00 AM' },
    end_time: '12:00',
    end: { value: '12:00', label: '12:00 PM' },
    label: 'Morning (9 AM - 12 PM)',
  },
  {
    start_time: '14:00',
    start: { value: '14:00', label: '02:00 PM' },
    end_time: '17:00',
    end: { value: '17:00', label: '05:00 PM' },
    label: 'Afternoon (2 PM - 5 PM)',
  },
  {
    start_time: '18:00',
    start: { value: '18:00', label: '06:00 PM' },
    end_time: '21:00',
    end: { value: '21:00', label: '09:00 PM' },
    label: 'Evening (6 PM - 9 PM)',
  },
  {
    start_time: '09:00',
    start: { value: '09:00', label: '09:00 AM' },
    end_time: '17:00',
    end: { value: '17:00', label: '05:00 PM' },
    label: 'Full Day (9 AM - 5 PM)',
  },
];

const initialTimeSlot = predefinedTimeSlots[0];

const startTimeOptions = generateTimeOptions('start');
const endTimeOptions = generateTimeOptions('end');

const Availability = () => {
  const { data, isLoading, isError } = useGetAvailabilitySlotsQuery({});
  const [saveAvailabilitySlots, saveAvailabilitySlotsResult] =
    useSaveAvailabilitySlotsMutation();
  const [availability, setAvailability] = useState(() =>
    daysOfWeek.reduce((results, day) => {
      results[day.toLowerCase()] = {
        day,
        enabled: false,
        timeSlots: [],
      };
      return results;
    }, {}),
  );

  useEffect(() => {
    if (data && !isError) {
      const results = prepareAvailabilitySlots(data);
      setAvailability((prevAvailability) => ({
        ...prevAvailability,
        ...results,
      }));
    }
  }, [data, isError]);

  const handleToggle = (dayKey) => {
    setAvailability((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey].enabled,
        timeSlots: prev[dayKey].enabled
          ? []
          : [
              {
                day: dayKey,
                start: initialTimeSlot.start,
                end: initialTimeSlot.end,
                start_time: initialTimeSlot.start_time,
                end_time: initialTimeSlot.end_time,
              },
            ],
      },
    }));
  };

  const handleTimeChange = (dayKey, slotIndex, field, value) => {
    const timeData = JSON.parse(value);

    setAvailability((prev) => {
      const updatedAvailability = { ...prev };
      updatedAvailability[dayKey].timeSlots[slotIndex][field] = timeData;
      updatedAvailability[dayKey].timeSlots[slotIndex][field + '_time'] =
        timeData.value;

      const startTime =
        updatedAvailability[dayKey].timeSlots[slotIndex].start_time?.split(':');
      let endTime =
        field === 'end' && timeData.value === '0:00' ? '24:00' : timeData.value;
      endTime = endTime?.split(':');

      const compareTime =
        new Date(0, 0, 0, endTime?.[0], +endTime?.[1]) -
        new Date(0, 0, 0, startTime?.[0], startTime?.[1]);

      if (field === 'end' && compareTime < 0) {
        ToastMessage({
          title: 'Invalid time slot. Please select correct time',
          message:
            "You can't select end time smaller than start time and cross the day.",
          options: { type: 'danger' },
        });
        return prev; // Don't update state if invalid
      }

      return updatedAvailability;
    });
  };

  const handleAddSlot = (dayKey, slot = initialTimeSlot) => {
    setAvailability((prev) => {
      const currentSlots = prev[dayKey].timeSlots || [];
      let newSlot = { ...slot, day: dayKey };

      // If there are existing slots, use the end time of the last slot as the start time
      if (currentSlots.length > 0) {
        const lastSlot = currentSlots[currentSlots.length - 1];
        newSlot = {
          ...newSlot,
          start_time: lastSlot.end_time,
          start: {
            value: lastSlot.end_time,
            label: formatTime(lastSlot.end_time),
          },
        };
      }

      return {
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          timeSlots: [...currentSlots, newSlot],
        },
      };
    });
  };

  const handleRemoveSlot = (dayKey, slotIndex) => {
    setAvailability((prev) => {
      const updatedAvailability = { ...prev };
      updatedAvailability[dayKey].timeSlots.splice(slotIndex, 1);
      if (updatedAvailability[dayKey].timeSlots?.length <= 0) {
        updatedAvailability[dayKey].enabled = false;
      }
      return updatedAvailability;
    });
  };

  const handleCloneSlot = (dayKey, slotIndex) => {
    setAvailability((prev) => {
      const updatedAvailability = { ...prev };
      const clonedSlot = {
        ...updatedAvailability[dayKey].timeSlots[slotIndex],
      };
      updatedAvailability[dayKey].timeSlots.splice(
        slotIndex + 1,
        0,
        clonedSlot,
      );
      return updatedAvailability;
    });
  };

  const handleSave = () => {
    const payload = [];
    const availabilityData = { ...availability };
    for (const slotKey in availabilityData) {
      const slots = availabilityData[slotKey];
      if (slots?.enabled) {
        payload.push(...slots.timeSlots);
      }
    }
    saveAvailabilitySlots(payload);
  };

  return (
    <div id="availability">
      <div className="container mt-3 d-flex justify-content-center align-items-center">
        {isLoading && <Loading type="overlay" text="Loading availability..." />}
        <ToastContainer />
        <Card
          className="shadow-sm p-3"
          style={{ width: '100%', maxWidth: '700px' }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="mb-0">Schedule</h1>
          </div>
          <Form>
            {Object.keys(availability).map((dayKey, dayIndex) => {
              const day = availability[dayKey];
              return (
                <Row
                  key={day.day}
                  className="day-container mb-2 align-items-center"
                >
                  <Col
                    xs={12}
                    sm={3}
                    className="d-flex align-items-center mb-2 mb-sm-0"
                  >
                    <Form.Check
                      type="switch"
                      id={`switch-${day.day}`}
                      label={day.day}
                      checked={day.enabled}
                      onChange={() => handleToggle(dayKey)}
                      className="day-switch custom-switch"
                      style={{ textTransform: 'capitalize' }}
                    />
                  </Col>
                  <Col xs={12} sm={9}>
                    {day.enabled && (
                      <div className="time-slots-container">
                        <div className="time-slots-list">
                          {day.timeSlots.map((slot, slotIndex) => (
                            <div key={slotIndex} className="calendly-time-slot">
                              <div className="time-slot-header">
                                <div className="time-display">
                                  <span className="time-text">
                                    {slot.start?.label} - {slot.end?.label}
                                  </span>
                                </div>
                                <div className="time-slot-actions">
                                  <button
                                    className="action-btn copy-btn"
                                    onClick={() =>
                                      handleCloneSlot(dayKey, slotIndex)
                                    }
                                    title="Copy this time slot"
                                  >
                                    <FaClone />
                                  </button>
                                  <button
                                    className="action-btn delete-btn"
                                    onClick={() =>
                                      handleRemoveSlot(dayKey, slotIndex)
                                    }
                                    title="Delete this time slot"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>

                              <div className="time-editor">
                                <div className="time-input-group">
                                  <label className="time-label">
                                    Start Time
                                  </label>
                                  <DropdownButton
                                    variant="outline-secondary"
                                    title={slot.start?.label}
                                    id={`dropdown-start-${dayIndex}-${slotIndex}`}
                                    className="calendly-time-dropdown"
                                    size="sm"
                                    onSelect={(value) =>
                                      handleTimeChange(
                                        dayKey,
                                        slotIndex,
                                        'start',
                                        value,
                                      )
                                    }
                                  >
                                    <div className="dropdown-scrollable">
                                      {startTimeOptions.map((time, index) => (
                                        <Dropdown.Item
                                          key={index}
                                          eventKey={JSON.stringify(time)}
                                          className="time-option"
                                        >
                                          {time?.label}
                                        </Dropdown.Item>
                                      ))}
                                    </div>
                                  </DropdownButton>
                                </div>

                                <div className="time-separator">to</div>

                                <div className="time-input-group">
                                  <label className="time-label">End Time</label>
                                  <DropdownButton
                                    variant="outline-secondary"
                                    title={slot.end?.label}
                                    id={`dropdown-end-${dayIndex}-${slotIndex}`}
                                    className="calendly-time-dropdown"
                                    size="sm"
                                    onSelect={(value) =>
                                      handleTimeChange(
                                        dayKey,
                                        slotIndex,
                                        'end',
                                        value,
                                      )
                                    }
                                  >
                                    <div className="dropdown-scrollable">
                                      {endTimeOptions.map((time, index) => (
                                        <Dropdown.Item
                                          key={index}
                                          eventKey={JSON.stringify(time)}
                                          className="time-option"
                                        >
                                          {time?.label}
                                        </Dropdown.Item>
                                      ))}
                                    </div>
                                  </DropdownButton>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3">
                          <Button
                            variant="outline-primary"
                            onClick={() => handleAddSlot(dayKey)}
                            size="sm"
                          >
                            <FaPlus className="me-1" /> Add New Time Slot
                          </Button>
                        </div>
                      </div>
                    )}
                  </Col>
                </Row>
              );
            })}
          </Form>

          {/* Global Save Button */}
          <div className="d-flex justify-content-center mt-4">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saveAvailabilitySlotsResult?.isLoading}
              size="lg"
              className="save-button"
            >
              {saveAvailabilitySlotsResult?.isLoading ? (
                <Loading type="inline" size="small" text="Saving..." />
              ) : (
                'Save Schedule'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Availability;
