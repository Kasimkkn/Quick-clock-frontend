
import AdminDashboardCharts from "@/components/dashboard/AdminDashboardCharts";
import EventsPanel from "@/components/dashboard/EventsPanel";
import NotificationPanel from "@/components/dashboard/NotificationPanel";
import TasksSummary from "@/components/dashboard/TasksSummary";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { processAbsentees } from "@/lib/attendanceUtils";
import { formatDate } from "@/lib/utils";
import { attendanceService, userService } from "@/services/api";
import {
  CalendarCheck, ChevronRight, GanttChartSquare,
  UserCheck, UserMinus, Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Admin = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeChart, setActiveChart] = useState("attendance");

  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (!isAdmin) {
      navigate("/dashboard");
    } else {
      fetchDashboardStats();

      // Process absences (for auto leave deduction)
      processAbsentees();
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Fetch dashboard stats from API
  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);

      // Get all employees
      const employeesResponse = await userService.getAllUsers();
      const employees = employeesResponse.data.users;

      // Get today's attendance records
      const today = formatDate(new Date());
      const todayRecordsResponse = await attendanceService.getAttendanceByDate(today);
      const todayRecords = todayRecordsResponse.data.attendance;

      const presentEmployees = todayRecords.filter(r => r.checkInTime).length;
      const lateEmployees = todayRecords.filter(r => {
        if (!r.checkInTime) return false;

        const checkInHour = parseInt(r.checkInTime.split(':')[0]);
        const checkInMinute = parseInt(r.checkInTime.split(':')[1]);

        return checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15);
      }).length;

      setStats({
        totalEmployees: employees.length,
        presentToday: presentEmployees,
        lateToday: lateEmployees,
        absentToday: employees.length - presentEmployees
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // If not logged in or not admin, don't render anything
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">

        {/* Modern Professional Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Employees Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-8 translate-x-8" />

            <CardHeader className="relative pb-3 pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardDescription className="text-sm font-medium text-slate-600 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                    Total Employees
                  </CardDescription>
                  <div className="flex items-baseline space-x-2">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {isLoading ? (
                        <div className="animate-pulse bg-slate-200 h-8 w-16 rounded" />
                      ) : (
                        <span className="tabular-nums">{stats.totalEmployees}</span>
                      )}
                    </CardTitle>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative pt-0 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full" />
                    <span>98% Active</span>
                  </div>
                  <span>•</span>
                  <span>2 New this week</span>
                </div>
                <Link to="/employees">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-auto p-2 hover:bg-blue-50 text-blue-600 font-medium group/btn"
                  >
                    View all
                    <ChevronRight className="h-3 w-3 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Present Today Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50/50 to-teal-50 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-transparent to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-green-500/5 to-transparent rounded-full translate-y-8 -translate-x-8" />

            <CardHeader className="relative pb-3 pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardDescription className="text-sm font-medium text-slate-600 flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                    Present Today
                  </CardDescription>
                  <div className="flex items-baseline space-x-2">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {isLoading ? (
                        <div className="animate-pulse bg-slate-200 h-8 w-16 rounded" />
                      ) : (
                        <span className="tabular-nums">{stats.presentToday}</span>
                      )}
                    </CardTitle>
                    <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full font-medium">
                      Online
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-110">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative pt-0 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                    <span>95% Rate</span>
                  </div>
                  <span>•</span>
                  <span>Excellent</span>
                </div>
                <Link to="/attendance">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-auto p-2 hover:bg-emerald-50 text-emerald-600 font-medium group/btn"
                  >
                    View details
                    <ChevronRight className="h-3 w-3 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Late Today Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-transparent to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-2 left-2 w-16 h-16 bg-gradient-to-tr from-yellow-500/5 to-transparent rounded-full" />

            <CardHeader className="relative pb-3 pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardDescription className="text-sm font-medium text-slate-600 flex items-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse" />
                    Late Arrivals
                  </CardDescription>
                  <div className="flex items-baseline space-x-2">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {isLoading ? (
                        <div className="animate-pulse bg-slate-200 h-8 w-16 rounded" />
                      ) : (
                        <span className="tabular-nums">{stats.lateToday}</span>
                      )}
                    </CardTitle>
                    <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full font-medium">
                      Today
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-amber-500/25 transition-all duration-300 group-hover:scale-110">
                    <CalendarCheck className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative pt-0 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-amber-500 rounded-full" />
                    <span>Avg 15min</span>
                  </div>
                  <span>•</span>
                  <span>Improving</span>
                </div>
                <Link to="/attendance">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-auto p-2 hover:bg-amber-50 text-amber-600 font-medium group/btn"
                  >
                    View details
                    <ChevronRight className="h-3 w-3 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Absent Today Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-rose-50 via-red-50/50 to-pink-50 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            {/* Sophisticated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-600/5 via-transparent to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/5 to-transparent rounded-full translate-y-8 -translate-x-8" />

            <CardHeader className="relative pb-3 pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardDescription className="text-sm font-medium text-slate-600 flex items-center">
                    <div className="w-2 h-2 bg-rose-500 rounded-full mr-2 animate-pulse" />
                    Absent Today
                  </CardDescription>
                  <div className="flex items-baseline space-x-2">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
                      {isLoading ? (
                        <div className="animate-pulse bg-slate-200 h-8 w-16 rounded" />
                      ) : (
                        <span className="tabular-nums">{stats.absentToday}</span>
                      )}
                    </CardTitle>
                    <span className="text-xs text-rose-700 bg-rose-100 px-2 py-1 rounded-full font-medium">
                      Away
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-rose-500/25 transition-all duration-300 group-hover:scale-110">
                    <UserMinus className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative pt-0 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-rose-500 rounded-full" />
                    <span>5% Rate</span>
                  </div>
                  <span>•</span>
                  <span>Normal</span>
                </div>
                <Link to="/attendance">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-auto p-2 hover:bg-rose-50 text-rose-600 font-medium group/btn"
                  >
                    View details
                    <ChevronRight className="h-3 w-3 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Analytics Charts - Takes 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
                <Tabs defaultValue="attendance" className="w-full" onValueChange={setActiveChart}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="employees">Employees</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="leaves">Leaves</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <AdminDashboardCharts chartType={activeChart} />
              </CardContent>
            </Card>

            {/* Tasks Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Tasks Overview</CardTitle>
                <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <TasksSummary />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Content - Takes 1/3 width on large screens */}
          <div className="space-y-4">
            {/* Notifications Panel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <NotificationPanel />
              </CardContent>
            </Card>

            {/* Today's Events */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Today's Events</CardTitle>
              </CardHeader>
              <CardContent>
                <EventsPanel />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
