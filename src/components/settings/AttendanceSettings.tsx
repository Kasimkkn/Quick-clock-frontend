
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock } from 'lucide-react';

const saveAttendanceSettings = (settings: AttendanceSettings) => {
  localStorage.setItem('attendanceSettings', JSON.stringify(settings));
};

const getAttendanceSettings = (): AttendanceSettings => {
  const settings = localStorage.getItem('attendanceSettings');
  if (settings) {
    return JSON.parse(settings);
  }

  // Default settings
  return {
    lateThresholdHour: 9,
    lateThresholdMinute: 15,
    autoCheckoutHour: 0, // Midnight
    autoCheckoutMinute: 0
  };
};

export interface AttendanceSettings {
  lateThresholdHour: number;
  lateThresholdMinute: number;
  autoCheckoutHour: number;
  autoCheckoutMinute: number;
}

const AttendanceSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AttendanceSettings>({
    lateThresholdHour: 9,
    lateThresholdMinute: 15,
    autoCheckoutHour: 0,
    autoCheckoutMinute: 0
  });

  // Load settings on component mount
  useEffect(() => {
    const savedSettings = getAttendanceSettings();
    setSettings(savedSettings);
  }, []);

  const handleSave = () => {
    // Validate inputs
    const hourValid = settings.lateThresholdHour >= 0 && settings.lateThresholdHour < 24;
    const minuteValid = settings.lateThresholdMinute >= 0 && settings.lateThresholdMinute < 60;

    if (!hourValid || !minuteValid) {
      toast({
        title: "Invalid Time",
        description: "Please enter valid hours (0-23) and minutes (0-59)",
        variant: "destructive"
      });
      return;
    }

    saveAttendanceSettings(settings);

    toast({
      title: "Settings Saved",
      description: "Attendance settings have been updated successfully"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-timesRoman font-bold">Attendance Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Late Attendance Threshold</h3>
            <p className="text-sm text-gray-500">
              Employees who check-in after this time will be marked as late
            </p>

            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="lateThresholdHour">Hour (0-23)</Label>
                <Input
                  id="lateThresholdHour"
                  type="number"
                  min={0}
                  max={23}
                  value={settings.lateThresholdHour}
                  onChange={(e) => setSettings({
                    ...settings,
                    lateThresholdHour: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="lateThresholdMinute">Minute (0-59)</Label>
                <Input
                  id="lateThresholdMinute"
                  type="number"
                  min={0}
                  max={59}
                  value={settings.lateThresholdMinute}
                  onChange={(e) => setSettings({
                    ...settings,
                    lateThresholdMinute: parseInt(e.target.value) || 0
                  })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Auto-Checkout Settings</h3>
            <p className="text-sm text-gray-500">
              Time when the system will automatically check out employees who forgot to check out
            </p>

            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="autoCheckoutHour">Hour (0-23)</Label>
                <Input
                  id="autoCheckoutHour"
                  type="number"
                  min={0}
                  max={23}
                  value={settings.autoCheckoutHour}
                  onChange={(e) => setSettings({
                    ...settings,
                    autoCheckoutHour: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="autoCheckoutMinute">Minute (0-59)</Label>
                <Input
                  id="autoCheckoutMinute"
                  type="number"
                  min={0}
                  max={59}
                  value={settings.autoCheckoutMinute}
                  onChange={(e) => setSettings({
                    ...settings,
                    autoCheckoutMinute: parseInt(e.target.value) || 0
                  })}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} className="w-full sm:w-auto">
              <Clock className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceSettings;
