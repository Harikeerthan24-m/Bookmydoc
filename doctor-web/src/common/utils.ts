export const validateTime = (timeValue: string) => {
  let [hours, minutes] = timeValue?.split(':') as any[];
  hours = +hours;
  minutes = +minutes;

  if (hours > 24 || hours <= 0) {
    hours = 0;
  }
  if (minutes > 60 || minutes < 0) {
    minutes = 0;
  }
  return { hours, minutes } as Record<string, number>;
};

export const formatTime = (time) => {
  if (!time) {
    return '00:00';
  }
  let [hours, minutes] = time?.split(':');
  const ampm = hours < 12 ? 'AM' : 'PM';
  hours = hours % 12 || 12;
  minutes = String(minutes);
  return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')} ${ampm}`;
};
