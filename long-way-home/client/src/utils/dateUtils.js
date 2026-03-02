export function parseGameDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatGameDate(dateStr) {
  const date = parseGameDate(dateStr);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function addDays(dateStr, days) {
  const date = parseGameDate(dateStr);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBetween(dateStr1, dateStr2) {
  const d1 = parseGameDate(dateStr1);
  const d2 = parseGameDate(dateStr2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function isSunday(dateStr) {
  return parseGameDate(dateStr).getDay() === 0;
}

export function getDayOfWeek(dateStr) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[parseGameDate(dateStr).getDay()];
}

export function isBefore(dateStr1, dateStr2) {
  return parseGameDate(dateStr1) < parseGameDate(dateStr2);
}

export function isAfter(dateStr1, dateStr2) {
  return parseGameDate(dateStr1) > parseGameDate(dateStr2);
}
