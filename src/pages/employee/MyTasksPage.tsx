
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, CircleDashed } from "lucide-react";
import { taskService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskUpdateRequest from "@/components/task/TaskUpdateRequest";
import { toast } from "sonner";

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
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

const calculateProgress = (status: string): number => {
  switch (status) {
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

const MyTasksPage = () => {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Fetch tasks
  const { data: tasksData, isLoading, error, refetch } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      try {
        const response = await taskService.getMyTasks();
        return response.data.tasks || [];
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to load tasks. Please try again.");
        return [];
      }
    }
  });

  // Update task status
  const handleUpdateStatus = async (taskId: string | number, status: string) => {
    try {
      await taskService.updateTaskStatus(taskId, status);
      toast.success(`Task status updated to ${status}`);
      refetch();
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  // Filter tasks based on active tab
  const filteredTasks = tasksData ? tasksData.filter((task: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return task.status !== "completed";
    if (activeTab === "completed") return task.status === "completed";
    if (activeTab === "overdue") {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < new Date() && task.status !== "completed";
    }
    return true;
  }) : [];

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Tasks Overview</CardTitle>
            <CardDescription>
              Track and update your tasks. Request changes when needed.
            </CardDescription>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="all">All Tasks</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Priority</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead className="hidden md:table-cell">Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading tasks...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-red-500">
                      Error loading tasks. Please try again.
                    </TableCell>
                  </TableRow>
                ) : filteredTasks.length > 0 ? (
                  filteredTasks.map((task: any) => (
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
                            <div className="text-xs text-muted-foreground hidden sm:block">
                              {task.project ? task.project.name : "No project"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getPriorityBadge(task.priority)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDueDate(task.dueDate)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="w-full">
                          <Progress value={calculateProgress(task.status)} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {task.status !== "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(task.id, "completed")}
                            >
                              Complete
                            </Button>
                          )}
                          <TaskUpdateRequest
                            taskId={task.id}
                            currentTitle={task.title}
                            currentDescription={task.description}
                            onUpdateSuccess={refetch}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No tasks found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MyTasksPage;
