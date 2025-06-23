import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const holidaysData = require('../db/holidays.json');

function isPublicHoliday(date) {
    const holidays = holidaysData.holidays;

    const formattedDate = date.toISOString().split('T')[0]; // Get YYYY-MM-DD format

    for (const holiday of holidays) {
        if (holiday.date === formattedDate) {
            return true;
        }

        if (holiday.startDate && holiday.endDate) {
            const holidayStart = new Date(holiday.startDate);
            const holidayEnd = new Date(holiday.endDate);
            if (date >= holidayStart && date <= holidayEnd) {
                return true;
            }
        }
    }

    return false;
}

export { isPublicHoliday };
