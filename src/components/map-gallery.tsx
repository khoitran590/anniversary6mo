"use client";

import { useEffect, useRef, useState } from "react";
import { PixelFrame } from "./pixel-frame";
import { PixelHeart } from "./pixel-art";

type Location = {
  id: string;
  name: string;
  /** A place name written in the page — e.g. "Joshua Tree National Park, CA".
   *  Resolved to coordinates for you at build time, so you never touch lat/lng. */
  place?: string;
  /** Coordinates, resolved from `place` at build time (or set manually). */
  lat?: number;
  lng?: number;
  captions: string[];
  photoIndices: number[];
};

interface MapGalleryProps {
  locations: Location[];
  photos: string[];
  tints: string[];
}

/* Minimal structural types for just the slice of the Google Maps JS API we use,
   so we avoid `any` without pulling in the full @types/google.maps package. */
type LatLng = { lat: number; lng: number };

interface GMapBounds {
  extend(point: LatLng): void;
}

interface GMap {
  fitBounds(bounds: GMapBounds, padding?: number): void;
}

interface GMarker {
  addListener(event: string, handler: () => void): void;
}

interface GoogleMaps {
  Map: new (el: HTMLElement, opts: unknown) => GMap;
  Marker: new (opts: unknown) => GMarker;
  LatLngBounds: new () => GMapBounds;
  SymbolPath: { CIRCLE: number };
}

function getGoogleMaps(): GoogleMaps | undefined {
  return (window as unknown as { google?: { maps?: GoogleMaps } }).google?.maps;
}

export function MapGallery({ locations, photos, tints }: MapGalleryProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<GMap | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  useEffect(() => {
    const container = mapContainer.current;
    if (!container) return;

    const initMap = () => {
      // Check if Google Maps is available
      const googleMaps = getGoogleMaps();
      if (!googleMaps) {
        console.warn(
          "Google Maps not loaded. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable."
        );
        return;
      }

      const mapInstance = new googleMaps.Map(container, {
        zoom: 4,
        center: { lat: 37.5, lng: -119 }, // gentle US-west default before bounds fit
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#f5f5f5" }],
          },
          {
            featureType: "water",
            elementType: "geometry.fill",
            stylers: [{ color: "#e8f4f8" }],
          },
          {
            featureType: "administrative",
            elementType: "labels.text.fill",
            stylers: [{ color: "#7c7c7c" }],
          },
        ],
      });

      map.current = mapInstance;

      // Drop a pin for every location that resolved to coordinates, tracking
      // bounds so they all fit in view.
      const bounds = new googleMaps.LatLngBounds();
      let placed = 0;
      locations.forEach((location) => {
        if (typeof location.lat !== "number" || typeof location.lng !== "number") {
          return;
        }
        const coords = { lat: location.lat, lng: location.lng };

        const marker = new googleMaps.Marker({
          position: coords,
          map: mapInstance,
          title: location.name,
          icon: {
            path: googleMaps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#ff69b4",
            fillOpacity: 0.8,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });

        marker.addListener("click", () => {
          setSelectedLocation(location);
        });

        bounds.extend(coords);
        placed += 1;
      });

      // Re-fit so every pin stays visible — both now and whenever the viewport
      // changes (e.g. a phone rotating between portrait and landscape).
      const fit = () => {
        if (placed > 1) mapInstance.fitBounds(bounds, 48);
      };
      fit();
      return fit;
    };

    let cleanupResize: (() => void) | undefined;

    // Wait for Google Maps to be available
    const checkGoogleMaps = setInterval(() => {
      if (getGoogleMaps()) {
        clearInterval(checkGoogleMaps);
        const fit = initMap();
        if (fit) {
          // Debounce so a burst of resize events triggers a single re-fit.
          let raf = 0;
          const onResize = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(fit);
          };
          window.addEventListener("resize", onResize);
          window.addEventListener("orientationchange", onResize);
          cleanupResize = () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
          };
        }
      }
    }, 100);

    return () => {
      clearInterval(checkGoogleMaps);
      cleanupResize?.();
    };
  }, [locations]);

  const selectedPhotos = selectedLocation
    ? selectedLocation.photoIndices.map((idx) => ({
        src: photos[idx],
        caption: selectedLocation.captions[
          selectedLocation.photoIndices.indexOf(idx)
        ],
        tint: tints[idx % tints.length],
      }))
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Map section */}
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-lg border-4 border-foreground shadow-lg">
          <div
            ref={mapContainer}
            className="h-[400px] w-full sm:h-[500px] lg:h-[600px]"
          />
        </div>
      </div>

      {/* Photos panel */}
      <div className="flex flex-col gap-4">
        {selectedLocation ? (
          <>
            <div
              key={selectedLocation.id}
              className="retro animate-pop rounded-lg border-4 border-foreground bg-secondary p-4 shadow-md"
            >
              <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
                <span className="inline-block animate-heartbeat">
                  <PixelHeart pixel={4} color="#ff69b4" />
                </span>
                {selectedLocation.name}
              </h3>
              <p className="mt-1 text-[10px] text-primary/80">
                {selectedPhotos.length} {selectedPhotos.length === 1 ? "memory" : "memories"}
              </p>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-2 sm:max-h-[550px]">
              {selectedPhotos.map((photo, idx) => (
                <div
                  key={idx}
                  className="animate-pop"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <PixelFrame
                    src={photo.src ? `/photos/${encodeURIComponent(photo.src)}` : undefined}
                    caption={photo.caption}
                    tint={photo.tint}
                    alt={photo.caption}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="retro flex flex-col items-center justify-center gap-3 rounded-lg border-4 border-dashed border-foreground/30 p-8 text-center">
            <PixelHeart pixel={6} color="#ff69b4" />
            <p className="text-xs text-primary/70">
              click a location pin to see our memories 💕
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
