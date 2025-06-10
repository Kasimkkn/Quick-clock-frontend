
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Bell, CheckCircle, Clock, FileText, Info, MessageSquare, XCircle } from "lucide-react";
import { notificationService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Notification } from "@/types";

const getIconForType = (type: string) => {
  switch (type) {
    case "leave":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "task":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "info":
      return <Info className="h-4 w-4 text-sky-500" />;
    case "warning":
      return <XCircle className="h-4 w-4 text-amber-500" />;
    case "message":
      return <MessageSquare className="h-4 w-4 text-violet-500" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "project":
      return <FileText className="h-4 w-4 text-indigo-500" />;
    case "holiday":
      return <FileText className="h-4 w-4 text-purple-500" />;
    case "system":
      return <Info className="h-4 w-4 text-gray-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

// Truncate text function
const truncateText = (text: string, maxLength: number = 80) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

const NotificationPanel = () => {
  const [hasUnread, setHasUnread] = useState(false);

  const {
    data: notificationsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const response = await notificationService.getMyNotifications();
        const unreadExists = response.data.notifications.some((n: Notification) => !n.isRead);
        setHasUnread(unreadExists);
        return response.data.notifications;
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to fetch notifications");
        return [];
      }
    }
  });

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      await refetch();
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    if (!hasUnread) {
      toast.info("All notifications are already marked as read");
      return;
    }

    try {
      await notificationService.markAllAsRead();
      // Refetch notifications after marking all as read
      await refetch();
      setHasUnread(false);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const deleteAllRead = async () => {
    const hasReadNotifications = notificationsData?.some((n: Notification) => n.isRead);

    if (!hasReadNotifications) {
      toast.info("No read notifications to clear");
      return;
    }

    try {
      await notificationService.deleteAllRead();
      // Refetch notifications after deleting read ones
      await refetch();
      toast.success("Read notifications cleared");
    } catch (error) {
      console.error("Error deleting read notifications:", error);
      toast.error("Failed to delete read notifications");
    }
  };

  if (error) {
    console.error("Error fetching notifications:", error);
  }

  return (
    <div className="space-y-3">
      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={markAllAsRead}
          disabled={isLoading || !hasUnread}
          title={!hasUnread ? "No unread notifications" : "Mark all as read"}
        >
          Mark all as read
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={deleteAllRead}
          disabled={isLoading || !notificationsData?.some((n: Notification) => n.isRead)}
          title={!notificationsData?.some((n: Notification) => n.isRead) ? "No read notifications to clear" : "Clear read notifications"}
        >
          Clear read
        </Button>
      </div>

      <ScrollArea className="h-[67vh]">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notificationsData && notificationsData.length > 0 ? (
          <div className="space-y-2">
            {notificationsData.map((notification: Notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 rounded-lg transition-colors cursor-pointer",
                  notification.isRead
                    ? "bg-gray-100/50 border border-gray-200"
                    : "bg-blue-100 border border-blue-300 shadow-sm"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex gap-3">
                  <div className={cn(
                    "p-2 rounded-full h-max",
                    notification.isRead ? "bg-white/80" : "bg-white"
                  )}>
                    {getIconForType(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className={cn(
                        "font-medium",
                        notification.isRead ? "" : "text-blue-900"
                      )}>
                        {truncateText(notification.title, 50)}
                      </span>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" /> {new Date(notification.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <p className={cn(
                      "text-xs",
                      notification.isRead ? "text-muted-foreground" : "text-blue-700"
                    )}>
                      {truncateText(notification.message, 120)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Bell className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NotificationPanel;
