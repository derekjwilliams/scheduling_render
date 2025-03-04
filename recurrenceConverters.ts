// Mapping for days letters to RFC-compliant two-letter codes.
const dayMap: { [key: string]: string } = {
  M: 'MO',
  T: 'TU',
  W: 'WE',
  R: 'TH',
  F: 'FR',
  S: 'SA', // for Saturday (if needed)
  U: 'SU', // for Sunday (if needed)
};

interface RecurrencePattern {
  days: string[]; // e.g. ['TU', 'TH']
  startTime: { hours: number; minutes: number };
  endTime: { hours: number; minutes: number };
}

function parseRecurrenceString(recurrence: string): RecurrencePattern {
  // Match the day letters at the beginning.
  const dayMatch = recurrence.match(/^([MTWRFSU]+)\s/);
  if (!dayMatch) {
    throw new Error('Invalid recurrence string: days not found');
  }
  const daysStr = dayMatch[1];
  // Map each letter to its RFC representation.
  const days = daysStr.split('').map(letter => {
    if (!dayMap[letter]) {
      throw new Error(`Unsupported day letter: ${letter}`);
    }
    return dayMap[letter];
  });

  // Match the time range (accepts times like 9am, 8:30am, 14:00, etc.).
  const timeMatch = recurrence.match(/(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)[-–](\d{1,2}(?::\d{2})?\s?(?:am|pm)?)/i);
  if (!timeMatch) {
    throw new Error('Invalid recurrence string: times not found');
  }

  const parseTime = (timeStr: string): { hours: number; minutes: number } => {
    timeStr = timeStr.trim().toLowerCase();
    let hours: number, minutes: number;
    if (timeStr.includes('am') || timeStr.includes('pm')) {
      // Remove the am/pm suffix and note the period.
      const period = timeStr.includes('pm') ? 'pm' : 'am';
      timeStr = timeStr.replace(/\s?(am|pm)/, '');
      const parts = timeStr.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parts[1] ? parseInt(parts[1], 10) : 0;
      // Convert to 24-hour format.
      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
    } else {
      // Assume 24-hour time.
      const parts = timeStr.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parts[1] ? parseInt(parts[1], 10) : 0;
    }
    return { hours, minutes };
  };

  const startTime = parseTime(timeMatch[1]);
  const endTime = parseTime(timeMatch[2]);

  return { days, startTime, endTime };
}

// Utility to format a Date into a string like "YYYYMMDDTHHmmss" (UTC)
function formatDateTo5545(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

// Given a base date, return a new Date with the same date but with time set to given hours and minutes.
function setTime(date: Date, hours: number, minutes: number): Date {
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

/**
 * Converts the provided recurrence string into an RFC5545 (iCalendar) formatted string.
 *
 * @param startDate - The start of the recurrence period.
 * @param endDate - The end of the recurrence period.
 * @param recurrenceString - e.g. "MWF 9am-10am"
 * @returns A string with DTSTART, DTEND, and an RRULE.
 */
export function parseTo5545(startDate: Date, endDate: Date, recurrenceString: string): string {
  const pattern = parseRecurrenceString(recurrenceString);

  // Create the DTSTART and DTEND by combining the provided startDate with the parsed times.
  // (Depending on your requirements you might need to align this to the first matching weekday.)
  const dtStart = setTime(startDate, pattern.startTime.hours, pattern.startTime.minutes);
  const dtEnd = setTime(startDate, pattern.endTime.hours, pattern.endTime.minutes);

  // Construct the RRULE; here we use FREQ=WEEKLY and include BYDAY, and set the UNTIL as the endDate.
  const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${pattern.days.join(',')};UNTIL=${formatDateTo5545(endDate)}`;

  // Build the iCalendar event string.
  const icalString = [
    'BEGIN:VEVENT',
    `DTSTART:${formatDateTo5545(dtStart)}`,
    `DTEND:${formatDateTo5545(dtEnd)}`,
    rrule,
    'END:VEVENT',
  ].join('\n');

  return icalString;
}

/**
 * Converts the provided recurrence string into an RFC8984–compatible JSON representation.
 *
 * @param startDate - The start of the recurrence period.
 * @param endDate - The end of the recurrence period.
 * @param recurrenceString - e.g. "TR 14:00-15:30"
 * @returns A JSON object describing the recurrence.
 */
export function parseTo8984(startDate: Date, endDate: Date, recurrenceString: string): object {
  const pattern = parseRecurrenceString(recurrenceString);

  // Create the event times using the recurrence string’s times and the provided startDate.
  const eventStart = setTime(startDate, pattern.startTime.hours, pattern.startTime.minutes);
  const eventEnd = setTime(startDate, pattern.endTime.hours, pattern.endTime.minutes);

  // Build the JSON representation.
  // Note: the exact schema for RFC8984 may vary; adjust keys as needed.
  return {
    dtstart: eventStart.toISOString(),
    dtend: eventEnd.toISOString(),
    recurrence: {
      frequency: 'WEEKLY',
      byDay: pattern.days, // e.g. ["TU", "TH"]
      until: endDate.toISOString(),
    },
  };
}

// Example usage:
const startDate = new Date('2025-03-10T00:00:00Z');
const endDate = new Date('2025-06-10T23:59:59Z');

console.log(parseTo5545(startDate, endDate, 'MWF 9am-10am'));
console.log(parseTo8984(startDate, endDate, 'TR 11am-12:15pm'));
