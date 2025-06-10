
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Employee, AttendanceRecord } from "@/types";
import { getAttendanceStatus, formatDateTime, calculateWorkingHours } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type AttendanceLogTableProps = {
  sortedRecords: AttendanceRecord[];
  employeeId?: string;
  getEmployeeData: (id: string) => Employee | undefined;
};

export default function AttendanceLogTable({ sortedRecords, employeeId, getEmployeeData }: Readonly<AttendanceLogTableProps>) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {!employeeId && <TableHead>Employee</TableHead>}
            {!employeeId && <TableHead>Department</TableHead>}
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
                {!employeeId && <TableCell className="font-medium">{record.employee?.fullName || 'Unknown'}</TableCell>}
                {!employeeId && <TableCell>{record.employee?.department || 'N/A'}</TableCell>}
                <TableCell>{record.checkInTime || 'Not recorded'}</TableCell>
                <TableCell>{record.checkOutTime || 'Not recorded'}</TableCell>
                <TableCell>
                  {calculateWorkingHours(record.checkInTime, record.checkOutTime)}
                </TableCell>
                <TableCell>
                  <Badge className={status === 'present'
                    ? 'bg-attendance-present'
                    : status === 'late'
                      ? 'bg-attendance-late'
                      : 'bg-attendance-absent'}>
                    {status === 'present' ? 'Present' : status === 'late' ? 'Late' : 'Absent'}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={employeeId ? 4 : 7} className="h-24 text-center">
                No attendance records found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
