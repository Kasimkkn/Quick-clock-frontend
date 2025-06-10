
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateWorkingHours, formatDateTime, getAttendanceStatus } from "@/lib/utils";
import { attendanceService } from "@/services/api";
import { AttendanceRecord } from "@/types";
import { Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function EmployeeAttendanceHistory() {
  // Initialize with empty date filters to show all records by default
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  const [dateFilter, setDateFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [employeeRecords, setEmployeeRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeAttendance = async () => {
      try {
        setIsLoading(true);
        const records = await attendanceService.getMyAttendanceHistory();
        if (records.data) {
          console.log('Fetched employee attendance:', records.data.attendance);
          setEmployeeRecords(records.data.attendance);
        }
      } catch (error) {
        console.log('Error fetching employee attendance:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployeeAttendance();
  }, []);

  // Apply filters
  const filteredRecords = employeeRecords.filter(record => {
    // Filter by specific date if set
    if (dateFilter && record.date !== dateFilter) {
      return false;
    }

    // Filter by month if set
    if (monthFilter) {
      const recordDate = new Date(record.date);
      const recordMonth = recordDate.toISOString().substring(0, 7); // YYYY-MM
      if (recordMonth !== monthFilter) {
        return false;
      }
    }

    return true;
  });

  // Sort records by date (newest first)
  const sortedRecords = [...filteredRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate statistics
  const totalDays = employeeRecords.length;
  const presentDays = employeeRecords.filter(record => getAttendanceStatus(record.checkInTime) === 'present').length;
  const lateDays = employeeRecords.filter(record => getAttendanceStatus(record.checkInTime) === 'late').length;
  const absentDays = employeeRecords.filter(record => !record.checkInTime).length;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Attendance History</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Days</h3>
          <p className="text-lg font-bold">{totalDays}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Present</h3>
          <p className="text-lg font-bold text-green-600">{presentDays}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Late</h3>
          <p className="text-lg font-bold text-yellow-600">{lateDays}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Absent</h3>
          <p className="text-lg font-bold text-red-600">{absentDays}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-1/3">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              if (dateFilter !== e.target.value) {
                setDateFilter(e.target.value);
                if (e.target.value) setMonthFilter("");
              }
            }}
            placeholder="Filter by date"
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-1/3">
          <Input
            type="month"
            value={monthFilter}
            onChange={(e) => {
              if (monthFilter !== e.target.value) {
                setMonthFilter(e.target.value);
                if (e.target.value) setDateFilter("");
              }
            }}
            placeholder="Filter by month"
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => {
              setDateFilter("");
              setMonthFilter("");
            }}
            className="w-full sm:w-auto"
          >
            <Filter className="h-4 w-4 mr-2" /> Reset Filters
          </Button>
        </div>
      </div>

      {/* Attendance records table */}
      <div className="border rounded-md">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Working Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.length > 0 ? sortedRecords.map(record => {
                const status = getAttendanceStatus(record.checkInTime);
                return (
                  <TableRow key={record.id}>
                    <TableCell>{formatDateTime(record.date)}</TableCell>
                    <TableCell>{record.checkInTime || 'Not recorded'}</TableCell>
                    <TableCell>{record.checkOutTime || 'Not recorded'}</TableCell>
                    <TableCell>
                      {calculateWorkingHours(record.checkInTime, record.checkOutTime)}
                    </TableCell>
                    <TableCell>
                      <Badge className={status === 'present' ? 'bg-attendance-present' : status === 'late' ? 'bg-attendance-late' : 'bg-attendance-absent'}>
                        {status === 'present' ? 'Present' : status === 'late' ? 'Late' : 'Absent'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No attendance records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
