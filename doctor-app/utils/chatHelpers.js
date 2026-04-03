/**
 * Formats an ISO date string into a human-readable label: "Today", "Yesterday", or "DD/MM/YYYY".
 * @param {string} isoString 
 * @returns {string|null}
 */
export function getDateLabel(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();
  const tD = today.getDate();
  const tM = today.getMonth();
  const tY = today.getFullYear();
  const yD = yesterday.getDate();
  const yM = yesterday.getMonth();
  const yY = yesterday.getFullYear();
  if (y === tY && m === tM && d === tD) return 'Today';
  if (y === yY && m === yM && d === yD) return 'Yesterday';
  const day = String(d).padStart(2, '0');
  const month = String(m + 1).padStart(2, '0');
  return `${day}/${month}/${y}`;
}

/**
 * Transforms a flat list of messages into a list with date section headers inserted.
 * @param {Array} messages 
 * @returns {Array}
 */
export function buildListWithDateSections(messages) {
  const list = [];
  let lastDateKey = null;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const iso = msg.createdAt;
    const date = iso ? new Date(iso) : new Date();
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (dateKey !== lastDateKey) {
      lastDateKey = dateKey;
      const label = getDateLabel(iso || date.toISOString());
      if (label) {
        list.push({ type: 'date', id: `date-${dateKey}`, label });
      }
    }
    list.push({ ...msg, type: 'message' });
  }
  return list;
}
