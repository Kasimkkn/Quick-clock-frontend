
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import AttendanceAnalytics from "@/components/reports/AttendanceAnalytics";
import AdminDashboardCharts from "@/components/dashboard/AdminDashboardCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChartBarIcon, Users, CalendarDays, ClipboardCheck } from "lucide-react";

const AnalyticsPage = () => {
  const [activeChart, setActiveChart] = useState("attendance");

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              View and analyze company-wide data and metrics.
            </p>
          </div>
        </div>

        {/* Main Analytics Card */}
        <Card>
          <CardHeader className="pb-0">
            <Tabs defaultValue="attendance" className="w-full" onValueChange={setActiveChart}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <CardTitle className="text-xl">Analytics Metrics</CardTitle>
                <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-4 gap-1">
                  <TabsTrigger value="attendance" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span className="hidden md:inline">Attendance</span>
                  </TabsTrigger>
                  <TabsTrigger value="employees" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden md:inline">Employees</span>
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    <span className="hidden md:inline">Tasks</span>
                  </TabsTrigger>
                  <TabsTrigger value="leaves" className="flex items-center gap-2">
                    <ChartBarIcon className="h-4 w-4" />
                    <span className="hidden md:inline">Leaves</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <CardContent className="pt-6">
                <TabsContent value="attendance" className="mt-0">
                  <AdminDashboardCharts chartType="attendance" />
                </TabsContent>
                <TabsContent value="employees" className="mt-0">
                  <AdminDashboardCharts chartType="employees" />
                </TabsContent>
                <TabsContent value="tasks" className="mt-0">
                  <AdminDashboardCharts chartType="tasks" />
                </TabsContent>
                <TabsContent value="leaves" className="mt-0">
                  <AdminDashboardCharts chartType="leaves" />
                </TabsContent>
              </CardContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Attendance Analytics Detail Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Detailed Attendance Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceAnalytics />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
