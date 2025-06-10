
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collaborationService, projectService, userService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Meeting, Project, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CalendarIcon, Clock, Plus, Trash } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, addDays } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";

// Form schema for meeting creation/editing
const meetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.date({
    required_error: "Please select a date",
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  isVirtual: z.boolean().default(false),
  meetingLink: z.string().optional(),
  projectId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  attendees: z.array(z.string()).min(1, "Select at least one attendee"),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

const MeetingScheduler = () => {
  const { currentUser } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [selected, setSelected] = useState<Date>(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form setup
  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      isVirtual: false,
      meetingLink: "",
      projectId: "",
      isRecurring: false,
      recurringPattern: "weekly",
      attendees: [],
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      // Short delay to prevent flickering during animation
      setTimeout(() => {
        form.reset();
        setSelectedMeeting(null);
        setIsCreating(false);
      }, 300);
    }
  }, [dialogOpen, form]);

  // Set form values when editing a meeting
  useEffect(() => {
    if (selectedMeeting && dialogOpen) {
      form.reset({
        title: selectedMeeting.title || "",
        description: selectedMeeting.description || "",
        date: parseISO(selectedMeeting.startTime),
        startTime: format(parseISO(selectedMeeting.startTime), "HH:mm"),
        endTime: format(parseISO(selectedMeeting.endTime), "HH:mm"),
        location: selectedMeeting.location || "",
        isVirtual: selectedMeeting.isVirtual,
        meetingLink: selectedMeeting.meetingLink || "",
        projectId: selectedMeeting.project?.id || "",
        isRecurring: selectedMeeting.isRecurring,
        recurringPattern: selectedMeeting.recurringPattern || "weekly",
        attendees: selectedMeeting.attendees || [],
      });
    }
  }, [selectedMeeting, dialogOpen, form]);

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        const response = await projectService.getAllProjects();
        return response.data.projects || [];
      } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
      }
    },
  });

  // Fetch employees/users for attendees selection
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      try {
        const response = await userService.getAllUsers();
        return response.data.users || [];
      } catch (error) {
        console.error("Error fetching employees:", error);
        return [];
      }
    },
  });

  // Fetch meetings
  const { data: meetings, refetch: refetchMeetings } = useQuery({
    queryKey: ["meetings", selected.toISOString().split('T')[0]],
    queryFn: async () => {
      try {
        const selectedDate = selected.toISOString().split('T')[0];
        const response = await collaborationService.getMeetings({ date: selectedDate });
        return response.data || [];
      } catch (error) {
        console.error("Error fetching meetings:", error);
        return [];
      }
    },
  });

  const handleCreateMeeting = () => {
    setIsCreating(true);
    setDialogOpen(true);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDialogOpen(true);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      await collaborationService.deleteMeeting(meetingId);
      toast.success("Meeting deleted successfully");
      refetchMeetings();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast.error("Failed to delete meeting");
    }
  };

  const onSubmit = async (data: MeetingFormValues) => {
    try {
      const formattedStartTime = `${format(data.date, "yyyy-MM-dd")}T${data.startTime}:00`;
      const formattedEndTime = `${format(data.date, "yyyy-MM-dd")}T${data.endTime}:00`;

      const meetingData = {
        title: data.title,
        description: data.description,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        location: data.location,
        isVirtual: data.isVirtual,
        meetingLink: data.meetingLink,
        projectId: data.projectId,
        isRecurring: data.isRecurring,
        recurringPattern: data.isRecurring ? data.recurringPattern : undefined,
        attendees: data.attendees,
      };

      if (selectedMeeting) {
        // Update existing meeting
        await collaborationService.updateMeeting(selectedMeeting.id, meetingData);
        toast.success("Meeting updated successfully");
      } else {
        // Create new meeting
        await collaborationService.createMeeting(meetingData);
        toast.success("Meeting created successfully");
      }

      setDialogOpen(false);
      refetchMeetings();
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast.error("Failed to save meeting");
    }
  };

  const formatMeetingTime = (meeting: Meeting) => {
    const start = parseISO(meeting.startTime);
    const end = parseISO(meeting.endTime);
    return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMMM d");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-card rounded-xl border shadow-lg p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-timesRoman font-bold text-primary">
                Meeting Scheduler
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Schedule and manage your meetings efficiently
              </p>
            </div>
            <Button
              onClick={handleCreateMeeting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-lg transition-all duration-300 px-6 py-3 text-base font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid xl:grid-cols-12 gap-6">
          {/* Calendar Section */}
          <div className="xl:col-span-5">
            <Card className="bg-card border shadow-lg rounded-xl overflow-hidden h-fit">
              <CardHeader className="bg-primary text-primary-foreground p-6">
                <CardTitle className="text-xl font-timesRoman font-bold flex items-center">
                  <CalendarIcon className="h-6 w-6 mr-3" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Calendar
                  mode="single"
                  selected={selected}
                  onSelect={(date) => date && setSelected(date)}
                  className="w-full border-0"
                  classNames={{
                    months: "p-6",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center text-lg font-timesRoman font-bold",
                    caption_label: "text-lg font-bold",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-muted rounded-lg transition-colors",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-10 font-medium text-sm",
                    row: "flex w-full mt-2",
                    cell: "h-10 w-10 text-center text-sm p-0 relative hover:bg-muted/50 rounded-md transition-colors",
                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md transition-colors",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground font-bold",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Meeting List Section */}
          <div className="xl:col-span-7">
            <Card className="bg-card border shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-primary text-secondary-foreground p-6">
                <CardTitle className="text-xl text-white font-timesRoman font-bold flex items-center">
                  <Clock className="h-6 w-6 mr-3" />
                  {getDateLabel(selected)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-h-[600px] overflow-y-auto space-y-4 scrollbar-hide">
                  {meetings && meetings.length > 0 ? (
                    meetings.map((meeting: Meeting) => (
                      <div key={meeting.id} className="bg-muted/30 border border-border rounded-lg p-4 hover:shadow-lg transition-all duration-200 group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-timesRoman font-bold text-lg text-foreground mb-2">
                              {meeting.title}
                            </h3>
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <Clock className="h-4 w-4 mr-2 text-primary" />
                              <span className="font-medium">{formatMeetingTime(meeting)}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMeeting(meeting)}
                              className="border-primary/20 hover:border-primary hover:bg-primary/10"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive/20 hover:border-destructive hover:bg-destructive/10 text-destructive"
                              onClick={() => handleDeleteMeeting(meeting.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {meeting.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 bg-background/50 p-3 rounded-md border">
                            {meeting.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {meeting.isVirtual ? (
                              <div className="flex items-center text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                                Virtual
                              </div>
                            ) : (
                              <div className="flex items-center text-xs text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                                <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span>
                                In-Person
                              </div>
                            )}
                          </div>

                          {meeting.isVirtual && meeting.meetingLink && (
                            <a
                              href={meeting.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:text-primary/80 hover:underline font-medium bg-primary/10 px-3 py-1 rounded-full transition-colors duration-200"
                            >
                              Join Meeting →
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-timesRoman font-bold text-foreground mb-2">
                        No meetings scheduled
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Schedule your first meeting for this day
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Meeting Creation/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-card">
            <DialogHeader className="space-y-3 pb-6 border-b">
              <DialogTitle className="text-2xl font-timesRoman font-bold text-primary">
                {isCreating ? "Schedule New Meeting" : "Edit Meeting"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {isCreating ? "Fill in the details to schedule a new meeting" : "Update meeting details and settings"}
              </p>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 pb-2 border-b border-border">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <h3 className="text-lg font-timesRoman font-bold text-foreground">Basic Information</h3>
                  </div>

                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Meeting Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter meeting title"
                              {...field}
                              className="bg-background border-border focus:border-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Meeting agenda and details"
                              {...field}
                              className="bg-background border-border focus:border-primary min-h-[100px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Date & Time Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 pb-2 border-b border-border">
                    <div className="w-2 h-2 bg-secondary rounded-full"></div>
                    <h3 className="text-lg font-timesRoman font-bold text-foreground">Date & Time</h3>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium text-foreground">Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal bg-background border-border hover:border-primary",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              className="bg-background border-border focus:border-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              className="bg-background border-border focus:border-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Meeting Settings Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 pb-2 border-b border-border">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <h3 className="text-lg font-timesRoman font-bold text-foreground">Meeting Settings</h3>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Virtual Meeting Toggle */}
                    <FormField
                      control={form.control}
                      name="isVirtual"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/30">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium text-foreground">Virtual Meeting</FormLabel>
                            <FormDescription className="text-muted-foreground">
                              Toggle if this is a virtual meeting
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Recurring Meeting Toggle */}
                    <FormField
                      control={form.control}
                      name="isRecurring"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/30">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium text-foreground">Recurring Meeting</FormLabel>
                            <FormDescription className="text-muted-foreground">
                              Set this meeting to repeat
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Conditional Fields Grid */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Virtual Meeting Link or Location */}
                    {form.watch("isVirtual") ? (
                      <FormField
                        control={form.control}
                        name="meetingLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Meeting Link</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://..."
                                {...field}
                                className="bg-background border-border focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Location</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Meeting room or location"
                                {...field}
                                className="bg-background border-border focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Recurring Pattern */}
                    {form.watch("isRecurring") && (
                      <FormField
                        control={form.control}
                        name="recurringPattern"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">Recurrence Pattern</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background border-border focus:border-primary">
                                  <SelectValue placeholder="Select pattern" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-card border-border">
                                <SelectItem value="daily">📅 Daily</SelectItem>
                                <SelectItem value="weekly">🗓️ Weekly</SelectItem>
                                <SelectItem value="biweekly">📆 Bi-weekly</SelectItem>
                                <SelectItem value="monthly">🗓️ Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Project */}
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Related Project</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background border-border focus:border-primary">
                                <SelectValue placeholder="Select a project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-border">
                              {projects?.map((project: Project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  📁 {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Attendees Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 pb-2 border-b border-border">
                    <div className="w-2 h-2 bg-destructive rounded-full"></div>
                    <h3 className="text-lg font-timesRoman font-bold text-foreground">Attendees</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="attendees"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormDescription className="text-muted-foreground">
                            Select who should attend this meeting
                          </FormDescription>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-4 bg-muted/20 rounded-lg border border-border">
                          {employees?.map((employee: User) => (
                            <FormField
                              key={employee.id}
                              control={form.control}
                              name="attendees"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={employee.id}
                                    className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-md border border-border bg-background hover:bg-muted/30 transition-colors"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(employee.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, employee.id])
                                            : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== employee.id
                                              )
                                            )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-sm">
                                      👤 {employee.fullName} {employee.lastName}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="pt-6 border-t border-border">
                  <div className="flex justify-between items-center w-full">
                    <div className="text-xs text-muted-foreground">
                      * Required fields
                    </div>
                    <div className="flex space-x-3">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {isCreating ? "Create Meeting" : "Update Meeting"}
                      </Button>
                    </div>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MeetingScheduler;
