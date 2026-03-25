"use client";

import Map, { Layer, Marker, Source } from "react-map-gl/mapbox";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PathData } from "@/lib/types";
import { CashFlowTicker } from "./CashFlowTicker";

type PointFeature = GeoJSON.Feature<GeoJSON.Point, { id: number }>;
type FeatureCollectionPoints = GeoJSON.FeatureCollection<GeoJSON.Point>;

const CENTER = { lng: -3.7004, lat: 40.4167 };

const COMPETITOR_OFFSETS: readonly [number, number][] = [
  [0.007, 0.004],
  [-0.005, 0.008],
  [0.002, -0.006],
];

function truncateLabel(label: string, max: number): string {
  if (label.length <= max) return label;
  return `${label.slice(0, Math.max(0, max - 1))}…`;
}

function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function buildCustomerFeatures(n: number, center: typeof CENTER): PointFeature[] {
  const features: PointFeature[] = [];
  for (let i = 0; i < n; i += 1) {
    const lng = center.lng + gaussian() * 0.005;
    const lat = center.lat + gaussian() * 0.005;
    features.push({
      type: "Feature",
      id: i,
      properties: { id: i },
      geometry: { type: "Point", coordinates: [lng, lat] },
    });
  }
  return features;
}

function buildHeatFeatures(center: typeof CENTER): FeatureCollectionPoints {
  const coords: [number, number][] = [
    [center.lng - 0.006, center.lat + 0.004],
    [center.lng + 0.005, center.lat - 0.003],
    [center.lng - 0.002, center.lat - 0.007],
    [center.lng + 0.008, center.lat + 0.006],
    [center.lng, center.lat],
  ];
  return {
    type: "FeatureCollection",
    features: coords.map((c, i) => ({
      type: "Feature" as const,
      id: `heat-${i}`,
      properties: {},
      geometry: { type: "Point" as const, coordinates: c },
    })),
  };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export type MapSceneProps = {
  pathData: PathData;
  pathLabel: string;
};

export function MapScene({ pathData, pathLabel }: MapSceneProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

  const customerN = Math.min(Math.round(pathData.kpis.customerImpact * 0.5), 30);
  const competitorOpacity = Math.max(0, Math.min(1, pathData.kpis.competitiveExposure / 100));
  const heatIntensity = Math.max(
    0,
    Math.min(1, (pathData.kpis.risk + pathData.kpis.competitiveExposure) / 200),
  );

  const allCustomers = useMemo(
    () => buildCustomerFeatures(customerN, CENTER),
    [customerN],
  );

  const heatData = useMemo(() => buildHeatFeatures(CENTER), []);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [visibleCustomerCount, setVisibleCustomerCount] = useState(0);
  const [showCompetitors, setShowCompetitors] = useState(false);
  const [heatOpacity, setHeatOpacity] = useState(0);
  const [showTicker, setShowTicker] = useState(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const heatRafRef = useRef<number>(0);

  const clearAnimationTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    cancelAnimationFrame(heatRafRef.current);
  }, []);

  const onMapIdle = useCallback(() => {
    setMapLoaded(true);
  }, []);

  useEffect(() => {
    clearAnimationTimers();
    if (!mapLoaded) return;

    if (reduceMotion) {
      const id = requestAnimationFrame(() => {
        setVisibleCustomerCount(customerN);
        setShowCompetitors(true);
        setHeatOpacity(0.5);
        setShowTicker(true);
      });
      return () => cancelAnimationFrame(id);
    }

    queueMicrotask(() => {
      setVisibleCustomerCount(0);
      setShowCompetitors(false);
      setHeatOpacity(0);
      setShowTicker(false);
    });

    const schedule = (fn: () => void, ms: number) => {
      timersRef.current.push(setTimeout(fn, ms));
    };

    schedule(() => {
      let added = 0;
      const staggerMs = 50;
      const addNext = () => {
        if (added >= customerN) return;
        added += 1;
        setVisibleCustomerCount(added);
        if (added < customerN) {
          timersRef.current.push(setTimeout(addNext, staggerMs));
        }
      };
      addNext();
    }, 150);

    const customerStaggerMs = Math.max(0, customerN - 1) * 50;
    const competitorStart = 150 + customerStaggerMs + 50;

    schedule(() => setShowCompetitors(true), Math.max(300, competitorStart));

    const competitorAnimMs = 200 + 2 * 100;
    const heatStart = Math.max(500, competitorStart + competitorAnimMs);

    schedule(() => {
      const start = performance.now();
      const duration = 400;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setHeatOpacity(0.5 * easeInOut(t));
        if (t < 1) heatRafRef.current = requestAnimationFrame(step);
      };
      heatRafRef.current = requestAnimationFrame(step);
    }, heatStart);

    schedule(() => setShowTicker(true), heatStart + 400);

    return clearAnimationTimers;
  }, [mapLoaded, reduceMotion, customerN, clearAnimationTimers]);

  const customerData: FeatureCollectionPoints = useMemo(
    () => ({
      type: "FeatureCollection",
      features: allCustomers.slice(0, visibleCustomerCount),
    }),
    [allCustomers, visibleCustomerCount],
  );

  const competitorPositions = useMemo(
    () =>
      COMPETITOR_OFFSETS.map(([dlng, dlat]) => ({
        lng: CENTER.lng + dlng,
        lat: CENTER.lat + dlat,
      })),
    [],
  );

  return (
    <div className="relative min-h-[10rem] w-full flex-1 overflow-hidden rounded-lg border border-border bg-surface">
      <Map
        mapboxAccessToken={token}
        initialViewState={{
          longitude: CENTER.lng,
          latitude: CENTER.lat,
          zoom: 14,
        }}
        style={{ width: "100%", height: "100%", minHeight: 160 }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        scrollZoom={false}
        dragPan={false}
        doubleClickZoom={false}
        touchZoomRotate={false}
        reuseMaps
        onIdle={onMapIdle}
      >
        <Source id="customers" type="geojson" data={customerData}>
          <Layer
            id="customers-circles"
            type="circle"
            paint={{
              "circle-radius": 4,
              "circle-color": "#2196F3",
              "circle-opacity": 0.7,
            }}
          />
        </Source>

        <Source id="heat" type="geojson" data={heatData}>
          <Layer
            id="heat-layer"
            type="heatmap"
            paint={{
              "heatmap-weight": heatIntensity,
              "heatmap-intensity": heatIntensity * 1.2,
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(255, 71, 87, 0)",
                0.4,
                "rgba(255, 71, 87, 0.35)",
                1,
                "rgba(255, 71, 87, 0.6)",
              ],
              "heatmap-opacity": heatOpacity,
              "heatmap-radius": 28,
            }}
          />
        </Source>

        <Marker longitude={CENTER.lng} latitude={CENTER.lat} anchor="bottom">
          <motion.div
            className="flex flex-col items-center"
            initial={{ scale: 0 }}
            animate={{ scale: mapLoaded ? 1 : 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 200, damping: 20 }
            }
          >
            <div
              className="size-3 shrink-0 rounded-full border-2 border-white bg-accent"
              style={{ width: 12, height: 12 }}
            />
            <span className="mt-1 max-w-[10rem] text-center text-caption text-text">
              {truncateLabel(pathLabel, 20)}
            </span>
          </motion.div>
        </Marker>

        {competitorPositions.map((pos, i) => (
          <Marker key={`${pos.lng}-${pos.lat}`} longitude={pos.lng} latitude={pos.lat} anchor="center">
            <motion.div
              className="flex size-4 items-center justify-center"
              style={{ opacity: competitorOpacity }}
              initial={{ scale: 0 }}
              animate={{
                scale:
                  reduceMotion && mapLoaded ? 1 : !reduceMotion && showCompetitors ? 1 : 0,
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                      delay: showCompetitors ? i * 0.1 : 0,
                    }
              }
            >
              <div className="size-3 rotate-45 bg-red" />
            </motion.div>
          </Marker>
        ))}
      </Map>

      <CashFlowTicker
        pathLabel={truncateLabel(pathLabel, 24)}
        revenueImpact={pathData.kpis.revenueImpact}
        visible={showTicker}
        reducedMotion={reduceMotion}
      />
    </div>
  );
}
