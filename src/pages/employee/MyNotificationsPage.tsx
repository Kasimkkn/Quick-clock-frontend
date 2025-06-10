
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NotificationPanel from "@/components/dashboard/NotificationPanel";
import { notificationService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

const MyNotificationsPage = () => {
  const {
    data: unreadCountData,
    isLoading: countLoading
  } = useQuery({
    queryKey: ['notificationsCount'],
    queryFn: async () => {
      const response = await notificationService.getUnreadCount();
      return response.data.count;
    }
  });

  return (
    <Layout>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              My Notifications
              {!countLoading && unreadCountData > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {unreadCountData} unread
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <NotificationPanel />
        </CardContent>
      </Card>
    </Layout>
  );
};

export default MyNotificationsPage;
