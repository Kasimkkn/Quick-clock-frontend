
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { leaveService } from "@/services/api";
import { LeaveRequest, LeaveType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { differenceInBusinessDays, format, parseISO } from "date-fns";
import { Calendar, Clock, File } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import LeaveForm from "./LeaveForm";

// Helper function to calculate business days between two dates
const calculateBusinessDays = (startDate: string, endDate: string): number => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return differenceInBusinessDays(end, start) + 1; // Include both start and end dates
};

// Function to get badge color based on leave status
const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Function to get badge color based on leave type
const getLeaveTypeColor = (type: LeaveType) => {
  switch (type) {
    case "sick":
      return "bg-blue-100 text-blue-800";
    case "vacation":
      return "bg-purple-100 text-purple-800";
    case "personal":
      return "bg-indigo-100 text-indigo-800";
    case "casual":
      return "bg-green-100 text-green-800";
    case "paid":
      return "bg-emerald-100 text-emerald-800";
    case "unpaid":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
const EmployeeLeaveManager = () => {
  const [openLeaveFormDialog, setOpenLeaveFormDialog] = useState(false);

  // Fetch my leaves
  const {
    data: leaves,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["myLeaves"],
    queryFn: async () => {
      const response = await leaveService.getMyLeaves();
      return response.data;
    }
  });

  // Default annual leave balance
  const totalLeaveBalance = 12;

  const handleCancelLeave = async (leaveId: string) => {
    try {
      await leaveService.cancelLeave(leaveId);
      toast.success("Leave request cancelled");
      refetch();
    } catch (error) {
      console.error("Error cancelling leave:", error);
      toast.error("Failed to cancel leave request");
    }
  };

  const calculateLeavesTaken = () => {
    if (!leaves) return 0;
    return leaves.filter((leave: LeaveRequest) => leave.status === "approved").reduce((total: number, leave: LeaveRequest) => {
      return total + calculateBusinessDays(leave.startDate, leave.endDate);
    }, 0);
  };

  const leavesTaken = calculateLeavesTaken();

  // Check if any leaves have pending status that can be cancelled
  const hasPendingLeaves = leaves?.some((leave: LeaveRequest) => leave.status === "pending") || false;

  return <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-primary" />
            Leaves Taken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{leavesTaken} days</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Clock className="mr-2 h-4 w-4 text-amber-500" />
            Pending Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {leaves?.filter((leave: LeaveRequest) => leave.status === "pending").length || 0}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <File className="mr-2 h-4 w-4 text-green-500" />
            Remaining Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalLeaveBalance - leavesTaken} days
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold">My Leave Requests</h2>
      <Dialog open={openLeaveFormDialog} onOpenChange={setOpenLeaveFormDialog}>
        <DialogTrigger asChild>
          <Button>Apply for Leave</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-semibold mb-2">Apply for Leave</DialogTitle>
            <DialogDescription>
              Fill in the details to submit a leave request.
            </DialogDescription>
          </DialogHeader>
          <LeaveForm onSuccess={() => {
            setOpenLeaveFormDialog(false);
            refetch();
          }} onClose={() => setOpenLeaveFormDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>

    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              {hasPendingLeaves && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow>
              <TableCell colSpan={hasPendingLeaves ? 6 : 5} className="text-center">Loading leave requests...</TableCell>
            </TableRow> : leaves && leaves.length > 0 ? leaves.map((leave: LeaveRequest) => <TableRow key={leave.id}>
              <TableCell>
                <Badge className={getLeaveTypeColor(leave.type)}>
                  {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(leave.startDate), "MMM d, yyyy")}
                {" to "}
                {format(new Date(leave.endDate), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                {calculateBusinessDays(leave.startDate, leave.endDate)} day(s)
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {leave.reason}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(leave.status)}>
                  {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                </Badge>
              </TableCell>
              {hasPendingLeaves && (
                <TableCell className="text-right">
                  {leave.status === "pending" && <Button variant="outline" size="sm" onClick={() => handleCancelLeave(leave.id)}>
                    Cancel
                  </Button>}
                </TableCell>
              )}
            </TableRow>) : <TableRow>
              <TableCell colSpan={hasPendingLeaves ? 6 : 5} className="text-center">No leave requests found</TableCell>
            </TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>;
};
export default EmployeeLeaveManager;
