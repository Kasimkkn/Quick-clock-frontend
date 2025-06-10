
import { useState, useEffect } from "react";
import { CheckCircle2, CircleDashed, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { taskService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@/types";
import { useAuth } from "@/context/AuthContext";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
    case "in-progress":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
    case "todo":
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">To Do</Badge>;
    case "blocked":
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Blocked</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">High</Badge>;
    case "medium":
      return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">Medium</Badge>;
    case "low":
      return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">Low</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const formatDueDate = (dateStr: string) => {
  if (!dateStr) return "No due date";
  
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const calculateProgress = (task: Task): number => {
  switch (task.status) {
    case "completed":
      return 100;
    case "in-progress":
      return 50;
    case "blocked":
      return 25;
    case "todo":
    default:
      return 0;
  }
};

const TasksSummary = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    blocked: 0
  });

  // Fetch tasks
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['dashboard-tasks'],
    queryFn: async () => {
      try {
        if (isAdmin) {
          const response = await taskService.getAllTasks();
          return response.data.tasks || [];
        } else {
          const response = await taskService.getMyTasks();
          return response.data.tasks || [];
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }
    }
  });

  // Calculate stats when tasks data changes
  useEffect(() => {
    if (tasksData && tasksData.length > 0) {
      const total = tasksData.length;
      const completed = tasksData.filter((t: Task) => t.status === 'completed').length;
      const inProgress = tasksData.filter((t: Task) => t.status === 'in-progress').length;
      const todo = tasksData.filter((t: Task) => t.status === 'todo').length;
      const blocked = tasksData.filter((t: Task) => t.status === 'blocked').length;
      
      setStats({
        total,
        completed,
        inProgress,
        todo,
        blocked
      });
    }
  }, [tasksData]);

  return (
    <div className="space-y-4">
      {/* Task Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-muted-foreground">Total Tasks</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-muted-foreground">In Progress</div>
          <div className="text-2xl font-semibold text-blue-600">{stats.inProgress}</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-2xl font-semibold text-green-600">{stats.completed}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-muted-foreground">To Do</div>
          <div className="text-2xl font-semibold text-gray-600">{stats.todo}</div>
        </div>
      </div>

      {/* Task Progress Overview */}
      <div className="rounded-lg border overflow-hidden">
        <div className="p-3 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Recent Tasks</h3>
            <Link to={isAdmin ? "/admin/tasks" : "/my-tasks"}>
              <Button variant="link" size="sm" className="h-auto p-0">
                View All
              </Button>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Loading tasks...
                  </TableCell>
                </TableRow>
              ) : tasksData && tasksData.length > 0 ? (
                tasksData.slice(0, 4).map((task: Task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />
                        ) : task.status === 'in-progress' ? (
                          <Clock className="h-4 w-4 text-blue-500 mt-1" />
                        ) : (
                          <CircleDashed className="h-4 w-4 text-gray-500 mt-1" />
                        )}
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {task.project?.name || "No project"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(task.status)}
                    </TableCell>
                    <TableCell>
                      {formatDueDate(task.dueDate)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={calculateProgress(task)} className="h-2" />
                        <span className="text-xs text-muted-foreground">{calculateProgress(task)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No tasks found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default TasksSummary;
