
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/api';

const NotificationPushService = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Set up event source for real-time notifications
    // In production, this would connect to a real server-sent events endpoint
    const setupNotificationListener = () => {
      // Simulate real-time push notifications with periodic polling
      const pollInterval = setInterval(async () => {
        try {
          // Get latest notifications
          const result = await notificationService.getMyNotifications();
          const notifications = result.data.notifications;

          // Find unread notifications
          const unreadNotifications = notifications.filter(
            (notification) => !notification.isRead
          );

          // Display toast for recent unread notifications
          if (unreadNotifications.length > 0) {
            // Only show the most recent one to avoid spamming
            const latestNotification = unreadNotifications[0];

            toast(latestNotification.title, {
              description: latestNotification.message,
              icon: <Bell className="h-4 w-4" />,
              action: {
                label: "View",
                onClick: () => {
                  // Mark as read when clicked
                  notificationService.markAsRead(latestNotification.id);

                  // Navigate based on type
                  const type = latestNotification.type;
                  if (type === 'task') {
                    window.location.href = '/tasks';
                  } else if (type === 'leave') {
                    window.location.href = '/leaves';
                  } else {
                    window.location.href = '/admin/notifications';
                  }
                }
              }
            });

            // Mark as read to avoid showing again
            await notificationService.markAsRead(latestNotification.id);
          }
        } catch (error) {
          console.error("Error polling for notifications:", error);
        }
      }, 10000); // Poll every 5 seconds

      return () => clearInterval(pollInterval);
    };

    const cleanup = setupNotificationListener();
    return cleanup;
  }, [currentUser]);

  // This component doesn't render anything, it just sets up the listeners
  return null;
};

export default NotificationPushService;
