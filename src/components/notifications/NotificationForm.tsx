
import { Button } from "@/components/ui/button";
import {
  Card
} from "@/components/ui/card";
import {
  Checkbox,
} from "@/components/ui/checkbox";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { notificationService, userService } from "@/services/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckboxIndicator } from "@radix-ui/react-checkbox";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, User, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Enhanced schema with multiple users support
const notificationSchema = z.object({
  recipientType: z.enum(["single", "multiple", "all"], {
    required_error: "Please select recipient type",
  }),
  userId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  title: z.string().min(3, {
    message: "Title must be at least 3 characters",
  }),
  message: z.string().min(5, {
    message: "Message must be at least 5 characters",
  }),
  type: z.enum(["leave", "task", "holiday", "system", "message", "project"], {
    required_error: "Type is required",
  }),
  referenceId: z.string().optional(),
});

interface NotificationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const NotificationForm = ({ onSuccess, onCancel }: NotificationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch users with proper error handling
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await userService.getAllUsers();
        return response.data.users;
      } catch (error) {
        console.error("Error fetching users:", error);
        throw new Error("Failed to load users. Please try again later.");
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Initialize form with Zod schema
  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      recipientType: "single",
      userId: "",
      userIds: [],
      title: "",
      message: "",
      type: "system",
      referenceId: "",
    },
    mode: "onChange"
  });

  // Watch the recipientType field to conditionally validate userId/userIds
  const recipientType = form.watch("recipientType");

  // Handle user selection for multiple recipients
  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Update form with selected users
  useEffect(() => {
    if (recipientType === "multiple") {
      form.setValue("userIds", selectedUserIds);
    }
  }, [selectedUserIds, recipientType, form]);

  // Monitor form state to determine if all required fields are valid
  useEffect(() => {
    const { recipientType, userId, userIds, title, message, type } = form.getValues();

    let isRecipientsValid = false;

    if (recipientType === "all") {
      isRecipientsValid = true;
    } else if (recipientType === "single") {
      isRecipientsValid = !!userId;
    } else if (recipientType === "multiple") {
      isRecipientsValid = Array.isArray(userIds) && userIds.length > 0;
    }

    const isValid =
      !!recipientType &&
      isRecipientsValid &&
      title.length >= 3 &&
      message.length >= 5 &&
      !!type;

    setFormValid(isValid);
  }, [form.watch()]);

  // Get validation error messages for better UX
  const getValidationError = () => {
    const { recipientType, userId, userIds } = form.getValues();

    if (recipientType === "single" && !userId) {
      return "Please select a recipient";
    }

    if (recipientType === "multiple" && (!userIds || userIds.length === 0)) {
      return "Please select at least one recipient";
    }

    return null;
  };

  // Memoize users to avoid unnecessary re-renders
  const users = useMemo(() => {
    return usersData || [];
  }, [usersData]);

  const onSubmit = async (values: z.infer<typeof notificationSchema>) => {
    // Reset any previous error
    setError(null);

    // Validate form before submission
    if (!formValid) {
      const validationError = getValidationError();
      toast.error(validationError || "Please fill in all required fields correctly");
      return;
    }

    try {
      setIsSubmitting(true);

      // Create the notification data object
      const notificationData = {
        title: values.title,
        message: values.message,
        type: values.type,
        referenceId: values.referenceId || undefined
      };

      if (values.recipientType === "all") {
        // Send to all users
        await notificationService.createNotificationForAll(notificationData);
        toast.success("Notification sent to all users");
      } else if (values.recipientType === "multiple") {
        // Send to multiple users
        if (!values.userIds || values.userIds.length === 0) {
          toast.error("Please select at least one recipient");
          setIsSubmitting(false);
          return;
        }

        await notificationService.createBulkNotifications(values.userIds, notificationData);
        toast.success(`Notification sent to ${values.userIds.length} users`);
      } else {
        // Send to a single user
        if (!values.userId) {
          toast.error("Please select a recipient");
          setIsSubmitting(false);
          return;
        }

        await notificationService.createNotification({
          userId: values.userId,
          ...notificationData
        });
        toast.success("Notification sent successfully");
      }

      // Reset form and close dialog on success
      form.reset();
      onSuccess();
    } catch (error: any) {
      // Enhanced error handling
      console.error("Error sending notification:", error);

      // Extract error message from API response if available
      const errorMessage = error.response?.data?.message ||
        error.message ||
        "Failed to send notification";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If users failed to load, show error
  if (usersError) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-center text-red-500">
            Failed to load users. Please try again later.
          </p>
          <Button onClick={onCancel}>Close</Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="recipientType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Recipient Type <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset selected users when changing recipient type
                      if (value !== "multiple") {
                        setSelectedUserIds([]);
                      }
                    }}
                    defaultValue={field.value}
                    className="flex flex-wrap gap-4"
                  >
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="single" />
                      </FormControl>
                      <FormLabel className="cursor-pointer flex items-center">
                        <User className="mr-1 h-4 w-4" /> Single User
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="multiple" />
                      </FormControl>
                      <FormLabel className="cursor-pointer flex items-center">
                        <UsersRound className="mr-1 h-4 w-4" /> Multiple Users
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="all" />
                      </FormControl>
                      <FormLabel className="cursor-pointer flex items-center">
                        <CheckCircle className="mr-1 h-4 w-4" /> All Users
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {recipientType === "single" && (
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select User <span className="text-red-500">*</span></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {usersLoading ? (
                        <SelectItem value="loading-placeholder">
                          Loading users...
                        </SelectItem>
                      ) : users.length === 0 ? (
                        <SelectItem value="no-users-placeholder">
                          No users found
                        </SelectItem>
                      ) : (
                        users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.fullName} ({user.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {recipientType === "multiple" && (
            <FormField
              control={form.control}
              name="userIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Users <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                      {usersLoading ? (
                        <div className="py-4 text-center text-gray-500">Loading users...</div>
                      ) : users.length === 0 ? (
                        <div className="py-4 text-center text-gray-500">No users found</div>
                      ) : (
                        <div className="space-y-2">
                          {users.map(user => (
                            <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md">
                              <Checkbox
                                checked={selectedUserIds.includes(user.id)}
                                onCheckedChange={() => toggleUser(user.id)}
                                id={`user-${user.id}`}
                              >
                                <CheckboxIndicator />
                              </Checkbox>
                              <label
                                htmlFor={`user-${user.id}`}
                                className="flex-grow cursor-pointer text-sm"
                              >
                                {user.fullName} ({user.email})
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <div className="mt-2 text-sm">
                    {selectedUserIds.length > 0 ? (
                      <span className="text-blue-600">{selectedUserIds.length} user(s) selected</span>
                    ) : (
                      <span className="text-red-500">Please select at least one user</span>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Notification title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notification message"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type <span className="text-red-500">*</span></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select notification type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="message">Message</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference ID (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Related object ID (task, leave, etc.)"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formValid}
              title={!formValid ? getValidationError() || "Please fill all required fields correctly" : ""}
            >
              {isSubmitting ? "Sending..." : "Send Notification"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

export default NotificationForm;
