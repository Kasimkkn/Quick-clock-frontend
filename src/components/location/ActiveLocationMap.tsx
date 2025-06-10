
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { AlertCircle } from 'lucide-react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Circle from 'ol/geom/Circle';
import { Style, Fill, Stroke, Icon } from 'ol/style';
import 'ol/ol.css';

interface ActiveLocationMapProps {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
}

const ActiveLocationMap = ({ center, radius }: ActiveLocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Convert coordinates from WGS 84 (longitude, latitude) to Web Mercator
      const centerCoord = fromLonLat([center.longitude, center.latitude]);
      
      // Create vector source for map features
      const vectorSource = new VectorSource();
      
      // Create point feature for the center marker
      const pointFeature = new Feature({
        geometry: new Point(centerCoord)
      });
      
      // Style for the center marker
      pointFeature.setStyle(new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: 'https://openlayers.org/en/latest/examples/data/icon.png',
          scale: 0.5
        })
      }));
      
      // Add the point feature to the source
      vectorSource.addFeature(pointFeature);
      
      // Calculate radius in map units (meters)
      // OpenLayers uses meters for measurement in Web Mercator projection
      const circleFeature = new Feature({
        geometry: new Circle(centerCoord, radius)
      });
      
      // Style for the circle (geofence)
      circleFeature.setStyle(new Style({
        fill: new Fill({
          color: 'rgba(139, 92, 246, 0.2)'
        }),
        stroke: new Stroke({
          color: 'rgba(109, 40, 217, 0.8)',
          width: 2
        })
      }));
      
      // Add the circle feature to the source
      vectorSource.addFeature(circleFeature);
      
      // Create vector layer with the features
      const vectorLayer = new VectorLayer({
        source: vectorSource
      });
      
      // Create the map
      map.current = new Map({
        target: mapContainer.current,
        layers: [
          // Base layer with OpenStreetMap
          new TileLayer({
            source: new OSM()
          }),
          // Vector layer with our features
          vectorLayer
        ],
        view: new View({
          center: centerCoord,
          zoom: 15
        })
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to initialize map.');
    }

    return () => {
      if (map.current) {
        map.current.setTarget(undefined);
        map.current = null;
      }
    };
  }, [center, radius]);

  return (
    <div className="h-[300px] rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default ActiveLocationMap;
