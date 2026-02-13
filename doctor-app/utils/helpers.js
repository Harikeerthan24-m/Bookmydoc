export function handleFirebaseError(error) {
  const code =
    error?.code ||
    error?.error?.code ||
    error?.statusCode ||
    error?.error?.statusCode;

  let message = null;
  let errorMessage = null;
  if (code === 'auth/invalid-credential') {
    message = 'Invalid Credentials.';
    errorMessage = 'Please try again with valid credentials';
  } else if (code === 'auth/user-not-found') {
    message = 'User not found.';
    errorMessage = 'Please sign up with new account';
  } else if (code === 'auth/invalid-email') {
    message = 'Invalid email.';
    errorMessage = 'Please provide correct email.';
  } else if (code === 'auth/too-many-requests') {
    message = 'Too many requests.';
    errorMessage = 'Your account is suspended. Please reset your password.';
  } else if (code === 'auth/network-request-failed') {
    message = 'Network request failed.';
    errorMessage = 'Please check your internet connection.';
  } else if (code === 'auth/invalid-credential') {
    message = 'Invalid Credentials.';
    errorMessage = 'Please try again with valid credentials';
  } else if (code === 'auth/user-not-found') {
    message = 'User not found.';
    errorMessage = 'Please sign up with new account';
  } else if (code === 'auth/too-many-requests') {
    message = 'Too many requests.';
    errorMessage = 'Your account is suspended. Please reset your password.';
  } else if (code === 'auth/network-request-failed') {
    message = 'Network request failed.';
    errorMessage = 'Please check your internet connection.';
  } else if (code === 'auth/user-token-expired') {
    message = 'Token expired.';
    errorMessage = 'Please login again.';
  }

  return { code, message, errorMessage };
}

export function getNextDayOfWeek(dayName, referenceDate = new Date()) {
  const daysOfWeek = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  // Find the index of the target day (e.g., Monday -> 1, Tuesday -> 2)
  const dayIndex = daysOfWeek.indexOf(dayName);
  if (dayIndex === -1) {
    console.error('Invalid day name.');
  }
  // Get the current day index
  const currentDayIndex = referenceDate.getDay();
  // Calculate the number of days to add to get the next occurrence of the target day
  let daysUntilNextDay = (dayIndex + 7 - currentDayIndex) % 7;
  daysUntilNextDay = daysUntilNextDay >= 0 ? daysUntilNextDay : 7;
  // Create a new Date object representing the next occurrence of the target day
  const nextDate = new Date(referenceDate);
  nextDate.setDate(referenceDate.getDate() + daysUntilNextDay);
  return {
    year: nextDate.getFullYear(),
    month: nextDate.getMonth() + 1,
    month_name: nextDate.toLocaleString('en-US', { month: 'long' }),
    date: nextDate.getDate(),
    day: nextDate.toLocaleString('en-US', { weekday: 'short' }),
    day_name: nextDate.toLocaleString('en-US', { weekday: 'long' }),
  };
}

export const formatTime = (time) => {
  if (!time) {
    return '00:00';
  }
  let [hours, minutes] = time?.split(':');
  const ampm = hours < 12 ? 'AM' : 'PM';
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export const capitalize = (value) => {
  if (value) {
    value = value[0].toUpperCase() + value.slice(1, value.length);
  }
  return value;
};

export const availabilityFormat = (availability) => {
  return availability?.reduce(
    (value, current) =>
      (value = value
        ? value + ', ' + capitalize(current)
        : capitalize(current)),
    '',
  );
};
