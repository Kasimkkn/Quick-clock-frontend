import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateId } from "@/lib/utils";
import { manualRequestService } from "@/services/api";
import { format } from "date-fns";
import { CheckCircle, FileText, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Request types
interface ManualRequest {
  id: string;
  employeeId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  type: "new" | "edit";
  originalRecordId?: string;
  employee: {
    id: string;
    fullName: string;
    designation: string;
    department: string;
  }
}

export default function AdminAttendanceRequests() {
  const [requests, setRequests] = useState<ManualRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await manualRequestService.getAllManualRequests();
      if (response.data) {
        setRequests(response.data);
      }
    } catch (error) {
      console.error("Error fetching manual requests:", error);
      toast.error("Failed to load attendance requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (request: ManualRequest) => {
    setProcessingId(request.id);
    try {
      await manualRequestService.processManualRequest(
        request.id,
        "approved",
        "Request approved by admin"
      );

      // Update local state
      setRequests(prev =>
        prev.map(r => r.id === request.id ? { ...r, status: "approved" } : r)
      );

      toast.success("Request approved successfully");
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: ManualRequest) => {
    setProcessingId(request.id);
    try {
      await manualRequestService.processManualRequest(
        request.id,
        "rejected",
        "Request rejected by admin"
      );

      // Update local state
      setRequests(prev =>
        prev.map(r => r.id === request.id ? { ...r, status: "rejected" } : r)
      );

      toast.success("Request rejected successfully");
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-700";
      case "rejected": return "bg-red-700";
      default: return "bg-yellow-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Manual Attendance Requests
        </CardTitle>
        <CardDescription>
          Review and approve/reject employee requests for attendance adjustments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading requests...
          </div>
        ) : requests?.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-md p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="font-medium">{request?.employee.fullName}</div>
                    <div className="text-sm text-muted-foreground">
                      Requested on {format(new Date(request.createdAt), "PPP")}
                    </div>

                    <div className="mt-2 font-medium">
                      <span className="text-muted-foreground">Date: </span>
                      {format(new Date(request.date), "PPP")}
                    </div>

                    <div className="flex flex-wrap gap-x-4 mt-1">
                      {request.checkInTime && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Check-in: </span>
                          <span className="font-medium">{request.checkInTime}</span>
                        </div>
                      )}

                      {request.checkOutTime && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Check-out: </span>
                          <span className="font-medium">{request.checkOutTime}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Reason: </span>
                      <span className="text-sm">{request.reason}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    <Badge variant="default" className={getStatusBadgeClass(request.status)}>
                      {request.status}
                    </Badge>

                    {request.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-600 text-green-600 hover:bg-green-50"
                          onClick={() => handleApprove(request)}
                          disabled={processingId === request.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-600 hover:bg-red-50"
                          onClick={() => handleReject(request)}
                          disabled={processingId === request.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No attendance requests to review
          </div>
        )}
      </CardContent>
    </Card>
  );
}