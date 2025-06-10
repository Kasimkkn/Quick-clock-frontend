
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { cn, formatDate } from "@/lib/utils";
import { manualRequestService } from "@/services/api";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import ManualAttendanceRequestTable from "./ManualAttendanceRequestTable";

export default function ManualAttendanceRequest() {
  const { currentUser } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTable, setRefreshTable] = useState(0);

  const resetForm = () => {
    setDate(new Date());
    setCheckInTime("");
    setCheckOutTime("");
    setReason("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !date) {
      toast.error("Missing required information");
      return;
    }

    if (!checkInTime && !checkOutTime) {
      toast.error("Please provide at least check-in or check-out time");
      return;
    }

    if (!reason) {
      toast.error("Please provide a reason for this request");
      return;
    }

    const formattedDate = formatDate(date);

    try {
      setIsLoading(true);

      await manualRequestService.submitManualRequest(
        formattedDate,
        checkInTime || undefined,
        checkOutTime || undefined,
        reason
      );

      toast.success("Request submitted successfully");
      resetForm();
      // Trigger refresh on the table component
      setRefreshTable(prev => prev + 1);
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error("Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Attendance Request</CardTitle>
          <CardDescription>
            Use this form to request attendance adjustments for days you forgot to check in/out
            or need to correct existing records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="request-date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="request-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check-in">Check-in Time</Label>
                <Input
                  id="check-in"
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="check-out">Check-out Time</Label>
                <Input
                  id="check-out"
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Request</Label>
              <Textarea
                id="reason"
                placeholder="Provide details about why you need this attendance adjustment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Display the table of requests with the key based on refreshTable to force re-render */}
      <ManualAttendanceRequestTable key={refreshTable} />
    </div>
  );
};
