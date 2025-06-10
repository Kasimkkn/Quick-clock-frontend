
import { Button } from '@/components/ui/button';
import { getCurrentLocation } from '@/lib/utils';
import { geofenceService } from '@/services/api';
import { GeoLocation } from '@/types';
import { AlertTriangle, Loader2, MapPin, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';

interface LocationTrackerProps {
  onLocationCaptured: (location: GeoLocation) => void;
  buttonText?: string;
}

export default function LocationTracker({
  onLocationCaptured,
  buttonText = "Capture Location"
}: LocationTrackerProps) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const [activeGeoFence, setActiveGeoFence] = useState<{centerLatitude: number, centerLongitude: number} | null>(null);

  useEffect(() => {
    // If user is WFH, fetch the active geofence to use its coordinates
    if (currentUser?.isWfhEnabled) {
      const fetchActiveGeoFence = async () => {
        try {
          const response = await geofenceService.getAllGeoFences();
          const activeFence = response.data.geofences.find(fence => fence.active);
          
          if (activeFence) {
            setActiveGeoFence({
              centerLatitude: activeFence.centerLatitude,
              centerLongitude: activeFence.centerLongitude
            });
          }
        } catch (err) {
          console.error("Error fetching active geofence:", err);
        }
      };
      
      fetchActiveGeoFence();
    }
  }, [currentUser?.isWfhEnabled]);
  
  const captureLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      let userLocation: GeoLocation | null = null;
      
      // For WFH employees, use the active geofence coordinates
      if (currentUser?.isWfhEnabled && activeGeoFence) {
        userLocation = {
          latitude: activeGeoFence.centerLatitude,
          longitude: activeGeoFence.centerLongitude,
          accuracy: 10, // Set a default accuracy
          isWithinFence: true // Always within fence for WFH employees
        };
        
        toast.success("WFH location captured", {
          description: "Using office location for WFH employee."
        });
      } else {
        // Get actual location for non-WFH employees
        userLocation = await getCurrentLocation();
        
        if (!userLocation) {
          setError("Could not get your location. Please enable location services.");
          toast.error("Location service error", {
            description: "Please enable location services in your browser settings."
          });
          setLoading(false);
          return;
        }

        // Only check geo-fencing for non-WFH employees
        const isWithinFenceData = await geofenceService.isLocationWithinGeoFence(
          userLocation.latitude, 
          userLocation.longitude
        );
        const isWithinFence = isWithinFenceData.data.isWithinFence;
        
        userLocation.isWithinFence = isWithinFence;
        
        if (!isWithinFence) {
          toast.warning("Out of authorized zone", {
            description: "You are not within the authorized office zone."
          });
          setError("You are not within the authorized office zone.");
        }
      }

      setLocation(userLocation);
      onLocationCaptured(userLocation);

    } catch (err) {
      console.error("Error capturing location:", err);
      setError("Failed to get your location. Please try again.");
      toast.error("Location error", {
        description: "Failed to capture your location. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <Button
          onClick={captureLocation}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Location...
            </>
          ) : (
            <>
              {currentUser?.isWfhEnabled ? (
                <Home className="mr-2 h-4 w-4" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              {buttonText}
            </>
          )}
        </Button>
      </div>

      {location && (
        <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-3 rounded">
          <div className="flex items-center mb-1">
            {currentUser?.isWfhEnabled ? (
              <Home className="h-4 w-4 mr-1" />
            ) : (
              <MapPin className="h-4 w-4 mr-1" />
            )}
            <span className="font-medium">Location captured</span>
            {currentUser?.isWfhEnabled && (
              <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                WFH
              </span>
            )}
          </div>
          <p>Latitude: {location.latitude.toFixed(6)}</p>
          <p>Longitude: {location.longitude.toFixed(6)}</p>
          <p>Accuracy: {location.accuracy ? `±${location.accuracy.toFixed(1)}m` : 'Unknown'}</p>
        </div>
      )}

      {error && !currentUser?.isWfhEnabled && (
        <div className="flex items-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
          <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
