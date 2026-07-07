import { supabase } from '@/services/supabase';

import { getSegmentsInBbox } from '../api/roads';
import { parseLineString } from '../types/road';

// Mock the whole supabase module so the real client (and env validation) never loads in tests.
jest.mock('@/services/supabase', () => ({
  supabase: { rpc: jest.fn() },
}));

const rpc = supabase.rpc as unknown as jest.Mock;

const BBOX = { minLng: 10.44, minLat: 46.52, maxLng: 10.46, maxLat: 46.54 };

describe('parseLineString', () => {
  it('parses a GeoJSON LineString into LatLng[]', () => {
    const path = parseLineString(
      '{"type":"LineString","coordinates":[[10.45,46.53],[10.451,46.531]]}',
    );
    expect(path).toEqual([
      { lng: 10.45, lat: 46.53 },
      { lng: 10.451, lat: 46.531 },
    ]);
  });

  it('throws on a non-LineString payload', () => {
    expect(() => parseLineString('{"type":"Point","coordinates":[10,46]}')).toThrow();
  });
});

describe('getSegmentsInBbox', () => {
  it('maps rows and validates geometry', async () => {
    rpc.mockResolvedValueOnce({
      data: [
        {
          id: 's1',
          road_id: 'r1',
          difficulty: 'hairpin',
          difficulty_score: 1,
          geojson: '{"type":"LineString","coordinates":[[10.45,46.53],[10.451,46.531]]}',
        },
      ],
      error: null,
    });
    const segs = await getSegmentsInBbox(BBOX);
    expect(rpc).toHaveBeenCalledWith('segments_in_bbox', {
      min_lng: 10.44,
      min_lat: 46.52,
      max_lng: 10.46,
      max_lat: 46.54,
    });
    expect(segs).toHaveLength(1);
    expect(segs[0]!.difficulty).toBe('hairpin');
    expect(segs[0]!.path[0]).toEqual({ lng: 10.45, lat: 46.53 });
  });

  it('throws when the RPC returns an error', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await expect(getSegmentsInBbox(BBOX)).rejects.toThrow('boom');
  });
});
