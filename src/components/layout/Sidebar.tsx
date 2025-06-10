
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { notificationService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Calendar,
  CalendarCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Home,
  LineChart,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Table,
  UserCog,
  Users,
  FolderKanban,
  Clock,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define interface for navigation link items
interface NavLinkItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const Sidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const { isAdmin, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Fetch unread notification count for badge
  const { data: unreadCountData } = useQuery({
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
  });

  const navLinkClass = ({ isActive }: { isActive: boolean }) => {
    return cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
      {
        "bg-accent text-accent-foreground": isActive,
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground": !isActive,
        "justify-center": !expanded && !isMobile,
        "w-full": expanded || isMobile
      }
    );
  };

  const toggleExpanded = () => setExpanded(!expanded);

  // Add the Team Collaboration link to both admin and employee arrays
  const teamCollaborationLink: NavLinkItem = { 
    to: "/collaboration", 
    label: "Collaboration", 
    icon: <MessageSquare className="h-5 w-5" /> 
  };

  // Admin navigation links
  const adminLinks: NavLinkItem[] = [
    { to: "/admin", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    teamCollaborationLink,  // Add collaboration link for admins
    { to: "/attendance", label: "Attendance", icon: <CheckCircle className="h-5 w-5" /> },
    { to: "/leaves", label: "Leaves", icon: <FileText className="h-5 w-5" /> },
    { to: "/employees", label: "Employees", icon: <Users className="h-5 w-5" /> },
    { to: "/requests", label: "Requests", icon: <ClipboardList className="h-5 w-5" /> },
    { to: "/calendar", label: "Calendar", icon: <Calendar className="h-5 w-5" /> },
    { to: "/locations", label: "Locations", icon: <MapPin className="h-5 w-5" /> },
    { to: "/projects", label: "Projects", icon: <FolderKanban className="h-5 w-5" /> },
    { to: "/admin/tasks", label: "Tasks", icon: <Table className="h-5 w-5" /> },
    { to: "/admin/notifications", label: "Notifications", icon: <Bell className="h-5 w-5" />, badge: unreadCountData },
    { to: "/analytics", label: "Analytics", icon: <LineChart className="h-5 w-5" /> },
    { to: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  // Employee navigation links
  const employeeLinks: NavLinkItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    teamCollaborationLink,  // Add collaboration link for employees
    { to: "/my-attendance", label: "My Attendance", icon: <CheckCircle className="h-5 w-5" /> },
    { to: "/my-leaves", label: "My Leaves", icon: <FileText className="h-5 w-5" /> },
    { to: "/my-requests", label: "My Requests", icon: <ClipboardList className="h-5 w-5" /> },
    { to: "/team-calendar", label: "Team Calendar", icon: <CalendarCheck className="h-5 w-5" /> },
    { to: "/my-tasks", label: "My Tasks", icon: <Table className="h-5 w-5" /> },
    { to: "/my-notifications", label: "Notifications", icon: <Bell className="h-5 w-5" />, badge: unreadCountData },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  if (isMobile && !expanded) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shadow-lg"
          onClick={toggleExpanded}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-white transition-all duration-300",
        {
          "w-60": expanded,
          "w-16": !expanded,
          "translate-x-0": expanded || !isMobile,
          "-translate-x-full": !expanded && isMobile
        }
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b px-3",
          expanded ? "justify-between" : "justify-center"
        )}
      >
        <Clock className="h-6 w-6 text-primary" />
      </div>

      <div className={cn("flex-1 overflow-y-auto py-2", expanded ? "px-3" : "px-2")}>
        <nav className="grid gap-1">
          <TooltipProvider>
            {links.map((link) => (
              <Tooltip key={link.to} delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink to={link.to} className={navLinkClass} end={link.to === "/admin" || link.to === "/dashboard"}>
                    <div className="flex items-center flex-col">
                      <div className="relative">
                        {link.icon}
                        {link.badge > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                            {link.badge}
                          </span>
                        )}
                      </div>
                      {(expanded || isMobile) && <span className="text-xs">{link.label}</span>}
                    </div>
                  </NavLink>
                </TooltipTrigger>
                {!expanded && !isMobile && <TooltipContent side="right">{link.label}</TooltipContent>}
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </div>

      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-10 top-2"
          onClick={toggleExpanded}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default Sidebar;
