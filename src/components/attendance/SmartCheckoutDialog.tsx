
import React, { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock } from "lucide-react";
import { toast } from "sonner";

interface SmartCheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  checkInTime: string;
}

export function SmartCheckoutDialog({ open, onClose, onSubmit, checkInTime }: SmartCheckoutDialogProps) {
  const [reason, setReason] = useState("");
  
  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for working late");
      return;
    }
    
    onSubmit(reason);
    setReason("");
    onClose();
  };

  const calculateHours = () => {
    if (!checkInTime) return "0";
    
    const now = new Date();
    const checkIn = new Date();
    const [hours, minutes] = checkInTime.split(':').map(Number);
    
    checkIn.setHours(hours, minutes, 0);
    const diffMs = now.getTime() - checkIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours.toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-amber-500" />
            Extended Work Hours
          </DialogTitle>
          <DialogDescription>
            You've worked approximately {calculateHours()} hours today.
            Please provide a reason for working late.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Enter reason for extended work hours..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit & Checkout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
