
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notificationService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import NotificationPanel from "@/components/dashboard/NotificationPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import NotificationForm from "@/components/notifications/NotificationForm";
import { Bell, Plus } from "lucide-react";
import { useState } from "react";

const NotificationsPage = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Fetch unread count for display
  const {
    data: unreadCountData,
    isLoading: countLoading,
    refetch: refetchCount
  } = useQuery({
    queryKey: ['notificationsCount'],
    queryFn: async () => {
      const response = await notificationService.getUnreadCount();
      return response.data.count;
    }
  });

  const markAllAsRead = async () => {
    // Don't attempt if there are no unread notifications
    if (!unreadCountData || unreadCountData === 0) {
      toast.info("All notifications are already marked as read");
      return;
    }

    try {
      await notificationService.markAllAsRead();
      toast.success("All notifications marked as read");
      refetchCount();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create Notification</DialogTitle>
                <DialogDescription>
                  Send a notification to an employee, team member, or all users.
                </DialogDescription>
              </DialogHeader>
              <NotificationForm 
                onSuccess={() => {
                  setCreateDialogOpen(false);
                  refetchCount();
                }} 
                onCancel={() => setCreateDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                All Notifications
                {!countLoading && unreadCountData > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {unreadCountData} unread
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllAsRead}
                disabled={countLoading || unreadCountData === 0}
              >
                <Bell className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationPanel />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
