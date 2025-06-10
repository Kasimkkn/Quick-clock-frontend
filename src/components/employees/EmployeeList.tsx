import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { userService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, MoreVertical, RefreshCw, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import UserManagement from "./UserManagement";
import WfhToggle from "./WfhToggle";

const EmployeeList = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch employees
  const {
    data: employeesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await userService.getAllUsers();
      return response.data.users;
    }
  });

  // Handle delete employee
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    try {
      await userService.deleteUser(employeeToDelete.id);
      toast.success("Employee deleted successfully");
      refetch();
      setIsDeleteAlertOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Failed to delete employee");
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteAlertOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    if (!isDeleting) {
      setIsDeleteAlertOpen(false);
      setEmployeeToDelete(null);
    }
  };

  // Handle edit employee
  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Handle role update
  const handleRoleUpdate = async (id, role) => {
    try {
      await userService.updateUserRole(id, role);
      toast.success(`Role updated to ${role}`);
      refetch();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  // Filter employees based on search term
  const filteredEmployees = employeesData
    ? employeesData.filter(emp => {
      const fullName = emp.fullName.toLowerCase();
      const email = emp.email.toLowerCase();
      const department = emp.department?.toLowerCase() || '';
      const designation = emp.designation?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();

      return fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        department.includes(searchLower) ||
        designation.includes(searchLower);
    })
    : [];

  // Check if there are any employees that can be edited or deleted
  const hasActionableEmployees = filteredEmployees.some(emp => {
    // Define criteria for employees that can have actions
    return emp.role !== "admin" || emp.id !== currentUser.id;
  });

  if (error) {
    console.error("Error fetching employees:", error);
    return <div>Error loading employees. Please try again later.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      ) : filteredEmployees.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>WFH Status</TableHead>
              {hasActionableEmployees && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => {
              const isCurrentUser = employee.id === currentUser.id;
              const isAdmin = employee.role === "admin";
              const hasActions = !isCurrentUser || !isAdmin;

              return (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="font-medium">
                        {employee.fullName} {employee.lastName}
                        {isCurrentUser && (
                          <Badge variant="outline" className="ml-2">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.department || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={employee.role === "admin" ? "default" : "outline"}>
                      {employee.role === "admin" ? "Admin" : "Employee"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <WfhToggle
                      employee={employee}
                      onStatusChange={refetch}
                    />
                  </TableCell>
                  {hasActionableEmployees && (
                    <TableCell className="text-right">
                      {hasActions && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                              Edit Profile
                            </DropdownMenuItem>
                            {!isCurrentUser && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleRoleUpdate(
                                    employee.id,
                                    employee.role === "admin" ? "employee" : "admin"
                                  )}
                                >
                                  {employee.role === "admin"
                                    ? "Remove Admin Rights"
                                    : "Make Admin"
                                  }
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => openDeleteDialog(employee)}
                                >
                                  Delete Employee
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No employees found</p>
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-max">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Employee" : "Add Employee"}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update employee information"
                : "Enter details to add a new employee"
              }
            </DialogDescription>
          </DialogHeader>
          <UserManagement
            key={'user-management'}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Employee
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{employeeToDelete?.fullName} {employeeToDelete?.lastName}"?
              This action cannot be undone and will permanently remove the employee from the system,
              including all their associated data and access permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmployee}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Employee
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeList;