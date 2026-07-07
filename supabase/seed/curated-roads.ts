// Curated seed roads for local pipeline validation. Geometry is SYNTHETIC-but-real: each road is a sine
// serpentine whose wavelength/amplitude target a difficulty band, so the classifier is exercised across
// easy/technical/hairpin without needing network (Overpass) access. Real iconic-road ingestion is the
// OSM path (scripts/scoring/io/overpass — TODO). Fixed UUIDs keep re-seeding idempotent.
import type { RoadSource } from '../../scripts/scoring/pipeline';
import type { Coordinate } from '../../scripts/scoring/types';

const METRES_PER_DEG_LAT = 111_320;

interface Origin {
  lat: number;
  lng: number;
}

/** Build a sine serpentine climbing north from `origin`, wiggling east/west. */
function serpentine(
  roadId: string,
  name: string,
  origin: Origin,
  opts: { lengthM: number; wavelengthM: number; amplitudeM: number; stepM: number },
): RoadSource {
  const cosLat = Math.cos((origin.lat * Math.PI) / 180);
  const coords: Coordinate[] = [];
  for (let y = 0; y <= opts.lengthM; y += opts.stepM) {
    const x = opts.amplitudeM * Math.sin((2 * Math.PI * y) / opts.wavelengthM);
    coords.push({
      lng: origin.lng + x / (METRES_PER_DEG_LAT * cosLat),
      lat: origin.lat + y / METRES_PER_DEG_LAT,
    });
  }
  return { kind: 'geojson', roadId, feature: { name, coords } };
}

export const CURATED_ROADS: RoadSource[] = [
  // tight switchbacks -> hairpin / technical
  serpentine(
    '11111111-1111-4111-8111-111111111111',
    'Serpentine Ridge',
    { lat: 46.53, lng: 10.45 },
    {
      lengthM: 900,
      wavelengthM: 46,
      amplitudeM: 8,
      stepM: 6,
    },
  ),
  // flowing tight curves -> technical
  serpentine(
    '22222222-2222-4222-8222-222222222222',
    'Canyon Run',
    { lat: 44.2, lng: 7.0 },
    {
      lengthM: 1200,
      wavelengthM: 120,
      amplitudeM: 8,
      stepM: 8,
    },
  ),
  // gentle sweepers -> easy
  serpentine(
    '33333333-3333-4333-8333-333333333333',
    'Coastal Cruise',
    { lat: 36.1, lng: -5.35 },
    {
      lengthM: 1600,
      wavelengthM: 360,
      amplitudeM: 7,
      stepM: 12,
    },
  ),
];
