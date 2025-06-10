import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { attendanceService, userService } from '@/services/api';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAttendanceStatus } from '@/lib/utils';
import { AttendanceRecord, Employee } from '@/types';
import { Loader2 } from 'lucide-react';

const COLORS = ['#4ade80', '#fb923c', '#f87171'];

const AttendanceAnalyticsOriginal = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await userService.getAllUsers();
        setEmployees(response.data.users);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setIsLoading(true);
      try {
        const response = await attendanceService.getAllAttendance();
        setAttendanceData(response.data.attendance);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  // Filter attendance data based on selected month and employee
  const filteredAttendance = attendanceData.filter(record => {
    const recordDate = record.date;
    const recordMonth = recordDate.substring(0, 7); // YYYY-MM format

    const employeeMatch = selectedEmployee === 'all' || record.employeeId === selectedEmployee;
    const monthMatch = recordMonth === selectedMonth;

    return employeeMatch && monthMatch;
  });

  // Prepare data for daily attendance chart
  const getDailyChartData = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

    return daysInMonth.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayRecords = filteredAttendance.filter(record => record.date === dayStr);

      const totalEmployees = selectedEmployee === 'all' ? employees.length : 1;
      const presentCount = dayRecords.filter(record => getAttendanceStatus(record.checkInTime) === 'present').length;
      const lateCount = dayRecords.filter(record => getAttendanceStatus(record.checkInTime) === 'late').length;
      const absentCount = totalEmployees - presentCount - lateCount;

      return {
        date: format(day, 'dd'),
        Present: presentCount,
        Late: lateCount,
        Absent: absentCount
      };
    });
  };

  // Prepare data for monthly summary chart
  const getMonthlySummaryData = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    const totalEmployees = selectedEmployee === 'all' ? employees.length : 1;
    const totalPossibleAttendances = daysInMonth * totalEmployees;

    let presentDays = 0;
    let lateDays = 0;
    let absentDays = 0;

    filteredAttendance.forEach(record => {
      const status = getAttendanceStatus(record.checkInTime);
      if (status === 'present') presentDays++;
      else if (status === 'late') lateDays++;
    });

    // Calculate absent days (total possible - present - late)
    absentDays = totalPossibleAttendances - presentDays - lateDays;
    if (absentDays < 0) absentDays = 0; // Safeguard against negative values

    const totalDays = daysInMonth; // Instead of using string concatenation
    const presentPercentage = Math.round((presentDays / totalPossibleAttendances) * 100);
    const absentPercentage = Math.round((absentDays / totalPossibleAttendances) * 100);
    const latePercentage = Math.round((lateDays / totalPossibleAttendances) * 100);

    return [
      { name: 'Present', value: presentPercentage },
      { name: 'Late', value: latePercentage },
      { name: 'Absent', value: absentPercentage }
    ];
  };

  // Get employee name by ID
  const getEmployeeName = (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? `${employee.fullName}` : 'Unknown';
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow rounded text-black">
          <p className="font-semibold">{`Day: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const PieCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow rounded text-black">
          <p>{`${payload[0]?.name}: ${payload[0]?.value}%`}</p>
        </div>
      );
    }
    return null;
  };

  const dailyChartData = getDailyChartData();
  const monthlySummaryData = getMonthlySummaryData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="w-full sm:w-1/2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(new Date().getFullYear(), i, 1);
                  return (
                    <SelectItem
                      key={i}
                      value={format(date, 'yyyy-MM')}
                    >
                      {format(date, 'MMMM yyyy')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-1/2">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.fullName} {employee.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
            <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            {isLoading ? (
              <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Present" stackId="a" fill="#4ade80" />
                    <Bar dataKey="Late" stackId="a" fill="#fb923c" />
                    <Bar dataKey="Absent" stackId="a" fill="#f87171" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary">
            {isLoading ? (
              <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={monthlySummaryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {monthlySummaryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieCustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Monthly Statistics</h3>
                  <div className="space-y-4">
                    {monthlySummaryData.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span>{item.name}</span>
                        </div>
                        <span className="font-semibold">{item.value}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium mb-2">Employee Details</h4>
                    {selectedEmployee === 'all' ? (
                      <p className="text-sm text-gray-500">Showing data for all employees</p>
                    ) : (
                      <p className="text-sm">{getEmployeeName(selectedEmployee)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AttendanceAnalyticsOriginal;
