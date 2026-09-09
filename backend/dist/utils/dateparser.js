"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFlexibleDate = parseFlexibleDate;
const date_fns_1 = require("date-fns");
function parseFlexibleDate(dateInput) {
    if (!dateInput)
        return null;
    // If it's a plain date-only string (no time component), force UTC
    // interpretation explicitly — parseISO otherwise treats date-only
    // strings as local time, which silently shifts the date depending
    // on the server's timezone offset.
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateInput);
    const normalizedInput = isDateOnly ? `${dateInput}T00:00:00.000Z` : dateInput;
    const date = (0, date_fns_1.parseISO)(normalizedInput);
    return (0, date_fns_1.isValid)(date) ? date : null;
}
