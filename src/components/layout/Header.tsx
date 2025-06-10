
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { notificationService } from "@/services/api";
import { Notification } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Bell, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const { isAuthenticated, currentUser, logout, isAdmin } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch notifications count
  const { data: unreadCountData = 0 } = useQuery({
    queryKey: ['notificationsCount'],
    queryFn: async () => {
      try {
        const response = await notificationService.getUnreadCount();
        return response.data.count;
      } catch (error) {
        console.error("Error fetching notification count:", error);
        return 0;
      }
    },
    refetchInterval: 60000, // Refetch every minute
    enabled: isAuthenticated
  });

  // Fetch latest notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['headerNotifications'],
    queryFn: async () => {
      try {
        const response = await notificationService.getMyNotifications();
        return response.data.notifications.slice(0, 5); // Get only latest 5
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
    },
    enabled: isAuthenticated
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      refetchNotifications(); // Refresh notifications after marking as read
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Get notification time
  const getNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  // Truncate text function
  const truncateText = (text: string, maxLength: number = 60) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <header className={`bg-white shadow-sm border-b sticky top-0 z-30 ${isAuthenticated ? "md:pl-[60px]" : ""}`}>
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <h1 className="font-bold text-xl text-gray-900 hidden sm:inline-block">QuickClock</h1>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} {currentTime.toLocaleTimeString()}
          </div>

          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCountData > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-primary text-white text-[10px] h-4 min-w-4 flex items-center justify-center">
                      {unreadCountData}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-80 overflow-y-auto">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notification: Notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className={`font-medium ${!notification.isRead ? 'text-blue-800' : ''}`}>
                          {notification.title}
                        </div>
                        <div className={`text-xs ${!notification.isRead ? 'text-blue-700' : 'text-muted-foreground'}`}>
                          {truncateText(notification.message, 80)}
                        </div>
                        <div className="text-xs text-muted-foreground">{getNotificationTime(notification.createdAt)}</div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">No notifications</p>
                    </div>
                  )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center font-medium">
                  <Link to={`${currentUser?.role === 'admin' ? '/admin/notifications' : '/my-notifications'}`}>View all notifications</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser?.photoUrl} alt={currentUser?.fullName} />
                    <AvatarFallback>{currentUser?.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
