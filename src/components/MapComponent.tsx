"use client";

import { useEffect, useRef } from "react";

interface City {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}

interface MapComponentProps {
  city: City;
}

export default function MapComponent({ city }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!mapInstanceRef.current && mapRef.current) {
        const map = L.map(mapRef.current, {
          center: [city.lat, city.lng],
          zoom: city.zoom,
          zoomControl: true,
          attributionControl: true,
        });

        // Dark tile layer - CartoDB Dark Matter
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 20,
          }
        ).addTo(map);

        // Custom neon marker icon
        const neonIcon = L.divIcon({
          className: "",
          html: `
            <div style="
              position: relative;
              width: 20px;
              height: 20px;
            ">
              <div style="
                width: 12px;
                height: 12px;
                background: #00d4ff;
                border-radius: 50%;
                position: absolute;
                top: 4px; left: 4px;
                box-shadow: 0 0 12px #00d4ff, 0 0 24px rgba(0,212,255,0.6);
                animation: markerPulse 2s ease-in-out infinite;
              "></div>
              <div style="
                width: 20px;
                height: 20px;
                border: 1px solid rgba(0,212,255,0.5);
                border-radius: 50%;
                position: absolute;
                top: 0; left: 0;
                animation: markerRing 2s ease-in-out infinite;
              "></div>
            </div>
            <style>
              @keyframes markerPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3); }
              }
              @keyframes markerRing {
                0% { transform: scale(1); opacity: 0.8; }
                100% { transform: scale(2.5); opacity: 0; }
              }
            </style>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        markerRef.current = L.marker([city.lat, city.lng], {
          icon: neonIcon,
        }).addTo(map);

        // Add a subtle circle around the location
        L.circle([city.lat, city.lng], {
          color: "#00d4ff",
          fillColor: "rgba(0, 212, 255, 0.03)",
          fillOpacity: 1,
          weight: 1,
          opacity: 0.4,
          radius: 15000,
        }).addTo(map);

        mapInstanceRef.current = map;
      } else if (mapInstanceRef.current) {
        // Update existing map
        mapInstanceRef.current.flyTo([city.lat, city.lng], city.zoom, {
          duration: 1.5,
          easeLinearity: 0.25,
        });

        if (markerRef.current) {
          markerRef.current.setLatLng([city.lat, city.lng]);
        }
      }
    };

    initMap();
  }, [city]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ background: "#0a0a0a" }}
    />
  );
}
