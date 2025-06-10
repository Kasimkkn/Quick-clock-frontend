import { calculateWorkingHours, getAttendanceStatus } from "@/lib/utils";
import { attendanceService, userService } from "@/services/api";
import { AttendanceRecord, Employee } from "@/types";
import { useEffect, useState } from "react";
import AttendanceLogFilters from "./AttendanceLogFilters";
import AttendanceLogTable from "./AttendanceLogTable";

type AttendanceLogProps = {
  employeeId?: string;
};

export default function AttendanceLog({
  employeeId
}: Readonly<AttendanceLogProps>) {
  const [dateFilter, setDateFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>(employeeId || "all");
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (!dateFilter && !monthFilter) {
      setDateFilter(new Date().toISOString().split("T")[0]);
    }

    const fetchAttendanceRecords = async () => {
      try {
        const records = await attendanceService.getAllAttendance();
        if (records) {
          setAllAttendanceRecords(records.data.attendance);
        }
      } catch (error) {
        console.log("Error fetching attendance records:", error);
      }
    }

    const fetchEmployees = async () => {
      try {
        const employees = await userService.getAllUsers();
        if (employees) {
          setAllEmployees(employees.data.users);
        }
      } catch (error) {
        console.log("Error fetching employees:", error);
      }
    }

    fetchEmployees();
    fetchAttendanceRecords();
  }, []);

  // Handle month filter change - clear date filter when month is selected
  const handleMonthFilterChange = (month: string) => {
    setMonthFilter(month);
    if (month) {
      setDateFilter(""); // Clear date filter when month is selected
    }
  };

  // Handle date filter change - clear month filter when date is selected
  const handleDateFilterChange = (date: string) => {
    setDateFilter(date);
    if (date) {
      setMonthFilter(""); // Clear month filter when date is selected
    }
  };

  const departments = [...new Set(allEmployees.map(emp => emp.department))];

  const filteredRecords = allAttendanceRecords.filter(record => {
    if (employeeId && record.employeeId !== employeeId) {
      return false;
    }

    if (selectedEmployee && selectedEmployee !== "all" && record.employeeId !== selectedEmployee) {
      return false;
    }

    // Month filter takes priority over date filter
    if (monthFilter) {
      const monthString = record.date.slice(0, 7);
      if (monthString !== monthFilter) return false;
    } else if (dateFilter && record.date !== dateFilter) {
      // Only apply date filter if month filter is not set
      return false;
    }

    return true;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getEmployeeData = (id: string): Employee | undefined => {
    return allEmployees.find(emp => emp.id === id);
  };

  const exportToCsv = () => {
    const headers = ['Date', 'Employee Name', 'Department', 'Check-in Time', 'Check-out Time', 'Working Hours', 'Status'];
    const rows = sortedRecords.map(record => {
      const employee = getEmployeeData(record.employeeId);
      const status = getAttendanceStatus(record.checkInTime);
      return [record.date, employee?.fullName || 'Unknown', employee?.department || 'Unknown', record.checkInTime || 'N/A', record.checkOutTime || 'N/A', calculateWorkingHours(record.checkInTime, record.checkOutTime), status];
    });
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allMonths = Array.from(
    new Set(
      allAttendanceRecords.map(r => r.date.slice(0, 7))
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-4">
      <AttendanceLogFilters
        dateFilter={dateFilter}
        setDateFilter={handleDateFilterChange}
        monthFilter={monthFilter}
        setMonthFilter={handleMonthFilterChange}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        allMonths={allMonths}
        allEmployees={allEmployees}
        departments={departments}
        employeeId={employeeId}
        onReset={() => {
          setDateFilter(new Date().toISOString().split("T")[0]);
          setMonthFilter("");
          setDepartmentFilter("all");
          setSelectedEmployee(employeeId || "all");
        }}
        onExport={exportToCsv}
      />
      <AttendanceLogTable
        sortedRecords={sortedRecords}
        employeeId={employeeId}
        getEmployeeData={getEmployeeData}
      />
    </div>
  );
}