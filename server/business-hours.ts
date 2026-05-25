/**
 * Business Hours & Holiday Detection
 * Determines if GigitekAI support team is available
 */

// US Federal Holidays (2026)
const US_HOLIDAYS_2026 = [
  { month: 1, day: 1, name: "New Year's Day" },
  { month: 1, day: 19, name: "MLK Jr. Day" },
  { month: 2, day: 16, name: "Presidents Day" },
  { month: 5, day: 25, name: "Memorial Day" },
  { month: 7, day: 4, name: "Independence Day" },
  { month: 9, day: 7, name: "Labor Day" },
  { month: 10, day: 12, name: "Columbus Day" },
  { month: 11, day: 11, name: "Veterans Day" },
  { month: 11, day: 26, name: "Thanksgiving" },
  { month: 12, day: 25, name: "Christmas" },
];

// Business hours: 8 AM - 6 PM EST, Monday-Friday
const BUSINESS_HOURS_START = 8; // 8 AM
const BUSINESS_HOURS_END = 18; // 6 PM
const TIMEZONE = "America/New_York";

/**
 * Check if today is a US federal holiday
 */
export function isHoliday(date: Date = new Date()): { isHoliday: boolean; name?: string } {
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  const day = date.getDate();

  const holiday = US_HOLIDAYS_2026.find((h) => h.month === month && h.day === day);
  if (holiday) {
    return { isHoliday: true, name: holiday.name };
  }

  return { isHoliday: false };
}

/**
 * Check if current time is within business hours
 */
export function isBusinessHours(date: Date = new Date()): boolean {
  // Get current hour in EST
  const estTime = new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE }));
  const hour = estTime.getHours();
  const dayOfWeek = estTime.getDay();

  // Check if it's a weekday (Monday=1, Friday=5)
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  // Check if it's within business hours
  const isWithinHours = hour >= BUSINESS_HOURS_START && hour < BUSINESS_HOURS_END;

  return isWeekday && isWithinHours;
}

/**
 * Check if support team is available
 */
export function isSupportAvailable(date: Date = new Date()): {
  available: boolean;
  reason?: string;
} {
  const holiday = isHoliday(date);
  if (holiday.isHoliday) {
    return {
      available: false,
      reason: `We're closed today for ${holiday.name}. Our team will be back tomorrow.`,
    };
  }

  if (!isBusinessHours(date)) {
    const estTime = new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE }));
    const dayOfWeek = estTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      return {
        available: false,
        reason: "We're closed on weekends. Our team will be available Monday-Friday, 8 AM - 6 PM EST.",
      };
    }

    return {
      available: false,
      reason: "Our team is currently offline (8 AM - 6 PM EST, Mon-Fri). Leave a message and we'll get back to you!",
    };
  }

  return { available: true };
}

/**
 * Get next available support time
 */
export function getNextAvailableTime(date: Date = new Date()): string {
  const estTime = new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE }));
  const dayOfWeek = estTime.getDay();
  const hour = estTime.getHours();

  // If it's after 6 PM, next available is tomorrow at 8 AM
  if (hour >= 18) {
    const tomorrow = new Date(estTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1); // Skip Sunday
    if (tomorrow.getDay() === 6) tomorrow.setDate(tomorrow.getDate() + 1); // Skip Saturday
    return tomorrow.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }

  // If it's before 8 AM, next available is today at 8 AM
  if (hour < 8) {
    return "today at 8 AM EST";
  }

  // If it's a weekend, find next Monday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const nextMonday = new Date(estTime);
    nextMonday.setDate(nextMonday.getDate() + ((1 - dayOfWeek + 7) % 7 || 7));
    return nextMonday.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }

  return "shortly";
}
