import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { TextField, Box, Button, CircularProgress, Paper, List, ListItem, ListItemText } from '@mui/material';
import { MyLocation as MyLocationIcon } from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Free Nominatim geocoding API (no key required)
const searchLocation = async (query: string) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
  );
  return response.json();
};

const reverseGeocode = async (lat: number, lng: number) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  );
  return response.json();
};

// Map click handler component
interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface LocationMapProps {
  address: string;
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  address,
  latitude,
  longitude,
  onLocationChange,
}) => {
  const [searchAddress, setSearchAddress] = useState(address);
  const [predictions, setPredictions] = useState<Record<string, unknown>[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<[number, number]>([latitude || 20.5937, longitude || 78.9629]);
  const searchTimeout = useRef(1000);

  const handleSearchInput = async (value: string) => {
    setSearchAddress(value);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (value.length > 2) {
      searchTimeout.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const results = await searchLocation(value);
          setPredictions(results);
          setShowPredictions(true);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handlePlaceSelect = async (place: Record<string, unknown>) => {
    setShowPredictions(false);
    setSearchAddress(place.display_name as string);
    const lat = parseFloat(place.lat as string);
    const lng = parseFloat(place.lon as string);
    setPosition([lat, lng]);
    onLocationChange(lat, lng, (place.display_name as string) || '');
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng).then(result => {
      if (result.display_name) {
        onLocationChange(lat, lng, result.display_name);
        setSearchAddress(result.display_name);
      } else {
        onLocationChange(lat, lng, searchAddress);
      }
    });
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setPosition([lat, lng]);
          const result = await reverseGeocode(lat, lng);
          onLocationChange(lat, lng, result.display_name || `${lat}, ${lng}`);
          setSearchAddress(result.display_name || `${lat}, ${lng}`);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
        }
      );
    }
  };


  return (
    <Box className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <TextField
              fullWidth
              size="small"
              placeholder="Search Location On Map"
              value={searchAddress}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => searchAddress.length > 2 && setShowPredictions(true)}
             
            />
            
            {/* Predictions Dropdown */}
            {showPredictions && predictions.length > 0 && (
              <Paper className="absolute z-10 w-full mt-1 max-h-64 overflow-auto shadow-lg">
                <List dense>
                  {predictions.map((prediction) => (
                    <ListItem
                      key={prediction.place_id as string}
                      onClick={() => handlePlaceSelect(prediction)}
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      <ListItemText
                        primary={<span className="font-medium text-sm">{(prediction.display_name as string).split(',')[0]}</span>}
                        secondary={<span className="text-xs text-gray-500">{(prediction.display_name as string).split(',').slice(1).join(',')}</span>}
                      />
                    </ListItem>
                  ))}
                </List>
                <div className="text-xs text-gray-400 text-center py-1 border-t">
                  Powered by OpenStreetMap
                </div>
              </Paper>
            )}
          </div>
          <Button
            variant="outlined"
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <MyLocationIcon />}
          >
            Current
          </Button>
        </div>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '400px', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} draggable={true} eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const latLng = marker.getLatLng();
            handleMapClick(latLng.lat, latLng.lng);
          }
        }} />
        <MapClickHandler onMapClick={handleMapClick} />
      </MapContainer>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>📍 Click on map to set location, or drag the marker</span>
        <span>Map Data &copy; OpenStreetMap contributors | Free & open</span>
      </div>
    </Box>
  );
};