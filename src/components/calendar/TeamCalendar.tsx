import CalendarView from "@/components/calendar/CalendarView";
import HolidayManager from "@/components/calendar/HolidayManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { CalendarIcon, Users } from "lucide-react";
import { useState } from "react";

const TeamCalendar = () => {
  const [activeTab, setActiveTab] = useState("calendar");
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Team Calendar</h1>
          <p className="text-muted-foreground">
            View and manage team events, leaves and holidays
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant={activeTab === "calendar" ? "default" : "outline"}
              onClick={() => setActiveTab("calendar")}
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Calendar View
            </Button>
            <Button
              variant={activeTab === "holidays" ? "default" : "outline"}
              onClick={() => setActiveTab("holidays")}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Manage Holidays
            </Button>
          </div>
        )}
      </div>

      <div className="w-full overflow-hidden">
        {activeTab === "calendar" ? <CalendarView /> : <HolidayManager />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Holidays</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">Leave</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-3 w-3 rounded-full bg-purple-500"></div>
              <span className="text-sm">Birthdays</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Calendar Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500 border-2 border-blue-600"></div>
              <span className="text-sm">Today's Date</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-3 w-3 rounded border-2 border-gray-400"></div>
              <span className="text-sm">Selected Date</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-3 w-3 rounded bg-gray-200"></div>
              <span className="text-sm">Event Indicators</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Calendar Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use the calendar controls to navigate between months and years.
              Click on a date to view detailed events for that day.
              {isAdmin && " As an admin, you can also add and manage holidays."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamCalendar;