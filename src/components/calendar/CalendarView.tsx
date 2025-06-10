import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { holidayService, leaveService, userService } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Holiday, Leave, User } from "@/types";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isSameMonth } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

type CalendarEvent = {
  date: Date;
  type: "holiday" | "leave" | "birthday";
  label: string;
  description?: string;
  employeeName?: string;
};

const CalendarView: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // For the dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogContent, setDialogContent] = useState<React.ReactNode>(null);

  useEffect(() => {
    fetchData();
  }, [currentMonth, currentUser]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch holidays
      const holidaysResponse = await holidayService.getAllHolidays();
      const holidays = holidaysResponse.data.holidays;

      // Fetch leaves (all if admin, only current user's if employee)
      const leavesResponse = isAdmin
        ? await leaveService.getAllLeaves()
        : await leaveService.getMyLeaves();
      const leaves = leavesResponse.data;

      // Fetch all users to get birthdays
      const usersResponse = await userService.getAllUsers();
      const users = usersResponse.data.users;

      // Process events
      const calendarEvents: CalendarEvent[] = [
        ...processHolidays(holidays),
        ...processLeaves(leaves),
        ...processBirthdays(users),
      ];

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast.error("Failed to load calendar data");
    } finally {
      setIsLoading(false);
    }
  };

  const processHolidays = (holidays: Holiday[]): CalendarEvent[] => {
    return holidays.map((holiday) => ({
      date: parseISO(holiday.date),
      type: "holiday",
      label: holiday.name,
      description: holiday.description,
    }));
  };

  const processLeaves = (leaves: Leave[]): CalendarEvent[] => {
    return leaves.flatMap((leave) => {
      const startDate = parseISO(leave.startDate);
      const endDate = parseISO(leave.endDate);

      // Create an array of dates between start and end dates
      const dates: Date[] = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dates.map((date) => ({
        date: date,
        type: "leave" as const,
        label: `${leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave`,
        employeeName: leave.employee?.fullName || "",
      }));
    });
  };

  const processBirthdays = (users: User[]): CalendarEvent[] => {
    const currentYear = new Date().getFullYear();

    return users
      .filter((user) => user.birthday)
      .map((user) => {
        const birthdayDate = parseISO(user.birthday!);
        const birthdayThisYear = new Date(
          currentYear,
          birthdayDate.getMonth(),
          birthdayDate.getDate()
        );

        return {
          date: birthdayThisYear,
          type: "birthday",
          label: "Birthday",
          employeeName: user.fullName,
        };
      });
  };

  // Function to get events for a selected date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date));
  };

  // Handle date selection and show dialog
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const eventsForDate = getEventsForDate(date);

    if (eventsForDate.length > 0) {
      const formattedDate = format(date, "PPPP");
      setDialogTitle(`Events on ${formattedDate}`);

      setDialogContent(
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {eventsForDate.map((event, idx) => (
            <div key={idx} className="p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Badge
                  className={
                    event.type === "holiday"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : event.type === "leave"
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-purple-500 text-white hover:bg-purple-600"
                  }
                >
                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </Badge>
              </div>
              <h4 className="font-semibold text-lg">{event.label}</h4>
              {event.employeeName && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  👤 {event.employeeName}
                </p>
              )}
              {event.description && (
                <p className="text-sm text-gray-500 mt-2 italic">
                  {event.description}
                </p>
              )}
            </div>
          ))}
        </div>
      );

      setDialogOpen(true);
    }
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add empty cells for the start of the month
  const startDayOfWeek = getDay(monthStart);
  const emptyCells = Array(startDayOfWeek).fill(null);

  // Weekday labels
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {format(currentMonth, "MMMM yyyy")}
              </h1>
              <Button
                onClick={goToToday}
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                Today
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={goToPreviousMonth}
                variant="outline"
                size="icon"
                className="hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={goToNextMonth}
                variant="outline"
                size="icon"
                className="hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Weekday Headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="h-16 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for month start */}
            {emptyCells.map((_, index) => (
              <div key={`empty-${index}`} className="h-24 lg:h-32"></div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((date) => {
              const dayEvents = getEventsForDate(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isTodayCell = isToday(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);

              return (
                <div
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  className={`
                    h-24 lg:h-32 p-2 rounded-xl cursor-pointer transition-all duration-200 border-2 relative
                    ${isTodayCell
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                    }
                    ${isSelected
                      ? 'ring-2 ring-primary ring-offset-2 bg-primary/10'
                      : 'hover:border-primary/50 hover:bg-primary/5'
                    }
                    ${!isCurrentMonth ? 'opacity-50' : ''}
                    ${dayEvents.length > 0 ? 'hover:shadow-lg' : ''}
                  `}
                >
                  {/* Date Number */}
                  <div className={`
                    text-sm lg:text-base font-semibold mb-1
                    ${isTodayCell ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
                    ${!isCurrentMonth ? 'text-gray-400' : ''}
                  `}>
                    {format(date, 'd')}
                  </div>

                  {/* Event Indicators */}
                  {dayEvents.length > 0 && (
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event, index) => (
                        <div
                          key={index}
                          className={`
                            text-xs px-2 py-1 rounded-md font-medium truncate
                            ${event.type === "holiday"
                              ? "bg-red-500 text-white"
                              : event.type === "leave"
                                ? "bg-blue-500 text-white"
                                : "bg-purple-500 text-white"
                            }
                          `}
                          title={`${event.label}${event.employeeName ? ` - ${event.employeeName}` : ''}`}
                        >
                          {event.label}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 font-medium text-center">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{dialogTitle}</DialogTitle>
            <DialogDescription>
              Details of events for the selected date
            </DialogDescription>
          </DialogHeader>
          {dialogContent}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CalendarView;