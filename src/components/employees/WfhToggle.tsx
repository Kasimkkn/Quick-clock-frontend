
import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { userService } from "@/services/api";
import { toast } from "sonner";
import { User } from "@/types";

interface WfhToggleProps {
  employee: User;
  onStatusChange: () => void;
}

const WfhToggle: React.FC<WfhToggleProps> = ({ employee, onStatusChange }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleWfh = async (checked: boolean) => {
    setIsLoading(true);
    try {
      await userService.updateUser(employee.id, {
        ...employee,
        isWfhEnabled: checked,
      });
      
      toast.success(
        checked 
          ? "Work From Home status enabled" 
          : "Work From Home status disabled"
      );
      
      onStatusChange();
    } catch (error) {
      console.error("Failed to update WFH status:", error);
      toast.error("Failed to update Work From Home status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={!!employee.isWfhEnabled}
        onCheckedChange={handleToggleWfh}
        disabled={isLoading}
        aria-label="Toggle WFH status"
      />
      <span className={`text-sm ${isLoading ? "opacity-50" : ""}`}>
        {employee.isWfhEnabled ? "WFH Enabled" : "Office Only"}
      </span>
    </div>
  );
};

export default WfhToggle;
