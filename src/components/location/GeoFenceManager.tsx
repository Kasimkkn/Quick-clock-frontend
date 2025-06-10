
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { getCurrentLocation } from '@/lib/utils';
import { geofenceService } from '@/services/api';
import { Map, MapPin, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { GeoFence } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  name: z.string().min(3, {
    message: "Name must be at least 3 characters.",
  }),
  centerLatitude: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Latitude must be a valid number.",
  }),
  centerLongitude: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Longitude must be a valid number.",
  }),
  radius: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Radius must be a positive number.",
  }),
  active: z.boolean().default(true),
});

const GeoFenceManager = () => {
  const [isAddingFence, setIsAddingFence] = useState(false);
  const [isEditingFence, setIsEditingFence] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [geofenceToDelete, setGeofenceToDelete] = useState<string | null>(null);

  // Fetch geofences
  const { data: geofences, isLoading, refetch: refetchGeoFences } = useQuery({
    queryKey: ['geofences'],
    queryFn: async () => {
      const response = await geofenceService.getAllGeoFences();
      return response.data.geofences;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      centerLatitude: "",
      centerLongitude: "",
      radius: "100",
      active: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!values.centerLatitude || !values.centerLongitude) {
        toast.error("Please enter a valid latitude and longitude.");
        return;
      }
      if (isEditingFence) {
        // Update existing geofence
        await geofenceService.updateGeoFence(
          isEditingFence,
          values.name,
          parseFloat(values.centerLatitude),
          parseFloat(values.centerLongitude),
          parseFloat(values.radius),
          values.active
        );
        toast.success("Location updated successfully");
      } else {
        // Create new geofence
        await geofenceService.createGeoFence(
          values.name,
          parseFloat(values.centerLatitude),
          parseFloat(values.centerLongitude),
          parseFloat(values.radius),
          values.active
        );
        toast.success("New location added");
      }

      // Reset form and state
      form.reset();
      setIsAddingFence(false);
      setIsEditingFence(null);
      refetchGeoFences();
    } catch (error) {
      console.error("Error saving geofence:", error);
      toast.error("Failed to save location");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!geofenceToDelete) return;

    try {
      await geofenceService.deleteGeoFence(geofenceToDelete);
      toast.success("Location deleted");
      setDeleteDialogOpen(false);
      setGeofenceToDelete(null);
      refetchGeoFences();
    } catch (error) {
      console.error("Error deleting geofence:", error);
      toast.error("Failed to delete location");
    }
  };

  const openDeleteDialog = (id: string) => {
    setGeofenceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (geofence: GeoFence) => {
    setIsEditingFence(geofence.id);
    setIsAddingFence(true);
    form.reset({
      name: geofence.name,
      centerLatitude: geofence.centerLatitude.toString(),
      centerLongitude: geofence.centerLongitude.toString(),
      radius: geofence.radius.toString(),
      active: geofence.active,
    });
  };

  const handleCancel = () => {
    form.reset();
    setIsAddingFence(false);
    setIsEditingFence(null);
  };

  const handleGetCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      form.setValue("centerLatitude", location.latitude.toString());
      form.setValue("centerLongitude", location.longitude.toString());
      toast.success("Current location detected");
    } catch (error) {
      console.error("Error getting location:", error);
      toast.error("Failed to get current location");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Office Locations</h3>
        {!isAddingFence && (
          <Button onClick={() => setIsAddingFence(true)}>
            <MapPin className="mr-2 h-4 w-4" />
            Add New Location
          </Button>
        )}
      </div>

      {isAddingFence ? (
        <Card>
          <CardHeader>
            <CardTitle>{isEditingFence ? "Edit Location" : "Add New Location"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Office HQ, Branch Office, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="centerLatitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 12.9716" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="centerLongitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 77.5946" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetCurrentLocation}
                >
                  <Map className="mr-2 h-4 w-4" />
                  Use My Current Location
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="radius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Radius (meters)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{isEditingFence ? "Update" : "Save"}</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <p>Loading locations...</p>
            ) : geofences && geofences.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {geofences.map((geofence: GeoFence) => (
                    <div key={geofence.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{geofence.name}</h4>
                            <Badge variant={geofence.active ? "default" : "outline"}>
                              {geofence.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {geofence.centerLatitude}, {geofence.centerLongitude} (radius: {geofence.radius}m)
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(geofence)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(geofence.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No locations configured. Add a new location to enable attendance tracking.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected location and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGeofenceToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GeoFenceManager;
