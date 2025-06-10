
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Clock, ScanFace, User, CalendarCheck, ClipboardList, Calendar } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceService, taskService, holidayService } from '@/services/api';
import { Employee, Task } from '@/types';
import { calculateWorkingHours, formatDate } from '@/lib/utils';
import IdCard from '@/components/qr/IdCard';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const Dashboard = () => {
  const { currentUser, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const clockIntervalRef = useRef<number | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<{
    checkInTime?: string;
    checkOutTime?: string;
  } | null>(null);
  const [workingHours, setWorkingHours] = useState<string>("0h 0m");

  // Fetch user's tasks
  const { data: tasksData } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      try {
        const response = await taskService.getMyTasks();
        return response.data.tasks;
      } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }
    },
    enabled: isAuthenticated
  });

  // Fetch today's holidays/events
  const { data: holidaysData } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      try {
        const response = await holidayService.getAllHolidays();
        return response.data.holidays;
      } catch (error) {
        console.error("Error fetching holidays:", error);
        return [];
      }
    },
    enabled: isAuthenticated
  });

  // Get today's date and filter holidays for today
  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0]; // YYYY-MM-DD

  const todaysEvents = holidaysData?.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.toISOString().split('T')[0] === todayFormatted;
  }) || [];

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (currentUser) {
      // Fix: Cast currentUser to Employee to ensure required properties exist
      setEmployee(currentUser as unknown as Employee);
    }

    const fetchEmployeeAttendanceToday = async () => {
      try {
        const attendance = await attendanceService.getTodayAttendance();
        if (attendance.data) {
          console.log('Fetched employee attendance:', attendance.data.attendance);
          setTodayAttendance({
            checkInTime: attendance.data.attendance?.checkInTime,
            checkOutTime: attendance.data.attendance?.checkOutTime
          })
        }
      } catch (error) {
        console.log('Error fetching employee attendance:', error);
      }
    }

    fetchEmployeeAttendanceToday();
  }, [currentUser]);

  useEffect(() => {
    const updateWorkingHours = () => {
      if (todayAttendance?.checkInTime) {
        if (todayAttendance.checkOutTime) {
          const hours = calculateWorkingHours(todayAttendance.checkInTime, todayAttendance.checkOutTime);
          setWorkingHours(hours);
        } else {
          const now = new Date();
          const checkIn = new Date();
          const [hours, minutes] = todayAttendance.checkInTime.split(':').map(Number);
          checkIn.setHours(hours, minutes, 0);

          let diffMs = now.getTime() - checkIn.getTime();
          if (diffMs < 0) {
            diffMs += 24 * 60 * 60 * 1000;
          }

          const diffHrs = Math.floor(diffMs / 3600000);
          const diffMins = Math.floor((diffMs % 3600000) / 60000);

          setWorkingHours(`${diffHrs}h ${diffMins}m`);
        }
      } else {
        setWorkingHours("0h 0m");
      }
    };

    updateWorkingHours(); // Initial update

    if (todayAttendance?.checkInTime && !todayAttendance?.checkOutTime) {
      clockIntervalRef.current = window.setInterval(updateWorkingHours, 60000);

      return () => {
        if (clockIntervalRef.current) {
          clearInterval(clockIntervalRef.current);
          clockIntervalRef.current = null;
        }
      };
    }

    return () => {
      if (clockIntervalRef.current) {
        clearInterval(clockIntervalRef.current);
        clockIntervalRef.current = null;
      }
    };
  }, [todayAttendance]);

  if (!isAuthenticated) {
    return null;
  }

  const formatTaskDueDate = (dateStr: string) => {
    if (!dateStr) return "No due date";

    const dueDate = new Date(dateStr);
    const today = new Date();

    // Check if due date is today
    if (dueDate.toDateString() === today.toDateString()) {
      return "Today";
    }

    // Check if due date is tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (dueDate.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    // Otherwise return formatted date
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case "in-progress":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case "todo":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">To Do</Badge>;
      case "blocked":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Blocked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Filter active tasks that are not completed
  const activeTasks = tasksData?.filter(task => task.status !== 'completed' && task.isActive !== false) || [];

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className='mt-4 sm:mt-6'>
          {employee ? (
            <IdCard employee={employee} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <p>Loading employee ID card...</p>
              </CardContent>
            </Card>
          )}
        </div>
        <Card className="mt-4 sm:mt-6">
          <CardHeader className="py-3 px-4 sm:py-4 sm:px-6">
            <CardTitle>Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent className="py-3 px-4 sm:py-4 sm:px-6">
            {todayAttendance ? (
              <div>
                <p className="mb-2">
                  <span className="font-semibold">Check-in Time:</span>{" "}
                  {todayAttendance.checkInTime || "Not checked in yet"}
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Check-out Time:</span>{" "}
                  {todayAttendance.checkOutTime || "Not checked out yet"}
                </p>

                {/* Working Hours Live Counter */}
                <div className={`flex items-center ${todayAttendance.checkInTime && !todayAttendance.checkOutTime ? "text-green-600" : "text-gray-700"} mb-2 mt-4 p-2 border rounded-md bg-gray-50`}>
                  <Clock className="h-5 w-5 mr-2" />
                  <div>
                    <p className="font-semibold">Working Hours:</p>
                    <p className="text-xl font-bold">{workingHours}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p>No attendance recorded for today.</p>
            )}

            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                onClick={() => navigate("/scan")}
                className="flex-1"
                variant="default"
              >
                <ScanFace className="mr-2 h-4 w-4" />
                Scan QR Code
              </Button>
              <Button
                onClick={() => navigate("/my-requests")}
                className="flex-1"
                variant="outline"
              >
                Manual Request
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="mt-4 sm:mt-6">
          <CardHeader className="py-3 px-4 sm:py-4 sm:px-6">
            <CardTitle>{activeTasks.length > 0 ? "Upcoming Tasks" : "Today's Events"}</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 sm:px-2 p-0">
            <ScrollArea className="h-[220px] px-4">
              {activeTasks.length > 0 ? (
                <div className="space-y-3">
                  {activeTasks.slice(0, 5).map((task: Task) => (
                    <div key={task.id} className="border rounded-md p-3 hover:bg-slate-50">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        {getTaskStatusBadge(task.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" />
                          {task.project?.name || "No project"}
                        </span>
                        <span className="text-xs flex items-center gap-1">
                          <CalendarCheck className="h-3 w-3" />
                          {formatTaskDueDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : todaysEvents.length > 0 ? (
                <div className="space-y-3">
                  {todaysEvents.map((event) => (
                    <div key={event.id} className="border rounded-md p-3 hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <h4 className="font-medium text-sm">{event.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 pl-6">
                        {event.description || "Holiday"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <ClipboardList className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-muted-foreground text-sm">No upcoming tasks</p>
                  <p className="text-xs text-muted-foreground">You're all caught up!</p>
                </div>
              )}
            </ScrollArea>
            <div className="p-3 border-t">
              <Button variant="link" className="w-full" size="sm" onClick={() => navigate('/my-tasks')}>
                View all tasks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
