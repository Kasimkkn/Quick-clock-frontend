
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import QrScanner from "@/components/qr/QrScanner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { geofenceService } from "@/services/api";

const Scan = () => {
  const { isAuthenticated, isAdmin, currentUser } = useAuth();
  const navigate = useNavigate();
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      // If user is WFH enabled, we don't need to check camera permissions
      // as we'll use geofence coordinates directly
      if (currentUser?.isWfhEnabled) {
        setPermissionError(null);
        return;
      }
      
      // For non-WFH users, check camera permissions as before
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setPermissionError(null);
        })
        .catch((err) => {
          console.error("Camera permission error:", err);
          setPermissionError("Camera access is required for QR scanning. Please enable camera permissions in your browser settings.");
        });
    }
  }, [isAuthenticated, isAdmin, currentUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }

    if (isAdmin) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate, isAdmin]);

  if (!isAuthenticated || isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-8">
        {permissionError && !currentUser?.isWfhEnabled && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Camera Permission Required</AlertTitle>
            <AlertDescription>{permissionError}</AlertDescription>
          </Alert>
        )}
        
        {currentUser?.isWfhEnabled && (
          <Alert variant="default" className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Work From Home Mode</AlertTitle>
            <AlertDescription>
              You're in WFH mode. Location check will be automatically passed.
            </AlertDescription>
          </Alert>
        )}
        
        <QrScanner />
      </div>
    </Layout>
  );
};

export default Scan;
