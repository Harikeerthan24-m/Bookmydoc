import React, { useEffect, useState } from 'react';
import { FaPlus, FaTrash, FaClone } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
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
        return prev;
      }

      return updatedAvailability;
    });
  };

  const handleAddSlot = (dayKey, slot = initialTimeSlot) => {
    setAvailability((prev) => {
      const currentSlots = prev[dayKey].timeSlots || [];
      let newSlot = { ...slot, day: dayKey };

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
      return { ...updatedAvailability };
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
      return { ...updatedAvailability };
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

  const activeDaysCount = Object.values(availability).filter(
    (d) => d.enabled,
  ).length;

  return (
    <div id="availability">
      {isLoading && <Loading type="overlay" text="Loading availability..." />}
      <ToastContainer />

      <div className="av-wrapper">
        {/* ── Header ── */}
        <div className="av-header">
          <div className="av-header-left">
            <p className="av-eyebrow">Doctor Dashboard</p>
            <h1 className="av-title">Weekly Schedule</h1>
            <p className="av-subtitle">
              {activeDaysCount === 0
                ? 'No days configured — toggle days below to set your hours'
                : `Available ${activeDaysCount} day${activeDaysCount !== 1 ? 's' : ''} this week`}
            </p>
          </div>
          <button
            className="av-save-btn"
            onClick={handleSave}
            disabled={saveAvailabilitySlotsResult?.isLoading}
          >
            {saveAvailabilitySlotsResult?.isLoading ? (
              <>
                <span className="av-spinner" />
                Saving…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="17 21 17 13 7 13 7 21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="7 3 7 8 15 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Save Schedule
              </>
            )}
          </button>
        </div>

        {/* ── Week Overview Strip ── */}
        <div className="av-week-strip">
          {Object.keys(availability).map((dayKey) => {
            const day = availability[dayKey];
            return (
              <button
                key={dayKey}
                className={`av-week-dot ${day.enabled ? 'active' : ''}`}
                onClick={() => handleToggle(dayKey)}
                title={`Toggle ${day.day}`}
              >
                <span className="av-dot-abbr">{day.day.slice(0, 2)}</span>
                {day.enabled && (
                  <span className="av-dot-count">{day.timeSlots.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Day Rows ── */}
        <div className="av-days-list">
          {Object.keys(availability).map((dayKey) => {
            const day = availability[dayKey];
            return (
              <div
                key={dayKey}
                className={`av-day-card ${day.enabled ? 'is-active' : ''}`}
              >
                {/* Day row header */}
                <div className="av-day-row-header">
                  <label className="av-toggle" title={`Toggle ${day.day}`}>
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={() => handleToggle(dayKey)}
                    />
                    <span className="av-toggle-track">
                      <span className="av-toggle-thumb" />
                    </span>
                  </label>

                  <div className="av-day-info">
                    <span className="av-day-name">{day.day}</span>
                    <span className="av-day-abbr">
                      {day.day.slice(0, 3).toUpperCase()}
                    </span>
                  </div>

                  <div className="av-day-status">
                    {day.enabled ? (
                      <span className="av-status-badge active">
                        {day.timeSlots.length} slot
                        {day.timeSlots.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="av-status-badge inactive">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded time slots panel */}
                {day.enabled && (
                  <div className="av-slots-panel">
                    <div className="av-slots-list">
                      {day.timeSlots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="av-slot-row">
                          <div className="av-slot-index">{slotIndex + 1}</div>

                          <div className="av-slot-times">
                            <div className="av-time-field">
                              <span className="av-time-label">From</span>
                              <select
                                className="av-time-select"
                                value={slot.start_time}
                                onChange={(e) => {
                                  const opt = startTimeOptions.find(
                                    (t) => t.value === e.target.value,
                                  );
                                  if (opt)
                                    handleTimeChange(
                                      dayKey,
                                      slotIndex,
                                      'start',
                                      JSON.stringify(opt),
                                    );
                                }}
                              >
                                {startTimeOptions.map((time, i) => (
                                  <option key={i} value={time.value}>
                                    {time.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="av-time-arrow">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M5 12h14M13 6l6 6-6 6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>

                            <div className="av-time-field">
                              <span className="av-time-label">To</span>
                              <select
                                className="av-time-select"
                                value={slot.end_time}
                                onChange={(e) => {
                                  const opt = endTimeOptions.find(
                                    (t) => t.value === e.target.value,
                                  );
                                  if (opt)
                                    handleTimeChange(
                                      dayKey,
                                      slotIndex,
                                      'end',
                                      JSON.stringify(opt),
                                    );
                                }}
                              >
                                {endTimeOptions.map((time, i) => (
                                  <option key={i} value={time.value}>
                                    {time.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="av-slot-actions">
                            <button
                              className="av-icon-btn av-clone-btn"
                              onClick={() => handleCloneSlot(dayKey, slotIndex)}
                              title="Duplicate"
                            >
                              <FaClone />
                            </button>
                            <button
                              className="av-icon-btn av-delete-btn"
                              onClick={() =>
                                handleRemoveSlot(dayKey, slotIndex)
                              }
                              title="Remove"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      className="av-add-btn"
                      onClick={() => handleAddSlot(dayKey)}
                    >
                      <FaPlus />
                      Add Time Slot
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer save ── */}
        <div className="av-footer">
          <button
            className="av-save-btn av-save-lg"
            onClick={handleSave}
            disabled={saveAvailabilitySlotsResult?.isLoading}
          >
            {saveAvailabilitySlotsResult?.isLoading ? (
              <Loading type="inline" size="small" text="Saving..." />
            ) : (
              'Save Schedule'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Availability;
