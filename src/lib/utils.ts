
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Employee, GeoLocation, Leave, LeaveType } from "../types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get attendance settings
export function getAttendanceSettings() {
  const settings = localStorage.getItem('attendanceSettings');
  if (settings) {
    return JSON.parse(settings);
  }

  // Default settings
  return {
    lateThresholdHour: 9,
    lateThresholdMinute: 15,
    autoCheckoutHour: 0,
    autoCheckoutMinute: 0
  };
}

// Generate a random ID (simple implementation)
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Format time as HH:MM:SS
export function formatTime(date: Date): string {
  return date.toTimeString().split(' ')[0];
}

// Format date and time as human-readable string
export function formatDateTime(dateString: string, timeString?: string): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  let formatted = date.toLocaleDateString('en-US', options);

  if (timeString) {
    formatted += ' at ' + timeString;
  }

  return formatted;
}

// Get today's date as YYYY-MM-DD
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Get current time as HH:MM:SS
export function getCurrentTimeString(): string {
  return new Date().toTimeString().split(' ')[0];
}

// Create employee object with ID and creation timestamp
export function createEmployee(
  userData: Omit<Employee, 'id' | 'createdAt'>
): Employee {
  return {
    ...userData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
}

// Parse QR code data to extract employee ID
export function parseQrCodeData(qrData: string): string | null {
  try {
    // Simple implementation for now - assuming QR code contains employee ID directly
    // In a real application, this might be more complex (e.g., JSON, encrypted data)
    return qrData;
  } catch (error) {
    console.error("Failed to parse QR code data:", error);
    return null;
  }
}

// Calculate working hours between check-in and check-out
export function calculateWorkingHours(checkInTime: string, checkOutTime?: string): string {
  if (!checkOutTime) return "Not checked out";

  const checkIn = new Date(`1970-01-01T${checkInTime}`);
  const checkOut = new Date(`1970-01-01T${checkOutTime}`);

  // Handle case where checkout is on the next day
  let diffMs = checkOut.getTime() - checkIn.getTime();
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000;
  }

  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);

  return `${diffHrs}h ${diffMins}m`;
}

// Function to get the status based on check-in time
export function getAttendanceStatus(checkInTime: string | undefined): 'present' | 'late' | 'absent' {
  if (!checkInTime) return 'absent';

  const time = new Date(`1970-01-01T${checkInTime}`);
  const hours = time.getHours();
  const minutes = time.getMinutes();

  // Get configurable attendance settings
  const settings = getAttendanceSettings();
  const lateThresholdHour = settings.lateThresholdHour;
  const lateThresholdMinute = settings.lateThresholdMinute;

  // Consider late if arrival after threshold time
  if (hours > lateThresholdHour || (hours === lateThresholdHour && minutes > lateThresholdMinute)) {
    return 'late';
  }

  return 'present';
}

// Get current geolocation
export async function getCurrentLocation(): Promise<GeoLocation | null> {
  try {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by this browser");
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: GeoLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          };
          resolve(location);
        },
        (error) => {
          console.error("Error getting location:", error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  } catch (error) {
    console.error("Error in getCurrentLocation:", error);
    return null;
  }
}

// Calculate days between two dates (inclusive)
export function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
}

// Get leave type display name
export function getLeaveTypeLabel(type: LeaveType): string {
  switch (type) {
    case 'sick': return 'Sick Leave';
    case 'casual': return 'Casual Leave';
    case 'paid': return 'Paid Leave';
    case 'unpaid': return 'Unpaid Leave';
    case 'other': return 'Other';
    default: return 'Unknown';
  }
}

// Get remaining leave days for an employee
export function getRemainingLeaveDays(
  employeeId: string,
  leaveType: LeaveType,
  leaves: Leave[],
  allowedDays: number
): number {
  const usedLeaves = leaves
    .filter(leave =>
      leave.employeeId === employeeId &&
      leave.type === leaveType &&
      leave.status === 'approved'
    )
    .reduce((total, leave) => {
      return total + calculateDaysBetween(leave.startDate, leave.endDate);
    }, 0);

  return Math.max(0, allowedDays - usedLeaves);
}

// Format date range
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  if (startDate === endDate) {
    return startStr;
  }

  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return `${startStr} - ${endStr}`;
}

// Function to get readable date from ISO string
export function getReadableDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Function to get readable time from ISO string
export function getReadableTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Function to check if auto-checkout time has passed
export function shouldAutoCheckout(): boolean {
  const now = new Date();
  const settings = getAttendanceSettings();

  // Get auto checkout time settings
  const checkoutHour = settings.autoCheckoutHour;
  const checkoutMinute = settings.autoCheckoutMinute;

  // Compare current time with auto checkout time
  return (now.getHours() >= checkoutHour && now.getMinutes() >= checkoutMinute);
}
