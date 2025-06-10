
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { manualRequestService } from "@/services/api";
import { ManualRequest } from "@/types";
import { format, parseISO } from "date-fns";
import { CheckCircle, Search, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch (error) {
    return dateStr;
  }
};
type FilterState = {
  status: "all" | "pending" | "approved" | "rejected";
  employee: string;
  searchTerm: string;
};

const AdminAttendanceRequestTable = () => {
  const [requests, setRequests] = useState<ManualRequest[]>([]);
  const [employees, setEmployees] = useState<{ id: string, fullName: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    employee: "all",
    searchTerm: "",
  });
  const [selectedRequest, setSelectedRequest] = useState<ManualRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await manualRequestService.getAllManualRequests();
      if (response.data) {
        setRequests(response.data);

        // Extract unique employees from requests
        const uniqueEmployees = Array.from(
          new Map(
            response.data
              .filter(req => req.employee)
              .map(req => [
                req.employeeId,
                { id: req.employeeId, fullName: req.employee?.fullName || 'Unknown' }
              ])
          ).values()
        );
        setEmployees(uniqueEmployees as { id: string, fullName: string }[]);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load attendance requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    try {
      await manualRequestService.processManualRequest(
        selectedRequest.id,
        "approved",
        "Request approved by admin"
      );

      // Update the local state
      setRequests(prev =>
        prev.map(req => req.id === selectedRequest.id ? { ...req, status: "approved" } : req)
      );

      toast.success("Request approved successfully");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    try {
      await manualRequestService.processManualRequest(
        selectedRequest.id,
        "rejected",
        "Request rejected by admin"
      );

      // Update the local state
      setRequests(prev =>
        prev.map(req => req.id === selectedRequest.id ? { ...req, status: "rejected" } : req)
      );

      toast.success("Request rejected successfully");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  const openRequestDetails = (request: ManualRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const filteredRequests = requests.filter((request) => {
    // Filter by status
    if (filters.status !== "all" && request.status !== filters.status) {
      return false;
    }

    // Filter by employee
    if (filters.employee !== "all" && request.employeeId !== filters.employee) {
      return false;
    }

    // Search by date, reason, or employee name
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const dateMatch = format(parseISO(request.date), "PPP").toLowerCase().includes(searchLower);
      const reasonMatch = request.reason.toLowerCase().includes(searchLower);
      const nameMatch = request.employee?.fullName?.toLowerCase().includes(searchLower) || false;

      if (!dateMatch && !reasonMatch && !nameMatch) {
        return false;
      }
    }

    return true;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regularization Requests</CardTitle>
        <CardDescription>
          Review and manage attendance regularization requests from employees
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by employee, date or reason..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.employee}
            onValueChange={(value) => handleFilterChange("employee", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In/Out</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No requests found matching the filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.employee?.fullName || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(request.date), "PP")}
                      </TableCell>
                      <TableCell>
                        {request.checkInTime && `In: ${request.checkInTime}`}
                        {request.checkInTime && request.checkOutTime && <br />}
                        {request.checkOutTime && `Out: ${request.checkOutTime}`}
                        {!request.checkInTime && !request.checkOutTime && "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {formatDate(request.createdAt)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {request.reason}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRequestDetails(request)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Request Details Dialog */}
        {selectedRequest && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Regularization Request Details</DialogTitle>
                <DialogDescription>
                  Submitted on {format(parseISO(selectedRequest.createdAt), "PPP")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold">Employee</h4>
                    <p>{selectedRequest.employee?.fullName || "Unknown"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Date</h4>
                    <p>{format(parseISO(selectedRequest.date), "PPP")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold">Check In Time</h4>
                    <p>{selectedRequest.checkInTime || "Not specified"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Check Out Time</h4>
                    <p>{selectedRequest.checkOutTime || "Not specified"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold">Request Type</h4>
                  <p className="capitalize">
                    {selectedRequest.type === "new" ? "New Record" : "Edit Existing Record"}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold">Reason</h4>
                  <p className="text-sm">{selectedRequest.reason}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold">Status</h4>
                  <Badge className={getStatusBadgeClass(selectedRequest.status)}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {selectedRequest.status === "pending" && (
                <DialogFooter className="flex space-x-2">
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={processingId === selectedRequest.id}
                  >
                    {processingId === selectedRequest.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={processingId === selectedRequest.id}
                  >
                    {processingId === selectedRequest.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAttendanceRequestTable;
