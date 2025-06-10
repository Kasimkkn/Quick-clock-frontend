
import { SmartCheckoutDialog } from '@/components/attendance/SmartCheckoutDialog';
import LocationTracker from '@/components/location/LocationTracker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCurrentTimeString } from '@/lib/utils';
import { attendanceService, geofenceService } from '@/services/api';
import { Html5Qrcode } from "html5-qrcode";
import { AlertCircle, Fingerprint, Loader2, QrCode } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const QR_CONFIG = {
  fps: 10,
  qrbox: { width: 240, height: 240 },
};

const EXTENDED_HOURS_THRESHOLD = 9;

const QrScanner = () => {
  const { currentUser } = useAuth();
  console.log('currentUser:', currentUser);
  const { toast } = useToast();
  const qrContainerRef = useRef(null);
  const scannerRef = useRef(null);

  const [isScanning, setIsScanning] = useState(false);
  const [location, setLocation] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showLateCheckoutDialog, setShowLateCheckoutDialog] = useState(false);
  const [pendingCheckoutData, setPendingCheckoutData] = useState(null);
  const [processingAttendance, setProcessingAttendance] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchTodaysAttendance = async () => {
      try {
        const response = await attendanceService.getTodayAttendance();
        if (response.data) {
          setTodayRecord(response.data.attendance);
        }
      } catch (error) {
        console.log('Error fetching today\'s attendance:', error);
      }
    };

    fetchTodaysAttendance();

    if (currentUser.isWfhEnabled) {
      populateWfhLocation();
    }
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
      }
    };
  }, []);

  const populateWfhLocation = async () => {
    try {
      const response = await geofenceService.getAllGeoFences();
      const activeGeofence = response.data.geofences.find(fence => fence.active);

      if (activeGeofence) {
        setLocation({
          latitude: activeGeofence.centerLatitude,
          longitude: activeGeofence.centerLongitude,
          isWithinFence: true
        });
      }
    } catch (error) {
      console.error('Error fetching geofences for WFH user:', error);
      toast({
        title: "Error",
        description: "Could not fetch office locations. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLocationCaptured = (locationData) => {
    setLocation(locationData);
    setErrorMessage(null);
  };

  const showNotification = (type, title, message) => {
    if (type === 'error') {
      setErrorMessage(message);
    } else {
      setErrorMessage(null);
    }

    if (type === 'error') {
      toast({
        title: title || "Error",
        description: message,
        variant: "destructive",
      });
    } else if (type === 'success') {
      toast({
        title: title,
        description: message,
      });
    } else if (type === 'info') {
      toast({
        title: title,
        description: message,
      });
    }

    if (type === 'error') {
      setIsScanning(false);
    }
  };

  const calculateWorkingHours = (checkInTime) => {
    if (!checkInTime) return 0;

    const now = new Date();
    const checkIn = new Date();
    const [hours, minutes] = checkInTime.split(':').map(Number);

    checkIn.setHours(hours, minutes, 0);
    const diffMs = now.getTime() - checkIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours;
  };

  const processAttendance = async (lateCheckoutReason = '') => {
    if (!currentUser || !location || processingAttendance) return;

    setProcessingAttendance(true);

    try {
      const currentTime = getCurrentTimeString();
      const isCheckedIn = todayRecord?.checkInTime;

      if (!isCheckedIn || isCheckedIn.length === 0) {
        try {
          const res = await attendanceService.checkIn(location.latitude, location.longitude);
          if (res.data) {
            console.log('Checked in:', res.data.attendance);
            setTodayRecord(res.data.attendance);
            showNotification('success', "Check-in Successful", `You checked in at ${currentTime}`);
          }
        } catch (error) {
          console.log('Error checking in:', error);
          showNotification('error', "Check-in Failed", "Unable to check in. Please try again.");
        }
      } else {
        try {
          const res = await attendanceService.checkOut(location.latitude, location.longitude, lateCheckoutReason);
          if (res.data) {
            console.log('Checked out:', res.data.attendance);
            setTodayRecord(res.data.attendance);
            showNotification('success', "Check-out Successful", `You checked out at ${currentTime}`);
          }
        } catch (error) {
          console.log('Error checking out:', error);
          showNotification('error', "Check-out Failed", "Unable to check out. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error saving attendance record:", error);
      showNotification('error', "Error", "Failed to save attendance record");
    } finally {
      setProcessingAttendance(false);
      stopScanner();
    }
  };

  const handleQrCodeSuccess = async (decodedText) => {
    // Prevent multiple scans being processed at the same time
    if (processingAttendance) return;

    try {
      if (!currentUser) {
        showNotification('error', "Not Logged In", "Please log in to mark attendance");
        return;
      }

      stopScanner();
      setProcessingAttendance(true);

      if (decodedText !== currentUser.id) {
        showNotification('error', "Invalid QR Code", "This QR code doesn't match your employee ID");
        setProcessingAttendance(false);
        return;
      }

      if (!location) {
        showNotification('error', "Location Required", "Please capture your location first before scanning");
        setProcessingAttendance(false);
        return;
      }

      if (!location.isWithinFence && !currentUser.isWfhEnabled) {
        showNotification('error', "Location Restricted", "You are not within the authorized office zone");
        setProcessingAttendance(false);
        return;
      }

      // Check if this is a check-out operation - first get latest data from server
      try {
        const latestResponse = await attendanceService.getTodayAttendance();
        const latestRecord = latestResponse.data?.attendance;

        // Update state with latest data
        if (latestRecord) {
          setTodayRecord(latestRecord);
        }

        // Use the latest record for check-out logic
        if (latestRecord && latestRecord.checkInTime && !latestRecord.checkOutTime) {
          const workingHours = calculateWorkingHours(latestRecord.checkInTime);

          // If working hours exceed threshold, show dialog
          if (workingHours > EXTENDED_HOURS_THRESHOLD) {
            setPendingCheckoutData({
              checkInTime: latestRecord.checkInTime
            });
            setShowLateCheckoutDialog(true);
            setProcessingAttendance(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching latest attendance data:", error);
        // Continue with local data if server fetch fails
      }

      await processAttendance();

    } catch (error) {
      console.error("Error processing attendance:", error);
      showNotification('error', "Error", "Failed to process attendance. Please try again");
      setProcessingAttendance(false);
    }
  };

  const handleLateCheckoutSubmit = async (reason) => {
    await processAttendance(reason);
    setShowLateCheckoutDialog(false);
  };

  const startScanner = () => {
    if (!location) {
      showNotification('error', "Location Required", "Please capture your location first before scanning");
      return;
    }

    if (processingAttendance || isScanning || isInitializing) {
      return;
    }

    setIsInitializing(true);
    setIsScanning(true);

    setTimeout(() => {
      try {
        if (!qrContainerRef.current) {
          showNotification('error', "Scanner Error", "QR scanner container not found");
          setIsInitializing(false);
          setIsScanning(false);
          return;
        }

        // Clean up any existing scanner instance first
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop()
            .then(() => initializeScanner())
            .catch(err => {
              console.error("Error stopping previous scanner:", err);
              initializeScanner();
            });
        } else {
          initializeScanner();
        }
      } catch (err) {
        console.error("Error in setTimeout callback:", err);
        showNotification('error', "Scanner Error", "Failed to initialize QR scanner. Please try again");
        setIsInitializing(false);
        setIsScanning(false);
      }
    }, 100);
  };

  const initializeScanner = () => {
    try {
      const qrScanner = new Html5Qrcode("qr-reader");
      scannerRef.current = qrScanner;

      qrScanner
        .start(
          { facingMode: "environment" },
          QR_CONFIG,
          handleQrCodeSuccess,
          (errorMessage) => {
            // Don't log every frame error
            if (!errorMessage.includes("No QR code found")) {
              console.log("QR scan error:", errorMessage);
            }
          }
        )
        .catch((err) => {
          console.error("Error starting scanner:", err);
          showNotification('error', "Scanner Error", "Could not start the scanner. Please check camera permissions");
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } catch (err) {
      console.error("Error initializing scanner:", err);
      showNotification('error', "Scanner Error", "Failed to initialize QR scanner. Please try again");
      setIsInitializing(false);
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .then(() => {
          setIsScanning(false);
        })
        .catch(err => {
          console.error("Error stopping scanner:", err);
          setIsScanning(false);
        });
    } else {
      setIsScanning(false);
    }
  };

  const renderAttendanceStatus = () => {
    if (!todayRecord) {
      return (
        <p className="text-gray-600 flex flex-col items-center">
          <QrCode className="h-10 w-10 mb-2 text-gray-400" />
          You haven't checked in today
        </p>
      );
    } else if (!todayRecord.checkOutTime) {
      return (
        <p className="text-green-600 flex flex-col items-center">
          <Fingerprint className="h-10 w-10 mb-2 text-green-500" />
          Checked in at {todayRecord.checkInTime}
          <span className="text-sm mt-1">Scan again to check out</span>
        </p>
      );
    } else {
      return (
        <p className="text-blue-600 flex flex-col items-center">
          <Fingerprint className="h-10 w-10 mb-2 text-blue-500" />
          Attendance complete for today
          <span className="text-sm mt-1">In: {todayRecord.checkInTime} | Out: {todayRecord.checkOutTime}</span>
        </p>
      );
    }
  };

  const getScanButtonText = () => {
    if (!todayRecord) return "Scan to Check In";
    if (!todayRecord.checkOutTime) return "Scan to Check Out";
    return "Attendance Complete";
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Scan QR Code to Mark Attendance</span>
            {todayRecord && todayRecord.checkInTime && !todayRecord.checkOutTime && (
              <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                Checked In
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium mb-3">Step 1: Capture Your Location</h3>
            {currentUser?.isWfhEnabled ? (
              <div className="bg-blue-50 p-3 rounded-md text-blue-800">
                <p className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Location is automatically set for WFH employees
                </p>
              </div>
            ) : (
              <LocationTracker
                onLocationCaptured={handleLocationCaptured}
                buttonText="Verify Your Location"
              />
            )}
          </div>

          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className="text-lg font-medium mb-3">Step 2: Scan Your ID Card</h3>
            {isScanning ? (
              <>
                <div
                  id="qr-reader"
                  ref={qrContainerRef}
                  className="mb-4 h-72 bg-gray-100"
                >
                  <div className="text-center p-4 h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Camera is starting...</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button variant="outline" onClick={stopScanner}>
                    Cancel Scan
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-4 border rounded-md bg-gray-50">
                  {renderAttendanceStatus()}
                </div>

                <Button
                  className="w-full"
                  onClick={startScanner}
                  disabled={!location || (todayRecord && todayRecord.checkOutTime) || processingAttendance || isInitializing}
                >
                  {processingAttendance || isInitializing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="mr-2 h-4 w-4" />
                  )}
                  {processingAttendance || isInitializing ? "Processing..." : getScanButtonText()}
                </Button>

                {!location && (
                  <p className="text-sm text-amber-600 text-center">
                    Please capture your location first
                  </p>
                )}

                {(processingAttendance || isInitializing) && (
                  <p className="text-sm text-blue-600 text-center">
                    Please wait, processing your attendance...
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Smart Checkout Dialog for late work hours */}
      {showLateCheckoutDialog && pendingCheckoutData && (
        <SmartCheckoutDialog
          open={showLateCheckoutDialog}
          onClose={() => {
            setShowLateCheckoutDialog(false);
            setProcessingAttendance(false);
          }}
          onSubmit={handleLateCheckoutSubmit}
          checkInTime={pendingCheckoutData.checkInTime}
        />
      )}
    </div>
  );
};

export default QrScanner;
