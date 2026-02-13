export const formatTime = (time) => {
  if (!time) {
    return '00:00';
  }
  let [hours, minutes] = time?.split(':');
  const ampm = hours < 12 ? 'AM' : 'PM';
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export const formatDate = (dateString) => {
  if (!dateString) {
    return '';
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid date
    }

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Get day name
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayName = dayNames[date.getDay()];

    return `${year}-${month}-${day}, ${dayName}`;
  } catch (error) {
    return dateString; // Return original if error
  }
};

export const isExpireDate = (bookingDate) => {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  bookingDate = new Date(bookingDate);
  return bookingDate.toISOString() < today.toISOString();
};

export const generateTimeOptions = (statEnd) => {
  const times = [];
  const start = new Date(
    0,
    0,
    0,
    statEnd === 'start' ? 0 : 0,
    statEnd === 'start' ? 0 : 30,
    0,
  );
  const end = new Date(
    0,
    0,
    0,
    statEnd === 'start' ? 23 : 24,
    statEnd === 'start' ? 30 : 0,
    0,
  );

  while (start <= end) {
    const hours = start.getHours() % 12 || 12;
    const minutes = start.getMinutes().toString().padStart(2, '0');
    const ampm = start.getHours() < 12 ? 'AM' : 'PM';

    times.push({
      value: `${start.getHours()}:${minutes}`,
      label: `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`,
    });
    start.setMinutes(start.getMinutes() + 30);
  }

  return times;
};

export const prepareAvailabilitySlots = (slots = []) => {
  const results = [];
  for (const slot of slots) {
    if (results[slot?.day?.toLowerCase()]) {
      results[slot?.day?.toLowerCase()].timeSlots.push({
        ...slot,
        start: {
          value: slot?.start_time,
          label: formatTime(slot?.start_time),
        },
        end: {
          value: slot?.end_time,
          label: formatTime(slot?.end_time),
        },
      });
    } else {
      results[slot?.day?.toLowerCase()] = {
        enabled: true,
        day: slot?.day,
        timeSlots: [
          {
            ...slot,
            start: {
              value: slot?.start_time,
              label: formatTime(slot?.start_time),
            },
            end: {
              value: slot?.end_time,
              label: formatTime(slot?.end_time),
            },
          },
        ],
      };
    }
  }
  return results;
};
