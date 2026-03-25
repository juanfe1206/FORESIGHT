import { fetchNearbyCompetitors, geocodeLocation } from "@/lib/overpass";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;
  const bizType = searchParams.get("bizType") || "other";
  const location = searchParams.get("location") || "";
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  let lat = latParam ? Number(latParam) : NaN;
  let lng = lngParam ? Number(lngParam) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    if (!location.trim()) {
      return Response.json({ competitors: [] });
    }
    const geo = await geocodeLocation(location);
    lat = geo?.lat ?? 40.4167;
    lng = geo?.lng ?? -3.7004;
  }

  const competitors = await fetchNearbyCompetitors(bizType, lat, lng);
  return Response.json({ competitors });
}
