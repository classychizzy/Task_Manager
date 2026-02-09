"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFlexibleDate = parseFlexibleDate;
exports.isValidDateString = isValidDateString;
exports.combineDateAndTime = combineDateAndTime;
const date_fns_1 = require("date-fns");
/**
 * Parses multiple date formats and returns a valid Date object or null
 * Accepts: ISO, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY
 */
function parseFlexibleDate(dateInput) {
    if (!dateInput)
        return null;
    // Try ISO format first (most common from frontend)
    let date = (0, date_fns_1.parseISO)(dateInput);
    if ((0, date_fns_1.isValid)(date))
        return date;
    // Try common formats
    const formats = [
        'dd/MM/yyyy', // 15/02/2026
        'MM/dd/yyyy', // 02/15/2026
        'yyyy-MM-dd', // 2026-02-15
        'dd-MM-yyyy', // 15-02-2026
    ];
    for (const format of formats) {
        date = (0, date_fns_1.parse)(dateInput, format, new Date());
        if ((0, date_fns_1.isValid)(date))
            return date;
    }
    return null; // No valid format found
}
/**
 * Validates if a date string is valid
 */
function isValidDateString(dateInput) {
    return parseFlexibleDate(dateInput) !== null;
}
/**
 * Combines separate date and time strings into a single Date
 */
function combineDateAndTime(dateStr, timeStr) {
    if (!dateStr)
        return null;
    const date = dateStr; // "2026-02-15"
    const time = timeStr || "00:00"; // Default to midnight
    const combined = `${date}T${time}:00.000Z`;
    const result = new Date(combined);
    return (0, date_fns_1.isValid)(result) ? result : null;
}
