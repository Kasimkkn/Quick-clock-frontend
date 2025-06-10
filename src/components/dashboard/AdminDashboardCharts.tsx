
import { useState, useEffect } from "react";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
  Line,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addDays, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  eachWeekOfInterval,
  subWeeks,
  addWeeks,
  subMonths,
  addMonths
} from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { userService, attendanceService, leaveService, taskService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface AdminDashboardChartsProps {
  chartType: string;
}

const AdminDashboardCharts = ({ chartType }: AdminDashboardChartsProps) => {
  const [dateRange, setDateRange] = useState<"daily" | "weekly" | "monthly" | "yearly" | "custom">("daily");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [chartData, setChartData] = useState<any[]>([]);

  // Update date range when date or dateRange changes
  useEffect(() => {
    if (!date) return;

    if (dateRange === "weekly") {
      setStartDate(startOfWeek(date, { weekStartsOn: 1 }));
      setEndDate(endOfWeek(date, { weekStartsOn: 1 }));
    } else if (dateRange === "monthly") {
      setStartDate(startOfMonth(date));
      setEndDate(endOfMonth(date));
    } else {
      setStartDate(date);
      setEndDate(date);
    }
  }, [date, dateRange]);

  // Fetch employee data for pie chart
  const { data: employeesData } = useQuery({
    queryKey: ['all-employees', dateRange, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      try {
        const response = await userService.getAllUsers();
        return response.data.users || [];
      } catch (error) {
        console.error("Error fetching employees:", error);
        return [];
      }
    },
    enabled: chartType === 'employees'
  });

  // Fetch attendance data with date range
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-data', dateRange, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      try {
        if (dateRange === 'daily' && date) {
          const dateStr = format(date, 'yyyy-MM-dd');
          const response = await attendanceService.getAttendanceByDate(dateStr);
          return { records: response.data.attendance || [], type: 'daily' };
        } else if (dateRange === 'weekly' && startDate && endDate) {
          // Fetch attendance for each day in the week
          const days = eachDayOfInterval({ start: startDate, end: endDate });
          const records = [];
          
          for (const day of days) {
            const dateStr = format(day, 'yyyy-MM-dd');
            const response = await attendanceService.getAttendanceByDate(dateStr);
            records.push({
              date: day,
              data: response.data.attendance || []
            });
          }
          
          return { records, type: 'weekly' };
        } else if (dateRange === 'monthly' && startDate && endDate) {
          // Fetch attendance for each week in the month
          const weeks = eachWeekOfInterval(
            { start: startDate, end: endDate },
            { weekStartsOn: 1 }
          );
          
          const records = [];
          
          for (let i = 0; i < weeks.length; i++) {
            const weekStart = weeks[i];
            const weekEnd = i < weeks.length - 1 
              ? subDays(weeks[i + 1], 1) 
              : endDate;
              
            const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
            
            const weekRecords = [];
            for (const day of weekDays) {
              const dateStr = format(day, 'yyyy-MM-dd');
              const response = await attendanceService.getAttendanceByDate(dateStr);
              weekRecords.push({
                date: day,
                data: response.data.attendance || []
              });
            }
            
            records.push({
              week: i + 1,
              startDate: weekStart,
              endDate: weekEnd,
              data: weekRecords
            });
          }
          
          return { records, type: 'monthly' };
        } else {
          // Fallback to daily
          const today = date || new Date();
          const dateStr = format(today, 'yyyy-MM-dd');
          const response = await attendanceService.getAttendanceByDate(dateStr);
          return { records: response.data.attendance || [], type: 'daily' };
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
        return { records: [], type: dateRange };
      }
    },
    enabled: chartType === 'attendance'
  });

  // Fetch leaves data with date range
  const { data: leavesData } = useQuery({
    queryKey: ['leaves-data', dateRange, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      try {
        const response = await leaveService.getAllLeaves();
        const allLeaves = response.data || [];
        
        // Filter leaves based on date range
        const filteredLeaves = allLeaves.filter((leave: any) => {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);
          
          // Check if the leave overlaps with our date range
          return (
            (leaveStart <= endDate && leaveEnd >= startDate) ||
            (leaveStart >= startDate && leaveStart <= endDate) ||
            (leaveEnd >= startDate && leaveEnd <= endDate)
          );
        });
        
        return filteredLeaves;
      } catch (error) {
        console.error("Error fetching leaves:", error);
        return [];
      }
    },
    enabled: chartType === 'leaves'
  });

  // Fetch tasks data with potential date filtering
  const { data: tasksData } = useQuery({
    queryKey: ['tasks-data', dateRange, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      try {
        const response = await taskService.getAllTasks();
        const allTasks = response.data.tasks || [];
        
        // Filter tasks based on date range if tasks have createdAt or dueDate
        const filteredTasks = allTasks.filter((task: any) => {
          if (!task.dueDate) return true; // Include tasks without due date
          
          const dueDate = new Date(task.dueDate);
          return dueDate >= startDate && dueDate <= endDate;
        });
        
        return filteredTasks;
      } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }
    },
    enabled: chartType === 'tasks'
  });

  // Query for fetching employees count
  const { data: employeesCountData } = useQuery({
    queryKey: ['employees-count'],
    queryFn: async () => {
      try {
        const response = await userService.getAllUsers();
        return response.data.users || [];
      } catch (error) {
        console.error("Error fetching employees count:", error);
        return [];
      }
    }
  });

  useEffect(() => {
    // Update chart data based on selected chart type and date range
    const processData = async () => {
      try {
        if (chartType === 'attendance' && attendanceData) {
          // Process attendance data
          let processedData: any[] = [];
          
          // Get total employees count once outside of the mapping functions
          const employees = employeesCountData || [];
          const totalEmployees = employees.length || 0;
          
          if (attendanceData.type === 'daily') {
            const records = attendanceData.records;
            const presentCount = records.filter((record: any) => record.checkInTime).length;
            const lateCount = records.filter((record: any) => {
              if (!record.checkInTime) return false;
              const checkInHour = parseInt(record.checkInTime.split(':')[0]);
              const checkInMinute = parseInt(record.checkInTime.split(':')[1]);
              return checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15);
            }).length;
            
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const dayName = days[(date || new Date()).getDay() === 0 ? 6 : (date || new Date()).getDay() - 1];
            
            processedData = [
              { 
                name: dayName, 
                present: presentCount, 
                absent: totalEmployees - presentCount, 
                late: lateCount 
              }
            ];
          } else if (attendanceData.type === 'weekly') {
            const records = attendanceData.records;
            
            processedData = records.map((dayRecord: any) => {
              const day = dayRecord.date;
              const dayName = format(day, 'E');
              const data = dayRecord.data;
              
              const presentCount = data.filter((record: any) => record.checkInTime).length;
              const lateCount = data.filter((record: any) => {
                if (!record.checkInTime) return false;
                const checkInHour = parseInt(record.checkInTime.split(':')[0]);
                const checkInMinute = parseInt(record.checkInTime.split(':')[1]);
                return checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15);
              }).length;
              
              return {
                name: dayName,
                present: presentCount,
                absent: totalEmployees - presentCount,
                late: lateCount
              };
            });
          } else if (attendanceData.type === 'monthly') {
            // Fix: Remove await inside map function
            processedData = attendanceData.records.map((weekRecord: any) => {
              // No await here anymore, use the already fetched employees count
              let totalPresent = 0;
              let totalAbsent = 0;
              let totalLate = 0;
              
              weekRecord.data.forEach((dayRecord: any) => {
                const data = dayRecord.data;
                const presentCount = data.filter((record: any) => record.checkInTime).length;
                const lateCount = data.filter((record: any) => {
                  if (!record.checkInTime) return false;
                  const checkInHour = parseInt(record.checkInTime.split(':')[0]);
                  const checkInMinute = parseInt(record.checkInTime.split(':')[1]);
                  return checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15);
                }).length;
                
                totalPresent += presentCount;
                totalAbsent += (totalEmployees - presentCount); // Fix: Use totalEmployees instead of employees
                totalLate += lateCount;
              });
              
              return {
                name: `Week ${weekRecord.week}`,
                present: totalPresent,
                absent: totalAbsent,
                late: totalLate
              };
            });
          } else {
            // Fallback to default data
            processedData = [
              { name: "Mon", present: 42, absent: 5, late: 3 },
              { name: "Tue", present: 45, absent: 2, late: 3 },
              { name: "Wed", present: 43, absent: 4, late: 3 },
              { name: "Thu", present: 40, absent: 7, late: 3 },
              { name: "Fri", present: 44, absent: 3, late: 3 }
            ];
          }
          
          setChartData(processedData);
        } 
        else if (chartType === 'employees' && employeesData) {
          // Process employee data for pie chart
          const totalEmployees = employeesData.length;
          const wfhCount = employeesData.filter((emp: any) => emp.isWfhEnabled).length;
          const regularCount = totalEmployees - wfhCount;
          
          const departmentMap: Record<string, number> = {};
          employeesData.forEach((emp: any) => {
            const dept = emp.department || 'Other';
            departmentMap[dept] = (departmentMap[dept] || 0) + 1;
          });
          
          const departmentData = Object.entries(departmentMap).map(([name, value]) => ({ name, value }));
          
          setChartData(departmentData.length > 0 ? departmentData : [
            { name: "IT", value: 35 },
            { name: "HR", value: 10 },
            { name: "Finance", value: 15 },
            { name: "Marketing", value: 20 }
          ]);
        } 
        else if (chartType === 'tasks' && tasksData) {
          // Process tasks data based on date range
          if (dateRange === 'daily') {
            const todoCount = tasksData.filter((task: any) => task.status === 'todo').length;
            const inProgressCount = tasksData.filter((task: any) => task.status === 'in-progress').length;
            const completedCount = tasksData.filter((task: any) => task.status === 'completed').length;
            const blockedCount = tasksData.filter((task: any) => task.status === 'blocked').length;
            
            setChartData([
              { name: format(date || new Date(), 'MMM d'), completed: completedCount, inProgress: inProgressCount, pending: todoCount, blocked: blockedCount }
            ]);
          } else if (dateRange === 'weekly') {
            // Group tasks by due date within the week
            const dayTasksMap: Record<string, any> = {};
            
            // Initialize days
            const days = eachDayOfInterval({ start: startDate, end: endDate });
            days.forEach(day => {
              const dayKey = format(day, 'E');
              dayTasksMap[dayKey] = { 
                name: dayKey, 
                completed: 0, 
                inProgress: 0, 
                pending: 0, 
                blocked: 0 
              };
            });
            
            // Count tasks by day and status
            tasksData.forEach((task: any) => {
              if (!task.dueDate) return;
              
              const dueDate = new Date(task.dueDate);
              const dayKey = format(dueDate, 'E');
              
              if (dayTasksMap[dayKey]) {
                if (task.status === 'completed') dayTasksMap[dayKey].completed++;
                else if (task.status === 'in-progress') dayTasksMap[dayKey].inProgress++;
                else if (task.status === 'todo') dayTasksMap[dayKey].pending++;
                else if (task.status === 'blocked') dayTasksMap[dayKey].blocked++;
              }
            });
            
            setChartData(Object.values(dayTasksMap));
          } else if (dateRange === 'monthly') {
            // Group tasks by week within the month
            const weekTasksMap: Record<string, any> = {};
            const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
            
            // Initialize weeks
            for (let i = 0; i < weeks.length; i++) {
              const weekKey = `Week ${i + 1}`;
              weekTasksMap[weekKey] = {
                name: weekKey,
                completed: 0,
                inProgress: 0,
                pending: 0,
                blocked: 0
              };
            }
            
            // Count tasks by week and status
            tasksData.forEach((task: any) => {
              if (!task.dueDate) return;
              
              const dueDate = new Date(task.dueDate);
              
              // Find which week this task belongs to
              for (let i = 0; i < weeks.length; i++) {
                const weekStart = weeks[i];
                const weekEnd = i < weeks.length - 1 
                  ? subDays(weeks[i + 1], 1) 
                  : endDate;
                  
                if (dueDate >= weekStart && dueDate <= weekEnd) {
                  const weekKey = `Week ${i + 1}`;
                  
                  if (task.status === 'completed') weekTasksMap[weekKey].completed++;
                  else if (task.status === 'in-progress') weekTasksMap[weekKey].inProgress++;
                  else if (task.status === 'todo') weekTasksMap[weekKey].pending++;
                  else if (task.status === 'blocked') weekTasksMap[weekKey].blocked++;
                  
                  break;
                }
              }
            });
            
            setChartData(Object.values(weekTasksMap));
          } else {
            // Default data
            const todoCount = tasksData.filter((task: any) => task.status === 'todo').length;
            const inProgressCount = tasksData.filter((task: any) => task.status === 'in-progress').length;
            const completedCount = tasksData.filter((task: any) => task.status === 'completed').length;
            const blockedCount = tasksData.filter((task: any) => task.status === 'blocked').length;
            
            setChartData([
              { name: "Current", completed: completedCount, inProgress: inProgressCount, pending: todoCount, blocked: blockedCount }
            ]);
          }
        } 
        else if (chartType === 'leaves' && leavesData) {
          // Process leaves data based on date range
          if (dateRange === 'daily') {
            const leaveTypes: Record<string, number> = {
              sick: 0,
              vacation: 0,
              personal: 0,
              casual: 0,
            };
            
            leavesData.forEach((leave: any) => {
              const type = leave.type || 'other';
              if (leaveTypes[type] !== undefined) {
                leaveTypes[type]++;
              }
            });
            
            setChartData([
              { 
                name: format(date || new Date(), 'MMM d'), 
                sick: leaveTypes.sick || 0,
                vacation: leaveTypes.vacation || 0,
                personal: leaveTypes.personal || 0,
                casual: leaveTypes.casual || 0,
              }
            ]);
          } else if (dateRange === 'weekly') {
            // Group leaves by day
            const dayLeavesMap: Record<string, any> = {};
            
            // Initialize days
            const days = eachDayOfInterval({ start: startDate, end: endDate });
            days.forEach(day => {
              const dayKey = format(day, 'E');
              dayLeavesMap[dayKey] = { 
                name: dayKey, 
                sick: 0,
                vacation: 0,
                personal: 0,
                casual: 0
              };
            });
            
            // Count leaves by day and type
            leavesData.forEach((leave: any) => {
              const leaveStart = new Date(leave.startDate);
              const leaveEnd = new Date(leave.endDate);
              const leaveDays = eachDayOfInterval({ start: leaveStart, end: leaveEnd });
              
              leaveDays.forEach(day => {
                if (day >= startDate && day <= endDate) {
                  const dayKey = format(day, 'E');
                  const type = leave.type || 'other';
                  
                  if (dayLeavesMap[dayKey] && dayLeavesMap[dayKey][type] !== undefined) {
                    dayLeavesMap[dayKey][type]++;
                  }
                }
              });
            });
            
            setChartData(Object.values(dayLeavesMap));
          } else if (dateRange === 'monthly') {
            // Group leaves by week
            const weekLeavesMap: Record<string, any> = {};
            const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
            
            // Initialize weeks
            for (let i = 0; i < weeks.length; i++) {
              const weekKey = `Week ${i + 1}`;
              weekLeavesMap[weekKey] = {
                name: weekKey,
                sick: 0,
                vacation: 0,
                personal: 0,
                casual: 0
              };
            }
            
            // Count leaves by week and type
            leavesData.forEach((leave: any) => {
              const leaveStart = new Date(leave.startDate);
              const leaveEnd = new Date(leave.endDate);
              const leaveDays = eachDayOfInterval({ start: leaveStart, end: leaveEnd });
              
              leaveDays.forEach(day => {
                if (day >= startDate && day <= endDate) {
                  // Find which week this day belongs to
                  for (let i = 0; i < weeks.length; i++) {
                    const weekStart = weeks[i];
                    const weekEnd = i < weeks.length - 1 
                      ? subDays(weeks[i + 1], 1) 
                      : endDate;
                      
                    if (day >= weekStart && day <= weekEnd) {
                      const weekKey = `Week ${i + 1}`;
                      const type = leave.type || 'other';
                      
                      if (weekLeavesMap[weekKey] && weekLeavesMap[weekKey][type] !== undefined) {
                        weekLeavesMap[weekKey][type]++;
                      }
                      
                      break;
                    }
                  }
                }
              });
            });
            
            setChartData(Object.values(weekLeavesMap));
          } else {
            // Default data
            const leaveTypes: Record<string, number> = {
              sick: 0,
              vacation: 0,
              personal: 0,
              casual: 0,
            };
            
            leavesData.forEach((leave: any) => {
              const type = leave.type || 'other';
              if (leaveTypes[type] !== undefined) {
                leaveTypes[type]++;
              }
            });
            
            setChartData([
              { 
                name: "Current", 
                sick: leaveTypes.sick || 0,
                vacation: leaveTypes.vacation || 0,
                personal: leaveTypes.personal || 0,
                casual: leaveTypes.casual || 0,
              }
            ]);
          }
        } 
        else {
          // Fallback to mock data
          switch (chartType) {
            case 'attendance':
              setChartData([
                { name: "Mon", present: 42, absent: 5, late: 3 },
                { name: "Tue", present: 45, absent: 2, late: 3 },
                { name: "Wed", present: 43, absent: 4, late: 3 },
                { name: "Thu", present: 40, absent: 7, late: 3 },
                { name: "Fri", present: 44, absent: 3, late: 3 }
              ]);
              break;
            case 'employees':
              setChartData([
                { name: "Full-time", value: 35 },
                { name: "Part-time", value: 10 },
                { name: "Contract", value: 5 },
                { name: "Remote", value: 15 }
              ]);
              break;
            case 'tasks':
              setChartData([
                { name: "Week 1", completed: 25, inProgress: 15, pending: 10 },
                { name: "Week 2", completed: 30, inProgress: 10, pending: 15 },
                { name: "Week 3", completed: 35, inProgress: 20, pending: 5 },
                { name: "Week 4", completed: 40, inProgress: 15, pending: 10 }
              ]);
              break;
            case 'leaves':
              setChartData([
                { name: "Jan", casual: 10, sick: 5, annual: 2 },
                { name: "Feb", casual: 8, sick: 7, annual: 3 },
                { name: "Mar", casual: 12, sick: 3, annual: 1 },
                { name: "Apr", casual: 7, sick: 8, annual: 4 },
                { name: "May", casual: 9, sick: 6, annual: 2 },
                { name: "Jun", casual: 11, sick: 4, annual: 3 }
              ]);
              break;
          }
        }
      } catch (error) {
        console.error("Error processing chart data:", error);
        // Use fallback data
      }
    };

    processData();
  }, [chartType, dateRange, date, attendanceData, employeesData, leavesData, tasksData, startDate, endDate, employeesCountData]);

  // Function to navigate between weeks or months
  const handleDateNavigation = (direction: 'prev' | 'next') => {
    if (!date) return;

    let newDate;
    if (dateRange === 'weekly') {
      newDate = direction === 'prev' ? subWeeks(date, 1) : addWeeks(date, 1);
    } else if (dateRange === 'monthly') {
      newDate = direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1);
    } else {
      newDate = direction === 'prev' ? subDays(date, 1) : addDays(date, 1);
    }
    
    setDate(newDate);
  };

  // Render appropriate chart based on chartType prop
  const renderChart = () => {
    switch (chartType) {
      case "attendance":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="present" stackId="a" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" stackId="a" fill="#F87171" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      
      case "employees":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case "tasks":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="inProgress" fill="#6366F1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="blocked" fill="#F87171" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case "leaves":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="casual" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sick" fill="#EC4899" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vacation" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="personal" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        );
    }
  };

  interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border shadow-sm rounded-md">
          <p className="font-medium text-xs">{label}</p>
          <div className="space-y-1 mt-1">
            {payload.map((entry, index) => (
              <p key={index} className="text-xs" style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Get current date range display
  const getDateRangeDisplay = () => {
    if (!date) return "No date selected";
    
    if (dateRange === "weekly") {
      return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
    } else if (dateRange === "monthly") {
      return format(date, "MMMM yyyy");
    } else {
      return format(date, "PPP");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={dateRange === "daily" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("daily")}
          >
            Daily
          </Button>
          <Button
            variant={dateRange === "weekly" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("weekly")}
          >
            Weekly
          </Button>
          <Button
            variant={dateRange === "monthly" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("monthly")}
          >
            Monthly
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDateNavigation('prev')}
          >
            Previous
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal min-w-[150px]",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {getDateRangeDisplay()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDateNavigation('next')}
          >
            Next
          </Button>
        </div>
      </div>

      <div>{renderChart()}</div>
    </div>
  );
};

export default AdminDashboardCharts;
