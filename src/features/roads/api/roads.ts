// Typed data access for roads. The ONLY place the roads feature touches Supabase. UI/hooks call these;
// geometry is validated with Zod at this boundary (parseLineString).
import { supabase } from '@/services/supabase';

import type { Bbox, MapSegment, RoadSummary } from '../types/road';
import { parseLineString } from '../types/road';

/** Difficulty-colored segments visible in a viewport bbox (powers the map line layer). */
export async function getSegmentsInBbox(bbox: Bbox): Promise<MapSegment[]> {
  const { data, error } = await supabase.rpc('segments_in_bbox', {
    min_lng: bbox.minLng,
    min_lat: bbox.minLat,
    max_lng: bbox.maxLng,
    max_lat: bbox.maxLat,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    roadId: row.road_id,
    difficulty: row.difficulty,
    difficultyScore: row.difficulty_score,
    path: parseLineString(row.geojson),
  }));
}

/** Roads whose bbox intersects a viewport (Discover list / labels). */
export async function getRoadsInBbox(bbox: Bbox): Promise<RoadSummary[]> {
  const { data, error } = await supabase.rpc('roads_in_bbox', {
    min_lng: bbox.minLng,
    min_lat: bbox.minLat,
    max_lng: bbox.maxLng,
    max_lat: bbox.maxLat,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    region: row.region,
    country: row.country,
    scenicRating: row.scenic_rating,
    lengthM: row.length_m,
    centerline: parseLineString(row.geojson),
  }));
}

/** Road metadata for the detail header (geometry comes from the segment queries). */
export async function getRoadById(id: string): Promise<{
  id: string;
  name: string;
  region: string | null;
  country: string | null;
  description: string | null;
  scenicRating: number | null;
  bestTimeWindow: string | null;
  lengthM: number | null;
  coverPhotoUrl: string | null;
} | null> {
  const { data, error } = await supabase
    .from('roads')
    .select(
      'id, name, region, country, description, scenic_rating, best_time_window, length_m, cover_photo_url',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    region: data.region,
    country: data.country,
    description: data.description,
    scenicRating: data.scenic_rating,
    bestTimeWindow: data.best_time_window,
    lengthM: data.length_m,
    coverPhotoUrl: data.cover_photo_url,
  };
}
