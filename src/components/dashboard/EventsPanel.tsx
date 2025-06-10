
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isTomorrow, parseISO, isWithinInterval, addDays } from "date-fns";
import { Cake, Calendar, CalendarCheck, CalendarDays, CalendarOff, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { holidayService, leaveService, taskService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Holiday, Leave, Task } from "@/types";

interface Event {
  id: string;
  title: string;
  date: string;
  type: "holiday" | "leave" | "birthday" | "task";
  description?: string;
  status?: string;
}

const getIconForType = (type: string) => {
  switch (type) {
    case "holiday":
      return <CalendarOff className="h-4 w-4 text-red-500" />;
    case "birthday":
      return <Cake className="h-4 w-4 text-pink-500" />;
    case "leave":
      return <CalendarCheck className="h-4 w-4 text-amber-500" />;
    case "task":
      return <ClipboardList className="h-4 w-4 text-blue-500" />;
    default:
      return <CalendarDays className="h-4 w-4 text-gray-500" />;
  }
};

const getBadgeForType = (type: string, status?: string) => {
  switch (type) {
    case "holiday":
      return <Badge variant="destructive">Holiday</Badge>;
    case "birthday":
      return <Badge variant="outline" className="bg-pink-100 text-pink-800 border-pink-200">Birthday</Badge>;
    case "leave":
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Leave</Badge>;
    case "task":
      if (status === "completed") {
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      } else if (status === "in-progress") {
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      } else if (status === "todo") {
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">To Do</Badge>;
      } else if (status === "blocked") {
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Blocked</Badge>;
      }
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Task</Badge>;
    default:
      return <Badge variant="secondary">Event</Badge>;
  }
};

const formatEventDate = (dateStr: string) => {
  try {
    const date = parseISO(dateStr);
    
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    
    return format(date, "MMM dd");
  } catch (error) {
    console.error("Error parsing date:", error);
    return dateStr;
  }
};

const EventsPanel = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch holidays
  const { data: holidaysData } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      try {
        const response = await holidayService.getAllHolidays();
        return response.data.holidays || [];
      } catch (error) {
        console.error("Error fetching holidays:", error);
        setError("Failed to fetch holidays");
        return [];
      }
    }
  });

  // Fetch leaves
  const { data: leavesData } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      try {
        const response = await leaveService.getMyLeaves();
        return response.data.leaves || [];
      } catch (error) {
        console.error("Error fetching leaves:", error);
        setError("Failed to fetch leaves");
        return [];
      }
    }
  });

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const response = await taskService.getMyTasks();
        return response.data.tasks || [];
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Failed to fetch tasks");
        return [];
      }
    }
  });

  // Process and combine events when data is available
  useEffect(() => {
    const processEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const allEvents: Event[] = [];
        const today = new Date();
        const nextMonth = addDays(today, 30); // Events within the next month

        // Process holidays
        if (holidaysData && holidaysData.length > 0) {
          holidaysData.forEach((holiday: Holiday) => {
            try {
              const holidayDate = new Date(holiday.date);
              
              // Only include holidays in the next 30 days
              if (isWithinInterval(holidayDate, { start: today, end: nextMonth })) {
                allEvents.push({
                  id: `holiday-${holiday.id}`,
                  title: holiday.name,
                  date: format(holidayDate, "yyyy-MM-dd"),
                  type: "holiday",
                  description: holiday.description
                });
              }
            } catch (e) {
              console.error("Error processing holiday:", e);
            }
          });
        }

        // Process leaves
        if (leavesData && leavesData.length > 0) {
          leavesData
            .filter((leave: Leave) => leave.status === 'approved' || leave.status === 'pending')
            .forEach((leave: Leave) => {
              try {
                const startDate = new Date(leave.startDate);
                
                // Only include leaves in the next 30 days
                if (isWithinInterval(startDate, { start: today, end: nextMonth })) {
                  allEvents.push({
                    id: `leave-${leave.id}`,
                    title: `${leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave`,
                    date: format(startDate, "yyyy-MM-dd"),
                    type: "leave",
                    description: leave.reason
                  });
                }
              } catch (e) {
                console.error("Error processing leave:", e);
              }
            });
        }

        // Process tasks with due dates in the near future
        if (tasksData && tasksData.length > 0) {
          tasksData
            .filter((task: Task) => task.dueDate)
            .forEach((task: Task) => {
              try {
                const dueDate = new Date(task.dueDate);
                
                // Only include tasks in the next 30 days
                if (isWithinInterval(dueDate, { start: today, end: nextMonth })) {
                  allEvents.push({
                    id: `task-${task.id}`,
                    title: task.title,
                    date: format(dueDate, "yyyy-MM-dd"),
                    type: "task",
                    description: task.description,
                    status: task.status
                  });
                }
              } catch (e) {
                console.error("Error processing task:", e);
              }
            });
        }

        // Sort events by date (closest first)
        allEvents.sort((a, b) => {
          try {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB;
          } catch (e) {
            return 0;
          }
        });

        setEvents(allEvents);
      } catch (error) {
        console.error("Error processing events:", error);
        setError("Failed to process events");
      } finally {
        setIsLoading(false);
      }
    };

    processEvents();
  }, [holidaysData, leavesData, tasksData]);

  // Filter for today's events
  const todayEvents = events.filter(event => {
    try {
      return isToday(parseISO(event.date));
    } catch (e) {
      console.error("Error checking today's events:", e);
      return false;
    }
  });

  // Filter for upcoming events (not today)
  const upcomingEvents = events.filter(event => {
    try {
      return !isToday(parseISO(event.date));
    } catch (e) {
      console.error("Error checking upcoming events:", e);
      return false;
    }
  });

  return (
    <div className="space-y-2">
      {/* Today's Events Section */}
      {todayEvents.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Events</h3>
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex gap-3">
                  <div className="p-2 rounded-full bg-gray-100 h-max">
                    {getIconForType(event.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{event.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatEventDate(event.date)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground">
                        {event.description.length > 100 
                          ? `${event.description.substring(0, 100)}...` 
                          : event.description}
                      </p>
                    )}
                    <div className="pt-1">
                      {getBadgeForType(event.type, event.status)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upcoming Events Section */}
      <h3 className="text-sm font-medium text-gray-500 mb-2">Upcoming Events</h3>
      
      <ScrollArea className="h-[350px] pr-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <p className="text-sm text-muted-foreground">Loading events...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex gap-3">
                  <div className="p-2 rounded-full bg-gray-100 h-max">
                    {getIconForType(event.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{event.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatEventDate(event.date)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground">
                        {event.description.length > 100 
                          ? `${event.description.substring(0, 100)}...` 
                          : event.description}
                      </p>
                    )}
                    <div className="pt-1">
                      {getBadgeForType(event.type, event.status)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <CalendarDays className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming events</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default EventsPanel;
