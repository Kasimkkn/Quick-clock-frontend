export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "employee" | "admin";
    createdAt: string;
    // Adding these fields to maintain compatibility with existing components
    fullName?: string;
    mobile?: string;
    department?: string;
    designation?: string;
    photoUrl?: string;
    birthday?: string;
    password?: string; // Add this for registration
    isWfhEnabled?: boolean; // Added for WFH employee tagging
}

export interface Employee extends User {
    mobile: string;
    department: string;
    designation: string;
    photoUrl?: string;
    birthday?: string;
    isWfhEnabled?: boolean; // Added for WFH employee tagging
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
    isWithinFence?: boolean;
    timestamp?: string;
}

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    checkInTime: string;
    checkOutTime?: string;
    latitude: number;
    longitude: number;
    date: string;
    createdAt: string;
    updatedAt: string;
    manuallyAdded?: boolean;
    manuallyEdited?: boolean;
    autoCheckout?: boolean;
    lateCheckoutReason?: string;
    employee?: {
        id: string;
        fullName: string;
        designation: string;
        department: string;
    };
}

export interface Holiday {
    id: string;
    name: string;
    date: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export type LeaveType = 'sick' | 'vacation' | 'personal' | 'casual' | 'paid' | 'unpaid' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
    id: string;
    employeeId: string;
    startDate: string;
    endDate: string;
    type: LeaveType;
    reason: string;
    status: LeaveStatus;
    createdAt: string;
    updatedAt: string;
    approvedBy?: string;
    employee?: {
        id: string;
        fullName: string;
        designation: string;
        department: string;
    };
}

export type Leave = LeaveRequest;

// Update ManualRequest type to ensure status is properly typed
export type ManualRequestStatus = "pending" | "approved" | "rejected";

export interface ManualRequest {
    id: string;
    employeeId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    reason: string;
    status: ManualRequestStatus;
    createdAt: string;
    type: "new" | "edit";
    originalRecordId?: string;
    employee?: {
        id: string;
        fullName: string;
        designation: string;
        department: string;
    };
}

export type ManualAttendanceRequest = ManualRequest;

export interface GeoFence {
    id: string;
    name: string;
    centerLatitude: number;
    centerLongitude: number;
    radius: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    center?: {
        latitude: number;
        longitude: number;
    };
}

// Updated to match backend NotificationAttributes
export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: "leave" | "task" | "holiday" | "system" | "info" | "message" | "warning" | "success" | "project"; // Added all supported types
    isRead: boolean; // Changed from 'read' to 'isRead' to match backend
    referenceId?: string; // Added from backend model
    createdAt: string;
    updatedAt: string;
    time?: string; // Keep for backward compatibility
}

// Updated to match backend ProjectAttributes
export interface Project {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
    status: "active" | "completed" | "on-hold"; // Updated to match backend status values
    createdBy: string; // Added from backend model
    createdAt: string;
    updatedAt: string;
}

// Updated to match backend TaskAttributes
export interface Task {
    id: string;
    title: string;
    description: string;
    status: "todo" | "in-progress" | "completed" | "blocked";
    priority: "low" | "medium" | "high";
    projectId: string;
    project?: Project;
    assignedTo: string; // Changed from assigneeId to assignedTo to match backend
    createdBy: string; // Added from backend model
    dueDate: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean; // Updated to non-optional boolean
    // Keep these for backward compatibility
    assigneeId?: string;
    assignee?: {
        id: string;
        firstName: string;
        lastName: string;
        fullName?: string; // Added fullName for compatibility
        department: string;
        designation: string;
    };
    progress?: number;
}

export interface ProjectUpdate {
    id: string;
    projectId: string;
    userId: string;
    content: string;
    attachments?: DocumentAttachment[];
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        fullName: string;
        designation: string;
        photoUrl?: string;
    };
}

export interface DiscussionThread {
    id: string;
    projectId: string;
    title: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    lastActivity: string;
    commentCount: number;
    user?: {
        id: string;
        fullName: string;
        photoUrl?: string;
    };
}

export interface ThreadComment {
    id: string;
    threadId: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        fullName: string;
        designation: string;
        photoUrl?: string;
    };
}

export interface Meeting {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    isVirtual: boolean;
    meetingLink?: string;
    isRecurring: boolean;
    recurringPattern?: string;
    organizer: string;
    attendees: string[];
    createdAt: string;
    updatedAt: string;
    project?: {
        id: string;
        name: string;
    };
}

export interface DocumentAttachment {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    url: string;
    uploadedBy: string;
    projectId?: string;
    permissions: DocumentPermission[];
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        fullName: string;
    };
}

export interface DocumentPermission {
    userId: string;
    access: "view" | "edit" | "delete";
}

export type AuthContextType = {
    currentUser: User | null;
    login: (email: string, password: string) => Promise<User>;
    logout: () => void;
    register: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    loading: boolean;
};

// Form/Dialog description component import missing in UserManagement
import React from 'react';
export type FormDescription = React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
