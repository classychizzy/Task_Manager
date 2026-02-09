import { parseISO, parse, isValid } from 'date-fns';

/**
 * Parses multiple date formats and returns a valid Date object or null
 * Accepts: ISO, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY
 */
export function parseFlexibleDate(dateInput: string | undefined | null): Date | null {
    if (!dateInput) return null;

    // Try ISO format first (most common from frontend)
    let date = parseISO(dateInput);
    if (isValid(date)) return date;

    // Try common formats
    const formats = [
        'dd/MM/yyyy',   // 15/02/2026
        'MM/dd/yyyy',   // 02/15/2026
        'yyyy-MM-dd',   // 2026-02-15
        'dd-MM-yyyy',   // 15-02-2026
    ];
    
    for (const format of formats) {
        date = parse(dateInput, format, new Date());
        if (isValid(date)) return date;
    }

    return null; // No valid format found
}

/**
 * Validates if a date string is valid
 */
export function isValidDateString(dateInput: string | undefined | null): boolean {
    return parseFlexibleDate(dateInput) !== null;
}

/**
 * Combines separate date and time strings into a single Date
 */
export function combineDateAndTime(dateStr: string, timeStr?: string): Date | null {
    if (!dateStr) return null;

    const date = dateStr; // "2026-02-15"
    const time = timeStr || "00:00"; // Default to midnight
    const combined = `${date}T${time}:00.000Z`;
    
    const result = new Date(combined);
    return isValid(result) ? result : null;
}