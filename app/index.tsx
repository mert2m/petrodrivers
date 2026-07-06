import { Redirect } from 'expo-router';

/** Entry: send users straight to the (non-empty) map — the wedge (spec §1). Auth gating lands in Phase 3. */
export default function Index() {
  return <Redirect href="/(tabs)/map" />;
}
