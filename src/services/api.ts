import axios from 'axios';
import { ManualRequestStatus } from '@/types';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth-token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('auth-token', response.data.token);
            localStorage.setItem('attendance-system-current-user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    register: async (userData) => {
        return await api.post('/auth/register', userData);
    },

    logout: () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('attendance-system-current-user');
    },

    getProfile: async () => {
        return await api.get('/auth/profile');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('attendance-system-current-user');
        return user ? JSON.parse(user) : null;
    }
};

export const userService = {
    getAllUsers: async () => {
        return await api.get('/users');
    },

    getUserById: async (id) => {
        return await api.get(`/users/${id}`);
    },

    updateUserRole: async (id, role) => {
        return await api.put(`/users/update-role/${id}`, { role });
    },

    changePassword: async (id, oldPassword, newPassword) => {
        return await api.put(`/users/change-password/${id}`, { oldPassword, newPassword });
    },

    updateUser: async (id, userData) => {
        return await api.put(`/users/${id}`, userData);
    },

    deleteUser: async (id) => {
        return await api.delete(`/users/${id}`);
    }
};

export const attendanceService = {
    checkIn: async (latitude, longitude) => {
        return await api.post('/attendance/check-in', { latitude, longitude });
    },

    checkOut: async (latitude, longitude, lateCheckoutReason) => {
        return await api.post('/attendance/check-out', { latitude, longitude, lateCheckoutReason });
    },

    getMyAttendanceHistory: async () => {
        return await api.get('/attendance/my-records');
    },

    getTodayAttendance: async () => {
        return await api.get('/attendance/today');
    },

    // Admin functions
    getAllAttendance: async () => {
        return await api.get('/attendance');
    },

    getEmployeeAttendance: async (employeeId) => {
        return await api.get(`/attendance/employee/${employeeId}`);
    },

    getAttendanceByDate: async (date) => {
        return await api.get(`/attendance/date/${date}`);
    },

    manuallyAddEditAttendance: async (employeeId, date, checkInTime, checkOutTime) => {
        // Implemented TODO: manually add/edit attendance
        return await api.post(`/attendance/manually-update`, { employeeId, date, checkInTime, checkOutTime });
    },

    deleteAttendance: async (id) => {
        // Implemented TODO: delete attendance record
        return await api.delete(`/attendance/delete/${id}`);
    }
};

export const leaveService = {
    applyForLeave: async (startDate, endDate, type, reason) => {
        return await api.post('/leaves', { startDate, endDate, type, reason });
    },

    getMyLeaves: async () => {
        return await api.get('/leaves/my-leaves');
    },

    cancelLeave: async (id) => {
        return await api.delete(`/leaves/${id}`);
    },

    // Admin functions
    getAllLeaves: async () => {
        return await api.get('/leaves');
    },

    getPendingLeaves: async () => {
        return await api.get('/leaves/pending');
    },

    updateLeaveStatus: async (id, status, remarks) => {
        return await api.put(`/leaves/${id}/status`, { status, remarks });
    },

    // Add this method for leave balance
    getMyLeaveBalance: async () => {
        return await api.get('/leaves/my-balance');
    }
};

export const manualRequestService = {
    submitManualRequest: async (date, checkInTime, checkOutTime, reason) => {
        return await api.post('/manual-requests', { date, checkInTime, checkOutTime, reason });
    },

    getMyManualRequests: async () => {
        return await api.get('/manual-requests/my-requests');
    },

    cancelManualRequest: async (id) => {
        return await api.delete(`/manual-requests/${id}`);
    },

    // Admin functions
    getAllManualRequests: async () => {
        return await api.get('/manual-requests');
    },

    getPendingManualRequests: async () => {
        return await api.get('/manual-requests/pending');
    },

    processManualRequest: async (id, status: ManualRequestStatus, remarks) => {
        return await api.put(`/manual-requests/${id}/process`, { status, remarks });
    }
};

export const holidayService = {
    getAllHolidays: async () => {
        return await api.get('/holidays');
    },

    // Admin functions
    getHolidayById: async (id) => {
        // Implemented TODO: get holiday by ID
        return await api.get(`/holidays/${id}`);
    },

    createHoliday: async (name, date, description) => {
        return await api.post('/holidays', { name, date, description });
    },

    updateHoliday: async (id, name, date, description) => {
        return await api.put(`/holidays/${id}`, { name, date, description });
    },

    deleteHoliday: async (id) => {
        return await api.delete(`/holidays/${id}`);
    }
};

