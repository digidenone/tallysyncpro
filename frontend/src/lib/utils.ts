
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date for Tally XML format
 * @param dateInput The date to format (string or Date)
 * @returns Formatted date as string in the format YYYYMMDD
 */
export const formatDateForTally = (dateInput: string | Date | undefined): string => {
  if (!dateInput) {
    // Return today's date if no date is provided
    const today = new Date();
    return formatDateString(today);
  }
  
  try {
    // Handle different date input formats
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    
    return formatDateString(date);
  } catch (error) {
    // Fallback to today's date for any parsing errors
    console.warn("Invalid date provided to formatDateForTally, using today's date instead");
    return formatDateString(new Date());
  }
};

/**
 * Helper function to format a Date object to YYYYMMDD string
 */
const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}${month}${day}`;
};
