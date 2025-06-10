
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { leaveService } from "@/services/api";
import { format } from "date-fns";
import { CheckCircle, Clock, XCircle } from "lucide-react";

const AdminLeaveManager = () => {
  const [filter, setFilter] = useState("all");
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null
  );

  const fetchLeaves = async () => {
    try {
      setIsLoading(true);
      const response = await leaveService.getAllLeaves();
      setLeaveRequests(response.data || []);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast.error("Failed to load leave requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const openApproveDialog = (leave: any) => {
    console.log(
      "openApproveDialog called with leave:",
      leave
    )
    setSelectedLeave(leave);
    setDecision("approved");
    setRemarks("");
    setDialogOpen(true);
  };

  const openRejectDialog = (leave: any) => {
    setSelectedLeave(leave);
    setDecision("rejected");
    setRemarks("");
    setDialogOpen(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedLeave || !decision) return;

    try {
      await leaveService.updateLeaveStatus(
        selectedLeave.id,
        decision,
        remarks
      );
      toast.success(
        `Leave request ${decision === "approved" ? "approved" : "rejected"}`
      );
      setDialogOpen(false);
      fetchLeaves();
    } catch (error) {
      console.error("Error updating leave status:", error);
      toast.error("Failed to update leave status");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch (error) {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredLeaveRequests = leaveRequests.filter((leave) => {
    console.log(
      "filteredLeaveRequests called with leave:",
      leave.employee.fullName
    )
    if (filter === "all") return true;
    return leave.status === filter;
  });

  // Check if any leaves have actions available
  const hasActionsAvailable = filteredLeaveRequests.some(leave => leave.status === "pending");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>
              Review and manage leave requests from employees
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between gap-3">
              <Tabs
                defaultValue="all"
                className="w-full"
                value={filter}
                onValueChange={setFilter}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="hidden md:table-cell">Reason</TableHead>
                    <TableHead>Status</TableHead>
                    {hasActionsAvailable && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={hasActionsAvailable ? 6 : 5} className="text-center py-4">
                        Loading leave requests...
                      </TableCell>
                    </TableRow>
                  ) : filteredLeaveRequests.length > 0 ? (
                    filteredLeaveRequests.map((leave) => (

                      <TableRow key={leave.id}>
                        <TableCell className="font-medium">
                          {leave.employee?.fullName || "Unknown"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {leave.type}
                        </TableCell>
                        <TableCell>
                          {formatDate(leave.startDate)} -{" "}
                          {formatDate(leave.endDate)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {leave.reason}
                        </TableCell>
                        <TableCell>{getStatusBadge(leave.status)}</TableCell>
                        {hasActionsAvailable && (
                          <TableCell className="text-right">
                            {leave.status === "pending" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openApproveDialog(leave)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => openRejectDialog(leave)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={hasActionsAvailable ? 6 : 5} className="text-center py-4">
                        No leave requests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decision Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "approved"
                ? "Approve Leave Request"
                : "Reject Leave Request"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="remarks">
                {decision === "approved" ? "Approval Notes (Optional)" : "Rejection Reason"}
              </Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  decision === "approved"
                    ? "Add notes (optional)"
                    : "Please provide a reason for rejection"
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={decision === "approved" ? "default" : "destructive"}
              onClick={handleSubmitDecision}
            >
              {decision === "approved" ? "Approve Leave" : "Reject Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeaveManager;