export const geofenceService = {
    getAllGeoFences: async () => {
        return await api.get('/geofences');
    },

    // Admin functions
    getGeoFenceById: async (id) => {
        // Implemented TODO: get geofence by ID
        return await api.get(`/geofences/${id}`);
    },

    createGeoFence: async (name, centerLatitude, centerLongitude, radius, active) => {
        return await api.post('/geofences', { name, centerLatitude, centerLongitude, radius, active });
    },

    updateGeoFence: async (id, name, centerLatitude, centerLongitude, radius, active) => {
        return await api.put(`/geofences/${id}`, { name, centerLatitude, centerLongitude, radius, active });
    },

    deleteGeoFence: async (id) => {
        return await api.delete(`/geofences/${id}`);
    },

    isLocationWithinGeoFence: async (latitude, longitude) => {
        return await api.post('/geofences/check-location', { latitude, longitude });
    },

    // Add update location method
    updateLocation: async (id, data) => {
        return await api.put(`/geofences/location/${id}`, data);
    },

    // Add create location method
    createLocation: async (data) => {
        return await api.post('/geofences/location', data);
    }
};

export const notificationService = {
    getMyNotifications: async () => {
        return await api.get('/notifications');
    },

    getUnreadCount: async () => {
        return await api.get('/notifications/unread-count');
    },

    markAllAsRead: async () => {
        return await api.patch('/notifications/mark-all-read');
    },

    deleteAllRead: async () => {
        return await api.delete('/notifications/delete-all-read');
    },

    markAsRead: async (id) => {
        return await api.patch(`/notifications/${id}/read`);
    },

    deleteNotification: async (id) => {
        return await api.delete(`/notifications/${id}`);
    },

    // Add method to create notification for a single user
    createNotification: async (data) => {
        return await api.post('/notifications', data);
    },

    // Add method to create notification for multiple users
    createBulkNotifications: async (userIds, data) => {
        return await api.post('/notifications/bulk', {
            userIds,
            data
        });
    },

    // Add method to create notification for all users
    createNotificationForAll: async (data) => {
        return await api.post('/notifications/all', data);
    },

};

export const taskService = {
    getAllTasks: async () => {
        return await api.get('/tasks');
    },

    getMyTasks: async () => {
        return await api.get('/tasks/my-tasks');
    },

    getTaskById: async (id) => {
        return await api.get(`/tasks/${id}`);
    },

    createTask: async (taskData) => {
        return await api.post('/tasks', taskData);
    },

    updateTaskStatus: async (id, status) => {
        return await api.patch(`/tasks/${id}/status`, { status });
    },

    updateTask: async (id, taskData) => {
        return await api.put(`/tasks/${id}`, taskData);
    },

    deleteTask: async (id) => {
        return await api.delete(`/tasks/${id}`);
    },

    updateTaskRequest: async (id, title, description) => {
        return await api.put(`/tasks/request-update/${id}`, { title, description });
    }
};

export const projectService = {
    getAllProjects: async () => {
        return await api.get('/projects');
    },

    getProjectById: async (id) => {
        return await api.get(`/projects/${id}`);
    },

    createProject: async (projectData) => {
        return await api.post('/projects', projectData);
    },

    updateProject: async (id, projectData) => {
        return await api.put(`/projects/${id}`, projectData);
    },

    deleteProject: async (id) => {
        return await api.delete(`/projects/${id}`);
    },
    
    // New collaboration methods
    getProjectUpdates: async (projectId) => {
        return await api.get(`/projects/${projectId}/updates`);
    },
    
    createProjectUpdate: async (projectId, updateData) => {
        return await api.post(`/projects/${projectId}/updates`, updateData);
    }
};

// New collaboration service
export const collaborationService = {
    // Discussion threads
    getThreads: async (projectId) => {
        return await api.get(`/collaboration/threads?projectId=${projectId}`);
    },
    
    createThread: async (threadData) => {
        return await api.post('/collaboration/threads', threadData);
    },
    
    getComments: async (threadId) => {
        return await api.get(`/collaboration/threads/${threadId}/comments`);
    },
    
    addComment: async (threadId, commentData) => {
        return await api.post(`/collaboration/threads/${threadId}/comments`, commentData);
    },
    
    // Meetings
    getMeetings: async (options = {}) => {
        return await api.get('/collaboration/meetings', { params: options });
    },
    
    createMeeting: async (meetingData) => {
        return await api.post('/collaboration/meetings', meetingData);
    },
    
    updateMeeting: async (meetingId, meetingData) => {
        return await api.put(`/collaboration/meetings/${meetingId}`, meetingData);
    },
    
    deleteMeeting: async (meetingId) => {
        return await api.delete(`/collaboration/meetings/${meetingId}`);
    },
    
    // Documents
    getDocuments: async (projectId) => {
        return await api.get(`/collaboration/documents?projectId=${projectId}`);
    },
    
    uploadDocument: async (formData) => {
        return await api.post('/collaboration/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    
    deleteDocument: async (documentId) => {
        return await api.delete(`/collaboration/documents/${documentId}`);
    },
    
    updateDocumentPermissions: async (documentId, permissionsData) => {
        return await api.put(`/collaboration/documents/${documentId}/permissions`, permissionsData);
    }
};

export default {
    authService,
    userService,
    attendanceService,
    leaveService,
    manualRequestService,
    holidayService,
    geofenceService,
    notificationService,
    taskService,
    projectService,
    collaborationService
};
