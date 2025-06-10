
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter as FilterIcon } from "lucide-react";
import { Employee, AttendanceRecord } from "@/types";

type AttendanceLogFiltersProps = {
  dateFilter: string;
  setDateFilter: (val: string) => void;
  monthFilter: string;
  setMonthFilter: (val: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (val: string) => void;
  selectedEmployee: string;
  setSelectedEmployee: (val: string) => void;
  allMonths: string[];
  allEmployees: Employee[];
  departments: string[];
  employeeId?: string;
  onReset: () => void;
  onExport: () => void;
};

export default function AttendanceLogFilters({
  dateFilter,
  setDateFilter,
  monthFilter,
  setMonthFilter,
  departmentFilter,
  setDepartmentFilter,
  selectedEmployee,
  setSelectedEmployee,
  allMonths,
  allEmployees,
  departments,
  employeeId,
  onReset,
  onExport,
}: AttendanceLogFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-1/3">
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} placeholder="Filter by date" className="w-full" />
      </div>

      <div className="w-full sm:w-1/3">
        <select
          className="w-full border rounded px-3 py-2 text-base md:text-sm bg-background"
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
        >
          <option value="">Filter by month</option>
          {allMonths.map(month => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      {!employeeId && (
        <>
          <div className="w-full sm:w-1/3">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-1/3">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {allEmployees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="w-full sm:w-auto flex gap-2">
        <Button variant="outline" onClick={onReset}>
          <FilterIcon className="h-4 w-4 mr-2" /> Clear Filters
        </Button>
        <Button onClick={onExport}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>
    </div>
  );
}
