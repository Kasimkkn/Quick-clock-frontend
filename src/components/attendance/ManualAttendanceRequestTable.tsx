
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { manualRequestService } from "@/services/api";
import { ManualRequest } from "@/types";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash } from "lucide-react";

type FilterState = {
  status: "all" | "pending" | "approved" | "rejected";
  searchTerm: string;
};

const ManualAttendanceRequestTable = () => {
  const [requests, setRequests] = useState<ManualRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    searchTerm: "",
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await manualRequestService.getMyManualRequests();
      if (response.data) {
        setRequests(response.data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load your requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;

    try {
      setIsLoading(true);
      await manualRequestService.cancelManualRequest(requestId);
      toast.success("Request cancelled successfully");
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
    }
  };

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

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  const filteredRequests = requests.filter((request) => {
    const matchesStatus =
      filters.status === "all" || request.status === filters.status;
    const searchLower = filters.searchTerm.toLowerCase();
    
    // Search by date, reason, or status
    const matchesSearch =
      !filters.searchTerm ||
      format(parseISO(request.date), "PP").toLowerCase().includes(searchLower) ||
      request.reason.toLowerCase().includes(searchLower) ||
      request.status.toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  // Check if we have any pending requests that can be cancelled
  const hasPendingRequests = filteredRequests.some(request => request.status === "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Attendance Requests</CardTitle>
        <CardDescription>
          View and manage your manual attendance adjustment requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by date, reason or status..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="w-full"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  {hasPendingRequests && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={hasPendingRequests ? 6 : 5} 
                      className="text-center py-6 text-muted-foreground"
                    >
                      No requests found matching the filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {format(parseISO(request.date), "PP")}
                      </TableCell>
                      <TableCell>
                        {request.checkInTime || "—"}
                      </TableCell>
                      <TableCell>
                        {request.checkOutTime || "—"}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {request.reason}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </TableCell>
                      {hasPendingRequests && (
                        <TableCell className="text-right">
                          {request.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(request.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-100 h-8 px-2"
                            >
                              <Trash className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualAttendanceRequestTable;
