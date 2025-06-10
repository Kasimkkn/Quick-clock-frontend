
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { projectService, taskService, userService } from "@/services/api";
import { Task } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { formatDistance, parseISO } from "date-fns";
import { MoreVertical, Plus, SortAsc, SortDesc } from "lucide-react";
import { useEffect, useState } from "react";
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

const TasksPage = () => {
  const [open, setOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: tasksData, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', searchQuery, filterStatus, sortOrder],
    queryFn: async () => {
      try {
        // Fix: Remove the extra parameters and handle filtering in the component if needed
        const response = await taskService.getAllTasks();
        let filteredTasks = response.data.tasks || [];

        // Apply filters manually if needed
        if (searchQuery) {
          filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        if (filterStatus) {
          if (filterStatus === 'none') {
            filteredTasks = response.data.tasks || [];
          } else {
            filteredTasks = filteredTasks.filter(task =>
              task.status === filterStatus
            );
          }
        }

        // Sort tasks by due date
        filteredTasks.sort((a, b) => {
          if (!a.dueDate) return sortOrder === 'asc' ? 1 : -1;
          if (!b.dueDate) return sortOrder === 'asc' ? -1 : 1;

          const dateA = new Date(a.dueDate).getTime();
          const dateB = new Date(b.dueDate).getTime();

          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        return filteredTasks;
      } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }
    }
  });
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const response = await projectService.getAllProjects();
        return response.data.projects || [];
      } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
      }
    }
  });
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await userService.getAllUsers();
        return response.data.users || [];
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    }
  });

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || "");
      setStatus(editTask.status);
      setPriority(editTask.priority);
      setDueDate(editTask.dueDate.split("T")[0] || "");
      setProjectId(editTask.projectId || "");
      setAssigneeId(editTask.assignedTo || "");
    } else {
      setTitle("");
      setDescription("");
      setStatus("");
      setPriority("");
      setDueDate("");
      setProjectId("");
      setAssigneeId("");
    }
  }, [editTask]);

  const createTask = async () => {
    try {
      if (!title || !description || !projectId || !assigneeId) {
        toast.error("Title, description, project ID, and assignee are required");
        return
      }
      await taskService.createTask({
        title,
        description,
        status,
        priority,
        dueDate,
        projectId,
        assigneeId
      });
      toast.success("Task created successfully.");
      setOpen(false);
      refetchTasks();
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task. Please try again.");
    }
  };

  const updateTask = async () => {
    if (!editTask?.id) {
      toast.error("Task ID is missing.");
      return;
    }

    try {
      await taskService.updateTask(editTask.id, {
        title,
        description,
        status,
        priority,
        dueDate,
        projectId,
        assigneeId
      });
      toast.success("Task updated successfully.");
      setOpen(false);
      setEditTask(null);
      refetchTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task. Please try again.");
    }
  };

  const deleteTask = async (task: Task) => {
    if (!task.id) {
      toast.error("Task ID is missing.");
      return;
    }

    try {
      await taskService.deleteTask(task.id);
      toast.success("Task deleted successfully.");
      refetchTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task. Please try again.");
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      // Make sure we're using a valid status transition
      if ((task.status === "completed" && newStatus !== "completed") ||
        (task.status !== "completed" && newStatus === "completed") ||
        (task.status !== "completed" && newStatus !== "completed")) {
        // Valid status transition
      } else {
        // No change needed, current status matches new status
        return;
      }

      await taskService.updateTask(task.id, { status: newStatus });
      toast.success(`Task status updated to ${newStatus}.`);
      refetchTasks();
    } catch (error) {
      console.error("Failed to update task status:", error);
      toast.error("Failed to update task status. Please try again.");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("");
    setSortOrder("desc");
    refetchTasks();
  };

  return (
    <Layout>
      <div className="py-2">
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-2xl font-bold">Tasks</CardTitle>
          <div>
            <Button onClick={() => { setOpen(true); setEditTask(null); }}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Search, Filter & Sort</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              <Input
                type="text"
                placeholder="Search by title"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="none">All</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                defaultValue={sortOrder}
                onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by Due Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    <div className="flex items-center">
                      <SortAsc className="mr-2 h-4 w-4" />
                      <span>Ascending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="desc">
                    <div className="flex items-center">
                      <SortDesc className="mr-2 h-4 w-4" />
                      <span>Descending</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasksData && tasksData.length > 0 ? (
                  tasksData.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell>
                        {task.dueDate ? formatDistance(parseISO(task.dueDate), new Date(), { addSuffix: true }) : 'No due date'}
                      </TableCell>
                      <TableCell>{task.project?.name || 'No project'}</TableCell>
                      <TableCell>{task.assignee?.fullName || 'Unassigned'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => { setEditTask(task); setOpen(true); }}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteTask(task)}>
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusChange(task, task.status === 'completed' ? 'todo' : 'completed')}>
                              {task.status === 'completed' ? 'Mark as To Do' : 'Mark as Completed'}
                            </DropdownMenuItem>
                            {task.status !== 'blocked' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(task, 'blocked')}>
                                Mark as Blocked
                              </DropdownMenuItem>
                            )}
                            {task.status === 'blocked' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(task, 'todo')}>
                                Unblock Task
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No tasks found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-semibold">
                {editTask ? "Edit Task" : "Create New Task"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {editTask ? "Update task details and settings" : "Fill in the details to create a new task"}
              </p>
            </DialogHeader>

            <div className="space-y-4">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-medium">Basic Information</h3>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Task Title *
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter task title"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the task in detail"
                      className="w-full min-h-[100px] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Task Settings Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-medium">Task Settings</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">
                      Status
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status Options</SelectLabel>
                          <SelectItem value="todo">📝 To Do</SelectItem>
                          <SelectItem value="in-progress">⚡ In Progress</SelectItem>
                          <SelectItem value="completed">✅ Completed</SelectItem>
                          <SelectItem value="blocked">🚫 Blocked</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-sm font-medium">
                      Priority
                    </Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Priority Levels</SelectLabel>
                          <SelectItem value="high">🔴 High Priority</SelectItem>
                          <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                          <SelectItem value="low">🟢 Low Priority</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-sm font-medium">
                      Due Date
                    </Label>
                    <Input
                      type="date"
                      id="dueDate"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigneeId" className="text-sm font-medium">
                      Assignee
                    </Label>
                    <Select value={assigneeId} onValueChange={setAssigneeId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Assign to someone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Team Members</SelectLabel>
                          {usersData && usersData.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              👤 {user.fullName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Project Assignment Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <h3 className="text-lg font-medium">Project Assignment</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId" className="text-sm font-medium">
                    Project
                  </Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Available Projects</SelectLabel>
                        {projectsData && projectsData.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            📁 {project.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-8 mt-8 border-t">
              <div className="text-xs text-muted-foreground">
                * Required fields
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editTask ? updateTask : createTask}
                >
                  {editTask ? "Update Task" : "Create Task"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default TasksPage;
