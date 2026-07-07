// React Query hooks for the roads feature. Server state lives here (never in Zustand).
import { useQuery } from '@tanstack/react-query';

import { getRoadById, getRoadsInBbox, getSegmentsInBbox } from '../api/roads';
import type { Bbox } from '../types/road';

const bboxKey = (b: Bbox) => [b.minLng, b.minLat, b.maxLng, b.maxLat] as const;

/** Map segments for the current viewport. Pass null to disable (e.g. before the map settles). */
export function useSegmentsInBbox(bbox: Bbox | null) {
  return useQuery({
    queryKey: ['roads', 'segments', bbox && bboxKey(bbox)],
    queryFn: () => getSegmentsInBbox(bbox!),
    enabled: bbox !== null,
  });
}

/** Roads intersecting the current viewport (Discover). */
export function useRoadsInBbox(bbox: Bbox | null) {
  return useQuery({
    queryKey: ['roads', 'list', bbox && bboxKey(bbox)],
    queryFn: () => getRoadsInBbox(bbox!),
    enabled: bbox !== null,
  });
}

/** Metadata for a single road (detail header). */
export function useRoad(id: string | null) {
  return useQuery({
    queryKey: ['roads', 'detail', id],
    queryFn: () => getRoadById(id!),
    enabled: id !== null,
  });
}
