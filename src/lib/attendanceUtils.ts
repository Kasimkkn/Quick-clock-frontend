import { userService, attendanceService, leaveService, holidayService } from "@/services/api";

/**
 * Processes employee absences for the current day and auto-deducts casual leave
 * for employees who are absent without an approved leave
 * 
 * @returns {Promise<void>}
 */
export const processAbsentees = async (): Promise<void> => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Skip processing if today is a holiday
        if (await isHoliday(today)) {
            console.log("Today is a holiday. Skipping absence processing.");
            return;
        }

        // Skip weekends (0 = Sunday, 6 = Saturday)
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            console.log("Today is a weekend. Skipping absence processing.");
            return;
        }

        // Get all employees
        const employees = await getAllEmployees();
        console.log(`Processing absences for ${employees.length} employees`);

        // Process each employee
        for (const employee of employees) {
            await processEmployeeAbsence(employee, today);
        }

        console.log("Completed processing absences for today");
    } catch (error) {
        console.error("Error processing absentees:", error);
    }
};

/**
 * Checks if a specific date is a holiday
 * 
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<boolean>}
 */
async function isHoliday(date: string): Promise<boolean> {
    try {
        const holidaysResponse = await holidayService.getAllHolidays();

        if (!holidaysResponse?.data?.holidays) {
            console.warn("Could not retrieve holidays data");
            return false;
        }

        const holidays = holidaysResponse.data.holidays;
        return holidays.some(holiday => holiday.date === date);
    } catch (error) {
        console.error("Error checking holidays:", error);
        return false; // Default to not a holiday if there's an error
    }
}

/**
 * Fetches all employees from the API
 * 
 * @returns {Promise<Array>} - Array of employee objects
 */
async function getAllEmployees(): Promise<any[]> {
    try {
        const employeesResponse = await userService.getAllUsers();

        if (!employeesResponse?.data?.users) {
            console.warn("Could not retrieve employee data");
            return [];
        }

        return employeesResponse.data.users;
    } catch (error) {
        console.error("Error fetching employees:", error);
        return []; // Return empty array on error
    }
}

/**
 * Process absence for a specific employee on a specific date
 * 
 * @param {Object} employee - Employee object
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<void>}
 */
async function processEmployeeAbsence(employee: any, date: string): Promise<void> {
    try {
        // Check if employee has attendance for today
        const hasAttendance = await checkEmployeeAttendance(employee.id, date);

        if (!hasAttendance) {
            // Check if employee is on approved leave
            const isOnLeave = await checkEmployeeOnLeave(employee.id, date);

            if (!isOnLeave) {
                // Auto-deduct casual leave
                await autoDeductCasualLeave(employee.id, date);
                console.log(`Auto-deducted leave for employee ${employee.fullName || employee.name || employee.id} due to absence`);
            }
        }
    } catch (error) {
        console.error(`Error processing absence for employee ${employee.id}:`, error);
    }
}

/**
 * Checks if an employee has attendance on a specific date
 * 
 * @param {string} employeeId - Employee ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<boolean>}
 */
async function checkEmployeeAttendance(employeeId: string, date: string): Promise<boolean> {
    try {
        const attendanceResponse = await attendanceService.getEmployeeAttendance(employeeId);

        if (!attendanceResponse?.data?.attendance) {
            return false;
        }

        const employeeAttendance = attendanceResponse.data.attendance;
        const todayAttendance = employeeAttendance.find(record => record.date === date);

        return !!(todayAttendance && todayAttendance.checkInTime);
    } catch (error) {
        console.error(`Error checking attendance for employee ${employeeId}:`, error);
        return false;
    }
}

/**
 * Checks if an employee is on approved leave for a specific date
 * 
 * @param {string} employeeId - Employee ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<boolean>}
 */
async function checkEmployeeOnLeave(employeeId: string, date: string): Promise<boolean> {
    try {
        const leavesResponse = await leaveService.getAllLeaves();

        if (!leavesResponse?.data?.leaves) {
            return false;
        }

        const employeeLeaves = leavesResponse.data.leaves.filter(leave => leave.employeeId === employeeId);

        return employeeLeaves.some(leave => {
            if (leave.status !== 'approved') return false;

            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            const checkDate = new Date(date);

            return checkDate >= startDate && checkDate <= endDate;
        });
    } catch (error) {
        console.error(`Error checking leaves for employee ${employeeId}:`, error);
        return false;
    }
}

/**
 * Auto-deducts casual leave for an employee on a specific date
 * 
 * @param {string} employeeId - Employee ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<void>}
 */
async function autoDeductCasualLeave(employeeId: string, date: string): Promise<void> {
    try {
        // Using the employee's ID for auto-deduction
        await leaveService.applyForLeave(date, date, 'casual', 'Auto-deducted for absence');
    } catch (error) {
        console.error(`Error applying auto-deducted leave for employee ${employeeId}:`, error);
        throw error; // Re-throw to be handled by the calling function
    }
}