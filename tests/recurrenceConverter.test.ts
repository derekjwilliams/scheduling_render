// recurrenceConverters.test.ts
// import { describe, expect, test } from '@jest/globals';
import { parseTo5545, parseTo8984 } from '../recurrenceConverters';

const testRecurrenceStrings = [
  "TR 11am-12:15pm",
  "TR 2pm-3:15pm",
  "M 8am-9:40am",
  "M 10am-11:40am",
  "M 12pm-1:40pm",
  "M 2pm-3:40pm",
  "M 4pm-5:40pm",
  "T 8am-9:40am",
  "T 10am-11:40am",
  "T 12pm-1:40pm",
  "T 2pm-3:40pm",
  "T 4pm-5:40pm",
  "W 8am-9:40am",
  "W 10am-11:40am",
  "W 12pm-1:40pm",
  "W 2pm-3:40pm",
  "R 8am-9:40am",
  "R 10am-11:40am",
  "R 12pm-1:40pm",
  "R 2pm-3:40pm",
  "R 4pm-5:40pm",
  "F 8am-9:40am",
  "F 10am-11:40am",
  "F 12pm-1:40pm",
  "W 4pm-5:40pm",
  "M 12pm-1:40pm",
  "M 2pm-3:40pm",
  "T 10am-11:50am",
  "W 12pm-1:40pm",
  "TR 2pm-3:15pm",
  "TR 11am-12:15pm",
  "F 1pm-3:50pm",
  "W 4pm-6:50pm",
  "M 2pm-3:15pm"
];

describe('Recurrence Converters', () => {
  // Define a sample start and end date for the recurrence period.
  const startDate = new Date('2025-03-10T00:00:00Z');
  const endDate = new Date('2025-06-10T23:59:59Z');

  testRecurrenceStrings.forEach((recurrence) => {
    test(`parseTo5545 for "${recurrence}" produces valid output`, () => {
      const output = parseTo5545(startDate, endDate, recurrence);
      // Basic expectations: output should contain DTSTART, DTEND, and RRULE with UNTIL.
      expect(output).toContain('BEGIN:VEVENT');
      expect(output).toContain('DTSTART:');
      expect(output).toContain('DTEND:');
      expect(output).toContain('RRULE:');
      expect(output).toContain('UNTIL=');
      expect(output).toContain('END:VEVENT');
      // Uncomment to log the output for manual inspection:
      // console.log(`5545 for "${recurrence}":\n${output}\n`);
    });

    test(`parseTo8984 for "${recurrence}" produces valid output`, () => {
      const output = parseTo8984(startDate, endDate, recurrence) as any;
      // Basic expectations: JSON output should contain dtstart, dtend, and a recurrence object.
      expect(output).toHaveProperty('dtstart');
      expect(output).toHaveProperty('dtend');
      expect(output).toHaveProperty('recurrence');
      expect(output.recurrence).toHaveProperty('frequency', 'WEEKLY');
      expect(output.recurrence).toHaveProperty('byDay');
      expect(Array.isArray(output.recurrence.byDay)).toBe(true);
      expect(output.recurrence).toHaveProperty('until');
      // Uncomment to log the output for manual inspection:
      // console.log(`8984 for "${recurrence}":`, JSON.stringify(output, null, 2));
    });
  });
});
